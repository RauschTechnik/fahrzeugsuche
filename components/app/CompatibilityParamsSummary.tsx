import { useTranslations } from 'next-intl';
import { ComponentPropsWithoutRef } from 'react';
import { CompatibilityParams } from '@/types/app';
import styles from '@/assets/styles/app.module.css';
import { Icon } from '@/components/shared/Icon';
import { Button } from '@/components/ui/button';

interface Props extends ComponentPropsWithoutRef<'div'> {
  compatibilityParams: CompatibilityParams;
  onModifyParams: () => void;
}

export function CompatibilityParamsSummary({ compatibilityParams, onModifyParams, ...props }: Props) {
  const t = useTranslations('CompatibleSolutionsParams');

  return (
    <div className={styles.app__result_params} {...props}>
      <div className={styles.app__result_params_header}>
        <Icon icon="vehicle" className="size-7 text-key-500" />
        <h4 className={styles.app__form_title}>{t('loading-space')}</h4>
      </div>

      <div className={styles.app__result_params_item}>
        <p className={styles.app__result_params_value}>{t(`loading-space-values.${compatibilityParams.loading_space}`)}</p>
      </div>

      <div className={styles.app__result_params_header}>
        <Icon icon="wheelchair" className="size-7 text-key-500" />
        <h4 className={styles.app__form_title}>{t('wheelchair')}</h4>
      </div>

      <div className={styles.app__result_params_item}>
        {!!compatibilityParams.length && (
          <div>
            <h5 className={styles.app__result_params_key}>{t('length')}</h5>
            <p className={styles.app__result_params_value}>
              {compatibilityParams.length} {t('centimetre')}
            </p>
          </div>
        )}

        {!!compatibilityParams.width && (
          <div>
            <h5 className={styles.app__result_params_key}>{t('width')}</h5>
            <p className={styles.app__result_params_value}>
              {compatibilityParams.width} {t('centimetre')}
            </p>
          </div>
        )}

        {!!compatibilityParams.width_unfolded && (
          <div>
            <h5 className={styles.app__result_params_key}>{t('width-unfolded')}</h5>
            <p className={styles.app__result_params_value}>
              {compatibilityParams.width_unfolded} {t('centimetre')}
            </p>
          </div>
        )}

        {!!compatibilityParams.width_folded && (
          <div>
            <h5 className={styles.app__result_params_key}>{t('width-folded')}</h5>
            <p className={styles.app__result_params_value}>
              {compatibilityParams.width_folded} {t('centimetre')}
            </p>
          </div>
        )}

        {!!compatibilityParams.height && (
          <div>
            <h5 className={styles.app__result_params_key}>{t('height')}</h5>
            <p className={styles.app__result_params_value}>
              {compatibilityParams.height} {t('centimetre')}
            </p>
          </div>
        )}

        <div>
          <h5 className={styles.app__result_params_key}>{t('weight')}</h5>
          <p className={styles.app__result_params_value}>
            {compatibilityParams.is_heavy_wc ? t('greater-55') : t('less-55')}
          </p>
        </div>
      </div>

      <div className={styles.app__result_params_footer}>
        <Button variant="outline" type="button" className="w-full" onClick={onModifyParams}>
          {t('modify-parameters')}
        </Button>
      </div>
    </div>
  );
}
