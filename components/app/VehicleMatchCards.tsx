import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { ComponentPropsWithoutRef } from 'react';
import { VehicleMatch } from '@/types/app';
import { ManufacturerGroup } from '@/components/app/ManufacturerGroup';

interface Props extends ComponentPropsWithoutRef<'div'> {
  matches: Array<VehicleMatch>;
}

export function VehicleMatchCards({ matches, ...props }: Props) {
  const t = useTranslations('VehicleMatches');

  const groupedByManufacturer = useMemo(() => {
    const groups = new Map<string, Array<VehicleMatch>>();

    for (const match of matches) {
      const name = match.carModel.manufacturer.name;
      const existing = groups.get(name);

      if (existing) {
        existing.push(match);
      } else {
        groups.set(name, [match]);
      }
    }

    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [matches]);

  return (
    <div {...props}>
      <p className="border-b border-gray-200 py-5 font-bold text-gray-500">
        {t('matches-found', { count: matches.length })}
      </p>

      <ul>
        {groupedByManufacturer.map(([manufacturerName, manufacturerMatches]) => (
          <ManufacturerGroup key={manufacturerName} manufacturerName={manufacturerName} matches={manufacturerMatches} />
        ))}
      </ul>
    </div>
  );
}
