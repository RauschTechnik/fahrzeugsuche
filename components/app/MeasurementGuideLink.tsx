'use client';

import { FileText } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

const MEASUREMENT_GUIDE_PATHS: Record<string, string> = {
  de: '/rollstuhl-massblatt.pdf',
  en: '/rollstuhl-massblatt-en.pdf',
  fr: '/rollstuhl-massblatt-fr.pdf'
};

export function MeasurementGuideLink() {
  const t = useTranslations('MeasurementGuide');
  const locale = useLocale();

  return (
    <a
      href={MEASUREMENT_GUIDE_PATHS[locale] ?? MEASUREMENT_GUIDE_PATHS.de}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-key-500 hover:bg-gray-100">
      <FileText className="size-4 flex-shrink-0" />
      {t('label')}
    </a>
  );
}
