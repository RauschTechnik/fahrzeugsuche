import * as React from 'react';
import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Montserrat } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { Toaster } from '@/components/ui/sonner';
import { LanguageSwitcher } from '@/components/app/LanguageSwitcher';
import { MeasurementGuideLink } from '@/components/app/MeasurementGuideLink';
import { routing } from '@/i18n/routing';
import '@/assets/styles/globals.css';
import Script from "next/script";

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
        <Script id="hotjar" strategy="afterInteractive">
          {`(function(h,o,t,j,a,r){
              h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
              h._hjSettings={hjid:6791070,hjsv:6};
              a=o.getElementsByTagName('head')[0];
              r=o.createElement('script');r.async=1;
              r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
              a.appendChild(r);
          })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');`}
        </Script>
        <NextIntlClientProvider messages={messages}>
          <div className="container mx-auto flex items-center justify-between gap-3 px-5 pt-5">
            <Image
              src="/rausch-technik-logo.jpg"
              alt="Rausch Technik"
              width={1536}
              height={1024}
              className="h-32 w-auto"
              priority
            />

            <div className="flex items-center gap-3">
              <MeasurementGuideLink />
              <LanguageSwitcher />
            </div>
          </div>

          {children}

          <Toaster richColors />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
