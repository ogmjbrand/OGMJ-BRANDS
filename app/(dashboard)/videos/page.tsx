'use client';

import React, { useState } from 'react';
import { Upload, Play, MoreHorizontal, Zap } from 'lucide-react';

export default function VideosPage() {
  const [videos] = useState([
    {
      id: 1,
      title: 'Product Demo 2026',
      duration: '5:23',
      status: 'processed',
      clips: 3,
      views: 1250,
      thumbnail:
        'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=400&h=225&fit=crop',
    },
    {
      id: 2,
      title: 'Customer Testimonial',
      duration: '2:15',
      status: 'processing',
      clips: 1,
      views: 850,
      thumbnail:
        'https://images.unsplash.com/photo-1516321318423-f06f70504a1a?w=400&h=225&fit=crop',
    },
  ]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white">Videos</h1>
          <p className="text-[#D4AF37]/70 mt-2">Create viral video content automatically</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-[#D4AF37] text-[#07070A] rounded-lg font-semibold hover:bg-[#D4AF37]/90 transition">
          <Upload className="w-5 h-5" />
          Upload Video
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Videos', value: '2', icon: '🎬' },
          { label: 'Total Views', value: '2.1K', icon: '👁️' },
          { label: 'Total Clips', value: '4', icon: '✂️' },
          { label: 'Storage Used', value: '1.2GB', icon: '💾' },
        ].map((stat, idx) => (
          <div
            key={idx}
            className="p-4 bg-[#0E1116] border border-[#D4AF37]/10 rounded-lg space-y-2"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-[#D4AF37]/70">{stat.label}</p>
              <span className="text-xl">{stat.icon}</span>
            </div>
            <p className="text-2xl font-bold text-[#D4AF37]">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Videos Grid */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-white">Your Videos</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((video) => (
            <div
              key={video.id}
              className="group bg-[#0E1116] border border-[#D4AF37]/10 rounded-xl overflow-hidden hover:border-[#D4AF37]/30 transition"
            >
              {/* Thumbnail */}
              <div className="relative h-40 overflow-hidden bg-[#07070A]">
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition"
                />
                {/* Overlay */}
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition flex items-center justify-center">
                  <button className="p-2 bg-[#D4AF37] text-[#07070A] rounded-full opacity-0 group-hover:opacity-100 transition">
                    <Play className="w-6 h-6 ml-0.5" />
                  </button>
                </div>

                {/* Duration */}
                <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/60 text-white text-xs font-semibold rounded">
                  {video.duration}
                </div>

                {/* Status Badge */}
                {video.status === 'processing' && (
                  <div className="absolute top-2 left-2 px-2 py-1 bg-amber-500/20 text-amber-300 text-xs font-medium rounded">
                    Processing...
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-white group-hover:text-[#D4AF37] transition">
                    {video.title}
                  </h3>
                  <button className="p-1 text-[#D4AF37]/50 hover:text-[#D4AF37] opacity-0 group-hover:opacity-100 transition">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 text-sm text-[#D4AF37]/70">
                  <span className="flex items-center gap-1">
                    <Play className="w-3 h-3" />
                    {video.views} views
                  </span>
                  <span className="flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    {video.clips} clips
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <button className="flex-1 px-3 py-1.5 bg-[#D4AF37]/20 text-[#D4AF37] rounded text-sm font-medium hover:bg-[#D4AF37]/30 transition">
                    View
                  </button>
                  <button className="flex-1 px-3 py-1.5 bg-[#D4AF37]/10 text-[#D4AF37]/50 rounded text-sm font-medium hover:bg-[#D4AF37]/20 transition">
                    Clip
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Upload Card */}
          <div className="border-2 border-dashed border-[#D4AF37]/20 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:border-[#D4AF37]/40 transition cursor-pointer group">
            <Upload className="w-12 h-12 text-[#D4AF37]/50 group-hover:text-[#D4AF37] transition mb-3" />
            <p className="font-semibold text-white group-hover:text-[#D4AF37] transition">
              Upload New Video
            </p>
            <p className="text-sm text-[#D4AF37]/50 mt-1">
              Drag and drop or click to browse
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
