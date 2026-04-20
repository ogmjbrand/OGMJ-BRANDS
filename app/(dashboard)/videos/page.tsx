'use client';

import React, { useEffect, useState } from 'react';
import { Upload, Play, MoreHorizontal, Zap, AlertCircle } from 'lucide-react';
import { useBusinessContext } from '@/lib/context/BusinessContext';
import { getVideos } from '@/lib/services/videos.service';
import type { Video } from '@/lib/services/videos.service';

export default function VideosPage() {
  const { currentBusiness } = useBusinessContext();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadVideos() {
    if (!currentBusiness) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await getVideos(currentBusiness.id, {
        limit: 50,
      });

      if (result.success && result.data) {
        setVideos(result.data.videos || []);
      } else {
        setError(result.error?.message || 'Failed to load videos');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Failed to load videos:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadVideos();
  }, [currentBusiness]);

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const stats = {
    totalVideos: videos.length,
    totalViews: videos.reduce((sum, video) => sum + (video.metadata?.views || 0), 0),
    totalClips: videos.reduce((sum, video) => sum + (video.metadata?.clips || 0), 0),
    totalStorage: videos.reduce((sum, video) => sum + (video.fileSizeBytes || 0), 0),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center space-y-4">
          <div className="inline-block w-8 h-8 border-4 border-[#D4AF37]/20 border-t-[#D4AF37] rounded-full animate-spin"></div>
          <p className="text-[#D4AF37]/70">Loading videos...</p>
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
            onClick={loadVideos}
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
          { label: 'Total Videos', value: stats.totalVideos.toString(), icon: '🎬' },
          { label: 'Total Views', value: stats.totalViews.toString(), icon: '👁️' },
          { label: 'Total Clips', value: stats.totalClips.toString(), icon: '✂️' },
          { label: 'Storage Used', value: `${(stats.totalStorage / (1024 * 1024 * 1024)).toFixed(1)}GB`, icon: '💾' },
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
          {videos.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-[#D4AF37]/50">No videos uploaded yet</p>
            </div>
          ) : (
            videos.map((video) => (
              <div
                key={video.id}
                className="group bg-[#0E1116] border border-[#D4AF37]/10 rounded-xl overflow-hidden hover:border-[#D4AF37]/30 transition"
              >
                {/* Thumbnail */}
                <div className="relative h-40 overflow-hidden bg-[#07070A]">
                  {video.thumbnailUrl ? (
                    <img
                      src={video.thumbnailUrl}
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#D4AF37]/30">
                      <Play className="w-12 h-12" />
                    </div>
                  )}
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition flex items-center justify-center">
                    <button className="p-2 bg-[#D4AF37] text-[#07070A] rounded-full opacity-0 group-hover:opacity-100 transition">
                      <Play className="w-6 h-6 ml-0.5" />
                    </button>
                  </div>

                  {/* Duration */}
                  <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/60 text-white text-xs font-semibold rounded">
                    {formatDuration(video.durationSeconds)}
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
                      {video.metadata?.views || 0} views
                    </span>
                    <span className="flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      {video.metadata?.clips || 0} clips
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
            ))
          )}

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
