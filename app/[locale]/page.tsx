'use client';

import { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import styles from '@/assets/styles/app.module.css';
import { CompatibilityParams, VehicleMatch } from '@/types/app';
import { Button } from '@/components/ui/button';
import { CompatibilityForm } from '@/components/app/CompatibilityForm';
import { VehicleMatches } from '@/components/app/VehicleMatches';
import { PurchaseDisclaimer } from '@/components/app/PurchaseDisclaimer';
import { SearchScopeNotice } from '@/components/app/SearchScopeNotice';

export default function RootPage() {
  const t = useTranslations('Wizard');

  const [isShowMatches, setIsShowMatches] = useState(false);

  const [isNoMatchesFound, setIsNoMatchesFound] = useState(false);

  const [compatibilityParamsHistory, setCompatibilityParamsHistory] = useState<Array<CompatibilityParams>>([]);

  const [matches, setMatches] = useState<Array<VehicleMatch>>([]);

  const onCheckCompatibility = async (values: CompatibilityParams) => {
    setIsNoMatchesFound(false);

    const response = await fetch('/api/get-matching-vehicles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        loadingSpace: values.loading_space,
        wheelchairType: values.wheelchair_type,
        isHeavyWc: values.is_heavy_wc,
        length: values.length ?? null,
        height: values.height ?? null,
        width: values.width ?? values.width_folded ?? null,
        widthUnfolded: values.width_unfolded ?? null
      })
    });
    const data = await response.json();
    const matchingVehicles = data.matchingVehicles;

    if (matchingVehicles.length > 0) {
      setCompatibilityParamsHistory([...compatibilityParamsHistory, values]);
      setMatches(matchingVehicles);
      setIsShowMatches(true);
    } else {
      setIsNoMatchesFound(true);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className={styles.app}>
      <div className={styles.app__header}>
        <h1 className="mb-3 text-2xl md:mb-0 md:text-3xl">{t('title')}</h1>
      </div>

      {isNoMatchesFound && (
        <div className={styles.app__empty_result}>
          <h5>{t('no-matches.title')}</h5>
          <p>{t('no-matches.description')}</p>
        </div>
      )}

      {!isShowMatches && compatibilityParamsHistory.length > 0 && (
        <div className="mb-5">
          <Button variant="ghost" className="text-key-500 hover:text-key-500" onClick={() => setIsShowMatches(true)}>
            <ChevronLeft />
            {t('back-to-results')}
          </Button>
        </div>
      )}

      <CompatibilityForm
        isCheckDisabled={false}
        onCheckCompatibility={onCheckCompatibility}
        hidden={isShowMatches}
      />

      {!isShowMatches && <SearchScopeNotice className="mt-8" />}

      {!isShowMatches && <PurchaseDisclaimer className="mt-5" />}

      {isShowMatches && (
        <VehicleMatches
          compatibilityParams={compatibilityParamsHistory[compatibilityParamsHistory.length - 1]}
          matches={matches}
          onModifyParams={() => setIsShowMatches(false)}
        />
      )}
    </div>
  );
}
