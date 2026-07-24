import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Icon } from '@/components/shared/Icon';
import { translateProductLabel, VehicleMatch } from '@/types/app';
import { Alert, AlertType } from '@/components/shared/Alert';

interface Props {
  match: VehicleMatch;
}

export function VehicleMatchCard({ match }: Props) {
  const t = useTranslations('VehicleMatches');
  const tProductLabels = useTranslations('ProductLabels');
  const [isOpen, setIsOpen] = useState(false);

  return (
    <li className="border-b border-gray-100 py-4 pl-4">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-3 text-left">
        <div>
          <p className="font-semibold">{match.carModel.name}</p>

          <p className="text-gray-500">
            {match.carModel.yearOfProductionSince}
            {match.carModel.yearOfProductionUntil
              ? ` - ${match.carModel.yearOfProductionUntil}`
              : ` - ${t('model-today')}`}
          </p>
        </div>

        <ChevronDown className={cn('size-5 flex-shrink-0 text-gray-400 transition-transform', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <div className="mt-3 space-y-3">
          {match.carModel.hybridOrElectricDisclaimer && (
            <Alert text={t('loading-capacity-disclaimer')} type={AlertType.Info} />
          )}

          <ul className="space-y-3">
            {match.loadingOptions.map((option) => (
              <li key={option.label} className="rounded-lg border border-gray-200 p-3">
                <p className="font-semibold">{translateProductLabel(tProductLabels, option.label)}</p>

                <p>
                  <span className="mr-2 text-gray-500">{t('remaining-seats')}</span>
                  <span>{option.remainingSeats.trim() ? option.remainingSeats : t('not-applicable')}</span>
                </p>

                <p className="flex items-center gap-1">
                  <span className="text-gray-500">{t('compatibility')}</span>
                  {option.showCheckWithSupportWarning ? (
                    <>
                      <Icon icon="triangle-exclamation" className="text-amber-500" />
                      <span>{t('check-with-support')}</span>
                    </>
                  ) : (
                    <Icon icon="circle-check" className="text-emerald-500" />
                  )}
                </p>

                {!!option.comment && <Alert text={option.comment} type={AlertType.Info} className="mt-2" />}
              </li>
            ))}
          </ul>
        </div>
      )}
    </li>
  );
}
