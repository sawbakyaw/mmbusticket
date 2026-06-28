'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { useLanguage } from '@/hooks/use-language';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Bus, Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/dashboard';
  const { signIn, loading: authLoading } = useAuth();
  const { t, language } = useLanguage();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await signIn(email, password);

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.push(redirect);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 flex items-center justify-center py-8 sm:py-12 px-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-6 sm:mb-8">
            <Link href="/" className="inline-flex items-center gap-3 mb-4 sm:mb-6">
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-2 sm:p-3 rounded-xl">
                <Bus className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
              <div className="text-left">
                <span className="text-xl sm:text-2xl font-bold text-white">MM-BusTicket</span>
                <span className="block text-xs text-teal-400 font-medium tracking-wider uppercase">Pro</span>
              </div>
            </Link>
            <h1 className="text-xl sm:text-2xl font-bold text-white">{t('loginTitle')}</h1>
            <p className="text-slate-400 mt-1 text-sm sm:text-base">{t('loginSubtitle')}</p>
          </div>

          {/* Login Form */}
          <div className="bg-slate-900/60 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">{t('email')}</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={language === 'my' ? 'you@example.com' : 'you@example.com'}
                    className="w-full input-dark rounded-xl pl-12 pr-4 py-3"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-300">{t('password')}</label>
                  <Link href="/forgot-password" className="text-sm text-teal-400 hover:text-teal-300">
                    {t('forgotPassword')}
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={language === 'my' ? 'လျှို့ဝှက်စကားထည့်ပါ' : 'Enter your password'}
                    className="w-full input-dark rounded-xl pl-12 pr-12 py-3"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || authLoading}
                className="w-full btn-primary py-3 sm:py-4 rounded-xl text-base sm:text-lg font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                    {language === 'my' ? 'ဆောင်ရွက်နေသည်...' : 'Signing in...'}
                  </>
                ) : (
                  <>
                    {t('login')}
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-slate-900 px-4 text-slate-500">{t('dontHaveAccount')}</span>
              </div>
            </div>

            <Link
              href="/signup"
              className="block w-full text-center py-3 rounded-xl border border-slate-700 text-slate-300 hover:border-teal-500 hover:text-teal-400 transition-colors"
            >
              {t('createAccount')}
            </Link>
          </div>

          {/* Quick Links */}
          <div className="mt-6 text-center space-y-2">
            <p className="text-slate-500 text-sm">{language === 'my' ? 'အမြန်ဝင်ရောက်ရန်:' : 'Quick access portals:'}</p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                href="/login?type=admin"
                className="text-sm text-orange-400 hover:text-orange-300"
              >
                {language === 'my' ? 'Admin' : 'Admin Login'}
              </Link>
              <span className="text-slate-700">•</span>
              <Link
                href="/login?type=operator"
                className="text-sm text-teal-400 hover:text-teal-300"
              >
                Operator Portal
              </Link>
              <span className="text-slate-700">•</span>
              <Link
                href="/login?type=agent"
                className="text-sm text-blue-400 hover:text-blue-300"
              >
                Agent Portal
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
