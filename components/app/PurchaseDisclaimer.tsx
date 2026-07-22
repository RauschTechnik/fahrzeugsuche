import { ComponentPropsWithoutRef } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import styles from '@/assets/styles/app.module.css';
import { Icon } from '@/components/shared/Icon';

export function PurchaseDisclaimer({ className, ...props }: ComponentPropsWithoutRef<'div'>) {
  const t = useTranslations('PurchaseDisclaimer');

  return (
    <div className={cn(styles.app__disclaimer, className)} {...props}>
      <div className={styles.app__result_params_header}>
        <Icon icon="circle-info" className="size-7 text-key-500" />
        <h4 className={styles.app__form_title}>{t('title')}</h4>
      </div>

      <div className="space-y-3 p-5 text-base text-gray-600">
        <p>{t('paragraph-1')}</p>
        <p>{t('paragraph-scope', { year: new Date().getFullYear() })}</p>
        <p>{t('paragraph-2')}</p>
        <p>
          {t('paragraph-3')}{' '}
          <a
            href="https://check.ladeboy.de"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-key-500 underline">
            {t('link-label')}
          </a>
        </p>
      </div>
    </div>
  );
}
