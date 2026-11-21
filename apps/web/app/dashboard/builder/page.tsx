'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Globe, Eye, Code, Share2, MoreHorizontal, AlertCircle, FileText, Edit, Trash2, ExternalLink, Wand2, Sparkles, LayoutTemplate } from 'lucide-react';
import { useBusinessContext } from '@/lib/context/BusinessContext';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { getWebsites, getPages, createWebsite, updateWebsite, deleteWebsite, createPage, updatePage, deletePage, publishPage, getTemplates, type Website, type Page, type Template } from '@/lib/services/builder.service';
import { stashGenerationRequest } from '@/lib/editor/websiteGeneration';

export default function BuilderPage() {
  const router = useRouter();
  const { currentBusiness } = useBusinessContext();
  const [websites, setWebsites] = useState<Website[]>([]);
  const [pages, setPages] = useState<Record<string, Page[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedWebsites, setExpandedWebsites] = useState<Set<string>>(new Set());
  const [isCreateWebsiteOpen, setIsCreateWebsiteOpen] = useState(false);
  const [editWebsiteId, setEditWebsiteId] = useState<string | null>(null);
  const [newWebsiteName, setNewWebsiteName] = useState('');
  const [newWebsiteDescription, setNewWebsiteDescription] = useState('');
  const [creationMode, setCreationMode] = useState<'blank' | 'ai'>('blank');
  const [aiRequirements, setAiRequirements] = useState('');
  const [creatingWebsite, setCreatingWebsite] = useState(false);
  const [websiteActionError, setWebsiteActionError] = useState<string | null>(null);
  const [creatingPage, setCreatingPage] = useState<string | null>(null);
  const [editPageId, setEditPageId] = useState<string | null>(null);
  const [newPageTitle, setNewPageTitle] = useState('');
  const [newPageSlug, setNewPageSlug] = useState('');
  const [pageActionError, setPageActionError] = useState<string | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

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
          const pagesResult = await getPages(currentBusiness.id, website.id);
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

  async function handleSavePage(websiteId: string) {
    if (!newPageTitle.trim() || !newPageSlug.trim()) return;
    setPageActionError(null);

    try {
      if (editPageId) {
        const result = await updatePage(editPageId, {
          title: newPageTitle.trim(),
          slug: newPageSlug.trim(),
        });

        if (result.success && result.data) {
          setPages((prev) => ({
            ...prev,
            [websiteId]: prev[websiteId].map((page) =>
              page.id === editPageId ? result.data! : page
            ),
          }));
          setEditPageId(null);
          setNewPageTitle('');
          setNewPageSlug('');
          setCreatingPage(null);
        } else {
          setPageActionError(result.error?.message || 'Failed to update page');
        }
      } else {
        const result = await createPage({
          businessId: currentBusiness?.id || '',
          websiteId,
          title: newPageTitle.trim(),
          slug: newPageSlug.trim(),
        });

        if (result.success && result.data) {
          setPages((prev) => ({
            ...prev,
            [websiteId]: [...(prev[websiteId] || []), result.data!],
          }));
          setNewPageTitle('');
          setNewPageSlug('');
          setCreatingPage(null);
        } else {
          setPageActionError(result.error?.message || 'Failed to create page');
        }
      }
    } catch (err) {
      setPageActionError('Failed to save page');
      console.error(err);
    }
  }

  async function handleCreateWebsite(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!currentBusiness) return;
    if (!newWebsiteName.trim()) return;

    setCreatingWebsite(true);
    setWebsiteActionError(null);

    try {
      const result = await createWebsite(currentBusiness.id, {
        businessId: currentBusiness.id,
        name: newWebsiteName.trim(),
        description: newWebsiteDescription.trim() || undefined,
        templateId: selectedTemplateId || undefined,
      });

      if (result.success && result.data) {
        setWebsites((prev) => [result.data!, ...prev]);
        setNewWebsiteName('');
        setNewWebsiteDescription('');
        setSelectedTemplateId(null);
        setIsCreateWebsiteOpen(false);
      } else {
        setWebsiteActionError(result.error?.message || 'Failed to create website');
      }
    } catch (err) {
      setWebsiteActionError('Failed to create website');
      console.error(err);
    } finally {
      setCreatingWebsite(false);
    }
  }

  /**
   * AI creation mode: reuses the EXISTING createWebsite/createPage APIs
   * unchanged (no new endpoint) -- the only new step is stashing the
   * business description/requirements for the page editor to pick up and
   * run through the EXISTING /api/ai/website-assist + editor.apply path
   * (see AIAssistPanel.tsx's `autoGenerate` prop). If anything after the
   * website itself is created fails, the website still exists and shows
   * up in the list below exactly like a blank one -- never a broken or
   * inaccessible website, just one that didn't get AI content yet.
   */
  async function handleCreateWebsiteWithAI(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!currentBusiness) return;
    if (!newWebsiteName.trim() || !newWebsiteDescription.trim()) return;

    setCreatingWebsite(true);
    setWebsiteActionError(null);

    try {
      const siteResult = await createWebsite(currentBusiness.id, {
        businessId: currentBusiness.id,
        name: newWebsiteName.trim(),
        description: newWebsiteDescription.trim(),
      });

      if (!siteResult.success || !siteResult.data) {
        setWebsiteActionError(siteResult.error?.message || 'Failed to create website');
        return;
      }

      const website = siteResult.data;
      setWebsites((prev) => [website, ...prev]);

      const pageResult = await createPage({
        businessId: currentBusiness.id,
        websiteId: website.id,
        title: 'Home',
        slug: 'home',
      });

      if (!pageResult.success || !pageResult.data) {
        // The website exists and is now visible below like any other --
        // just without a page yet. Let the user add one manually rather
        // than leaving them with nothing to do.
        setWebsiteActionError(
          pageResult.error?.message || 'Website created, but the first page could not be created. Open it below and add a page to continue.'
        );
        setIsCreateWebsiteOpen(false);
        return;
      }

      stashGenerationRequest(pageResult.data.id, {
        description: newWebsiteDescription.trim(),
        requirements: aiRequirements.trim() || undefined,
      });

      setIsCreateWebsiteOpen(false);
      setNewWebsiteName('');
      setNewWebsiteDescription('');
      setAiRequirements('');
      router.push(`/dashboard/builder/${website.id}/${pageResult.data.id}?generate=1`);
    } catch (err) {
      setWebsiteActionError('Failed to create website');
      console.error(err);
    } finally {
      setCreatingWebsite(false);
    }
  }

  async function handleEditWebsite(website: Website) {
    setEditWebsiteId(website.id);
    setNewWebsiteName(website.name || '');
    setNewWebsiteDescription(website.description || '');
    setIsCreateWebsiteOpen(true);
  }

  async function handleEditPage(page: Page, websiteId: string) {
    setEditPageId(page.id);
    setNewPageTitle(page.title || '');
    setNewPageSlug(page.slug || '');
    setCreatingPage(websiteId);
    setPageActionError(null);
  }

  async function handleCancelPageEdit() {
    setEditPageId(null);
    setNewPageTitle('');
    setNewPageSlug('');
    setPageActionError(null);
  }

  async function handleUpdateWebsite(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editWebsiteId) return;
    if (!newWebsiteName.trim()) return;

    setCreatingWebsite(true);
    setWebsiteActionError(null);

    try {
      const result = await updateWebsite(editWebsiteId, {
        name: newWebsiteName.trim(),
        description: newWebsiteDescription.trim() || undefined,
      });

      if (result.success && result.data) {
        setWebsites((prev) => prev.map((site) => (site.id === editWebsiteId ? result.data! : site)));
        setEditWebsiteId(null);
        setNewWebsiteName('');
        setNewWebsiteDescription('');
        setIsCreateWebsiteOpen(false);
      } else {
        setWebsiteActionError(result.error?.message || 'Failed to update website');
      }
    } catch (err) {
      setWebsiteActionError('Failed to update website');
      console.error(err);
    } finally {
      setCreatingWebsite(false);
    }
  }

  async function handleDeleteWebsite(websiteId: string) {
    if (!confirm('Delete this website and all its pages?')) return;

    try {
      const result = await deleteWebsite(websiteId);
      if (result.success) {
        setWebsites((prev) => prev.filter((site) => site.id !== websiteId));
        setPages((prev) => {
          const next = { ...prev };
          delete next[websiteId];
          return next;
        });
      } else {
        alert(result.error?.message || 'Failed to delete website');
      }
    } catch (err) {
      alert('Failed to delete website');
      console.error(err);
    }
  }

  async function handleDeletePage(pageId: string, websiteId: string) {
    if (!confirm('Are you sure you want to delete this page?')) return;

    try {
      const result = await deletePage(pageId);
      if (result.success) {
        setPages((prev) => ({
          ...prev,
          [websiteId]: prev[websiteId].filter((p) => p.id !== pageId),
        }));
        if (editPageId === pageId) {
          setEditPageId(null);
          setNewPageTitle('');
          setNewPageSlug('');
          setPageActionError(null);
        }
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
        setPages((prev) => ({
          ...prev,
          [websiteId]: prev[websiteId].map((p) => (p.id === pageId ? result.data! : p)),
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

  useEffect(() => {
    async function loadTemplates() {
      setTemplatesLoading(true);
      const result = await getTemplates();
      if (result.success && result.data) {
        setTemplates(result.data);
      }
      setTemplatesLoading(false);
    }
    loadTemplates();
  }, []);

  function handleUseTemplate(template: Template) {
    setEditWebsiteId(null);
    setSelectedTemplateId(template.id);
    setNewWebsiteName(template.name);
    setNewWebsiteDescription('');
    setWebsiteActionError(null);
    setCreationMode('blank'); // a template is applied via the blank-creation path's templateId, not AI generation
    setAiRequirements('');
    setIsCreateWebsiteOpen(true);
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-500/20 text-green-400';
      case 'draft':
        return 'bg-amber-500/20 text-amber-400';
      case 'archived':
        return 'bg-gray-500/20 text-gray-400';
      default:
        return 'bg-[#C8FF00]/20 text-[#C8FF00]';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center space-y-4">
          <div className="inline-block w-8 h-8 border-4 border-[#C8FF00]/20 border-t-[#C8FF00] rounded-full animate-spin"></div>
          <p className="text-[#C8FF00]/70">Loading websites...</p>
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
            className="px-4 py-2 bg-[#C8FF00] text-[#07070A] rounded-lg font-semibold hover:bg-[#C8FF00]/90 transition"
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
          <p className="text-[#C8FF00]/70 mt-2">Create and manage your websites</p>
        </div>
        <Dialog open={isCreateWebsiteOpen} onOpenChange={(open: boolean) => {
          setIsCreateWebsiteOpen(open);
          if (!open) {
            setEditWebsiteId(null);
            setNewWebsiteName('');
            setNewWebsiteDescription('');
            setSelectedTemplateId(null);
            setWebsiteActionError(null);
            setCreationMode('blank');
            setAiRequirements('');
          }
        }}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2 px-4 py-2 bg-[#C8FF00] text-[#07070A] rounded-lg font-semibold hover:bg-[#C8FF00]/90 transition" size="sm">
              <Plus className="w-5 h-5" />
              New Website
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editWebsiteId ? 'Edit website' : 'Create a new website'}</DialogTitle>
            </DialogHeader>

            {!editWebsiteId && (
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCreationMode('ai')}
                  className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition ${
                    creationMode === 'ai'
                      ? 'border-[#C8FF00]/60 bg-[#C8FF00]/10'
                      : 'border-[#C8FF00]/10 bg-[#07070A] hover:border-[#C8FF00]/30'
                  }`}
                >
                  <Sparkles className={`mt-0.5 h-5 w-5 shrink-0 ${creationMode === 'ai' ? 'text-[#C8FF00]' : 'text-[#C8FF00]/50'}`} />
                  <div>
                    <p className="text-sm font-semibold text-white">Describe your business</p>
                    <p className="mt-1 text-xs text-[#C8FF00]/60">AI generates a complete homepage you can refine, then publish.</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setCreationMode('blank')}
                  className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition ${
                    creationMode === 'blank'
                      ? 'border-[#C8FF00]/60 bg-[#C8FF00]/10'
                      : 'border-[#C8FF00]/10 bg-[#07070A] hover:border-[#C8FF00]/30'
                  }`}
                >
                  <LayoutTemplate className={`mt-0.5 h-5 w-5 shrink-0 ${creationMode === 'blank' ? 'text-[#C8FF00]' : 'text-[#C8FF00]/50'}`} />
                  <div>
                    <p className="text-sm font-semibold text-white">Start blank</p>
                    <p className="mt-1 text-xs text-[#C8FF00]/60">An empty website you build yourself in the visual editor.</p>
                  </div>
                </button>
              </div>
            )}

            <form
              onSubmit={editWebsiteId ? handleUpdateWebsite : creationMode === 'ai' ? handleCreateWebsiteWithAI : handleCreateWebsite}
              className="space-y-4 pt-2"
            >
              <div className="grid gap-4">
                {websiteActionError && (
                  <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
                    {websiteActionError}
                  </div>
                )}
                <label className="space-y-2 text-sm text-[#C8FF00]/70">
                  Website Name
                  <input
                    type="text"
                    value={newWebsiteName}
                    onChange={(e) => setNewWebsiteName(e.target.value)}
                    className="w-full rounded-3xl border border-[#C8FF00]/10 bg-[#07070A] px-4 py-3 text-white outline-hidden focus:border-[#C8FF00]"
                    placeholder="Brand site, storefront, landing page"
                    required
                  />
                </label>
                <label className="space-y-2 text-sm text-[#C8FF00]/70">
                  {!editWebsiteId && creationMode === 'ai' ? 'Describe your business' : 'Description'}
                  <textarea
                    value={newWebsiteDescription}
                    onChange={(e) => setNewWebsiteDescription(e.target.value)}
                    rows={4}
                    className="w-full rounded-3xl border border-[#C8FF00]/10 bg-[#07070A] px-4 py-3 text-white outline-hidden focus:border-[#C8FF00]"
                    placeholder={
                      !editWebsiteId && creationMode === 'ai'
                        ? 'What does this business do, who is it for, and what should the website include?'
                        : 'One sentence summary of the website'
                    }
                    required={!editWebsiteId && creationMode === 'ai'}
                  />
                </label>
                {!editWebsiteId && creationMode === 'ai' && (
                  <label className="space-y-2 text-sm text-[#C8FF00]/70">
                    Specific requirements (optional)
                    <textarea
                      value={aiRequirements}
                      onChange={(e) => setAiRequirements(e.target.value)}
                      rows={2}
                      className="w-full rounded-3xl border border-[#C8FF00]/10 bg-[#07070A] px-4 py-3 text-white outline-hidden focus:border-[#C8FF00]"
                      placeholder="e.g. include a pricing section, mention we're open 24/7"
                    />
                  </label>
                )}
              </div>
              <DialogFooter>
                <Button type="submit" disabled={creatingWebsite}>
                  {creatingWebsite
                    ? editWebsiteId ? 'Saving...' : 'Creating...'
                    : editWebsiteId
                      ? 'Save Changes'
                      : creationMode === 'ai'
                        ? 'Generate Website'
                        : 'Create Website'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Info Banner */}
      <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg flex gap-3">
        <Globe className="w-5 h-5 text-blue-400 shrink-0" />
        <div className="text-sm text-blue-400">
          <p className="font-semibold">Free domain included</p>
          <p className="text-blue-400/70 mt-1">Every website gets a free .ogmj.co subdomain</p>
        </div>
      </div>

      {/* Websites Grid */}
      <div className="space-y-6">
        {websites.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Globe className="w-16 h-16 text-[#C8FF00]/20 mx-auto mb-4" />
            <p className="text-[#C8FF00]/50">No websites created yet</p>
            <p className="text-sm text-[#C8FF00]/30 mt-2">Create your first website to get started</p>
          </div>
        ) : (
          websites.map((website) => (
            <div
              key={website.id}
              className="bg-[#0E1116] border border-[#C8FF00]/10 rounded-xl overflow-hidden"
            >
              {/* Website Header */}
              <div className="p-6 border-b border-[#C8FF00]/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-linear-to-br from-[#C8FF00]/20 to-[#07070A] rounded-lg flex items-center justify-center">
                      <Globe className="w-6 h-6 text-[#C8FF00]" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white">{website.name}</h3>
                      <p className="text-sm text-[#C8FF00]/70">
                        Free .ogmj.co subdomain
                      </p>
                      <p className="text-xs text-[#C8FF00]/50 mt-2">
                        {website.pages} page{website.pages === 1 ? '' : 's'} • Last updated {new Date(website.lastModified || website.updatedAt).toLocaleDateString()}
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
                      title="Edit website"
                      onClick={() => handleEditWebsite(website)}
                      className="p-2 text-[#C8FF00]/50 hover:text-[#C8FF00] hover:bg-[#C8FF00]/10 rounded-sm transition"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      title="Delete website"
                      onClick={() => handleDeleteWebsite(website.id)}
                      className="p-2 text-red-400/70 hover:text-red-400 hover:bg-red-400/10 rounded-sm transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      title="Show pages"
                      onClick={() => toggleWebsiteExpansion(website.id)}
                      className="p-2 text-[#C8FF00]/50 hover:text-[#C8FF00] hover:bg-[#C8FF00]/10 rounded-sm transition"
                    >
                      <FileText className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Pages Section */}
              {expandedWebsites.has(website.id) && (
                <div className="p-6 border-t border-[#C8FF00]/10">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-white">Pages</h4>
                    <button
                      onClick={() => setCreatingPage(website.id)}
                      className="flex items-center gap-2 px-3 py-2 bg-[#C8FF00] text-[#07070A] rounded-lg text-sm font-medium hover:bg-[#C8FF00]/90 transition"
                    >
                      <Plus className="w-4 h-4" />
                      Add Page
                    </button>
                  </div>

                  {/* Create Page Form */}
                  {creatingPage === website.id && (
                    <div className="mb-4 p-4 bg-[#C8FF00]/5 border border-[#C8FF00]/20 rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <input
                          type="text"
                          placeholder="Page Title"
                          value={newPageTitle}
                          onChange={(e) => setNewPageTitle(e.target.value)}
                          className="px-3 py-2 bg-[#07070A] border border-[#C8FF00]/20 rounded-sm text-white placeholder-[#C8FF00]/50 focus:border-[#C8FF00] focus:outline-hidden"
                        />
                        <input
                          type="text"
                          placeholder="Page Slug (e.g., about)"
                          value={newPageSlug}
                          onChange={(e) => setNewPageSlug(e.target.value)}
                          className="px-3 py-2 bg-[#07070A] border border-[#C8FF00]/20 rounded-sm text-white placeholder-[#C8FF00]/50 focus:border-[#C8FF00] focus:outline-hidden"
                        />
                      </div>
                      {pageActionError && (
                        <div className="mb-4 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
                          {pageActionError}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSavePage(website.id)}
                          className="px-4 py-2 bg-[#C8FF00] text-[#07070A] rounded-sm text-sm font-medium hover:bg-[#C8FF00]/90 transition"
                        >
                          {editPageId ? 'Save Page' : 'Create Page'}
                        </button>
                        <button
                          onClick={() => {
                            setCreatingPage(null);
                            handleCancelPageEdit();
                          }}
                          className="px-4 py-2 bg-[#C8FF00]/10 text-[#C8FF00]/70 rounded-sm text-sm font-medium hover:bg-[#C8FF00]/20 transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Pages List */}
                  <div className="space-y-2">
                    {(pages[website.id] || []).length === 0 ? (
                      <p className="text-[#C8FF00]/50 text-center py-4">No pages created yet</p>
                    ) : (
                      (pages[website.id] || []).map((page) => (
                        <div
                          key={page.id}
                          className="flex items-center justify-between p-3 bg-[#07070A] border border-[#C8FF00]/10 rounded-lg hover:border-[#C8FF00]/20 transition"
                        >
                          <div className="flex items-center gap-3">
                            <FileText className="w-4 h-4 text-[#C8FF00]/50" />
                            <div>
                              <p className="font-medium text-white">{page.title}</p>
                              <p className="text-xs text-[#C8FF00]/50">/{page.slug}</p>
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
                              <Link
                                href={`/dashboard/builder/${website.id}/${page.id}`}
                                className="p-1 text-[#C8FF00]/50 hover:text-[#C8FF00] hover:bg-[#C8FF00]/10 rounded-sm transition"
                                title="Open in Visual Editor"
                              >
                                <Wand2 className="w-3 h-3" />
                              </Link>
                              <button
                                onClick={() => handlePublishPage(page.id, website.id)}
                                disabled={page.status === 'published'}
                                className="p-1 text-[#C8FF00]/50 hover:text-[#C8FF00] hover:bg-[#C8FF00]/10 rounded-sm disabled:opacity-50 disabled:cursor-not-allowed transition"
                                title="Publish Page"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleEditPage(page, website.id)}
                                className="p-1 text-[#C8FF00]/50 hover:text-[#C8FF00] hover:bg-[#C8FF00]/10 rounded-sm transition"
                                title="Edit Page"
                              >
                                <Edit className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleDeletePage(page.id, website.id)}
                                className="p-1 text-red-400/50 hover:text-red-400 hover:bg-red-400/10 rounded-sm transition"
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
        <div className="border-2 border-dashed border-[#C8FF00]/20 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:border-[#C8FF00]/40 transition cursor-pointer group">
          <Dialog open={isCreateWebsiteOpen} onOpenChange={setIsCreateWebsiteOpen}>
            <DialogTrigger asChild>
              <button className="w-full h-full p-8 flex flex-col items-center justify-center gap-3 text-white">
                <Plus className="w-12 h-12 text-[#C8FF00]/50 group-hover:text-[#C8FF00] transition" />
                <p className="font-semibold text-white group-hover:text-[#C8FF00] transition">
                  Create New Website
                </p>
                <p className="text-sm text-[#C8FF00]/50 mt-1">
                  Start with a blank site or template
                </p>
              </button>
            </DialogTrigger>
          </Dialog>
        </div>
      </div>

      {/* Templates Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-white">Templates</h2>
        {templatesLoading ? (
          <p className="text-[#C8FF00]/50 text-sm">Loading templates...</p>
        ) : templates.length === 0 ? (
          <p className="text-[#C8FF00]/50 text-sm">No templates available yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {templates.map((template) => (
              <div
                key={template.id}
                className="p-6 bg-[#0E1116] border border-[#C8FF00]/10 rounded-xl hover:border-[#C8FF00]/30 transition group"
              >
                <div className="h-32 bg-linear-to-br from-[#C8FF00]/10 to-[#07070A] rounded-sm mb-4 flex items-center justify-center overflow-hidden">
                  {template.previewImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={template.previewImage} alt={template.name} className="h-full w-full object-cover" />
                  ) : (
                    <Globe className="w-12 h-12 text-[#C8FF00]/20 group-hover:text-[#C8FF00]/40 transition" />
                  )}
                </div>
                <p className="font-semibold text-white group-hover:text-[#C8FF00] transition">
                  {template.name}
                </p>
                {template.category && (
                  <p className="text-xs text-[#C8FF00]/50 mt-1 capitalize">{template.category}</p>
                )}
                <button
                  onClick={() => handleUseTemplate(template)}
                  className="mt-3 w-full px-3 py-2 bg-[#C8FF00]/20 text-[#C8FF00] rounded-sm text-sm font-medium hover:bg-[#C8FF00]/30 transition"
                >
                  Use Template
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


