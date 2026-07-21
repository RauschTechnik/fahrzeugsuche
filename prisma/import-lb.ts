import { PrismaClient } from '@prisma/client';
import { read, utils } from 'xlsx';
import { readFileSync } from 'fs';
import { FILTER_GROUP_LABELS, PRODUCT_LABELS } from '../types/app';

const prisma = new PrismaClient();

// A handful of rows in the source spreadsheet tag "LB-TEZ" (telescoping arm)
// as compressible_wheelchair, but that product is only ever meant for regular
// wheelchairs - LB-SH-MS is the dedicated compressible-wheelchair product.
// Restrict each product to its intended wheelchair type(s) regardless of what
// a given row's raw wheelchairTypes column says.
const ALLOWED_WHEELCHAIR_TYPES: Record<string, Array<string>> = {
  LB: ['normal_wheelchair'],
  'LB-TEZ': ['normal_wheelchair'],
  'LB-SH-MS': ['compressible_wheelchair']
};

const SOURCE_PATH =
  'C:/Users/ServiceRauschTechnik/RAUSCH TECHNIK GmbH/Dateiablage - Allgemein/Angebote/Fahrzeuglisten_AKTUELL.xlsx';

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

async function main() {
  const buffer = readFileSync(SOURCE_PATH);
  const workbook = read(buffer, { type: 'buffer' });
  const worksheet = workbook.Sheets['LB'];
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
    // Include every product variant in this tab (LB = normal, LB-TEZ = telescope
    // arm variant, LB-SH-MS = compressible wheelchair) - each row's own
    // wheelchairTypes column already says which wheelchair type(s) it applies to.
    if (toBoolean(row[COL.isNotCompatible])) {
      skippedNotCompatible++;
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
    const maxWcLength = toNullableInt(row[COL.maxWcLength]);
    const maxWcHeight = toNullableInt(row[COL.maxWcHeight]);
    const maxWcWidth = toNullableInt(row[COL.maxWcWidth]);

    const productCode = String(row[COL.productCode] ?? '').trim();

    // "Ladeboy Klapprollstuhl" (LB-SH-MS) genuinely never has dimensions - any
    // compressible wheelchair fits. Every other product without any measurement
    // at all just hasn't been measured yet, regardless of how that's worded in
    // the internal note (typos and phrasing vary too much to text-match reliably,
    // and some rows note "not independently measured" but still carry real
    // borrowed figures from an identical sibling model - those stay in).
    if (productCode !== 'LB-SH-MS' && maxWcLength == null && maxWcHeight == null && maxWcWidth == null) {
      skippedNotMeasured++;
      continue;
    }

    const productLabel = PRODUCT_LABELS[productCode] ?? productCode;
    const filterGroupLabel = FILTER_GROUP_LABELS[productCode] ?? productLabel;

    const rawWheelchairTypes = String(row[COL.wheelchairTypes] ?? '')
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const allowedTypes = ALLOWED_WHEELCHAIR_TYPES[productCode];
    const wheelchairTypes = allowedTypes
      ? rawWheelchairTypes.filter((t) => allowedTypes.includes(t))
      : rawWheelchairTypes;

    for (const wheelchairType of wheelchairTypes) {
      await prisma.compatibility.create({
        data: {
          carModelId: carModel.id,
          loadingPosition: 'trunk_folded',
          productLabel,
          filterGroupLabel,
          wheelchairType,
          isForHeavyWc: false,
          maxWcLength,
          maxWcHeight,
          maxWcWidth,
          remainingSeats: String(row[COL.rawSeats] ?? '').trim(),
          isAdditionalVerificationNeeded: toBoolean(row[COL.isAdditionalVerificationNeeded]),
          comment
        }
      });
    }

    imported++;
  }

  console.log(`Imported ${imported} "Ladeboy gefaltet liegend im Kofferraum" compatibility rows.`);
  console.log(`Skipped ${skippedNotCompatible} rows marked as not compatible.`);
  console.log(`Skipped ${skippedNotMeasured} rows for vehicles not yet measured.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
