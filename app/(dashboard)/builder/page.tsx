'use client';

import React, { useState } from 'react';
import { Plus, Globe, Eye, Code, Share2, MoreHorizontal } from 'lucide-react';

interface Website {
  id: string;
  name: string;
  domain: string;
  status: 'draft' | 'published' | 'archived';
  visitors: number;
  lastModified: string;
  pages: number;
}

export default function BuilderPage() {
  const [websites, setWebsites] = useState<Website[]>([
    {
      id: '1',
      name: 'My Business Website',
      domain: 'mybusiness.ogmj.co',
      status: 'published',
      visitors: 2450,
      lastModified: '2 days ago',
      pages: 5,
    },
    {
      id: '2',
      name: 'Portfolio',
      domain: '',
      status: 'draft',
      visitors: 0,
      lastModified: 'Today',
      pages: 3,
    },
  ]);

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {websites.map((website) => (
          <div
            key={website.id}
            className="group bg-[#0E1116] border border-[#D4AF37]/10 rounded-xl overflow-hidden hover:border-[#D4AF37]/30 transition"
          >
            {/* Preview */}
            <div className="h-40 bg-gradient-to-br from-[#D4AF37]/10 to-[#07070A] flex items-center justify-center relative overflow-hidden">
              <Globe className="w-16 h-16 text-[#D4AF37]/20" />
              {website.status === 'published' && (
                <div className="absolute top-2 right-2 px-2 py-1 bg-green-500/20 text-green-400 text-xs font-semibold rounded">
                  Live
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-4 space-y-3">
              <div>
                <h3 className="font-semibold text-white group-hover:text-[#D4AF37] transition">
                  {website.name}
                </h3>
                <p className="text-xs text-[#D4AF37]/50 mt-1">
                  {website.domain || 'No domain assigned'}
                </p>
              </div>

              {/* Stats */}
              <div className="flex gap-4 text-xs text-[#D4AF37]/70">
                <span>{website.pages} pages</span>
                <span>{website.visitors} visitors</span>
              </div>

              {/* Meta */}
              <p className="text-xs text-[#D4AF37]/50">
                Modified {website.lastModified}
              </p>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <button className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-[#D4AF37]/20 text-[#D4AF37] rounded text-xs font-medium hover:bg-[#D4AF37]/30 transition">
                  <Code className="w-3 h-3" />
                  Edit
                </button>
                <button className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-[#D4AF37]/10 text-[#D4AF37]/50 rounded text-xs font-medium hover:bg-[#D4AF37]/20 transition">
                  <Eye className="w-3 h-3" />
                  View
                </button>
                <button className="p-2 text-[#D4AF37]/50 hover:text-[#D4AF37] hover:bg-[#D4AF37]/10 rounded transition">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Create New Card */}
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
