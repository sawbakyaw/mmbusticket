'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { OperatorLayout } from '@/components/operator-layout';
import {
  TrendingUp, TrendingDown, Users, Bus, Ticket, DollarSign,
  ArrowUpRight, ArrowDownRight, Activity, Calendar, MapPin, Clock
} from 'lucide-react';
import Link from 'next/link';

interface OperatorStats {
  totalBuses: number;
  totalTrips: number;
  totalBookings: number;
  totalRevenue: number;
  todayBookings: number;
  todayRevenue: number;
  activeTrips: number;
  upcomingTrips: number;
}

export default function OperatorDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<OperatorStats | null>(null);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [upcomingTrips, setUpcomingTrips] = useState<any[]>([]);
  const [operatorId, setOperatorId] = useState<string | null>(null);

  useEffect(() => {
    fetchOperatorData();
  }, []);

  const fetchOperatorData = async () => {
    try {
      // Get operator associated with current user
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('operator_id')
        .single();

      if (userProfile?.operator_id) {
        setOperatorId(userProfile.operator_id);
        await fetchStats(userProfile.operator_id);
      }
    } catch (error) {
      console.error('Error fetching operator data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async (opId: string) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Get buses count
      const { count: busesCount } = await supabase
        .from('buses')
        .select('*', { count: 'exact', head: true })
        .eq('operator_id', opId);

      // Get trips count
      const { data: trips } = await supabase
        .from('trips')
        .select('*')
        .eq('operator_id', opId);

      // Get bookings
      const { data: bookings } = await supabase
        .from('bookings')
        .select('*')
        .eq('operator_id', opId)
        .order('created_at', { ascending: false })
        .limit(10);

      const totalRevenue = bookings?.reduce((sum, b) => sum + Number(b.total_amount), 0) || 0;
      const todayBookings = bookings?.filter(b => new Date(b.created_at) >= today) || [];
      const todayRevenue = todayBookings.reduce((sum, b) => sum + Number(b.total_amount), 0);

      const activeTrips = trips?.filter(t => t.status === 'active').length || 0;
      const upcomingTrips = trips?.filter(t => new Date(t.departure_time) > new Date()).slice(0, 5) || [];

      setStats({
        totalBuses: busesCount || 0,
        totalTrips: trips?.length || 0,
        totalBookings: bookings?.length || 0,
        totalRevenue,
        todayBookings: todayBookings.length,
        todayRevenue,
        activeTrips,
        upcomingTrips: trips?.filter(t => new Date(t.departure_time) > new Date()).length || 0,
      });

      setRecentBookings(bookings?.slice(0, 5) || []);
      setUpcomingTrips(upcomingTrips);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US').format(amount);
  };

  const statCards = stats ? [
    {
      label: 'Total Buses',
      value: stats.totalBuses.toString(),
      change: '+2',
      positive: true,
      icon: Bus,
      color: 'from-blue-500 to-cyan-600',
    },
    {
      label: 'Active Trips',
      value: stats.activeTrips.toString(),
      change: `${stats.upcomingTrips} upcoming`,
      positive: true,
      icon: Calendar,
      color: 'from-orange-500 to-red-500',
    },
    {
      label: 'Total Bookings',
      value: stats.totalBookings.toLocaleString(),
      change: '+12%',
      positive: true,
      icon: Ticket,
      color: 'from-green-500 to-emerald-600',
    },
    {
      label: 'Total Revenue',
      value: `K ${formatCurrency(stats.totalRevenue)}`,
      change: '+8.5%',
      positive: true,
      icon: DollarSign,
      color: 'from-teal-500 to-cyan-600',
    },
  ] : [];

  return (
    <OperatorLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Operator Dashboard</h1>
            <p className="text-slate-400">Welcome back! Here's your fleet overview.</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/operator/trips/new"
              className="bg-gradient-to-r from-blue-500 to-cyan-600 px-4 py-2 rounded-lg text-white font-medium flex items-center gap-2 hover:opacity-90 transition-opacity"
            >
              <Calendar className="h-4 w-4" />
              Create Trip
            </Link>
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
                  <div className={`flex items-center gap-1 text-sm ${stat.positive ? 'text-green-400' : 'text-red-400'}`}>
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
              <Activity className="h-5 w-5 text-cyan-400" />
              Today's Performance
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Bookings</span>
                <span className="text-white font-semibold">{stats?.todayBookings || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Revenue</span>
                <span className="text-white font-semibold">K {formatCurrency(stats?.todayRevenue || 0)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Active Trips</span>
                <span className="text-white font-semibold">{stats?.activeTrips || 0}</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-slate-900/60 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Link
                href="/operator/buses/new"
                className="block w-full py-2 px-4 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-300 hover:bg-blue-500/20 text-center transition-colors"
              >
                Add New Bus
              </Link>
              <Link
                href="/operator/trips/new"
                className="block w-full py-2 px-4 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-cyan-300 hover:bg-cyan-500/20 text-center transition-colors"
              >
                Schedule Trip
              </Link>
              <Link
                href="/operator/reports"
                className="block w-full py-2 px-4 bg-teal-500/10 border border-teal-500/20 rounded-xl text-teal-300 hover:bg-teal-500/20 text-center transition-colors"
              >
                View Reports
              </Link>
            </div>
          </div>

          {/* Upcoming Trips */}
          <div className="bg-slate-900/60 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-400" />
              Upcoming Trips
            </h3>
            <div className="space-y-3">
              {upcomingTrips.length === 0 ? (
                <p className="text-slate-400 text-sm">No upcoming trips</p>
              ) : (
                upcomingTrips.slice(0, 3).map((trip) => (
                  <div key={trip.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-teal-400" />
                      <span className="text-white text-sm">{trip.route_id?.slice(0, 8)}...</span>
                    </div>
                    <span className="text-slate-400 text-sm">
                      {new Date(trip.departure_time).toLocaleDateString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Recent Bookings */}
        <div className="bg-slate-900/60 backdrop-blur-sm rounded-xl border border-slate-700/50">
          <div className="p-6 border-b border-slate-700/50 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Recent Bookings</h3>
            <Link
              href="/operator/bookings"
              className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
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
                        <span className="font-mono text-cyan-400">{booking.booking_reference}</span>
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
    </OperatorLayout>
  );
}
