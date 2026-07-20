import { useTranslations } from 'next-intl';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  labels: Array<string>;
  activeLabels: Set<string>;
  onToggleLabel: (label: string) => void;
}

export function LoadingOptionFilter({ labels, activeLabels, onToggleLabel }: Props) {
  const t = useTranslations('VehicleMatches');

  if (labels.length <= 1) return null;

  return (
    <div className="mb-5 border-b border-gray-200 pb-5">
      <p className="mb-3 font-bold text-gray-500">{t('filter-title')}</p>

      <div className="flex flex-col gap-2">
        {labels.map((label) => {
          const isActive = activeLabels.has(label);

          return (
            <label key={label} className="flex cursor-pointer items-center gap-2.5 select-none">
              <input type="checkbox" checked={isActive} onChange={() => onToggleLabel(label)} className="sr-only" />

              <span
                className={cn(
                  'flex size-5 flex-shrink-0 items-center justify-center rounded border transition-colors',
                  isActive ? 'border-key-500 bg-key-500' : 'border-gray-300 bg-background'
                )}>
                {isActive && <Check className="size-3.5 text-white" strokeWidth={3} />}
              </span>

              <span className={isActive ? 'font-medium' : 'text-gray-500'}>{label}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
