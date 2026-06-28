'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { AdminLayout } from '@/components/admin-layout';
import { PaymentGateway } from '@/lib/types-extended';
import {
  CreditCard, Smartphone, Building2, Edit2, Power, CheckCircle,
  XCircle, Settings, TestTube, ExternalLink
} from 'lucide-react';

const gatewayTypeIcons: Record<string, any> = {
  mobile_banking: Smartphone,
  card: CreditCard,
  bank_transfer: Building2,
};

export default function GatewaysPage() {
  const [loading, setLoading] = useState(true);
  const [gateways, setGateways] = useState<PaymentGateway[]>([]);

  useEffect(() => {
    fetchGateways();
  }, []);

  const fetchGateways = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_gateways')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setGateways(data || []);
    } catch (error) {
      console.error('Error fetching gateways:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleGateway = async (gateway: PaymentGateway) => {
    const { error } = await supabase
      .from('payment_gateways')
      .update({ is_active: !gateway.is_active })
      .eq('id', gateway.id);

    if (!error) {
      setGateways((prev) =>
        prev.map((g) =>
          g.id === gateway.id ? { ...g, is_active: !g.is_active } : g
        )
      );
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
            <h1 className="text-2xl font-bold text-white">Payment Gateways</h1>
            <p className="text-slate-400">Configure and manage payment providers</p>
          </div>
          <button className="btn-primary px-4 py-2 rounded-lg flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Test All Connections
          </button>
        </div>

        {/* Gateways Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-slate-900/60 rounded-xl p-6 animate-pulse">
                <div className="h-12 w-12 bg-slate-700 rounded-lg mb-4" />
                <div className="h-4 bg-slate-700 rounded w-2/3 mb-2" />
                <div className="h-3 bg-slate-700 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {gateways.map((gateway) => {
              const TypeIcon = gatewayTypeIcons[gateway.gateway_type] || CreditCard;
              return (
                <div
                  key={gateway.id}
                  className={`bg-slate-900/60 backdrop-blur-sm rounded-xl border overflow-hidden transition-all ${
                    gateway.is_active
                      ? 'border-teal-500/30'
                      : 'border-slate-700/50 opacity-70'
                  }`}
                >
                  {/* Header */}
                  <div className="p-6 border-b border-slate-700/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          gateway.is_active
                            ? 'bg-gradient-to-br from-teal-500 to-cyan-600'
                            : 'bg-slate-700'
                        }`}>
                          <TypeIcon className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white">{gateway.display_name}</h3>
                          <p className="text-slate-400 text-sm">{gateway.gateway_type.replace('_', ' ')}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {gateway.is_test_mode && (
                          <span className="px-2 py-1 bg-amber-500/10 text-amber-400 text-xs rounded-lg border border-amber-500/20">
                            Test Mode
                          </span>
                        )}
                        {gateway.is_active ? (
                          <CheckCircle className="h-5 w-5 text-teal-400" />
                        ) : (
                          <XCircle className="h-5 w-5 text-slate-500" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-slate-400">Min Amount</p>
                        <p className="text-white font-medium">MMK {formatCurrency(gateway.min_amount)}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Max Amount</p>
                        <p className="text-white font-medium">MMK {formatCurrency(gateway.max_amount)}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Fee (%)</p>
                        <p className="text-white font-medium">{gateway.fee_percentage}%</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Fixed Fee</p>
                        <p className="text-white font-medium">MMK {formatCurrency(gateway.fee_fixed)}</p>
                      </div>
                    </div>

                    {gateway.merchant_id && (
                      <div className="bg-slate-800/50 rounded-lg p-3">
                        <p className="text-slate-400 text-xs">Merchant ID</p>
                        <p className="text-white font-mono text-sm">{gateway.merchant_id}</p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="p-4 border-t border-slate-700/50 flex items-center gap-2">
                    <button
                      onClick={() => toggleGateway(gateway)}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                        gateway.is_active
                          ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
                          : 'bg-teal-500/10 text-teal-400 hover:bg-teal-500/20'
                      }`}
                    >
                      <Power className="h-4 w-4" />
                      {gateway.is_active ? 'Disable' : 'Enable'}
                    </button>
                    <button className="p-2 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500/20 transition-colors">
                      <TestTube className="h-4 w-4" />
                    </button>
                    <button className="p-2 bg-slate-700/50 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors">
                      <Edit2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Summary */}
        <div className="bg-slate-900/60 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Payment Gateway Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-slate-800/50 rounded-lg p-4">
              <p className="text-slate-400 text-sm">Total Gateways</p>
              <p className="text-3xl font-bold text-white">{gateways.length}</p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4">
              <p className="text-slate-400 text-sm">Active Gateways</p>
              <p className="text-3xl font-bold text-teal-400">
                {gateways.filter((g) => g.is_active).length}
              </p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4">
              <p className="text-slate-400 text-sm">Mobile Banking</p>
              <p className="text-3xl font-bold text-blue-400">
                {gateways.filter((g) => g.gateway_type === 'mobile_banking').length}
              </p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4">
              <p className="text-slate-400 text-sm">Card Payments</p>
              <p className="text-3xl font-bold text-orange-400">
                {gateways.filter((g) => g.gateway_type === 'card').length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
