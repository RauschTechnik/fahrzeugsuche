'use client';

import { FileText } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function MeasurementGuideLink() {
  const t = useTranslations('MeasurementGuide');

  return (
    <a
      href="/rollstuhl-massblatt.pdf"
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-key-500 hover:bg-gray-100">
      <FileText className="size-4 flex-shrink-0" />
      {t('label')}
    </a>
  );
}
