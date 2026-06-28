'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { AgentLayout } from '@/components/agent-layout';
import {
  TrendingUp, Bus, Ticket, DollarSign,
  ArrowUpRight, Activity, Calendar, Search, MapPin, Users, Wallet, CreditCard
} from 'lucide-react';
import Link from 'next/link';

interface AgentStats {
  totalBookings: number;
  totalCommission: number;
  todayBookings: number;
  todayCommission: number;
  walletBalance: number;
  pendingPayouts: number;
}

export default function AgentDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AgentStats | null>(null);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [agentId, setAgentId] = useState<string | null>(null);

  useEffect(() => {
    fetchAgentData();
  }, []);

  const fetchAgentData = async () => {
    try {
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('agent_id')
        .single();

      if (userProfile?.agent_id) {
        setAgentId(userProfile.agent_id);
        await fetchStats(userProfile.agent_id);
      }
    } catch (error) {
      console.error('Error fetching agent data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async (agId: string) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data: bookings } = await supabase
        .from('bookings')
        .select('*')
        .eq('agent_id', agId)
        .order('created_at', { ascending: false })
        .limit(10);

      const { data: wallet } = await supabase
        .from('wallets')
        .select('*')
        .eq('owner_id', agId)
        .single();

      const totalCommission = bookings?.reduce((sum, b) => sum + Number(b.agent_commission || 0), 0) || 0;
      const todayBookings = bookings?.filter(b => new Date(b.created_at) >= today) || [];
      const todayCommission = todayBookings.reduce((sum, b) => sum + Number(b.agent_commission || 0), 0);

      setStats({
        totalBookings: bookings?.length || 0,
        totalCommission,
        todayBookings: todayBookings.length,
        todayCommission,
        walletBalance: wallet?.balance || 0,
        pendingPayouts: 0,
      });

      setRecentBookings(bookings?.slice(0, 5) || []);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US').format(amount);
  };

  const statCards = stats ? [
    {
      label: 'Total Bookings',
      value: stats.totalBookings.toString(),
      icon: Ticket,
      color: 'from-green-500 to-emerald-600',
    },
    {
      label: 'Total Commission',
      value: `K ${formatCurrency(stats.totalCommission)}`,
      icon: TrendingUp,
      color: 'from-teal-500 to-cyan-600',
    },
    {
      label: 'Wallet Balance',
      value: `K ${formatCurrency(stats.walletBalance)}`,
      icon: Wallet,
      color: 'from-blue-500 to-indigo-600',
    },
    {
      label: 'Today Bookings',
      value: stats.todayBookings.toString(),
      icon: Calendar,
      color: 'from-orange-500 to-red-500',
    },
  ] : [];

  return (
    <AgentLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Agent Dashboard</h1>
            <p className="text-slate-400">Welcome back! Start booking tickets for your customers.</p>
          </div>
          <Link
            href="/agent/search"
            className="bg-gradient-to-r from-green-500 to-emerald-600 px-4 py-2 rounded-lg text-white font-medium flex items-center gap-2 hover:opacity-90 transition-opacity"
          >
            <Search className="h-4 w-4" />
            Book New Ticket
          </Link>
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
                </div>
                <p className="text-slate-400 text-sm">{stat.label}</p>
                <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Today's Performance */}
          <div className="bg-slate-900/60 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5 text-green-400" />
              Today's Performance
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Bookings Made</span>
                <span className="text-white font-semibold">{stats?.todayBookings || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Commission Earned</span>
                <span className="text-white font-semibold">K {formatCurrency(stats?.todayCommission || 0)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Wallet Balance</span>
                <span className="text-emerald-400 font-semibold">K {formatCurrency(stats?.walletBalance || 0)}</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-slate-900/60 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Link
                href="/agent/search"
                className="block w-full py-2 px-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-300 hover:bg-green-500/20 text-center transition-colors"
              >
                Search & Book Tickets
              </Link>
              <Link
                href="/agent/bookings"
                className="block w-full py-2 px-4 bg-teal-500/10 border border-teal-500/20 rounded-xl text-teal-300 hover:bg-teal-500/20 text-center transition-colors"
              >
                View My Bookings
              </Link>
              <Link
                href="/agent/wallet"
                className="block w-full py-2 px-4 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-300 hover:bg-blue-500/20 text-center transition-colors"
              >
                Check Wallet
              </Link>
            </div>
          </div>

          {/* Commission Summary */}
          <div className="bg-slate-900/60 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-teal-400" />
              Commission Summary
            </h3>
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-green-500/10 to-teal-500/10 rounded-lg p-4">
                <p className="text-slate-400 text-sm">Total Earned</p>
                <p className="text-2xl font-bold text-green-400">K {formatCurrency(stats?.totalCommission || 0)}</p>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Pending Payouts</span>
                <span className="text-amber-400 font-semibold">{stats?.pendingPayouts || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Bookings */}
        <div className="bg-slate-900/60 backdrop-blur-sm rounded-xl border border-slate-700/50">
          <div className="p-6 border-b border-slate-700/50 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Recent Bookings</h3>
            <Link
              href="/agent/bookings"
              className="text-sm text-green-400 hover:text-green-300 transition-colors"
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
                  <th className="px-6 py-4 font-medium">Commission</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                      Loading...
                    </td>
                  </tr>
                ) : recentBookings.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                      No bookings found. Start by searching for trips!
                    </td>
                  </tr>
                ) : (
                  recentBookings.map((booking) => (
                    <tr key={booking.id} className="border-b border-slate-800 hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-mono text-green-400">{booking.booking_reference}</span>
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
                      <td className="px-6 py-4 text-emerald-400 font-medium">
                        MMK {booking.agent_commission?.toLocaleString() || 0}
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
    </AgentLayout>
  );
}
