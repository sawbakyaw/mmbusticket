'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { AdminLayout } from '@/components/admin-layout';
import { CommissionRule, CommissionPayout } from '@/lib/types-extended';
import {
  Search, Plus, Edit2, Percent, DollarSign, TrendingUp,
  Calendar, Users, CheckCircle, Clock, RefreshCw
} from 'lucide-react';

const ruleTypeColors: Record<string, string> = {
  percentage: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
  fixed: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
};

export default function CommissionsPage() {
  const [loading, setLoading] = useState(true);
  const [rules, setRules] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'rules' | 'payouts'>('rules');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: rulesData } = await supabase
        .from('commission_rules')
        .select('*')
        .order('created_at', { ascending: false });

      const { data: payoutsData } = await supabase
        .from('commission_payouts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      setRules(rulesData || []);
      setPayouts(payoutsData || []);
    } catch (error) {
      console.error('Error fetching commission data:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    totalRules: rules.length,
    activeRules: rules.filter(r => r.is_active).length,
    totalPayouts: payouts.length,
    pendingPayouts: payouts.filter(p => p.status === 'pending').length,
    totalCommission: payouts
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + Number(p.amount), 0),
    pendingAmount: payouts
      .filter(p => p.status === 'pending')
      .reduce((sum, p) => sum + Number(p.amount), 0),
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
            <h1 className="text-2xl font-bold text-white">Commission Management</h1>
            <p className="text-slate-400">Configure commission rules and payouts</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="btn-primary px-4 py-2 rounded-lg flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Rule
            </button>
            <button
              onClick={fetchData}
              className="p-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <div className="bg-slate-900/60 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Percent className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-slate-400 text-sm">Total Rules</p>
                <p className="text-xl font-bold text-white">{stats.totalRules}</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-900/60 backdrop-blur-sm rounded-xl border border-green-500/30 p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <div>
                <p className="text-slate-400 text-sm">Active</p>
                <p className="text-xl font-bold text-green-400">{stats.activeRules}</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-900/60 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4">
            <div className="flex items-center gap-3">
              <DollarSign className="h-5 w-5 text-teal-400" />
              <div>
                <p className="text-slate-400 text-sm">Total Paid</p>
                <p className="text-xl font-bold text-teal-400">{formatCurrency(stats.totalCommission)}</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-900/60 backdrop-blur-sm rounded-xl border border-amber-500/30 p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-amber-400" />
              <div>
                <p className="text-slate-400 text-sm">Pending</p>
                <p className="text-xl font-bold text-amber-400">{stats.pendingPayouts}</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-900/60 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4 col-span-2">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-orange-400" />
              <div>
                <p className="text-slate-400 text-sm">Pending Amount</p>
                <p className="text-xl font-bold text-orange-400">MMK {formatCurrency(stats.pendingAmount)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('rules')}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'rules'
                ? 'bg-teal-500/10 text-teal-400 border border-teal-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Commission Rules
          </button>
          <button
            onClick={() => setActiveTab('payouts')}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'payouts'
                ? 'bg-teal-500/10 text-teal-400 border border-teal-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Payouts
          </button>
        </div>

        {/* Content */}
        {activeTab === 'rules' ? (
          <div className="bg-slate-900/60 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-slate-400 border-b border-slate-800">
                    <th className="px-6 py-4 font-medium">Rule Name</th>
                    <th className="px-6 py-4 font-medium">Type</th>
                    <th className="px-6 py-4 font-medium">Target</th>
                    <th className="px-6 py-4 font-medium">Value</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                        Loading...
                      </td>
                    </tr>
                  ) : rules.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                        No commission rules found
                      </td>
                    </tr>
                  ) : (
                    rules.map((rule) => (
                      <tr key={rule.id} className="border-b border-slate-800 hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4">
                          <p className="text-white font-medium">{rule.name}</p>
                          <p className="text-slate-400 text-sm">{rule.description}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${ruleTypeColors[rule.rule_type] || 'bg-slate-500/10 text-slate-400'}`}>
                            {rule.rule_type}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-300 capitalize">
                          {rule.target_type?.replace('_', ' ')}
                        </td>
                        <td className="px-6 py-4 text-white font-medium">
                          {rule.rule_type === 'percentage' ? `${rule.value}%` : `MMK ${formatCurrency(rule.value)}`}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            rule.is_active
                              ? 'bg-green-500/10 text-green-400'
                              : 'bg-slate-500/10 text-slate-400'
                          }`}>
                            {rule.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">
                              <Edit2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-slate-900/60 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-slate-400 border-b border-slate-800">
                    <th className="px-6 py-4 font-medium">Payout ID</th>
                    <th className="px-6 py-4 font-medium">Type</th>
                    <th className="px-6 py-4 font-medium">Amount</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium">Period</th>
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
                  ) : payouts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                        No payouts found
                      </td>
                    </tr>
                  ) : (
                    payouts.map((payout) => (
                      <tr key={payout.id} className="border-b border-slate-800 hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4">
                          <span className="font-mono text-slate-300 text-sm">{payout.id.slice(0, 8)}...</span>
                        </td>
                        <td className="px-6 py-4 text-slate-300 capitalize">
                          {payout.payout_type?.replace('_', ' ')}
                        </td>
                        <td className="px-6 py-4 text-white font-medium">
                          MMK {formatCurrency(payout.amount)}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            payout.status === 'completed'
                              ? 'bg-green-500/10 text-green-400'
                              : payout.status === 'pending'
                              ? 'bg-amber-500/10 text-amber-400'
                              : 'bg-slate-500/10 text-slate-400'
                          }`}>
                            {payout.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-400 text-sm">
                          {payout.period_start && payout.period_end
                            ? `${new Date(payout.period_start).toLocaleDateString()} - ${new Date(payout.period_end).toLocaleDateString()}`
                            : 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-slate-400 text-sm">
                          {new Date(payout.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
