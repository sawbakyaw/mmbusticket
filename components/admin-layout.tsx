'use client';

import { useAuth } from '@/hooks/use-auth';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, Bus, Ticket, CreditCard, Wallet,
  Settings, BarChart3, Bell, HelpCircle, LogOut, ChevronDown,
  Building2, UserCheck, FileText, Shield, Menu, X
} from 'lucide-react';
import { useState } from 'react';

const sidebarLinks = {
  super_admin: [
    { href: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/admin/users', icon: Users, label: 'User Management' },
    { href: '/admin/operators', icon: Bus, label: 'Operators' },
    { href: '/admin/agents', icon: UserCheck, label: 'Agents' },
    { href: '/admin/bookings', icon: Ticket, label: 'Bookings' },
    { href: '/admin/refunds', icon: FileText, label: 'Refunds' },
    { href: '/admin/wallets', icon: Wallet, label: 'Wallets' },
    { href: '/admin/gateways', icon: CreditCard, label: 'Payment Gateways' },
    { href: '/admin/commissions', icon: BarChart3, label: 'Commissions' },
    { href: '/admin/cms', icon: FileText, label: 'CMS' },
    { href: '/admin/notifications', icon: Bell, label: 'Notifications' },
    { href: '/admin/audit-logs', icon: Shield, label: 'Audit Logs' },
    { href: '/admin/settings', icon: Settings, label: 'Settings' },
  ],
  admin: [
    { href: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/admin/users', icon: Users, label: 'Users' },
    { href: '/admin/operators', icon: Bus, label: 'Operators' },
    { href: '/admin/bookings', icon: Ticket, label: 'Bookings' },
    { href: '/admin/refunds', icon: FileText, label: 'Refunds' },
    { href: '/admin/reports', icon: BarChart3, label: 'Reports' },
    { href: '/admin/settings', icon: Settings, label: 'Settings' },
  ],
};

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const links = sidebarLinks.super_admin; // TODO: Based on role

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-slate-900 border-r border-slate-800 transform transition-transform duration-200 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 p-4 border-b border-slate-800">
          <div className="bg-gradient-to-br from-orange-500 to orange-600 p-2 rounded-lg">
            <Bus className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="text-lg font-bold text-white">Admin</span>
            <span className="text-xs text-teal-400 block">Dashboard</span>
          </div>
          <button
            className="lg:hidden p-2 ml-auto text-slate-400 hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                pathname === link.href
                  ? 'bg-orange-500/10 text-orange-400 border border-orange-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
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
        <header className="sticky top-0 z-30 h-16 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800">
          <div className="flex items-center justify-between h-full px-4 lg:px-6">
            {/* Menu button */}
            <button
              className="lg:hidden p-2 text-slate-400 hover:text-white"
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
              <button className="relative p-2 text-slate-400 hover:text-white transition-colors">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full" />
              </button>

              {/* User menu */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-3 p-2 hover:bg-slate-800 rounded-xl transition-colors"
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
                  <div className="absolute right-0 top-full mt-2 w-56 bg-slate-800 border border-slate-700 rounded-xl shadow-xl py-2 animate-slide-up">
                    <div className="px-4 py-3 border-b border-slate-700">
                      <p className="text-sm text-white">{user?.email}</p>
                      <p className="text-xs text-slate-400">{user?.role}</p>
                    </div>
                    <Link
                      href="/admin/profile"
                      className="flex items-center gap-3 px-4 py-2 text-slate-300 hover:bg-slate-700 transition-colors"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <Users className="h-4 w-4" />
                      <span>Profile</span>
                    </Link>
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
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
