'use server';

import { randomUUID } from 'crypto';
import { prisma } from '@/lib/db';
import { stripCommentPhrases } from '@/lib/utils';
import {
  LOADING_SPACE_POSITIONS,
  LoadingPosition,
  PRODUCT_LABELS,
  VehicleMatch,
  VehicleMatchParams
} from '@/types/app';

// Remarks from the spreadsheet comments that are not shown for a product (the
// rest of the comment stays). Products not listed here show their comment as is.
const TRUNK_PHRASES_TO_HIDE = [
  /mit hybridantrieb noch nicht verbaut oder geprüft/,
  /ohne elektroantrieb/,
  /ohne hybridantrieb/
];
const SIDE_PHRASES_TO_HIDE = [/auch mit hybridantrieb \(bitte angeben\)/, /auch vollelektrisch \(bitte angeben\)/];

const PHRASES_TO_HIDE_BY_PRODUCT = new Map<string, Array<RegExp>>([
  [PRODUCT_LABELS.LB, TRUNK_PHRASES_TO_HIDE],
  [PRODUCT_LABELS['LB-TEZ'], TRUNK_PHRASES_TO_HIDE],
  [PRODUCT_LABELS['LB-S'], TRUNK_PHRASES_TO_HIDE],
  [PRODUCT_LABELS['LB-S-UG'], TRUNK_PHRASES_TO_HIDE],
  [PRODUCT_LABELS['LB-S2'], SIDE_PHRASES_TO_HIDE],
  [PRODUCT_LABELS['LB-S2-UG'], SIDE_PHRASES_TO_HIDE],
  [PRODUCT_LABELS['LB-S2-SM'], SIDE_PHRASES_TO_HIDE]
]);

// The "Einschränkung: Bei Elektro- oder Hybridfahrzeugen ..." box belongs to
// the vehicle, not to a product. It is dropped when every option shown for the
// vehicle is one of the known products - which is currently all of them, so
// the box is effectively switched off.
const PRODUCTS_WITHOUT_BATTERY_DISCLAIMER = new Set([
  PRODUCT_LABELS.SC,
  PRODUCT_LABELS['LB-SH-MS'],
  PRODUCT_LABELS.LB,
  PRODUCT_LABELS['LB-TEZ'],
  PRODUCT_LABELS['LB-S'],
  PRODUCT_LABELS['LB-S-UG'],
  PRODUCT_LABELS['LB-S2'],
  PRODUCT_LABELS['LB-S2-UG'],
  PRODUCT_LABELS['LB-S2-SM']
]);

// A small tolerance is applied before excluding a car model outright - anything
// within the tolerance is still returned, but flagged so the customer knows to
// double-check with support before ordering.
const TOLERANCE_CM = 2;

const ALL_POSITIONS = [
  LoadingPosition.TrunkFolded,
  LoadingPosition.TrunkUnfolded,
  LoadingPosition.SideFolded,
  LoadingPosition.SideUnfolded
];

const isFoldedPosition = (position: LoadingPosition) =>
  position === LoadingPosition.TrunkFolded || position === LoadingPosition.SideFolded;

export async function getMatchingVehicles({
  loadingSpace,
  wheelchairType,
  isHeavyWc,
  length,
  width,
  widthUnfolded,
  height
}: VehicleMatchParams): Promise<Array<VehicleMatch>> {
  const vehiclesByCarModelId = new Map<number, VehicleMatch>();

  for (const position of LOADING_SPACE_POSITIONS[loadingSpace]) {
    const relevantWidth = isFoldedPosition(position) ? (width ?? widthUnfolded) : (widthUnfolded ?? width);

    const dimensionFilters = [];

    if (length != null) {
      dimensionFilters.push({ OR: [{ maxWcLength: null }, { maxWcLength: { gte: length - TOLERANCE_CM } }] });
    }
    if (relevantWidth != null) {
      dimensionFilters.push({ OR: [{ maxWcWidth: null }, { maxWcWidth: { gte: relevantWidth - TOLERANCE_CM } }] });
    }
    if (height != null) {
      dimensionFilters.push({ OR: [{ maxWcHeight: null }, { maxWcHeight: { gte: height - TOLERANCE_CM } }] });
    }

    const compatibilities = await prisma.compatibility.findMany({
      where: {
        loadingPosition: position,
        wheelchairType,
        isForHeavyWc: isHeavyWc,
        AND: dimensionFilters,
        // Vehicles still in production (no end year set) plus those whose
        // production run extends through the current year or later.
        carModel: {
          OR: [{ yearOfProductionUntil: null }, { yearOfProductionUntil: { gte: new Date().getFullYear() } }]
        }
      },
      select: {
        productLabel: true,
        filterGroupLabel: true,
        maxWcLength: true,
        maxWcWidth: true,
        maxWcHeight: true,
        remainingSeats: true,
        isAdditionalVerificationNeeded: true,
        comment: true,
        carModel: {
          select: {
            id: true,
            name: true,
            yearOfProductionSince: true,
            yearOfProductionUntil: true,
            hybridOrElectricDisclaimer: true,
            manufacturer: { select: { name: true } }
          }
        }
      }
    });

    for (const entry of compatibilities) {
      const exceedsLength = length != null && entry.maxWcLength != null && entry.maxWcLength < length;
      const exceedsWidth = relevantWidth != null && entry.maxWcWidth != null && entry.maxWcWidth < relevantWidth;
      const exceedsHeight = height != null && entry.maxWcHeight != null && entry.maxWcHeight < height;

      const loadingOption = {
        position,
        label: entry.productLabel,
        filterGroup: entry.filterGroupLabel,
        remainingSeats: entry.remainingSeats,
        showCheckWithSupportWarning: entry.isAdditionalVerificationNeeded,
        showDimensionsExceededWarning: exceedsLength || exceedsWidth || exceedsHeight,
        comment: stripCommentPhrases(entry.comment, PHRASES_TO_HIDE_BY_PRODUCT.get(entry.productLabel) ?? [])
      };

      const existing = vehiclesByCarModelId.get(entry.carModel.id);

      if (existing) {
        // Several distinct products (e.g. "Ladeboy S2" and "Ladeboy S2 mit
        // Schwenkmodul") can share the same loadingPosition - only skip a row
        // if that exact product is already listed for this vehicle.
        if (!existing.loadingOptions.some((option) => option.label === loadingOption.label)) {
          existing.loadingOptions.push(loadingOption);
        }
      } else {
        vehiclesByCarModelId.set(entry.carModel.id, {
          uid: randomUUID(),
          carModel: entry.carModel,
          loadingOptions: [loadingOption]
        });
      }
    }
  }

  const matches = Array.from(vehiclesByCarModelId.values());

  for (const match of matches) {
    match.loadingOptions.sort((a, b) => ALL_POSITIONS.indexOf(a.position) - ALL_POSITIONS.indexOf(b.position));

    if (match.loadingOptions.every((option) => PRODUCTS_WITHOUT_BATTERY_DISCLAIMER.has(option.label))) {
      match.carModel = { ...match.carModel, hybridOrElectricDisclaimer: false };
    }
  }

  matches.sort((a, b) => {
    const isClean = (option: (typeof a.loadingOptions)[number]) =>
      !option.showCheckWithSupportWarning && !option.showDimensionsExceededWarning;
    const aHasClean = a.loadingOptions.some(isClean);
    const bHasClean = b.loadingOptions.some(isClean);

    if (aHasClean !== bHasClean) return Number(bHasClean) - Number(aHasClean);
    return b.loadingOptions.length - a.loadingOptions.length;
  });

  return matches;
}
