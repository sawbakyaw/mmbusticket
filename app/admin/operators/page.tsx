'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { AdminLayout } from '@/components/admin-layout';
import { Operator, Bus, Trip } from '@/lib/types';
import { Search, Plus, Edit2, Trash2, Bus as BusIcon, Users, Calendar, DollarSign, Eye } from 'lucide-react';
import Link from 'next/link';

export default function OperatorsPage() {
  const [loading, setLoading] = useState(true);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [search, setSearch] = useState('');
  const [selectedOperator, setSelectedOperator] = useState<Operator | null>(null);
  const [operatorStats, setOperatorStats] = useState<Record<string, any>>({});

  useEffect(() => {
    fetchOperators();
  }, []);

  const fetchOperators = async () => {
    try {
      const { data, error } = await supabase
        .from('operators')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setOperators(data || []);

      // Fetch stats for each operator
      for (const op of data || []) {
        const { count: busesCount } = await supabase
          .from('buses')
          .select('*', { count: 'exact', head: true })
          .eq('operator_id', op.id);

        const { count: tripsCount } = await supabase
          .from('trips')
          .select('*', { count: 'exact', head: true })
          .eq('operator_id', op.id);

        setOperatorStats((prev) => ({
          ...prev,
          [op.id]: {
            buses: busesCount || 0,
            trips: tripsCount || 0,
          },
        }));
      }
    } catch (error) {
      console.error('Error fetching operators:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredOperators = operators.filter((op) =>
    op.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Operators</h1>
            <p className="text-slate-400">Manage bus operators and their fleets</p>
          </div>
          <Link
            href="/admin/operators/new"
            className="btn-primary px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Operator
          </Link>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
          <input
            type="text"
            placeholder="Search operators..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full input-dark rounded-xl pl-12 pr-4 py-3"
          />
        </div>

        {/* Operators Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-slate-900/60 rounded-xl p-6 animate-pulse">
                <div className="h-12 w-12 bg-slate-700 rounded-lg mb-4" />
                <div className="h-4 bg-slate-700 rounded w-2/3 mb-2" />
                <div className="h-3 bg-slate-700 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOperators.map((operator) => (
              <div
                key={operator.id}
                className="bg-slate-900/60 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden hover:border-teal-500/30 transition-all group"
              >
                {/* Header */}
                <div className="p-6 border-b border-slate-700/50">
                  <div className="flex items-center gap-4">
                    {operator.logo_url ? (
                      <img
                        src={operator.logo_url}
                        alt={operator.name}
                        className="w-14 h-14 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500 to-teal-500 flex items-center justify-center">
                        <BusIcon className="h-7 w-7 text-white" />
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white">{operator.name}</h3>
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          operator.is_active
                            ? 'bg-green-500/10 text-green-400'
                            : 'bg-red-500/10 text-red-400'
                        }`}>
                          {operator.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="p-4 grid grid-cols-2 gap-4">
                  <div className="bg-slate-800/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-slate-400">
                      <BusIcon className="h-4 w-4" />
                      <span className="text-xs">Buses</span>
                    </div>
                    <p className="text-xl font-bold text-white mt-1">
                      {operatorStats[operator.id]?.buses || 0}
                    </p>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Calendar className="h-4 w-4" />
                      <span className="text-xs">Trips</span>
                    </div>
                    <p className="text-xl font-bold text-white mt-1">
                      {operatorStats[operator.id]?.trips || 0}
                    </p>
                  </div>
                </div>

                {/* Contact */}
                {operator.contact_phone && (
                  <div className="px-6 pb-4">
                    <p className="text-slate-400 text-sm">{operator.contact_phone}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="p-4 border-t border-slate-700/50 flex items-center gap-2">
                  <Link
                    href={`/admin/operators/${operator.id}`}
                    className="flex-1 py-2 text-center bg-teal-500/10 text-teal-400 rounded-lg hover:bg-teal-500/20 transition-colors text-sm"
                  >
                    <Eye className="h-4 w-4 inline mr-1" />
                    View
                  </Link>
                  <Link
                    href={`/admin/operators/${operator.id}/edit`}
                    className="flex-1 py-2 text-center bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500/20 transition-colors text-sm"
                  >
                    <Edit2 className="h-4 w-4 inline mr-1" />
                    Edit
                  </Link>
                  <button className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
