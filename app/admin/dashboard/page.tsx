'use client';

import { useEffect, useState } from 'react';
import { database } from '@/lib/db-client';
import { AdminLayout } from '@/components/admin-layout';
import { DashboardStats } from '@/lib/types-extended';
import { Booking } from '@/lib/types';
import {
  TrendingUp, TrendingDown, Users, Bus, Ticket, DollarSign,
  ArrowUpRight, ArrowDownRight, Activity, AlertCircle
} from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [pendingRefunds, setPendingRefunds] = useState(0);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch booking stats
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data: bookings } = await database
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      const { count: totalBookings } = await database
        .from('bookings')
        .select('*', { count: 'exact', head: true });

      const { count: todayBookingsCount } = await database
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString());

      const { count: pendingRefundsCount } = await database
        .from('refund_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      const { count: operatorsCount } = await database
        .from('operators')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      const { count: agentsCount } = await database
        .from('agents')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Calculate revenue
      const totalRevenue = bookings?.reduce((sum, b) => sum + Number(b.total_amount), 0) || 0;
      const todayRevenue = bookings
        ?.filter(b => new Date(b.created_at) >= today)
        .reduce((sum, b) => sum + Number(b.total_amount), 0) || 0;

      setStats({
        totalBookings: totalBookings || 0,
        totalRevenue,
        totalPassengers: bookings?.reduce((sum, b) => sum + b.seat_numbers.length, 0) || 0,
        activeOperators: operatorsCount || 0,
        activeAgents: agentsCount || 0,
        pendingRefunds: pendingRefundsCount || 0,
        totalWalletBalance: 0,
        todayBookings: todayBookingsCount || 0,
        todayRevenue,
        monthlyGrowth: 12.5,
      });

      setRecentBookings((bookings as Booking[]) || []);
      setPendingRefunds(pendingRefundsCount || 0);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'MMK',
      minimumFractionDigits: 0,
    }).format(amount).replace('MMK', 'K');
  };

  const statCards = stats ? [
    {
      label: 'Total Revenue',
      value: formatCurrency(stats.totalRevenue),
      change: '+12.5%',
      positive: true,
      icon: DollarSign,
      color: 'from-emerald-500 to-teal-400',
    },
    {
      label: 'Total Bookings',
      value: stats.totalBookings.toLocaleString(),
      change: '+8.2%',
      positive: true,
      icon: Ticket,
      color: 'from-sky-500 to-indigo-500',
    },
    {
      label: 'Active Operators',
      value: stats.activeOperators.toString(),
      change: '+2',
      positive: true,
      icon: Bus,
      color: 'from-amber-400 to-orange-500',
    },
    {
      label: 'Active Agents',
      value: stats.activeAgents.toString(),
      change: '+5',
      positive: true,
      icon: Users,
      color: 'from-cyan-500 to-sky-500',
    },
  ] : [];

  return (
    <AdminLayout>
      <div className="mx-auto max-w-[1600px] space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-teal-300">Operations overview</p>
            <h1 className="text-3xl font-semibold tracking-tight text-white">Dashboard</h1>
            <p className="mt-2 text-sm text-slate-400">Welcome back! Here&apos;s what&apos;s happening today.</p>
          </div>
          <div className="flex items-center gap-2">
            <select className="input-dark rounded-xl border border-slate-700/80 px-4 py-2.5 text-sm shadow-sm">
              <option>Last 7 days</option>
              <option>Last 30 days</option>
              <option>This month</option>
              <option>This year</option>
            </select>
          </div>
        </div>

        {/* Stats Cards */}
        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-2xl border border-slate-800/80 bg-[#0c1422] p-6 animate-pulse">
                <div className="h-4 bg-slate-700 rounded w-1/2 mb-4" />
                <div className="h-8 bg-slate-700 rounded w-3/4" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {statCards.map((stat, i) => (
              <div
                key={i}
                className="rounded-2xl border border-slate-800/80 bg-[#0c1422] p-5 shadow-sm shadow-black/10 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-700 hover:shadow-lg hover:shadow-black/20 sm:p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`rounded-xl bg-gradient-to-br p-3 shadow-lg shadow-black/15 ${stat.color}`}>
                    <stat.icon className="h-5 w-5 text-white" />
                  </div>
                  <div className={`flex items-center gap-1 text-sm ${
                    stat.positive ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {stat.positive ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                    {stat.change}
                  </div>
                </div>
                <p className="text-slate-400 text-sm">{stat.label}</p>
                <p className="mt-2 text-3xl font-semibold tracking-tight text-white">{stat.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Today&apos;s Performance */}
          <div className="rounded-2xl border border-slate-800/80 bg-[#0c1422] p-5 shadow-sm shadow-black/10 sm:p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5 text-teal-400" />
              Today&apos;s Performance
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Bookings</span>
                <span className="text-white font-semibold">{stats?.todayBookings || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Revenue</span>
                <span className="text-white font-semibold">{formatCurrency(stats?.todayRevenue || 0)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Passengers</span>
                <span className="text-white font-semibold">{stats?.totalPassengers || 0}</span>
              </div>
            </div>
          </div>

          {/* Pending Actions */}
          <div className="rounded-2xl border border-slate-800/80 bg-[#0c1422] p-5 shadow-sm shadow-black/10 sm:p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-400" />
              Pending Actions
            </h3>
            <div className="space-y-4">
              <Link
                href="/admin/refunds"
                className="flex items-center justify-between rounded-xl border border-amber-400/15 bg-amber-400/[0.06] p-3.5 transition-colors hover:bg-amber-400/10"
              >
                <span className="text-sm font-medium text-amber-200">Refund Requests</span>
                <span className="rounded-lg bg-amber-400/15 px-2.5 py-1 text-sm font-semibold text-amber-200">
                  {pendingRefunds}
                </span>
              </Link>
              <Link
                href="/admin/agents"
                className="flex items-center justify-between rounded-xl border border-teal-300/15 bg-teal-300/[0.06] p-3.5 transition-colors hover:bg-teal-300/10"
              >
                <span className="text-sm font-medium text-teal-200">Agent Verifications</span>
                <span className="rounded-lg bg-teal-300/15 px-2.5 py-1 text-sm font-semibold text-teal-100">0</span>
              </Link>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="rounded-2xl border border-slate-800/80 bg-[#0c1422] p-5 shadow-sm shadow-black/10 sm:p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Link
                href="/admin/operators/new"
                className="block w-full rounded-xl border border-slate-700/80 px-4 py-2.5 text-center text-sm font-medium text-slate-200 transition-colors hover:border-amber-300/30 hover:bg-amber-300/[0.06] hover:text-amber-100"
              >
                Add New Operator
              </Link>
              <Link
                href="/admin/trips/new"
                className="block w-full rounded-xl border border-slate-700/80 px-4 py-2.5 text-center text-sm font-medium text-slate-200 transition-colors hover:border-teal-300/30 hover:bg-teal-300/[0.06] hover:text-teal-100"
              >
                Create Trip
              </Link>
              <Link
                href="/admin/users"
                className="block w-full rounded-xl border border-slate-700/80 px-4 py-2.5 text-center text-sm font-medium text-slate-200 transition-colors hover:border-sky-300/30 hover:bg-sky-300/[0.06] hover:text-sky-100"
              >
                Manage Users
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Bookings */}
        <div className="overflow-hidden rounded-2xl border border-slate-800/80 bg-[#0c1422] shadow-sm shadow-black/10">
          <div className="flex items-center justify-between border-b border-slate-800/80 px-5 py-5 sm:px-6">
            <h3 className="text-lg font-semibold text-white">Recent Bookings</h3>
            <Link
              href="/admin/bookings"
              className="text-sm text-teal-400 hover:text-teal-300 transition-colors"
            >
              View All →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-900/70">
                <tr className="border-b border-slate-800/80 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-3.5 font-semibold sm:px-6">Reference</th>
                  <th className="px-5 py-3.5 font-semibold sm:px-6">Passenger</th>
                  <th className="px-5 py-3.5 font-semibold sm:px-6">Seats</th>
                  <th className="px-5 py-3.5 font-semibold sm:px-6">Amount</th>
                  <th className="px-5 py-3.5 font-semibold sm:px-6">Status</th>
                  <th className="px-5 py-3.5 font-semibold sm:px-6">Date</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-500">
                      Loading...
                    </td>
                  </tr>
                ) : recentBookings.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-500">
                      No bookings found
                    </td>
                  </tr>
                ) : (
                  recentBookings.map((booking) => (
                    <tr key={booking.id} className="border-b border-slate-800/70 transition-colors last:border-0 hover:bg-slate-800/30">
                      <td className="px-5 py-4 sm:px-6">
                        <span className="font-mono text-orange-400">{booking.booking_reference}</span>
                      </td>
                      <td className="px-5 py-4 sm:px-6">
                        <div>
                          <p className="text-white font-medium">{booking.passenger_name}</p>
                          <p className="text-slate-400 text-sm">{booking.passenger_phone}</p>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-300 sm:px-6">
                        {booking.seat_numbers?.join(', ')}
                      </td>
                      <td className="px-5 py-4 font-medium text-white sm:px-6">
                        MMK {booking.total_amount?.toLocaleString()}
                      </td>
                      <td className="px-5 py-4 sm:px-6">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          booking.payment_status === 'paid'
                            ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {booking.payment_status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-500 sm:px-6">
                        {new Date(booking.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
