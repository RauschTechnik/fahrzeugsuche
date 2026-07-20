import { read, utils } from 'xlsx';
import { readFileSync } from 'fs';
import { FILTER_GROUP_LABELS, PRODUCT_LABELS } from '../types/app';

const SOURCE_PATH =
  'C:/Users/ServiceRauschTechnik/RAUSCH TECHNIK GmbH/Dateiablage - Allgemein/Angebote/Fahrzeuglisten_AKTUELL.xlsx';

const PRODUCTION_URL = process.env.PRODUCTION_URL ?? 'https://fahrzeugsuche-production.up.railway.app';
const ADMIN_SECRET = process.env.ADMIN_IMPORT_SECRET;

const BATCH_SIZE = 250;

type ImportRow = {
  manufacturerName: string;
  modelName: string;
  yearOfProductionSince: number;
  yearOfProductionUntil: number | null;
  hybridOrElectricDisclaimer: boolean;
  loadingPosition: string;
  productLabel: string;
  filterGroupLabel: string;
  wheelchairType: string;
  isForHeavyWc: boolean;
  maxWcLength: number | null;
  maxWcWidth: number | null;
  maxWcHeight: number | null;
  remainingSeats: string;
  isAdditionalVerificationNeeded: boolean;
  comment: string | null;
};

// A handful of rows in the source spreadsheet tag "LB-TEZ" (telescoping arm)
// as compressible_wheelchair, but that product is only ever meant for regular
// wheelchairs - LB-SH-MS is the dedicated compressible-wheelchair product.
const ALLOWED_WHEELCHAIR_TYPES: Record<string, Array<string>> = {
  LB: ['normal_wheelchair'],
  'LB-TEZ': ['normal_wheelchair'],
  'LB-SH-MS': ['compressible_wheelchair']
};

type SheetConfig = {
  sheet: string;
  productCode?: string; // when omitted, include every product code in the sheet (used for the LB tab)
  position: 'trunk_folded' | 'trunk_unfolded' | 'side_folded' | 'side_unfolded';
  useUnfoldedFigures: boolean;
  isForHeavyWc: boolean;
};

const SHEETS: Array<SheetConfig> = [
  { sheet: 'LB', position: 'trunk_folded', useUnfoldedFigures: false, isForHeavyWc: false },
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

function collectRowsFromSheet(workbook: ReturnType<typeof read>, config: SheetConfig): Array<ImportRow> {
  const worksheet = workbook.Sheets[config.sheet];
  if (!worksheet) {
    console.log(`Sheet not found, skipping: ${config.sheet}`);
    return [];
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
    rawSeats: header.indexOf('SITZE-MAX'),
    isAdditionalVerificationNeeded: idx('isAdditionalVerificationNeeded'),
    commentDe: idx('commentDe'),
    isNotCompatible: idx('isNotCompatible')
  };

  const result: Array<ImportRow> = [];

  for (const row of dataRows) {
    const rowProductCode = String(row[COL.productCode] ?? '').trim();
    if (config.productCode && rowProductCode !== config.productCode) continue;
    if (toBoolean(row[COL.isNotCompatible])) continue;

    const manufacturerName = String(row[COL.manufacturer] ?? '').trim();
    const modelName = String(row[COL.modelDe] ?? '').trim();
    if (!manufacturerName || !modelName) continue;
    // Skip "combined" convenience rows (e.g. "M oder XL") - the individual
    // variants are already listed separately and showing both is redundant.
    if (/ oder | o\. /.test(modelName)) continue;

    const comment = String(row[COL.commentDe] ?? '').trim() || null;
    const maxWcWidth = config.useUnfoldedFigures
      ? toNullableInt(row[COL.maxUnfoldedWcWidth])
      : toNullableInt(row[COL.maxWcWidth]);

    const productLabel = PRODUCT_LABELS[rowProductCode] ?? rowProductCode;
    const filterGroupLabel = FILTER_GROUP_LABELS[rowProductCode] ?? productLabel;

    const rawWheelchairTypes = String(row[COL.wheelchairTypes] ?? '')
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const allowedTypes = ALLOWED_WHEELCHAIR_TYPES[rowProductCode];
    const wheelchairTypes = allowedTypes ? rawWheelchairTypes.filter((t) => allowedTypes.includes(t)) : rawWheelchairTypes;

    for (const wheelchairType of wheelchairTypes) {
      result.push({
        manufacturerName,
        modelName,
        yearOfProductionSince: toInt(row[COL.yearOfProductionSince], new Date().getFullYear()),
        yearOfProductionUntil: toNullableInt(row[COL.yearOfProductionUntil]),
        hybridOrElectricDisclaimer: toBoolean(row[COL.hybridOrElectricDisclaimer]),
        loadingPosition: config.position,
        productLabel,
        filterGroupLabel,
        wheelchairType,
        isForHeavyWc: config.isForHeavyWc,
        maxWcLength: toNullableInt(row[COL.maxWcLength]),
        maxWcWidth,
        maxWcHeight: toNullableInt(row[COL.maxWcHeight]),
        remainingSeats: String(row[COL.rawSeats] ?? '').trim(),
        isAdditionalVerificationNeeded: toBoolean(row[COL.isAdditionalVerificationNeeded]),
        comment
      });
    }
  }

  console.log(`[${config.sheet}] collected ${result.length} rows`);
  return result;
}

async function main() {
  if (!ADMIN_SECRET) {
    throw new Error('Set ADMIN_IMPORT_SECRET as an environment variable before running this script.');
  }

  const buffer = readFileSync(SOURCE_PATH);
  const workbook = read(buffer, { type: 'buffer' });

  const allRows: Array<ImportRow> = [];
  for (const config of SHEETS) {
    allRows.push(...collectRowsFromSheet(workbook, config));
  }

  console.log(`\nTotal rows to upload: ${allRows.length}`);

  for (let i = 0; i < allRows.length; i += BATCH_SIZE) {
    const batch = allRows.slice(i, i + BATCH_SIZE);
    const isFirstBatch = i === 0;

    const response = await fetch(`${PRODUCTION_URL}/api/admin/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-secret': ADMIN_SECRET },
      body: JSON.stringify({ rows: batch, reset: isFirstBatch })
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Batch starting at ${i} failed: ${response.status} ${text}`);
    }

    const data = await response.json();
    console.log(`Batch ${i}-${i + batch.length}: imported ${data.imported}`);
  }

  console.log('\nDone.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
