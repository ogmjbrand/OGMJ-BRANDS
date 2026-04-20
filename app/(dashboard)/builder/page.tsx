'use client';

import React, { useEffect, useState } from 'react';
import { Plus, Globe, Eye, Code, Share2, MoreHorizontal, AlertCircle, FileText, Edit, Trash2, ExternalLink } from 'lucide-react';
import { useBusinessContext } from '@/lib/context/BusinessContext';
import { getWebsites, getPages, createPage, deletePage, publishPage, type Website, type Page } from '@/lib/services/builder.service';

export default function BuilderPage() {
  const { currentBusiness } = useBusinessContext();
  const [websites, setWebsites] = useState<Website[]>([]);
  const [pages, setPages] = useState<Record<string, Page[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedWebsites, setExpandedWebsites] = useState<Set<string>>(new Set());
  const [creatingPage, setCreatingPage] = useState<string | null>(null);
  const [newPageTitle, setNewPageTitle] = useState('');
  const [newPageSlug, setNewPageSlug] = useState('');

  async function loadWebsites() {
    if (!currentBusiness) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await getWebsites(currentBusiness.id);

      if (result.success && result.data) {
        setWebsites(result.data);
        // Load pages for all websites
        const pagesData: Record<string, Page[]> = {};
        for (const website of result.data) {
          const pagesResult = await getPages(website.id);
          if (pagesResult.success && pagesResult.data) {
            pagesData[website.id] = pagesResult.data;
          }
        }
        setPages(pagesData);
      } else {
        setError(result.error?.message || 'Failed to load websites');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Failed to load websites:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreatePage(websiteId: string) {
    if (!newPageTitle.trim() || !newPageSlug.trim()) return;

    try {
      const result = await createPage({
        websiteId,
        title: newPageTitle.trim(),
        slug: newPageSlug.trim(),
      });

      if (result.success && result.data) {
        setPages(prev => ({
          ...prev,
          [websiteId]: [...(prev[websiteId] || []), result.data!],
        }));
        setNewPageTitle('');
        setNewPageSlug('');
        setCreatingPage(null);
      } else {
        alert(result.error?.message || 'Failed to create page');
      }
    } catch (err) {
      alert('Failed to create page');
      console.error(err);
    }
  }

  async function handleDeletePage(pageId: string, websiteId: string) {
    if (!confirm('Are you sure you want to delete this page?')) return;

    try {
      const result = await deletePage(pageId);
      if (result.success) {
        setPages(prev => ({
          ...prev,
          [websiteId]: prev[websiteId].filter(p => p.id !== pageId),
        }));
      } else {
        alert(result.error?.message || 'Failed to delete page');
      }
    } catch (err) {
      alert('Failed to delete page');
      console.error(err);
    }
  }

  async function handlePublishPage(pageId: string, websiteId: string) {
    try {
      const result = await publishPage(pageId);
      if (result.success && result.data) {
        setPages(prev => ({
          ...prev,
          [websiteId]: prev[websiteId].map(p => p.id === pageId ? result.data! : p),
        }));
      } else {
        alert(result.error?.message || 'Failed to publish page');
      }
    } catch (err) {
      alert('Failed to publish page');
      console.error(err);
    }
  }

  function toggleWebsiteExpansion(websiteId: string) {
    setExpandedWebsites(prev => {
      const newSet = new Set(prev);
      if (newSet.has(websiteId)) {
        newSet.delete(websiteId);
      } else {
        newSet.add(websiteId);
      }
      return newSet;
    });
  }

  useEffect(() => {
    loadWebsites();
  }, [currentBusiness]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-500/20 text-green-400';
      case 'draft':
        return 'bg-amber-500/20 text-amber-400';
      case 'archived':
        return 'bg-gray-500/20 text-gray-400';
      default:
        return 'bg-[#D4AF37]/20 text-[#D4AF37]';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center space-y-4">
          <div className="inline-block w-8 h-8 border-4 border-[#D4AF37]/20 border-t-[#D4AF37] rounded-full animate-spin"></div>
          <p className="text-[#D4AF37]/70">Loading websites...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
          <p className="text-red-400">{error}</p>
          <button
            onClick={loadWebsites}
            className="px-4 py-2 bg-[#D4AF37] text-[#07070A] rounded-lg font-semibold hover:bg-[#D4AF37]/90 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white">Website Builder</h1>
          <p className="text-[#D4AF37]/70 mt-2">Create and manage your websites</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-[#D4AF37] text-[#07070A] rounded-lg font-semibold hover:bg-[#D4AF37]/90 transition">
          <Plus className="w-5 h-5" />
          New Website
        </button>
      </div>

      {/* Info Banner */}
      <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg flex gap-3">
        <Globe className="w-5 h-5 text-blue-400 flex-shrink-0" />
        <div className="text-sm text-blue-400">
          <p className="font-semibold">Free domain included</p>
          <p className="text-blue-400/70 mt-1">Every website gets a free .ogmj.co subdomain</p>
        </div>
      </div>

      {/* Websites Grid */}
      <div className="space-y-6">
        {websites.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Globe className="w-16 h-16 text-[#D4AF37]/20 mx-auto mb-4" />
            <p className="text-[#D4AF37]/50">No websites created yet</p>
            <p className="text-sm text-[#D4AF37]/30 mt-2">Create your first website to get started</p>
          </div>
        ) : (
          websites.map((website) => (
            <div
              key={website.id}
              className="bg-[#0E1116] border border-[#D4AF37]/10 rounded-xl overflow-hidden"
            >
              {/* Website Header */}
              <div className="p-6 border-b border-[#D4AF37]/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#D4AF37]/20 to-[#07070A] rounded-lg flex items-center justify-center">
                      <Globe className="w-6 h-6 text-[#D4AF37]" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white">{website.name}</h3>
                      <p className="text-sm text-[#D4AF37]/70">
                        {website.domain || website.customDomain || 'No domain assigned'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(
                        website.status
                      )}`}
                    >
                      {website.status}
                    </span>
                    <button
                      onClick={() => toggleWebsiteExpansion(website.id)}
                      className="p-2 text-[#D4AF37]/50 hover:text-[#D4AF37] hover:bg-[#D4AF37]/10 rounded transition"
                    >
                      <FileText className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Pages Section */}
              {expandedWebsites.has(website.id) && (
                <div className="p-6 border-t border-[#D4AF37]/10">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-white">Pages</h4>
                    <button
                      onClick={() => setCreatingPage(website.id)}
                      className="flex items-center gap-2 px-3 py-2 bg-[#D4AF37] text-[#07070A] rounded-lg text-sm font-medium hover:bg-[#D4AF37]/90 transition"
                    >
                      <Plus className="w-4 h-4" />
                      Add Page
                    </button>
                  </div>

                  {/* Create Page Form */}
                  {creatingPage === website.id && (
                    <div className="mb-4 p-4 bg-[#D4AF37]/5 border border-[#D4AF37]/20 rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <input
                          type="text"
                          placeholder="Page Title"
                          value={newPageTitle}
                          onChange={(e) => setNewPageTitle(e.target.value)}
                          className="px-3 py-2 bg-[#07070A] border border-[#D4AF37]/20 rounded text-white placeholder-[#D4AF37]/50 focus:border-[#D4AF37] focus:outline-none"
                        />
                        <input
                          type="text"
                          placeholder="Page Slug (e.g., about)"
                          value={newPageSlug}
                          onChange={(e) => setNewPageSlug(e.target.value)}
                          className="px-3 py-2 bg-[#07070A] border border-[#D4AF37]/20 rounded text-white placeholder-[#D4AF37]/50 focus:border-[#D4AF37] focus:outline-none"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleCreatePage(website.id)}
                          className="px-4 py-2 bg-[#D4AF37] text-[#07070A] rounded text-sm font-medium hover:bg-[#D4AF37]/90 transition"
                        >
                          Create Page
                        </button>
                        <button
                          onClick={() => {
                            setCreatingPage(null);
                            setNewPageTitle('');
                            setNewPageSlug('');
                          }}
                          className="px-4 py-2 bg-[#D4AF37]/10 text-[#D4AF37]/70 rounded text-sm font-medium hover:bg-[#D4AF37]/20 transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Pages List */}
                  <div className="space-y-2">
                    {(pages[website.id] || []).length === 0 ? (
                      <p className="text-[#D4AF37]/50 text-center py-4">No pages created yet</p>
                    ) : (
                      (pages[website.id] || []).map((page) => (
                        <div
                          key={page.id}
                          className="flex items-center justify-between p-3 bg-[#07070A] border border-[#D4AF37]/10 rounded-lg hover:border-[#D4AF37]/20 transition"
                        >
                          <div className="flex items-center gap-3">
                            <FileText className="w-4 h-4 text-[#D4AF37]/50" />
                            <div>
                              <p className="font-medium text-white">{page.title}</p>
                              <p className="text-xs text-[#D4AF37]/50">/{page.slug}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium capitalize ${getStatusColor(
                                page.status
                              )}`}
                            >
                              {page.status}
                            </span>
                            <div className="flex gap-1">
                              <button
                                onClick={() => handlePublishPage(page.id, website.id)}
                                disabled={page.status === 'published'}
                                className="p-1 text-[#D4AF37]/50 hover:text-[#D4AF37] hover:bg-[#D4AF37]/10 rounded disabled:opacity-50 disabled:cursor-not-allowed transition"
                                title="Publish Page"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </button>
                              <button
                                className="p-1 text-[#D4AF37]/50 hover:text-[#D4AF37] hover:bg-[#D4AF37]/10 rounded transition"
                                title="Edit Page"
                              >
                                <Edit className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleDeletePage(page.id, website.id)}
                                className="p-1 text-red-400/50 hover:text-red-400 hover:bg-red-400/10 rounded transition"
                                title="Delete Page"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}

        {/* Create New Website Card */}
        <div className="border-2 border-dashed border-[#D4AF37]/20 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:border-[#D4AF37]/40 transition cursor-pointer group">
          <Plus className="w-12 h-12 text-[#D4AF37]/50 group-hover:text-[#D4AF37] transition mb-3" />
          <p className="font-semibold text-white group-hover:text-[#D4AF37] transition">
            Create New Website
          </p>
          <p className="text-sm text-[#D4AF37]/50 mt-1">
            Start with a blank site or template
          </p>
        </div>
      </div>

      {/* Templates Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-white">Templates</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {['Professional', 'Creative', 'E-Commerce'].map((template) => (
            <div
              key={template}
              className="p-6 bg-[#0E1116] border border-[#D4AF37]/10 rounded-xl hover:border-[#D4AF37]/30 transition cursor-pointer group"
            >
              <div className="h-32 bg-gradient-to-br from-[#D4AF37]/10 to-[#07070A] rounded mb-4 flex items-center justify-center">
                <Globe className="w-12 h-12 text-[#D4AF37]/20 group-hover:text-[#D4AF37]/40 transition" />
              </div>
              <p className="font-semibold text-white group-hover:text-[#D4AF37] transition">
                {template}
              </p>
              <button className="mt-3 w-full px-3 py-2 bg-[#D4AF37]/20 text-[#D4AF37] rounded text-sm font-medium hover:bg-[#D4AF37]/30 transition">
                Use Template
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
