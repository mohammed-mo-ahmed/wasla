'use client';

import { useLocale, useTranslations } from 'next-intl';
import Image from 'next/image';

export default function Footer() {
  const t = useTranslations('common');
  const locale = useLocale();
  const isRtl = locale === 'ar';

  return (
    <footer className="bg-white border-t border-amber-200 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-gray-500 font-cairo">
            &copy; {new Date().getFullYear()} {t('title')}. {locale === 'ar' ? 'جميع الحقوق محفوظة.' : 'All rights reserved.'}
          </p>
          <a
            href={isRtl ? 'https://qabnix.web.app/ar' : 'https://qabnix.web.app/en'}
            target="_blank"
            rel="noopener noreferrer"
            className="qabnix-badge"
          >
            <span className="qabnix-badge-ring" aria-hidden="true">
              <svg width="100%" height="100%" style={{ overflow: 'visible' }}>
                <rect x="1" y="1" width="calc(100% - 2px)" height="calc(100% - 2px)" rx="9999" ry="9999" />
              </svg>
            </span>
            <span className="qabnix-badge-content">
              <Image
                src="/images/logos/qabnix.webp"
                alt="Qabnix"
                width={22}
                height={22}
                className="w-[22px] h-[22px] object-contain"
              />
              <span>{locale === 'ar' ? 'صنع بواسطة قابنيكس' : 'Powered by Qabnix'}</span>
            </span>
          </a>
        </div>
      </div>
    </footer>
  );
}
