'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { AdminLayout } from '@/components/admin-layout';
import { NotificationTemplate, Notification } from '@/lib/types-extended';
import {
  Search, Bell, Plus, Edit2, Trash2, Send, Clock,
  CheckCircle, Users, Mail, Smartphone, RefreshCw
} from 'lucide-react';

const channelIcons: Record<string, any> = {
  email: Mail,
  sms: Smartphone,
  push: Bell,
};

const channelColors: Record<string, string> = {
  email: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  sms: 'bg-green-500/10 text-green-400 border-green-500/20',
  push: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
};

const statusColors: Record<string, string> = {
  sent: 'bg-green-500/10 text-green-400',
  pending: 'bg-amber-500/10 text-amber-400',
  failed: 'bg-red-500/10 text-red-400',
};

export default function NotificationsPage() {
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'templates' | 'history'>('templates');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: templatesData } = await supabase
        .from('notification_templates')
        .select('*')
        .order('created_at', { ascending: false });

      const { data: notificationsData } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      setTemplates(templatesData || []);
      setNotifications(notificationsData || []);
    } catch (error) {
      console.error('Error fetching notification data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTemplates = templates.filter((t) =>
    t.name?.toLowerCase().includes(search.toLowerCase()) ||
    t.event_type?.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    totalTemplates: templates.length,
    activeTemplates: templates.filter(t => t.is_active).length,
    totalSent: notifications.filter(n => n.status === 'sent').length,
    pending: notifications.filter(n => n.status === 'pending').length,
    failed: notifications.filter(n => n.status === 'failed').length,
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Notification Center</h1>
            <p className="text-slate-400">Manage templates and notification history</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="btn-primary px-4 py-2 rounded-lg flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Template
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
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-slate-900/60 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-teal-500/10">
                <Bell className="h-5 w-5 text-teal-400" />
              </div>
              <div>
                <p className="text-slate-400 text-sm">Templates</p>
                <p className="text-xl font-bold text-white">{stats.totalTemplates}</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-900/60 backdrop-blur-sm rounded-xl border border-green-500/30 p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <div>
                <p className="text-slate-400 text-sm">Active</p>
                <p className="text-xl font-bold text-green-400">{stats.activeTemplates}</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-900/60 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4">
            <div className="flex items-center gap-3">
              <Send className="h-5 w-5 text-blue-400" />
              <div>
                <p className="text-slate-400 text-sm">Sent</p>
                <p className="text-xl font-bold text-blue-400">{stats.totalSent}</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-900/60 backdrop-blur-sm rounded-xl border border-amber-500/30 p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-amber-400" />
              <div>
                <p className="text-slate-400 text-sm">Pending</p>
                <p className="text-xl font-bold text-amber-400">{stats.pending}</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-900/60 backdrop-blur-sm rounded-xl border border-red-500/30 p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-red-400" />
              <div>
                <p className="text-slate-400 text-sm">Failed</p>
                <p className="text-xl font-bold text-red-400">{stats.failed}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('templates')}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'templates'
                ? 'bg-teal-500/10 text-teal-400 border border-teal-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Templates
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'history'
                ? 'bg-teal-500/10 text-teal-400 border border-teal-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            History
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
          <input
            type="text"
            placeholder={activeTab === 'templates' ? 'Search templates...' : 'Search notifications...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full input-dark rounded-xl pl-12 pr-4 py-3"
          />
        </div>

        {/* Content */}
        {activeTab === 'templates' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              <div className="col-span-full text-center py-8 text-slate-400">Loading...</div>
            ) : filteredTemplates.length === 0 ? (
              <div className="col-span-full text-center py-8 text-slate-400">No templates found</div>
            ) : (
              filteredTemplates.map((template) => {
                const ChannelIcon = channelIcons[template.channel] || Bell;
                return (
                  <div
                    key={template.id}
                    className="bg-slate-900/60 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden hover:border-teal-500/30 transition-all"
                  >
                    <div className="p-6 border-b border-slate-700/50">
                      <div className="flex items-center justify-between mb-3">
                        <div className={`px-3 py-1 rounded-lg ${channelColors[template.channel] || 'bg-slate-500/10 text-slate-400'}`}>
                          <div className="flex items-center gap-2">
                            <ChannelIcon className="h-4 w-4" />
                            <span className="text-sm font-medium capitalize">{template.channel}</span>
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs ${
                          template.is_active
                            ? 'bg-green-500/10 text-green-400'
                            : 'bg-slate-500/10 text-slate-400'
                        }`}>
                          {template.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-white">{template.name}</h3>
                      <p className="text-slate-400 text-sm mt-1">{template.event_type}</p>
                    </div>
                    <div className="p-6">
                      <p className="text-slate-300 text-sm line-clamp-2">{template.subject}</p>
                    </div>
                    <div className="p-4 border-t border-slate-700/50 flex items-center gap-2">
                      <button className="flex-1 py-2 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500/20 transition-colors text-sm flex items-center justify-center gap-2">
                        <Edit2 className="h-4 w-4" />
                        Edit
                      </button>
                      <button className="flex-1 py-2 bg-teal-500/10 text-teal-400 rounded-lg hover:bg-teal-500/20 transition-colors text-sm flex items-center justify-center gap-2">
                        <Send className="h-4 w-4" />
                        Test
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          <div className="bg-slate-900/60 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-slate-400 border-b border-slate-800">
                    <th className="px-6 py-4 font-medium">Channel</th>
                    <th className="px-6 py-4 font-medium">Type</th>
                    <th className="px-6 py-4 font-medium">Recipient</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium">Sent At</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                        Loading...
                      </td>
                    </tr>
                  ) : notifications.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                        No notifications found
                      </td>
                    </tr>
                  ) : (
                    notifications.map((notification) => {
                      const ChannelIcon = channelIcons[notification.channel] || Bell;
                      return (
                        <tr key={notification.id} className="border-b border-slate-800 hover:bg-slate-800/30 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <ChannelIcon className="h-4 w-4 text-slate-400" />
                              <span className="text-slate-300 capitalize">{notification.channel}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-300">
                            {notification.notification_type}
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-mono text-slate-300 text-sm">
                              {notification.recipient?.slice(0, 20)}...
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${statusColors[notification.status] || statusColors.pending}`}>
                              {notification.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-400 text-sm">
                            {notification.sent_at
                              ? new Date(notification.sent_at).toLocaleString()
                              : 'Pending'}
                          </td>
                        </tr>
                      );
                    })
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
