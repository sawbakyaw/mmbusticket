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
      color: 'from-green-500 to-emerald-600',
    },
    {
      label: 'Total Bookings',
      value: stats.totalBookings.toLocaleString(),
      change: '+8.2%',
      positive: true,
      icon: Ticket,
      color: 'from-blue-500 to-indigo-600',
    },
    {
      label: 'Active Operators',
      value: stats.activeOperators.toString(),
      change: '+2',
      positive: true,
      icon: Bus,
      color: 'from-orange-500 to-red-500',
    },
    {
      label: 'Active Agents',
      value: stats.activeAgents.toString(),
      change: '+5',
      positive: true,
      icon: Users,
      color: 'from-teal-500 to-cyan-600',
    },
  ] : [];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
            <p className="text-slate-400">Welcome back! Here's what's happening today.</p>
          </div>
          <div className="flex items-center gap-2">
            <select className="input-dark rounded-lg px-4 py-2 text-sm">
              <option>Last 7 days</option>
              <option>Last 30 days</option>
              <option>This month</option>
              <option>This year</option>
            </select>
          </div>
        </div>

        {/* Stats Cards */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-slate-900/60 rounded-xl p-6 animate-pulse">
                <div className="h-4 bg-slate-700 rounded w-1/2 mb-4" />
                <div className="h-8 bg-slate-700 rounded w-3/4" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statCards.map((stat, i) => (
              <div
                key={i}
                className="bg-slate-900/60 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6 hover:border-slate-600 transition-all"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color}`}>
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
                <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Today's Performance */}
          <div className="bg-slate-900/60 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5 text-teal-400" />
              Today's Performance
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
          <div className="bg-slate-900/60 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-400" />
              Pending Actions
            </h3>
            <div className="space-y-4">
              <Link
                href="/admin/refunds"
                className="flex items-center justify-between p-3 bg-orange-500/10 border border-orange-500/20 rounded-xl hover:bg-orange-500/20 transition-colors"
              >
                <span className="text-orange-300">Refund Requests</span>
                <span className="bg-orange-500 text-white px-2 py-1 rounded-lg text-sm font-medium">
                  {pendingRefunds}
                </span>
              </Link>
              <Link
                href="/admin/agents"
                className="flex items-center justify-between p-3 bg-teal-500/10 border border-teal-500/20 rounded-xl hover:bg-teal-500/20 transition-colors"
              >
                <span className="text-teal-300">Agent Verifications</span>
                <span className="bg-teal-500 text-white px-2 py-1 rounded-lg text-sm font-medium">0</span>
              </Link>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-slate-900/60 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Link
                href="/admin/operators/new"
                className="block w-full py-2 px-4 bg-orange-500/10 border border-orange-500/20 rounded-xl text-orange-300 hover:bg-orange-500/20 text-center transition-colors"
              >
                Add New Operator
              </Link>
              <Link
                href="/admin/trips/new"
                className="block w-full py-2 px-4 bg-teal-500/10 border border-teal-500/20 rounded-xl text-teal-300 hover:bg-teal-500/20 text-center transition-colors"
              >
                Create Trip
              </Link>
              <Link
                href="/admin/users"
                className="block w-full py-2 px-4 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-300 hover:bg-blue-500/20 text-center transition-colors"
              >
                Manage Users
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Bookings */}
        <div className="bg-slate-900/60 backdrop-blur-sm rounded-xl border border-slate-700/50">
          <div className="p-6 border-b border-slate-700/50 flex items-center justify-between">
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
              <thead>
                <tr className="text-left text-sm text-slate-400 border-b border-slate-800">
                  <th className="px-6 py-4 font-medium">Reference</th>
                  <th className="px-6 py-4 font-medium">Passenger</th>
                  <th className="px-6 py-4 font-medium">Seats</th>
                  <th className="px-6 py-4 font-medium">Amount</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                      Loading...
                    </td>
                  </tr>
                ) : recentBookings.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                      No bookings found
                    </td>
                  </tr>
                ) : (
                  recentBookings.map((booking) => (
                    <tr key={booking.id} className="border-b border-slate-800 hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-mono text-orange-400">{booking.booking_reference}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-white font-medium">{booking.passenger_name}</p>
                          <p className="text-slate-400 text-sm">{booking.passenger_phone}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-300">
                        {booking.seat_numbers?.join(', ')}
                      </td>
                      <td className="px-6 py-4 text-white font-medium">
                        MMK {booking.total_amount?.toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          booking.payment_status === 'paid'
                            ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {booking.payment_status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-400 text-sm">
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
