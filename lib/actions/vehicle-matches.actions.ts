'use server';

import { randomUUID } from 'crypto';
import { prisma } from '@/lib/db';
import { LOADING_SPACE_POSITIONS, LoadingPosition, VehicleMatch, VehicleMatchParams } from '@/types/app';

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
        // Only vehicles still in production today (no end year set).
        carModel: { yearOfProductionUntil: null }
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
        showCheckWithSupportWarning: entry.isAdditionalVerificationNeeded || exceedsLength || exceedsWidth || exceedsHeight,
        comment: entry.comment
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
  }

  matches.sort((a, b) => {
    const aHasClean = a.loadingOptions.some((option) => !option.showCheckWithSupportWarning);
    const bHasClean = b.loadingOptions.some((option) => !option.showCheckWithSupportWarning);

    if (aHasClean !== bHasClean) return Number(bHasClean) - Number(aHasClean);
    return b.loadingOptions.length - a.loadingOptions.length;
  });

  return matches;
}
