'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { Bus, Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle, ShieldCheck } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/admin/dashboard';
  const { signIn, loading: authLoading } = useAuth();

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
    <div className="min-h-screen flex flex-col bg-slate-950">
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
                <span className="block text-xs text-teal-400 font-medium tracking-wider uppercase">Admin Console</span>
              </div>
            </Link>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 mb-3">
              <ShieldCheck className="h-4 w-4 text-orange-400" />
              <span className="text-xs font-medium text-orange-400">Restricted Access</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">Administrator Sign In</h1>
            <p className="text-slate-400 mt-1 text-sm sm:text-base">
              Sign in with your administrator credentials
            </p>
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
                <label className="text-sm font-medium text-slate-300">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@example.com"
                    className="w-full input-dark rounded-xl pl-12 pr-4 py-3"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-300">Password</label>
                  <Link href="/forgot-password" className="text-sm text-teal-400 hover:text-teal-300">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
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
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In to Console
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Footer note */}
          <div className="mt-6 text-center">
            <p className="text-slate-500 text-sm">
              Not an administrator?{' '}
              <Link href="/login" className="text-teal-400 hover:text-teal-300">
                Use the standard login
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
