import * as React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Montserrat } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { Toaster } from '@/components/ui/sonner';
import { LanguageSwitcher } from '@/components/app/LanguageSwitcher';
import { routing } from '@/i18n/routing';
import '@/assets/styles/globals.css';

const montserrat = Montserrat({
  variable: '--font-montserrat',
  subsets: ['latin'],
  weight: ['400', '600', '700']
});

export const metadata: Metadata = {
  title: 'Rausch Technik - Fahrzeugsuche',
  description: 'Finden Sie passende Fahrzeugmodelle für Ihren Rollstuhl'
};

export default async function AppLayout({
  children,
  params
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  setRequestLocale(locale);

  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className={`${montserrat.variable} font-montserrat antialiased`}>
        <NextIntlClientProvider messages={messages}>
          <div className="container mx-auto flex justify-end px-5 pt-5">
            <LanguageSwitcher />
          </div>

          {children}

          <Toaster richColors />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
