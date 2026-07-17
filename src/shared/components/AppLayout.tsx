'use client';

import Image from 'next/image';
import Link from 'next/link';
import {Key, Languages, LogOut, MapPin, Menu, MessageCircle, Search, User, Users, X} from 'lucide-react';
import {useLocale, useTranslations} from 'next-intl';
import {useState} from 'react';
import {usePathname} from 'next/navigation';
import {useAuth} from '@/shared/auth/AuthProvider';

type NavItem = {
  key: string;
  href: string;
  icon: React.ComponentType<{className?: string}>;
};

export function AppLayout({children}: {children: React.ReactNode}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const locale = useLocale();
  const pathname = usePathname() ?? `/${locale}`;
  const t = useTranslations('navigation');
  const footer = useTranslations('footer');
  const {isAuthenticated, logout, user} = useAuth();

  const navItems: NavItem[] = [
    {key: 'home', href: '/', icon: MapPin},
    {key: 'chatbot', href: '/chatbot', icon: MessageCircle},
    {key: 'search', href: '/search', icon: Search},
    {key: 'importantStops', href: '/stops', icon: MapPin},
    {key: 'userRoutes', href: '/user-routes', icon: Users},
    ...(isAuthenticated ? [{key: 'apiKey', href: '/api-key', icon: Key}] : [])
  ];

  const localizePath = (href: string) => `/${locale}${href === '/' ? '' : href}`;

  /**
   * Locale switching requires a full page reload so the Server Component layout
   * re-runs `getMessages()` and `NextIntlClientProvider` receives fresh translations.
   * A soft navigation (router.push) reuses the client-side component tree and
   * leaves the old messages in place even though the URL changes.
   */
  const switchLanguage = () => {
    const nextLocale = locale === 'ar' ? 'en' : 'ar';
    const segments = pathname.split('/');
    segments[1] = nextLocale;
    const nextPath = segments.join('/') || `/${nextLocale}`;
    window.location.href = nextPath;
  };

  const isActive = (href: string) => {
    const target = localizePath(href);
    return pathname === target || (href !== '/' && pathname.startsWith(`${target}/`));
  };

  const nav = (
    <>
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.key}
            href={localizePath(item.href)}
            onClick={() => setIsMenuOpen(false)}
            className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              isActive(item.href)
                ? 'bg-amber-100 text-amber-800'
                : 'text-gray-600 hover:bg-amber-50 hover:text-amber-700'
            }`}
          >
            <Icon className="h-4 w-4" />
            <span>{t(item.key)}</span>
          </Link>
        );
      })}
    </>
  );

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-amber-200 bg-white/95 shadow-sm backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href={localizePath('/')} className="flex items-center" aria-label="Home">
            <Image
              src={locale === 'ar' ? '/logo-ar.svg' : '/logo-en.svg'}
              alt=""
              width={112}
              height={40}
              className="h-10 w-auto object-contain"
              priority
            />
          </Link>

          <nav className="hidden items-center gap-1 md:flex">{nav}</nav>

          <div className="hidden items-center gap-2 md:flex">
            <button
              type="button"
              onClick={switchLanguage}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:bg-amber-50 hover:text-amber-700"
            >
              <Languages className="h-4 w-4" />
              {t('language')}
            </button>

            {isAuthenticated ? (
              <>
                <span className="rounded-md bg-gray-100 px-3 py-2 text-sm text-gray-700">
                  {user?.displayName || user?.email}
                </span>
                <button
                  type="button"
                  onClick={logout}
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" />
                  {t('logout')}
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href={localizePath('/login')}
                  className="rounded-md px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
                >
                  {t('login')}
                </Link>
                <Link
                  href={localizePath('/signup')}
                  className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  <User className="h-4 w-4" />
                  {t('register')}
                </Link>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsMenuOpen((open) => !open)}
            className="rounded-md p-2 text-gray-600 hover:bg-amber-50 hover:text-amber-700 md:hidden"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {isMenuOpen ? (
          <div className="border-t border-amber-200 bg-white px-4 py-3 md:hidden">
            <div className="space-y-1">{nav}</div>
            <div className="mt-3 flex flex-col gap-2 border-t border-gray-100 pt-3">
              <button
                type="button"
                onClick={switchLanguage}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:bg-amber-50"
              >
                <Languages className="h-4 w-4" />
                {t('language')}
              </button>
              {isAuthenticated ? (
                <button
                  type="button"
                  onClick={logout}
                  className="rounded-md px-3 py-2 text-start text-sm font-semibold text-red-600 hover:bg-red-50"
                >
                  {t('logout')}
                </button>
              ) : (
                <>
                  <Link
                    href={localizePath('/login')}
                    onClick={() => setIsMenuOpen(false)}
                    className="rounded-md px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
                  >
                    {t('login')}
                  </Link>
                  <Link
                    href={localizePath('/signup')}
                    onClick={() => setIsMenuOpen(false)}
                    className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    {t('register')}
                  </Link>
                </>
              )}
            </div>
          </div>
        ) : null}
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-amber-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 text-center text-sm text-gray-600 sm:px-6 lg:px-8">
          &copy; 2026. {footer('text')}
        </div>
      </footer>
    </div>
  );
}
