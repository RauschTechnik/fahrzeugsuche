'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { cn } from '@/lib/utils';

const LOCALE_LABELS: Record<string, string> = {
  de: 'DE',
  en: 'EN',
  fr: 'FR'
};

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="inline-flex gap-1 rounded-lg bg-gray-100 p-1">
      {routing.locales.map((value) => (
        <button
          key={value}
          type="button"
          onClick={() => router.replace(pathname, { locale: value })}
          className={cn(
            'rounded-md px-2.5 py-1 text-sm font-semibold transition-colors',
            value === locale ? 'bg-white text-key-500 shadow' : 'text-gray-500 hover:text-gray-700'
          )}>
          {LOCALE_LABELS[value]}
        </button>
      ))}
    </div>
  );
}
