'use client';

import Link from 'next/link';
import { Bus, Phone, Mail, MapPin, Facebook } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';

const popularRoutes = [
  { from: 'Yangon', to: 'Mandalay' },
  { from: 'Yangon', to: 'Bagan' },
  { from: 'Yangon', to: 'Naypyitaw' },
  { from: 'Yangon', to: 'Mawlamyine' },
];

export function Footer() {
  const { t, language } = useLanguage();

  return (
    <footer className="border-t border-slate-800/50 bg-slate-950">
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-2 rounded-lg">
                <Bus className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold text-white">MM-BusTicket Pro</span>
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed">
              {language === 'my'
                ? 'မြန်မာနိုင်ငံ၏ ထိပ်တန်း ဘတ်စ်ကားလက်မှတ် Bookingစနစ်။ 200+ နေရာသို့ 100+ Companyများဖြင့် အလွယ်တကူ Bookingပြုလုပ်ပါ။'
                : "Myanmar's leading online bus ticket platform. Book tickets instantly across 200+ destinations with 100+ operators."}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">{language === 'my' ? 'မီနူး' : 'Quick Links'}</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-slate-400 hover:text-orange-400 text-sm transition-colors">
                  {t('home')}
                </Link>
              </li>
              <li>
                <Link href="/find-booking" className="text-slate-400 hover:text-orange-400 text-sm transition-colors">
                  {t('findBooking')}
                </Link>
              </li>
              <li>
                <Link href="/help" className="text-slate-400 hover:text-orange-400 text-sm transition-colors">
                  {t('helpCenter')}
                </Link>
              </li>
              <li>
                <Link href="/help" className="text-slate-400 hover:text-orange-400 text-sm transition-colors">
                  {t('faq')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Popular Routes */}
          <div>
            <h4 className="text-white font-semibold mb-4">{t('popularRoutes')}</h4>
            <ul className="space-y-2">
              {popularRoutes.map((route, i) => (
                <li key={i}>
                  <Link
                    href={`/search?from=${route.from}&to=${route.to}`}
                    className="text-slate-400 hover:text-teal-400 text-sm transition-colors"
                  >
                    {route.from} - {route.to}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-4">{t('contactUs')}</h4>
            <ul className="space-y-3">
              <li>
                <a href="tel:09777111811" className="flex items-center gap-2 text-slate-400 hover:text-teal-400 text-sm transition-colors">
                  <Phone className="h-4 w-4 flex-shrink-0" />
                  09 777 111 811
                </a>
              </li>
              <li>
                <a href="mailto:support@mmbusticket.com" className="flex items-center gap-2 text-slate-400 hover:text-teal-400 text-sm transition-colors">
                  <Mail className="h-4 w-4 flex-shrink-0" />
                  support@mmbusticket.com
                </a>
              </li>
              <li>
                <a href="https://m.me/MMBusTicket" target="_blank" rel="noopener" className="flex items-center gap-2 text-slate-400 hover:text-blue-400 text-sm transition-colors">
                  <Facebook className="h-4 w-4 flex-shrink-0" />
                  {language === 'my' ? 'Messenger ပံ့ပိုးမှု' : 'Messenger Support'}
                </a>
              </li>
              <li className="flex items-start gap-2 text-slate-400 text-sm">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{language === 'my' ? 'ရန်ကုန်၊ မြန်မာ' : 'Yangon, Myanmar'}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 md:mt-12 pt-8 border-t border-slate-800/50">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-slate-500 text-sm text-center md:text-left">
              &copy; {new Date().getFullYear()} MM-BusTicket Pro. {language === 'my' ? 'မူပိုင်ခွင့်အားလုံးရှိသည်။' : 'All rights reserved.'}
            </p>
            <div className="flex items-center gap-4 md:gap-6">
              <Link href="/help" className="text-slate-500 hover:text-slate-300 text-sm transition-colors">
                {t('privacyPolicy')}
              </Link>
              <Link href="/help" className="text-slate-500 hover:text-slate-300 text-sm transition-colors">
                {t('termsConditions')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
