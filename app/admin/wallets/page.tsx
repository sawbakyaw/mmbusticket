'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { AdminLayout } from '@/components/admin-layout';
import { Wallet, WalletTransaction } from '@/lib/types-extended';
import {
  Search, Wallet as WalletIcon, ArrowUpRight, ArrowDownRight,
  RefreshCw, DollarSign, TrendingUp, Users, Clock, Filter, Eye
} from 'lucide-react';

const transactionTypeColors: Record<string, string> = {
  deposit: 'text-green-400',
  withdrawal: 'text-red-400',
  booking_payment: 'text-orange-400',
  refund: 'text-blue-400',
  commission: 'text-teal-400',
  transfer: 'text-purple-400',
};

export default function WalletsPage() {
  const [loading, setLoading] = useState(true);
  const [wallets, setWallets] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedWallet, setSelectedWallet] = useState<any | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: walletsData, error: walletsError } = await supabase
        .from('wallets')
        .select('*')
        .order('created_at', { ascending: false });

      if (walletsError) throw walletsError;

      const { data: transactionsData, error: transactionsError } = await supabase
        .from('wallet_transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (transactionsError) throw transactionsError;

      setWallets(walletsData || []);
      setTransactions(transactionsData || []);
    } catch (error) {
      console.error('Error fetching wallet data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch = tx.id?.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'all' || tx.transaction_type === typeFilter;
    return matchesSearch && matchesType;
  });

  const stats = {
    totalWallets: wallets.length,
    totalBalance: wallets.reduce((sum, w) => sum + Number(w.balance), 0),
    totalPending: wallets.filter(w => w.status === 'pending').length,
    totalFrozen: wallets.filter(w => w.status === 'frozen').length,
    todayDeposits: transactions
      .filter(t => t.transaction_type === 'deposit' && isToday(t.created_at))
      .reduce((sum, t) => sum + Number(t.amount), 0),
    todayWithdrawals: transactions
      .filter(t => t.transaction_type === 'withdrawal' && isToday(t.created_at))
      .reduce((sum, t) => sum + Number(t.amount), 0),
  };

  function isToday(date: string) {
    const today = new Date();
    const d = new Date(date);
    return d.toDateString() === today.toDateString();
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US').format(amount);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Wallet Management</h1>
            <p className="text-slate-400">Manage operator and agent wallets</p>
          </div>
          <button
            onClick={fetchData}
            className="p-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <div className="bg-slate-900/60 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <WalletIcon className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-slate-400 text-sm">Total Wallets</p>
                <p className="text-xl font-bold text-white">{stats.totalWallets}</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-900/60 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4 col-span-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-teal-500/10">
                <DollarSign className="h-5 w-5 text-teal-400" />
              </div>
              <div>
                <p className="text-slate-400 text-sm">Total Balance</p>
                <p className="text-xl font-bold text-teal-400">MMK {formatCurrency(stats.totalBalance)}</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-900/60 backdrop-blur-sm rounded-xl border border-amber-500/30 p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-amber-400" />
              <div>
                <p className="text-slate-400 text-sm">Pending</p>
                <p className="text-xl font-bold text-amber-400">{stats.totalPending}</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-900/60 backdrop-blur-sm rounded-xl border border-green-500/30 p-4">
            <div className="flex items-center gap-2">
              <ArrowDownRight className="h-4 w-4 text-green-400" />
              <div>
                <p className="text-slate-400 text-xs">Today Deposits</p>
                <p className="text-lg font-bold text-green-400">{formatCurrency(stats.todayDeposits)}</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-900/60 backdrop-blur-sm rounded-xl border border-red-500/30 p-4">
            <div className="flex items-center gap-2">
              <ArrowUpRight className="h-4 w-4 text-red-400" />
              <div>
                <p className="text-slate-400 text-xs">Today Withdrawals</p>
                <p className="text-lg font-bold text-red-400">{formatCurrency(stats.todayWithdrawals)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Wallets List */}
          <div className="lg:col-span-1">
            <div className="bg-slate-900/60 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Wallet Accounts</h3>
              <div className="space-y-3">
                {loading ? (
                  <div className="text-center py-8 text-slate-400">Loading...</div>
                ) : wallets.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">No wallets found</div>
                ) : (
                  wallets.map((wallet) => (
                    <button
                      key={wallet.id}
                      onClick={() => setSelectedWallet(wallet)}
                      className={`w-full p-4 rounded-xl border transition-all text-left ${
                        selectedWallet?.id === wallet.id
                          ? 'border-teal-500 bg-teal-500/10'
                          : 'border-slate-700 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white font-medium capitalize">{wallet.wallet_type}</span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          wallet.status === 'active' ? 'bg-green-500/10 text-green-400' :
                          wallet.status === 'frozen' ? 'bg-red-500/10 text-red-400' :
                          'bg-amber-500/10 text-amber-400'
                        }`}>
                          {wallet.status}
                        </span>
                      </div>
                      <p className="text-teal-400 font-bold text-lg">
                        MMK {formatCurrency(wallet.balance)}
                      </p>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Transactions */}
          <div className="lg:col-span-2">
            <div className="bg-slate-900/60 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden">
              <div className="p-6 border-b border-slate-700/50">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">Recent Transactions</h3>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="input-dark rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="all">All Types</option>
                    <option value="deposit">Deposits</option>
                    <option value="withdrawal">Withdrawals</option>
                    <option value="booking_payment">Booking</option>
                    <option value="refund">Refunds</option>
                    <option value="commission">Commission</option>
                  </select>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-sm text-slate-400 border-b border-slate-800">
                      <th className="px-6 py-3 font-medium">Type</th>
                      <th className="px-6 py-3 font-medium">Amount</th>
                      <th className="px-6 py-3 font-medium">Balance After</th>
                      <th className="px-6 py-3 font-medium">Reference</th>
                      <th className="px-6 py-3 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                          Loading...
                        </td>
                      </tr>
                    ) : filteredTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                          No transactions found
                        </td>
                      </tr>
                    ) : (
                      filteredTransactions.map((tx) => (
                        <tr key={tx.id} className="border-b border-slate-800 hover:bg-slate-800/30 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              {tx.transaction_type === 'deposit' || tx.transaction_type === 'refund' ? (
                                <ArrowDownRight className="h-4 w-4 text-green-400" />
                              ) : (
                                <ArrowUpRight className="h-4 w-4 text-red-400" />
                              )}
                              <span className={`capitalize ${transactionTypeColors[tx.transaction_type] || 'text-slate-300'}`}>
                                {tx.transaction_type?.replace('_', ' ')}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`font-medium ${
                              tx.transaction_type === 'deposit' || tx.transaction_type === 'refund'
                                ? 'text-green-400'
                                : 'text-red-400'
                            }`}>
                              {tx.transaction_type === 'deposit' || tx.transaction_type === 'refund' ? '+' : '-'}
                              MMK {formatCurrency(tx.amount)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-300">
                            MMK {formatCurrency(tx.balance_after)}
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-mono text-slate-400 text-sm">
                              {tx.reference_id?.slice(0, 12)}...
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-400 text-sm">
                            {new Date(tx.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
