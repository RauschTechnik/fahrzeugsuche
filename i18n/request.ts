import { getRequestConfig } from 'next-intl/server';
import { defaultLocale } from '@/i18n/config';

export default getRequestConfig(async () => {
  const messages = (await import(`@/messages/${defaultLocale}.json`)).default;

  return { locale: defaultLocale, messages };
});
