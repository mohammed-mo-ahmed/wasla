import {NextIntlClientProvider} from 'next-intl';
import {getMessages} from 'next-intl/server';
import {notFound} from 'next/navigation';
import {routing, type Locale} from '@/i18n/routing';
import {AuthProvider} from '@/shared/auth/AuthProvider';
import {AppLayout} from '@/shared/components/AppLayout';
import Footer from '@/components/Footer';

type Props = {
  children: React.ReactNode;
  params: Promise<{
    locale: string;
  }>;
};

function isLocale(locale: string): locale is Locale {
  return routing.locales.includes(locale as Locale);
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({locale}));
}

export default async function LocaleLayout({children, params}: Props) {
  const {locale} = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const messages = await getMessages({locale});
  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  return (
    <div
      lang={locale}
      dir={dir}
      className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-sky-50"
    >
      <NextIntlClientProvider locale={locale} messages={messages}>
        <AuthProvider>
          <AppLayout>{children}</AppLayout>
          <Footer />
        </AuthProvider>
      </NextIntlClientProvider>
    </div>
  );
}