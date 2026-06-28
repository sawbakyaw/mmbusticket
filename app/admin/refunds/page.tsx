'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { AdminLayout } from '@/components/admin-layout';
import {
  Search, Clock, CheckCircle, XCircle, AlertTriangle,
  RefreshCw, DollarSign, Calendar, Filter
} from 'lucide-react';

const statusColors: Record<string, string> = {
  pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  approved: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  processing: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  completed: 'bg-green-500/10 text-green-400 border-green-500/20',
  rejected: 'bg-red-500/10 text-red-400 border-red-500/20',
};

export default function RefundsPage() {
  const [loading, setLoading] = useState(true);
  const [refunds, setRefunds] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRefund, setSelectedRefund] = useState<any | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchRefunds();
  }, []);

  const fetchRefunds = async () => {
    try {
      const { data, error } = await supabase
        .from('refund_requests')
        .select(`
          *,
          bookings (
            booking_reference,
            passenger_name,
            total_amount
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRefunds(data || []);
    } catch (error) {
      console.error('Error fetching refunds:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRefunds = refunds.filter((refund) => {
    const matchesSearch =
      refund.id?.toLowerCase().includes(search.toLowerCase()) ||
      refund.bookings?.booking_reference?.toLowerCase().includes(search.toLowerCase()) ||
      refund.bookings?.passenger_name?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || refund.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: refunds.length,
    pending: refunds.filter(r => r.status === 'pending').length,
    approved: refunds.filter(r => r.status === 'approved').length,
    completed: refunds.filter(r => r.status === 'completed').length,
    rejected: refunds.filter(r => r.status === 'rejected').length,
    totalAmount: refunds.filter(r => r.status === 'completed').reduce((sum, r) => sum + Number(r.refund_amount), 0),
  };

  const handleAction = async (refundId: string, action: 'approve' | 'reject') => {
    setProcessing(true);
    try {
      const newStatus = action === 'approve' ? 'approved' : 'rejected';
      const { error } = await supabase
        .from('refund_requests')
        .update({
          status: newStatus,
          processed_at: new Date().toISOString(),
        })
        .eq('id', refundId);

      if (error) throw error;

      setRefunds(prev => prev.map(r =>
        r.id === refundId ? { ...r, status: newStatus } : r
      ));
      setSelectedRefund(null);
    } catch (error) {
      console.error('Error updating refund:', error);
    } finally {
      setProcessing(false);
    }
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
            <h1 className="text-2xl font-bold text-white">Refund Management</h1>
            <p className="text-slate-400">Process and track refund requests</p>
          </div>
          <button
            onClick={fetchRefunds}
            className="p-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <div className="bg-slate-900/60 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4">
            <p className="text-slate-400 text-sm">Total Requests</p>
            <p className="text-2xl font-bold text-white">{stats.total}</p>
          </div>
          <div className="bg-slate-900/60 backdrop-blur-sm rounded-xl border border-amber-500/30 p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-400" />
              <p className="text-slate-400 text-sm">Pending</p>
            </div>
            <p className="text-2xl font-bold text-amber-400">{stats.pending}</p>
          </div>
          <div className="bg-slate-900/60 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <p className="text-slate-400 text-sm">Completed</p>
            </div>
            <p className="text-2xl font-bold text-green-400">{stats.completed}</p>
          </div>
          <div className="bg-slate-900/60 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-400" />
              <p className="text-slate-400 text-sm">Rejected</p>
            </div>
            <p className="text-2xl font-bold text-red-400">{stats.rejected}</p>
          </div>
          <div className="bg-slate-900/60 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4 col-span-2">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-teal-400" />
              <p className="text-slate-400 text-sm">Total Refunded</p>
            </div>
            <p className="text-2xl font-bold text-teal-400">MMK {formatCurrency(stats.totalAmount)}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
            <input
              type="text"
              placeholder="Search by reference or passenger..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full input-dark rounded-xl pl-12 pr-4 py-3"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-dark rounded-xl px-4 py-3 min-w-32"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {/* Refunds Table */}
        <div className="bg-slate-900/60 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-slate-400 border-b border-slate-800">
                  <th className="px-6 py-4 font-medium">Request ID</th>
                  <th className="px-6 py-4 font-medium">Booking</th>
                  <th className="px-6 py-4 font-medium">Reason</th>
                  <th className="px-6 py-4 font-medium">Refund Amount</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Requested</th>
                  <th className="px-6 py-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                      Loading...
                    </td>
                  </tr>
                ) : filteredRefunds.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                      No refund requests found
                    </td>
                  </tr>
                ) : (
                  filteredRefunds.map((refund) => (
                    <tr key={refund.id} className="border-b border-slate-800 hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-mono text-slate-300 text-sm">{refund.id.slice(0, 8)}...</span>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-mono text-orange-400">{refund.bookings?.booking_reference}</p>
                          <p className="text-slate-400 text-sm">{refund.bookings?.passenger_name}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 max-w-xs">
                        <p className="text-slate-300 text-sm truncate">{refund.reason || 'No reason provided'}</p>
                      </td>
                      <td className="px-6 py-4 text-white font-medium">
                        MMK {formatCurrency(refund.refund_amount)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${statusColors[refund.status] || statusColors.pending}`}>
                          {refund.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-400 text-sm">
                        {new Date(refund.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        {refund.status === 'pending' && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleAction(refund.id, 'approve')}
                              className="px-3 py-1 bg-green-500/10 text-green-400 rounded-lg hover:bg-green-500/20 transition-colors text-sm"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleAction(refund.id, 'reject')}
                              className="px-3 py-1 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors text-sm"
                            >
                              Reject
                            </button>
                          </div>
                        )}
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
