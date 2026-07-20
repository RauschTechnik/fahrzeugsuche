import { useTranslations } from 'next-intl';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  seatCounts: Array<number>;
  activeSeatCounts: Set<number>;
  onToggleSeatCount: (seatCount: number) => void;
}

export function SeatsFilter({ seatCounts, activeSeatCounts, onToggleSeatCount }: Props) {
  const t = useTranslations('VehicleMatches');

  if (seatCounts.length <= 1) return null;

  return (
    <div className="mb-5 border-b border-gray-200 pb-5">
      <p className="mb-3 font-bold text-gray-500">{t('seats-filter-title')}</p>

      <div className="flex flex-wrap gap-x-5 gap-y-2">
        {seatCounts.map((seatCount) => {
          const isActive = activeSeatCounts.has(seatCount);

          return (
            <label key={seatCount} className="flex cursor-pointer items-center gap-2.5 select-none">
              <input
                type="checkbox"
                checked={isActive}
                onChange={() => onToggleSeatCount(seatCount)}
                className="sr-only"
              />

              <span
                className={cn(
                  'flex size-5 flex-shrink-0 items-center justify-center rounded border transition-colors',
                  isActive ? 'border-key-500 bg-key-500' : 'border-gray-300 bg-background'
                )}>
                {isActive && <Check className="size-3.5 text-white" strokeWidth={3} />}
              </span>

              <span className={isActive ? 'font-medium' : 'text-gray-500'}>
                {t('seats-count', { count: seatCount })}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
