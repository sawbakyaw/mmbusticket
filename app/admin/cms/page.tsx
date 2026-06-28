'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { AdminLayout } from '@/components/admin-layout';
import {
  Search, Plus, Edit2, Trash2, FileText, Globe, Settings,
  Eye, Save, RefreshCw, Layout, Share2
} from 'lucide-react';

const pageTypeColors: Record<string, string> = {
  page: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  blog: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  faq: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
  policy: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
};

export default function CMSPage() {
  const [loading, setLoading] = useState(true);
  const [pages, setPages] = useState<any[]>([]);
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [activeTab, setActiveTab] = useState<'pages' | 'settings'>('pages');
  const [search, setSearch] = useState('');
  const [editingPage, setEditingPage] = useState<any | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: pagesData } = await supabase
        .from('cms_pages')
        .select('*')
        .order('created_at', { ascending: false });

      const { data: settingsData } = await supabase
        .from('cms_settings')
        .select('*');

      // Convert settings array to object
      const settingsObj: Record<string, any> = {};
      settingsData?.forEach((s) => {
        settingsObj[s.key] = s.value;
      });

      setPages(pagesData || []);
      setSettings(settingsObj);
    } catch (error) {
      console.error('Error fetching CMS data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPages = pages.filter((p) =>
    p.title?.toLowerCase().includes(search.toLowerCase()) ||
    p.slug?.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    totalPages: pages.length,
    published: pages.filter(p => p.is_published).length,
    drafts: pages.filter(p => !p.is_published).length,
    totalViews: pages.reduce((sum, p) => sum + (p.views || 0), 0),
  };

  const settingGroups = [
    {
      name: 'Site Information',
      icon: Globe,
      settings: ['site_name', 'site_tagline', 'site_description', 'site_keywords'],
    },
    {
      name: 'Contact Details',
      icon: FileText,
      settings: ['contact_email', 'contact_phone', 'contact_address'],
    },
    {
      name: 'Social Media',
      icon: Share2,
      settings: ['social_facebook', 'social_instagram', 'social_twitter', 'social_linkedin'],
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">CMS Manager</h1>
            <p className="text-slate-400">Manage pages, content, and site settings</p>
          </div>
          <div className="flex items-center gap-3">
            {activeTab === 'pages' && (
              <button className="btn-primary px-4 py-2 rounded-lg flex items-center gap-2">
                <Plus className="h-4 w-4" />
                New Page
              </button>
            )}
            <button
              onClick={fetchData}
              className="p-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900/60 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <FileText className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-slate-400 text-sm">Total Pages</p>
                <p className="text-xl font-bold text-white">{stats.totalPages}</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-900/60 backdrop-blur-sm rounded-xl border border-green-500/30 p-4">
            <div className="flex items-center gap-3">
              <Eye className="h-5 w-5 text-green-400" />
              <div>
                <p className="text-slate-400 text-sm">Published</p>
                <p className="text-xl font-bold text-green-400">{stats.published}</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-900/60 backdrop-blur-sm rounded-xl border border-amber-500/30 p-4">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-amber-400" />
              <div>
                <p className="text-slate-400 text-sm">Drafts</p>
                <p className="text-xl font-bold text-amber-400">{stats.drafts}</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-900/60 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4">
            <div className="flex items-center gap-3">
              <Layout className="h-5 w-5 text-teal-400" />
              <div>
                <p className="text-slate-400 text-sm">Total Views</p>
                <p className="text-xl font-bold text-teal-400">{stats.totalViews.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('pages')}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'pages'
                ? 'bg-teal-500/10 text-teal-400 border border-teal-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Pages
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'settings'
                ? 'bg-teal-500/10 text-teal-400 border border-teal-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Site Settings
          </button>
        </div>

        {/* Content */}
        {activeTab === 'pages' ? (
          <>
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
              <input
                type="text"
                placeholder="Search pages..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full input-dark rounded-xl pl-12 pr-4 py-3"
              />
            </div>

            {/* Pages Table */}
            <div className="bg-slate-900/60 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-sm text-slate-400 border-b border-slate-800">
                      <th className="px-6 py-4 font-medium">Title</th>
                      <th className="px-6 py-4 font-medium">Type</th>
                      <th className="px-6 py-4 font-medium">Slug</th>
                      <th className="px-6 py-4 font-medium">Status</th>
                      <th className="px-6 py-4 font-medium">Updated</th>
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
                    ) : filteredPages.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                          No pages found
                        </td>
                      </tr>
                    ) : (
                      filteredPages.map((page) => (
                        <tr key={page.id} className="border-b border-slate-800 hover:bg-slate-800/30 transition-colors">
                          <td className="px-6 py-4">
                            <p className="text-white font-medium">{page.title}</p>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${pageTypeColors[page.page_type] || pageTypeColors.page}`}>
                              {page.page_type || 'page'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-mono text-slate-400 text-sm">/{page.slug}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                              page.is_published
                                ? 'bg-green-500/10 text-green-400'
                                : 'bg-amber-500/10 text-amber-400'
                            }`}>
                              {page.is_published ? 'Published' : 'Draft'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-400 text-sm">
                            {new Date(page.updated_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setEditingPage(page)}
                                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button className="p-2 text-slate-400 hover:text-teal-400 hover:bg-teal-500/10 rounded-lg transition-colors">
                                <Eye className="h-4 w-4" />
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
          </>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {settingGroups.map((group) => (
              <div
                key={group.name}
                className="bg-slate-900/60 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <group.icon className="h-5 w-5 text-teal-400" />
                  <h3 className="text-lg font-semibold text-white">{group.name}</h3>
                </div>
                <div className="space-y-4">
                  {group.settings.map((key) => (
                    <div key={key}>
                      <label className="text-slate-400 text-sm capitalize block mb-1">
                        {key.replace(/_/g, ' ')}
                      </label>
                      <input
                        type="text"
                        className="w-full input-dark rounded-lg px-4 py-2"
                        placeholder={`Enter ${key.replace(/_/g, ' ')}`}
                        defaultValue={settings[key] || ''}
                      />
                    </div>
                  ))}
                </div>
                <button className="mt-4 w-full py-2 bg-teal-500/10 text-teal-400 rounded-lg hover:bg-teal-500/20 transition-colors flex items-center justify-center gap-2">
                  <Save className="h-4 w-4" />
                  Save Changes
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
