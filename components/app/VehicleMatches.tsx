import { ComponentPropsWithoutRef, useMemo, useState } from 'react';
import { cn, parseMinSeats } from '@/lib/utils';
import { CompatibilityParams, LoadingPosition, VehicleMatch } from '@/types/app';
import styles from '@/assets/styles/app.module.css';
import { CompatibilityParamsSummary } from '@/components/app/CompatibilityParamsSummary';
import { VehicleMatchCards } from '@/components/app/VehicleMatchCards';
import { LoadingOptionFilter } from '@/components/app/LoadingOptionFilter';
import { SeatsFilter } from '@/components/app/SeatsFilter';

const ALL_POSITIONS = [
  LoadingPosition.TrunkFolded,
  LoadingPosition.TrunkUnfolded,
  LoadingPosition.SideFolded,
  LoadingPosition.SideUnfolded
];

interface Props extends ComponentPropsWithoutRef<'div'> {
  compatibilityParams: CompatibilityParams;
  matches: Array<VehicleMatch>;
  onModifyParams: () => void;
}

export function VehicleMatches({ compatibilityParams, matches, onModifyParams, ...props }: Props) {
  // Filter by the loading method's filter group (e.g. "Ladeboy gefaltet
  // liegend im Kofferraum" vs. "Ladeboy gefaltet stehend im Kofferraum")
  // rather than the exact product - equipment variants like the telescoping
  // arm or swivel module share their base product's group so they don't get
  // their own checkbox.
  const availableFilterGroups = useMemo(() => {
    const groupPositions = new Map<string, LoadingPosition>();

    for (const match of matches) {
      for (const option of match.loadingOptions) {
        if (!groupPositions.has(option.filterGroup)) {
          groupPositions.set(option.filterGroup, option.position);
        }
      }
    }

    return Array.from(groupPositions.entries())
      .sort(([groupA, positionA], [groupB, positionB]) => {
        const positionDiff = ALL_POSITIONS.indexOf(positionA) - ALL_POSITIONS.indexOf(positionB);
        return positionDiff !== 0 ? positionDiff : groupA.localeCompare(groupB);
      })
      .map(([group]) => group);
  }, [matches]);

  const [activeFilterGroups, setActiveFilterGroups] = useState<Set<string>>(() => new Set(availableFilterGroups));

  const onToggleFilterGroup = (filterGroup: string) => {
    setActiveFilterGroups((current) => {
      const next = new Set(current);

      if (next.has(filterGroup)) {
        next.delete(filterGroup);
      } else {
        next.add(filterGroup);
      }

      return next;
    });
  };

  const labelFilteredMatches = useMemo(
    () =>
      matches
        .map((match) => ({
          ...match,
          loadingOptions: match.loadingOptions.filter((option) => activeFilterGroups.has(option.filterGroup))
        }))
        .filter((match) => match.loadingOptions.length > 0),
    [matches, activeFilterGroups]
  );

  // Options without a parseable seat count (e.g. "Nicht zutreffend") always
  // stay visible - there is nothing meaningful to filter them against.
  const availableSeatCounts = useMemo(() => {
    const seatCounts = new Set<number>();

    for (const match of labelFilteredMatches) {
      for (const option of match.loadingOptions) {
        const minSeats = parseMinSeats(option.remainingSeats);
        if (minSeats != null) seatCounts.add(minSeats);
      }
    }

    return Array.from(seatCounts).sort((a, b) => a - b);
  }, [labelFilteredMatches]);

  const [activeSeatCounts, setActiveSeatCounts] = useState<Set<number>>(() => new Set(availableSeatCounts));

  const onToggleSeatCount = (seatCount: number) => {
    setActiveSeatCounts((current) => {
      const next = new Set(current);

      if (next.has(seatCount)) {
        next.delete(seatCount);
      } else {
        next.add(seatCount);
      }

      return next;
    });
  };

  const filteredMatches = useMemo(
    () =>
      labelFilteredMatches
        .map((match) => ({
          ...match,
          loadingOptions: match.loadingOptions.filter((option) => {
            const minSeats = parseMinSeats(option.remainingSeats);
            return minSeats == null || activeSeatCounts.has(minSeats);
          })
        }))
        .filter((match) => match.loadingOptions.length > 0),
    [labelFilteredMatches, activeSeatCounts]
  );

  return (
    <div className={cn(styles.app__result)} {...props}>
      <CompatibilityParamsSummary compatibilityParams={compatibilityParams} onModifyParams={onModifyParams} />

      <div className={styles.app__result_solutions}>
        <LoadingOptionFilter
          labels={availableFilterGroups}
          activeLabels={activeFilterGroups}
          onToggleLabel={onToggleFilterGroup}
        />

        <SeatsFilter
          seatCounts={availableSeatCounts}
          activeSeatCounts={activeSeatCounts}
          onToggleSeatCount={onToggleSeatCount}
        />

        <VehicleMatchCards matches={filteredMatches} />
      </div>
    </div>
  );
}
