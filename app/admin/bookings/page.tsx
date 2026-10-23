'use client';

import { useEffect, useState } from 'react';
import { database } from '@/lib/db-client';
import { AdminLayout } from '@/components/admin-layout';
import { Booking } from '@/lib/types';
import {
  Search, Filter, Download, Eye, RefreshCw, XCircle,
  CheckCircle, Clock, Ticket, TrendingUp
} from 'lucide-react';
import Link from 'next/link';

const paymentColors: Record<string, string> = {
  paid: 'bg-green-500/10 text-green-400 border-green-500/20',
  pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  failed: 'bg-red-500/10 text-red-400 border-red-500/20',
  refunded: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
};

export default function BookingsPage() {
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [search, setSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('all');

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const { data, error } = await database
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch =
      booking.booking_reference.toLowerCase().includes(search.toLowerCase()) ||
      booking.passenger_name.toLowerCase().includes(search.toLowerCase()) ||
      booking.passenger_phone.includes(search);
    const matchesPayment = paymentFilter === 'all' || booking.payment_status === paymentFilter;
    return matchesSearch && matchesPayment;
  });

  const stats = {
    total: bookings.length,
    paid: bookings.filter(b => b.payment_status === 'paid').length,
    pending: bookings.filter(b => b.payment_status === 'pending').length,
    failed: bookings.filter(b => b.payment_status === 'failed').length,
    revenue: bookings.filter(b => b.payment_status === 'paid').reduce((sum, b) => sum + Number(b.total_amount), 0),
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US').format(amount);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Bookings</h1>
            <p className="text-slate-400">Manage all ticket bookings</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export
            </button>
            <button
              onClick={fetchBookings}
              className="p-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-slate-900/60 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Ticket className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-slate-400 text-sm">Total</p>
                <p className="text-xl font-bold text-white">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-900/60 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <CheckCircle className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-slate-400 text-sm">Paid</p>
                <p className="text-xl font-bold text-white">{stats.paid}</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-900/60 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Clock className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <p className="text-slate-400 text-sm">Pending</p>
                <p className="text-xl font-bold text-white">{stats.pending}</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-900/60 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/10">
                <XCircle className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <p className="text-slate-400 text-sm">Failed</p>
                <p className="text-xl font-bold text-white">{stats.failed}</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-900/60 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-teal-500/10">
                <TrendingUp className="h-5 w-5 text-teal-400" />
              </div>
              <div>
                <p className="text-slate-400 text-sm">Revenue</p>
                <p className="text-xl font-bold text-white">K {formatCurrency(stats.revenue)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
            <input
              type="text"
              placeholder="Search by reference, passenger..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full input-dark rounded-xl pl-12 pr-4 py-3"
            />
          </div>
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="input-dark rounded-xl px-4 py-3 min-w-32"
          >
            <option value="all">All Payments</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
        </div>

        {/* Bookings Table */}
        <div className="bg-slate-900/60 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-slate-400 border-b border-slate-800">
                  <th className="px-6 py-4 font-medium">Reference</th>
                  <th className="px-6 py-4 font-medium">Passenger</th>
                  <th className="px-6 py-4 font-medium">Trip</th>
                  <th className="px-6 py-4 font-medium">Seats</th>
                  <th className="px-6 py-4 font-medium">Amount</th>
                  <th className="px-6 py-4 font-medium">Payment</th>
                  <th className="px-6 py-4 font-medium">Date</th>
                  <th className="px-6 py-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-slate-400">
                      Loading...
                    </td>
                  </tr>
                ) : filteredBookings.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-slate-400">
                      No bookings found
                    </td>
                  </tr>
                ) : (
                  filteredBookings.map((booking) => (
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
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-white text-sm">{booking.trip_id?.slice(0, 8)}...</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-300">
                        {booking.seat_numbers?.join(', ')}
                      </td>
                      <td className="px-6 py-4 text-white font-medium">
                        MMK {formatCurrency(booking.total_amount)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${paymentColors[booking.payment_status] || paymentColors.pending}`}>
                          {booking.payment_status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-400 text-sm">
                        {new Date(booking.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/admin/bookings/${booking.id}`}
                            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                        </div>
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
