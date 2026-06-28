'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { AdminLayout } from '@/components/admin-layout';
import { AuditLog } from '@/lib/types-extended';
import {
  Search, Filter, Download, Eye, RefreshCw, Shield,
  User, Calendar, Activity, AlertTriangle, Info
} from 'lucide-react';

const severityColors: Record<string, string> = {
  info: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  error: 'bg-red-500/10 text-red-400 border-red-500/20',
  critical: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
};

const actionColors: Record<string, string> = {
  create: 'text-green-400',
  update: 'text-blue-400',
  delete: 'text-red-400',
  login: 'text-teal-400',
  logout: 'text-orange-400',
  view: 'text-slate-400',
};

const severityIcons: Record<string, any> = {
  info: Info,
  warning: AlertTriangle,
  error: AlertTriangle,
  critical: Shield,
};

export default function AuditLogsPage() {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');
  const [selectedLog, setSelectedLog] = useState<any | null>(null);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.action?.toLowerCase().includes(search.toLowerCase()) ||
      log.resource_type?.toLowerCase().includes(search.toLowerCase()) ||
      log.user_id?.toLowerCase().includes(search.toLowerCase()) ||
      log.description?.toLowerCase().includes(search.toLowerCase());
    const matchesSeverity = severityFilter === 'all' || log.severity === severityFilter;
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    return matchesSearch && matchesSeverity && matchesAction;
  });

  const stats = {
    total: logs.length,
    today: logs.filter(l => isToday(l.created_at)).length,
    errors: logs.filter(l => l.severity === 'error' || l.severity === 'critical').length,
    warnings: logs.filter(l => l.severity === 'warning').length,
    logins: logs.filter(l => l.action === 'login').length,
    deletes: logs.filter(l => l.action === 'delete').length,
  };

  function isToday(date: string) {
    const today = new Date();
    const d = new Date(date);
    return d.toDateString() === today.toDateString();
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString();
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Audit Logs</h1>
            <p className="text-slate-400">Track all system activities and changes</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export
            </button>
            <button
              onClick={fetchLogs}
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
                <Activity className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-slate-400 text-sm">Total Logs</p>
                <p className="text-xl font-bold text-white">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-900/60 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-teal-400" />
              <div>
                <p className="text-slate-400 text-sm">Today</p>
                <p className="text-xl font-bold text-teal-400">{stats.today}</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-900/60 backdrop-blur-sm rounded-xl border border-red-500/30 p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              <div>
                <p className="text-slate-400 text-sm">Errors</p>
                <p className="text-xl font-bold text-red-400">{stats.errors}</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-900/60 backdrop-blur-sm rounded-xl border border-amber-500/30 p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-400" />
              <div>
                <p className="text-slate-400 text-sm">Warnings</p>
                <p className="text-xl font-bold text-amber-400">{stats.warnings}</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-900/60 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-green-400" />
              <div>
                <p className="text-slate-400 text-sm">Logins</p>
                <p className="text-xl font-bold text-green-400">{stats.logins}</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-900/60 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-red-400" />
              <div>
                <p className="text-slate-400 text-sm">Deletes</p>
                <p className="text-xl font-bold text-red-400">{stats.deletes}</p>
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
              placeholder="Search logs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full input-dark rounded-xl pl-12 pr-4 py-3"
            />
          </div>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="input-dark rounded-xl px-4 py-3 min-w-32"
          >
            <option value="all">All Severity</option>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="error">Error</option>
            <option value="critical">Critical</option>
          </select>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="input-dark rounded-xl px-4 py-3 min-w-32"
          >
            <option value="all">All Actions</option>
            <option value="create">Create</option>
            <option value="update">Update</option>
            <option value="delete">Delete</option>
            <option value="login">Login</option>
            <option value="logout">Logout</option>
          </select>
        </div>

        {/* Logs Table */}
        <div className="bg-slate-900/60 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-slate-400 border-b border-slate-800">
                  <th className="px-6 py-4 font-medium">Severity</th>
                  <th className="px-6 py-4 font-medium">Action</th>
                  <th className="px-6 py-4 font-medium">Resource</th>
                  <th className="px-6 py-4 font-medium">Description</th>
                  <th className="px-6 py-4 font-medium">User</th>
                  <th className="px-6 py-4 font-medium">IP Address</th>
                  <th className="px-6 py-4 font-medium">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                      Loading...
                    </td>
                  </tr>
                ) : filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                      No audit logs found
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => {
                    const SeverityIcon = severityIcons[log.severity] || Info;
                    return (
                      <tr
                        key={log.id}
                        className="border-b border-slate-800 hover:bg-slate-800/30 transition-colors cursor-pointer"
                        onClick={() => setSelectedLog(log)}
                      >
                        <td className="px-6 py-4">
                          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${severityColors[log.severity] || severityColors.info}`}>
                            <SeverityIcon className="h-3 w-3" />
                            <span className="text-xs font-medium capitalize">{log.severity}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`font-medium capitalize ${actionColors[log.action] || 'text-slate-300'}`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-slate-300 capitalize">{log.resource_type}</p>
                            <p className="text-slate-500 text-xs font-mono">{log.resource_id?.slice(0, 8)}...</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 max-w-xs">
                          <p className="text-slate-300 text-sm truncate">{log.description}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-mono text-slate-400 text-sm">
                            {log.user_id?.slice(0, 8)}...
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-mono text-slate-400 text-sm">
                            {log.ip_address || 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-400 text-sm">
                          {formatDate(log.created_at)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detail Modal */}
        {selectedLog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setSelectedLog(null)}
            />
            <div className="relative bg-slate-900 rounded-xl border border-slate-700 max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Log Details</h3>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="p-2 text-slate-400 hover:text-white"
                >
                  <RefreshCw className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-slate-400 text-sm">Severity</p>
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border mt-1 ${severityColors[selectedLog.severity] || severityColors.info}`}>
                      <span className="text-xs font-medium capitalize">{selectedLog.severity}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Action</p>
                    <p className={`font-medium capitalize ${actionColors[selectedLog.action] || 'text-slate-300'}`}>
                      {selectedLog.action}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Resource Type</p>
                    <p className="text-white capitalize">{selectedLog.resource_type}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Resource ID</p>
                    <p className="font-mono text-white">{selectedLog.resource_id}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">User ID</p>
                    <p className="font-mono text-white">{selectedLog.user_id}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">IP Address</p>
                    <p className="font-mono text-white">{selectedLog.ip_address || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Timestamp</p>
                    <p className="text-white">{formatDate(selectedLog.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">User Agent</p>
                    <p className="text-white text-sm truncate">{selectedLog.user_agent || 'N/A'}</p>
                  </div>
                </div>

                <div>
                  <p className="text-slate-400 text-sm">Description</p>
                  <p className="text-white">{selectedLog.description}</p>
                </div>

                {selectedLog.metadata && (
                  <div>
                    <p className="text-slate-400 text-sm mb-2">Metadata</p>
                    <div className="bg-slate-800 rounded-lg p-4">
                      <pre className="text-slate-300 text-sm font-mono overflow-x-auto">
                        {JSON.stringify(selectedLog.metadata, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
