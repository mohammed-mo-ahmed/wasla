'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import Image from 'next/image';
import { Phone, Mail, Clock } from 'lucide-react';

export default function Footer() {
  const t = useTranslations('common');
  const locale = useLocale();
  const isRtl = locale === 'ar';

  const quickLinks = [
    { href: '/', label: t('home') },
    { href: '/products', label: t('products') },
    { href: '/offers', label: t('offers') },
    { href: '/about', label: t('about') },
    { href: '/contact', label: t('contact') },
    { href: '/blog', label: t('blog') },
  ];

  return (
    <footer className="bg-slate-900 text-slate-300 pt-16 pb-8 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 mb-12">

          {/* Logo & Brief */}
          <div className={`flex flex-col ${isRtl ? 'items-start text-right' : 'items-start text-left'}`}>
            <div className="mb-4">
              <Image
                src={isRtl ? '/logo-ar.svg' : '/logo-en.svg'}
                alt="Mwaslaty"
                width={180}
                height={48}
                className="h-10 md:h-12 w-auto brightness-0 invert"
              />
            </div>
            <p className="text-sm text-slate-400 leading-relaxed font-cairo mb-4">
              {locale === 'ar'
                ? 'مجموعتنا الطبية تلتزم بتقديم رعاية صحية ذات مواصفات عالمية، مع توصيل سريع للأدوية ومستحضرات التجميل.'
                : 'Our pharmacy group is committed to providing world-class health services, ensuring fast delivery for medicines and cosmetics.'}
            </p>
          </div>

          {/* Quick Links */}
          <div className={`flex flex-col ${'items-start'}`}>
            <h3 className="text-white font-bold text-base mb-4 font-cairo">
              {locale === 'ar' ? 'روابط سريعة' : 'Quick Links'}
            </h3>
            <ul className="space-y-2 text-sm">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="hover:text-teal-400 transition-colors py-1 block"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Details */}
          <div className="flex flex-col items-start">
            <h3 className="text-white font-bold text-base mb-4 font-cairo">
              {locale === 'ar' ? 'معلومات الاتصال' : 'Contact Information'}
            </h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <Phone size={16} className="text-teal-500" />
                <span dir="ltr">+20 123 456 7890</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail size={16} className="text-teal-500" />
                <span>moyousefpharmacies@gmail.com</span>
              </li>
              <li className="flex items-center gap-2">
                <Clock size={16} className="text-teal-500" />
                <span className="font-cairo">{isRtl ? 'يومياً على مدار 24 ساعة' : '24 Hours Daily'}</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom bar - Qabnix badge */}
        <div className="pt-8 border-t border-slate-800 text-center text-xs text-slate-500 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="font-cairo">
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
