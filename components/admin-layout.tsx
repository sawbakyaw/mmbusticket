'use client';

import { useAuth } from '@/hooks/use-auth';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, Bus, Ticket, CreditCard, Wallet,
  BarChart3, Bell, HelpCircle, LogOut, ChevronDown,
  FileText, Shield, Menu, X
} from 'lucide-react';
import { useState } from 'react';

const sidebarLinks = {
  super_admin: [
    { href: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/admin/users', icon: Users, label: 'User Management' },
    { href: '/admin/operators', icon: Bus, label: 'Operators' },
    { href: '/admin/bookings', icon: Ticket, label: 'Bookings' },
    { href: '/admin/refunds', icon: FileText, label: 'Refunds' },
    { href: '/admin/wallets', icon: Wallet, label: 'Wallets' },
    { href: '/admin/gateways', icon: CreditCard, label: 'Payment Gateways' },
    { href: '/admin/commissions', icon: BarChart3, label: 'Commissions' },
    { href: '/admin/cms', icon: FileText, label: 'CMS' },
    { href: '/admin/notifications', icon: Bell, label: 'Notifications' },
    { href: '/admin/audit-logs', icon: Shield, label: 'Audit Logs' },

  ],
  admin: [
    { href: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/admin/users', icon: Users, label: 'Users' },
    { href: '/admin/operators', icon: Bus, label: 'Operators' },
    { href: '/admin/bookings', icon: Ticket, label: 'Bookings' },
    { href: '/admin/refunds', icon: FileText, label: 'Refunds' },

  ],
};

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const links = sidebarLinks.super_admin; // TODO: Based on role

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-[#0b1220] border-r border-slate-800/80 shadow-2xl shadow-black/20 transform transition-transform duration-200 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 p-4 border-b border-slate-800">
          <div className="bg-gradient-to-br from-orange-500 to-amber-400 p-2 rounded-xl shadow-lg shadow-orange-500/15">
            <Bus className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="text-lg font-bold text-white">Admin</span>
            <span className="text-xs text-slate-500 block tracking-[0.18em] uppercase">Operations</span>
          </div>
          <button
            className="ml-auto rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="max-h-[calc(100vh-10rem)] space-y-1 overflow-y-auto p-4">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                pathname === link.href
                  ? 'bg-teal-400/10 text-teal-200 border border-teal-300/20 shadow-sm shadow-teal-950/30'
                  : 'text-slate-400 border border-transparent hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <link.icon className="h-5 w-5" />
              <span className="font-medium">{link.label}</span>
            </Link>
          ))}
        </nav>

        {/* Help */}
        <div className="absolute bottom-4 left-4 right-4">
          <Link
            href="/help"
            className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/50 transition-all"
          >
            <HelpCircle className="h-5 w-5" />
            <span>Help & Support</span>
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Header */}
        <header className="sticky top-0 z-30 h-16 bg-[#0b1220]/90 backdrop-blur-xl border-b border-slate-800/80">
          <div className="flex items-center justify-between h-full px-4 lg:px-6">
            {/* Menu button */}
            <button
              className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white lg:hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu className="h-6 w-6" />
            </button>

            {/* Breadcrumb */}
            <div className="hidden lg:flex items-center gap-2 text-sm">
              <span className="text-slate-400">Admin</span>
              <span className="text-slate-600">/</span>
              <span className="text-white font-medium">
                {links.find((l) => l.href === pathname)?.label || 'Dashboard'}
              </span>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-4">
              {/* Notifications */}
              <button className="relative rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-800/70 hover:text-white">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full" />
              </button>

              {/* User menu */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-slate-800/70"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-teal-500 flex items-center justify-center">
                    <span className="text-white text-sm font-bold">
                      {user?.email?.[0]?.toUpperCase() || 'A'}
                    </span>
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium text-white">{user?.profile?.company_name || 'Admin'}</p>
                    <p className="text-xs text-slate-400">{user?.role}</p>
                  </div>
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl border border-slate-700/80 bg-[#111b2b] py-2 shadow-2xl shadow-black/30 animate-slide-up">
                    <div className="px-4 py-3 border-b border-slate-700">
                      <p className="text-sm text-white">{user?.email}</p>
                      <p className="text-xs text-slate-400">{user?.role}</p>
                    </div>
                    <button
                      onClick={signOut}
                      className="w-full flex items-center gap-3 px-4 py-2 text-red-400 hover:bg-slate-700 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-5 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
