import { PrismaClient } from '@prisma/client';
import { read, utils } from 'xlsx';
import { readFileSync } from 'fs';
import { FILTER_GROUP_LABELS, PRODUCT_LABELS } from '../types/app';

const prisma = new PrismaClient();

const SOURCE_PATH =
  'C:/Users/ServiceRauschTechnik/RAUSCH TECHNIK GmbH/Dateiablage - Allgemein/Angebote/Fahrzeuglisten_AKTUELL.xlsx';

type SheetConfig = {
  sheet: string;
  productCode: string;
  position: 'trunk_folded' | 'trunk_unfolded' | 'side_folded' | 'side_unfolded';
  useUnfoldedFigures: boolean;
  isForHeavyWc: boolean;
};

const SHEETS: Array<SheetConfig> = [
  { sheet: 'LB-S', productCode: 'LB-S', position: 'trunk_folded', useUnfoldedFigures: false, isForHeavyWc: false },
  { sheet: 'LB-UG', productCode: 'LB-S-UG', position: 'trunk_unfolded', useUnfoldedFigures: true, isForHeavyWc: false },
  { sheet: 'LB-S2', productCode: 'LB-S2', position: 'side_folded', useUnfoldedFigures: false, isForHeavyWc: false },
  {
    sheet: 'LB-S2 ungefaltet',
    productCode: 'LB-S2-UG',
    position: 'side_unfolded',
    useUnfoldedFigures: true,
    isForHeavyWc: false
  },
  {
    sheet: 'LB-S2-Schwenkmodul',
    productCode: 'LB-S2-SM',
    position: 'side_folded',
    useUnfoldedFigures: false,
    isForHeavyWc: false
  },
  { sheet: 'SC', productCode: 'SC', position: 'trunk_unfolded', useUnfoldedFigures: false, isForHeavyWc: true }
];

function toBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  const s = String(value ?? '')
    .toLowerCase()
    .trim();
  return s === 'true' || s === 'ja' || s === 'yes' || s === '1';
}

function toNullableInt(value: unknown): number | null {
  if (value === '' || value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? Math.round(n) : null;
}

function toInt(value: unknown, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) ? Math.round(n) : fallback;
}

async function importSheet(workbook: ReturnType<typeof read>, config: SheetConfig) {
  const worksheet = workbook.Sheets[config.sheet];
  if (!worksheet) {
    console.log(`Sheet not found, skipping: ${config.sheet}`);
    return;
  }

  const rows = utils.sheet_to_json(worksheet, { defval: '', header: 1 }) as Array<Array<unknown>>;
  const header = rows[0] as Array<string>;
  const dataRows = rows.slice(1);

  const idx = (label: string) => header.lastIndexOf(label);

  const COL = {
    manufacturer: idx('manufacturer'),
    modelDe: idx('modelDe'),
    hybridOrElectricDisclaimer: idx('hybridOrElectricDisclaimer'),
    yearOfProductionSince: idx('yearOfProductionSince'),
    yearOfProductionUntil: idx('yearOfProductionUntil'),
    productCode: idx('productCode'),
    wheelchairTypes: idx('wheelchairTypes'),
    maxWcLength: idx('maxWcLength'),
    maxWcHeight: idx('maxWcHeight'),
    maxWcWidth: idx('maxWcWidth'),
    maxUnfoldedWcWidth: idx('maxUnfoldedWcWidth'),
    // Raw human-entered seats column (first occurrence) - kept as free text since
    // it sometimes holds a range/footnote like "2-3" rather than a clean integer.
    rawSeats: header.indexOf('SITZE-MAX'),
    isAdditionalVerificationNeeded: idx('isAdditionalVerificationNeeded'),
    commentDe: idx('commentDe'),
    isNotCompatible: idx('isNotCompatible'),
    hinweisIntern: header.indexOf('HINWEIS-INTERN')
  };

  let imported = 0;
  let skippedNotCompatible = 0;
  let skippedNotMeasured = 0;

  for (const row of dataRows) {
    if (row[COL.productCode] !== config.productCode) continue;
    if (toBoolean(row[COL.isNotCompatible])) {
      skippedNotCompatible++;
      continue;
    }
    // Skip vehicles the team hasn't actually measured yet - the internal note
    // says so even though isNotCompatible isn't set for these rows.
    if (String(row[COL.hinweisIntern] ?? '').toLowerCase().includes('nicht vermessen')) {
      skippedNotMeasured++;
      continue;
    }

    const manufacturerName = String(row[COL.manufacturer] ?? '').trim();
    const modelName = String(row[COL.modelDe] ?? '').trim();
    if (!manufacturerName || !modelName) continue;
    // Skip "combined" convenience rows (e.g. "M oder XL") - the individual
    // variants are already listed separately and showing both is redundant.
    if (/ oder | o\. /.test(modelName)) continue;

    const manufacturer = await prisma.manufacturer.upsert({
      where: { name: manufacturerName },
      update: {},
      create: { name: manufacturerName }
    });

    const yearOfProductionSince = toInt(row[COL.yearOfProductionSince], new Date().getFullYear());
    const yearOfProductionUntil = toNullableInt(row[COL.yearOfProductionUntil]);
    const hybridOrElectricDisclaimer = toBoolean(row[COL.hybridOrElectricDisclaimer]);

    let carModel = await prisma.carModel.findFirst({
      where: { manufacturerId: manufacturer.id, name: modelName, yearOfProductionSince }
    });

    if (!carModel) {
      carModel = await prisma.carModel.create({
        data: {
          manufacturerId: manufacturer.id,
          name: modelName,
          yearOfProductionSince,
          yearOfProductionUntil,
          hybridOrElectricDisclaimer
        }
      });
    }

    const comment = String(row[COL.commentDe] ?? '').trim() || null;
    const maxWcWidth = config.useUnfoldedFigures ? toNullableInt(row[COL.maxUnfoldedWcWidth]) : toNullableInt(row[COL.maxWcWidth]);
    const remainingSeats = String(row[COL.rawSeats] ?? '').trim();

    const wheelchairTypes = String(row[COL.wheelchairTypes] ?? '')
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const productLabel = PRODUCT_LABELS[config.productCode] ?? config.productCode;
    const filterGroupLabel = FILTER_GROUP_LABELS[config.productCode] ?? productLabel;

    for (const wheelchairType of wheelchairTypes) {
      await prisma.compatibility.create({
        data: {
          carModelId: carModel.id,
          loadingPosition: config.position,
          productLabel,
          filterGroupLabel,
          wheelchairType,
          isForHeavyWc: config.isForHeavyWc,
          maxWcLength: toNullableInt(row[COL.maxWcLength]),
          maxWcHeight: toNullableInt(row[COL.maxWcHeight]),
          maxWcWidth,
          remainingSeats,
          isAdditionalVerificationNeeded: toBoolean(row[COL.isAdditionalVerificationNeeded]),
          comment
        }
      });
    }

    imported++;
  }

  console.log(
    `[${config.sheet}] Imported ${imported} rows, skipped ${skippedNotCompatible} not-compatible, ${skippedNotMeasured} not-yet-measured.`
  );
}

async function main() {
  const buffer = readFileSync(SOURCE_PATH);
  const workbook = read(buffer, { type: 'buffer' });

  for (const config of SHEETS) {
    await importSheet(workbook, config);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
