export enum WheelchairType {
  Regular = 'normal_wheelchair',
  Compressible = 'compressible_wheelchair',
  Scooter = 'scooter'
}

// Each value maps to one Ladeboy loading option - see LOADING_OPTION_LABELS below.
export enum LoadingPosition {
  TrunkFolded = 'trunk_folded',
  TrunkUnfolded = 'trunk_unfolded',
  SideFolded = 'side_folded',
  SideUnfolded = 'side_unfolded'
}

// Where in the vehicle the wheelchair gets loaded - chosen upfront in the form.
// Compressible wheelchairs and scooters only ever go in the trunk.
export enum LoadingSpace {
  Trunk = 'trunk',
  Side = 'side'
}

export const LOADING_SPACE_POSITIONS: Record<LoadingSpace, Array<LoadingPosition>> = {
  [LoadingSpace.Trunk]: [LoadingPosition.TrunkFolded, LoadingPosition.TrunkUnfolded],
  [LoadingSpace.Side]: [LoadingPosition.SideFolded, LoadingPosition.SideUnfolded]
};

// Display label per source spreadsheet product code - several of these share
// the same loadingPosition bucket (e.g. "LB" and "LB-TEZ" are both
// trunk_folded), so this is what tells them apart in the results.
export const PRODUCT_LABELS: Record<string, string> = {
  LB: 'Ladeboy gefaltet liegend im Kofferraum',
  'LB-TEZ': 'Ladeboy mit Teleskoparm gefaltet liegend im Kofferraum',
  'LB-SH-MS': 'Ladeboy Klapprollstuhl im Kofferraum',
  'LB-S': 'Ladeboy gefaltet stehend im Kofferraum',
  'LB-S-UG': 'Ladeboy ungefaltet stehend im Kofferraum',
  'LB-S2': 'Ladeboy S2 gefaltet hinter dem Fahrersitz',
  'LB-S2-UG': 'Ladeboy S2 ungefaltet hinter dem Fahrersitz',
  'LB-S2-SM': 'Ladeboy S2 gefaltet hinter dem Fahrersitz mit Schwenkmodul',
  SC: 'Scooterboy im Kofferraum'
};

// Which filter checkbox a product falls under - equipment variants of the same
// underlying loading method (e.g. "LB-TEZ" is "LB" with a telescoping arm,
// "LB-S2-SM" is "LB-S2" with a swivel module) share their base product's
// group instead of getting their own checkbox, so the filter list stays to
// the actual distinct loading methods.
export const FILTER_GROUP_LABELS: Record<string, string> = {
  LB: PRODUCT_LABELS.LB,
  'LB-TEZ': PRODUCT_LABELS.LB,
  'LB-SH-MS': PRODUCT_LABELS['LB-SH-MS'],
  'LB-S': PRODUCT_LABELS['LB-S'],
  'LB-S-UG': PRODUCT_LABELS['LB-S-UG'],
  'LB-S2': PRODUCT_LABELS['LB-S2'],
  'LB-S2-UG': PRODUCT_LABELS['LB-S2-UG'],
  'LB-S2-SM': PRODUCT_LABELS['LB-S2'],
  SC: PRODUCT_LABELS.SC
};

// The database stores product labels as plain German text (baked in at import
// time from the source spreadsheet), so they don't automatically follow the
// UI's locale. This maps that stored German text back to its product code,
// which callers use to look up a translated label via the "ProductLabels"
// message namespace - see translateProductLabel below.
export const PRODUCT_LABEL_TO_CODE: Record<string, string> = Object.fromEntries(
  Object.entries(PRODUCT_LABELS).map(([code, label]) => [label, code])
);

// Falls back to the raw (German) label if it doesn't match a known product
// code, rather than passing an arbitrary string as a translation key. Typed
// loosely because callers pass a next-intl translator scoped to the
// "ProductLabels" namespace, whose key type is too narrow to accept a
// dynamically looked-up string otherwise.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function translateProductLabel(t: (key: any) => string, label: string): string {
  const code = PRODUCT_LABEL_TO_CODE[label];
  return code ? t(code) : label;
}

export type CompatibilityParams = {
  loading_space: LoadingSpace;
  wheelchair_type: WheelchairType;
  length?: number;
  width?: number;
  width_unfolded?: number;
  width_folded?: number;
  height?: number;
  is_heavy_wc: boolean;
};

export type VehicleMatchParams = {
  loadingSpace: LoadingSpace;
  wheelchairType: WheelchairType;
  isHeavyWc: boolean;
  length?: number | null;
  height?: number | null;
  width?: number | null;
  widthUnfolded?: number | null;
};

export type LoadingOptionMatch = {
  position: LoadingPosition;
  label: string;
  filterGroup: string;
  remainingSeats: string;
  showCheckWithSupportWarning: boolean;
  comment?: string | null;
};

export type VehicleMatch = {
  uid: string;
  carModel: {
    id: number;
    name: string;
    yearOfProductionSince: number;
    yearOfProductionUntil: number | null;
    hybridOrElectricDisclaimer: boolean;
    manufacturer: {
      name: string;
    };
  };
  loadingOptions: Array<LoadingOptionMatch>;
};
