'use client';

import Link from 'next/link';
import { Bus, Phone, HelpCircle, Menu, X, Globe } from 'lucide-react';
import { useState } from 'react';
import { useLanguage } from '@/hooks/use-language';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-xl">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-orange-500/20 blur-lg rounded-full" />
              <div className="relative bg-gradient-to-br from-orange-500 to-orange-600 p-2 rounded-lg">
                <Bus className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-white group-hover:text-orange-400 transition-colors">
                MM-BusTicket
              </span>
              <span className="text-[10px] text-teal-400 font-medium tracking-wider uppercase">
                Pro
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link
              href="/"
              className="text-slate-300 hover:text-orange-400 transition-colors font-medium"
            >
              {t('home')}
            </Link>
            <Link
              href="/find-booking"
              className="text-slate-300 hover:text-orange-400 transition-colors font-medium"
            >
              {t('findBooking')}
            </Link>
            <Link
              href="/help"
              className="text-slate-300 hover:text-orange-400 transition-colors font-medium"
            >
              {t('helpCenter')}
            </Link>
          </nav>

          {/* Contact, Language & Actions */}
          <div className="hidden md:flex items-center gap-4">
            {/* Language Toggle */}
            <button
              onClick={() => setLanguage(language === 'en' ? 'my' : 'en')}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 transition-colors"
            >
              <Globe className="h-4 w-4 text-teal-400" />
              <span className="text-sm font-medium text-slate-200">
                {language === 'en' ? 'မြန်မာ' : 'English'}
              </span>
            </button>

            <a
              href="tel:09777111811"
              className="flex items-center gap-2 text-sm text-teal-400 hover:text-teal-300 transition-colors"
            >
              <Phone className="h-4 w-4" />
              <span>09 777 111 811</span>
            </a>
            <Link
              href="/help"
              className="btn-primary px-4 py-2 rounded-lg text-sm"
            >
              <HelpCircle className="h-4 w-4 mr-2 inline" />
              {t('support247')}
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-slate-300 hover:text-white"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 space-y-4 animate-slide-up">
            <Link
              href="/"
              className="block text-slate-300 hover:text-orange-400 py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              {t('home')}
            </Link>
            <Link
              href="/find-booking"
              className="block text-slate-300 hover:text-orange-400 py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              {t('findBooking')}
            </Link>
            <Link
              href="/help"
              className="block text-slate-300 hover:text-orange-400 py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              {t('helpCenter')}
            </Link>

            {/* Language Toggle for Mobile */}
            <button
              onClick={() => setLanguage(language === 'en' ? 'my' : 'en')}
              className="flex items-center gap-2 text-slate-300 py-2"
            >
              <Globe className="h-4 w-4" />
              <span>{language === 'en' ? 'မြန်မာဘာသာ' : 'English'}</span>
            </button>

            <a
              href="tel:09777111811"
              className="flex items-center gap-2 text-teal-400 py-2"
            >
              <Phone className="h-4 w-4" />
              <span>09 777 111 811</span>
            </a>
          </div>
        )}
      </div>
    </header>
  );
}
