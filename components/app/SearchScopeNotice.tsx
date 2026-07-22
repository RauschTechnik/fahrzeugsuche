import { ComponentPropsWithoutRef } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import styles from '@/assets/styles/app.module.css';
import { Icon } from '@/components/shared/Icon';

export function SearchScopeNotice({ className, ...props }: ComponentPropsWithoutRef<'div'>) {
  const t = useTranslations('SearchScopeNotice');

  return (
    <div className={cn(styles.app__disclaimer, className)} {...props}>
      <div className={styles.app__result_params_header}>
        <Icon icon="circle-info" className="size-7 text-key-500" />
        <h4 className={styles.app__form_title}>{t('title')}</h4>
      </div>

      <div className="p-5 text-base text-gray-600">
        <p>{t('text', { year: new Date().getFullYear() })}</p>
      </div>
    </div>
  );
}
