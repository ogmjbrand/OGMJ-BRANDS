'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Upload, Play, MoreHorizontal, Zap, AlertCircle, Trash2, RefreshCcw, Loader2, Library, Wand2, Megaphone, FileText, Scissors } from 'lucide-react';
import { useBusinessContext } from '@/lib/context/BusinessContext';
import { getCurrentSession } from '@/lib/auth';
import {
  getVideos,
  createVideo,
  deleteVideo,
  startVideoProcessing,
} from '@/lib/services/videos.service';
import type { Video } from '@/lib/services/videos.service';
import {
  validateVideoFile,
  getVideoDurationSeconds,
  uploadVideoFile,
} from '@/lib/services/video-upload';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import ScriptWorkspace from '@/components/dashboard/videos/ScriptWorkspace';
import ClipStudioWorkspace from '@/components/dashboard/videos/ClipStudioWorkspace';

type StudioTab = 'library' | 'generator' | 'marketing' | 'script_to_video' | 'clips';

const STUDIO_TABS: { id: StudioTab; label: string; icon: typeof Library }[] = [
  { id: 'library', label: 'Video Library', icon: Library },
  { id: 'generator', label: 'AI Video Generator', icon: Wand2 },
  { id: 'marketing', label: 'Marketing Studio', icon: Megaphone },
  { id: 'script_to_video', label: 'Script-to-Video', icon: FileText },
  { id: 'clips', label: 'Clip Studio', icon: Scissors },
];

export default function VideosPage() {
  const { currentBusiness } = useBusinessContext();
  const [activeTab, setActiveTab] = useState<StudioTab>('library');
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newVideoTitle, setNewVideoTitle] = useState('');
  const [newVideoDescription, setNewVideoDescription] = useState('');
  const [newVideoSourceUrl, setNewVideoSourceUrl] = useState('');
  const [newVideoDuration, setNewVideoDuration] = useState('');
  const [newVideoFileSize, setNewVideoFileSize] = useState('');
  const [creatingVideo, setCreatingVideo] = useState(false);
  const [videoFormError, setVideoFormError] = useState<string | null>(null);
  const [operationVideoId, setOperationVideoId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileUploading, setFileUploading] = useState(false);
  const [fileUploadProgress, setFileUploadProgress] = useState(0);
  const [fileUploadError, setFileUploadError] = useState<string | null>(null);

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

  async function handleCreateVideo(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!currentBusiness) return;
    if (!newVideoTitle.trim()) {
      setVideoFormError('Video title is required.');
      return;
    }
    if (!newVideoSourceUrl.trim()) {
      setVideoFormError('A source URL is required.');
      return;
    }

    setCreatingVideo(true);
    setVideoFormError(null);

    const result = await createVideo(currentBusiness.id, {
      title: newVideoTitle.trim(),
      description: newVideoDescription.trim() || undefined,
      sourceUrl: newVideoSourceUrl.trim() || undefined,
      durationSeconds: newVideoDuration ? parseInt(newVideoDuration, 10) : undefined,
      fileSizeBytes: newVideoFileSize ? parseInt(newVideoFileSize, 10) : undefined,
    });

    if (!result.success) {
      setVideoFormError(result.error?.message || 'Failed to create video.');
      setCreatingVideo(false);
      return;
    }

    setNewVideoTitle('');
    setNewVideoDescription('');
    setNewVideoSourceUrl('');
    setNewVideoDuration('');
    setNewVideoFileSize('');
    setIsDialogOpen(false);
    setCreatingVideo(false);
    loadVideos();
  }

  async function handleFileSelected(file: File) {
    if (!currentBusiness) {
      setFileUploadError('No business selected');
      return;
    }
    // Guard against duplicate submissions (double-click, drop while a
    // previous upload is still running).
    if (fileUploading) return;

    const validationError = validateVideoFile(file);
    if (validationError) {
      setFileUploadError(validationError.message);
      return;
    }

    setFileUploading(true);
    setFileUploadProgress(0);
    setFileUploadError(null);

    try {
      const session = await getCurrentSession();
      if (!session?.access_token) {
        throw new Error('You must be signed in to upload');
      }

      const durationSeconds = await getVideoDurationSeconds(file);

      const { path } = await uploadVideoFile({
        file,
        businessId: currentBusiness.id,
        accessToken: session.access_token,
        onProgress: setFileUploadProgress,
      });

      const result = await createVideo(currentBusiness.id, {
        title: file.name.replace(/\.[^/.]+$/, ''),
        sourceType: 'upload',
        fileUrl: path,
        durationSeconds: durationSeconds ?? undefined,
        fileSizeBytes: file.size,
      });

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to save video');
      }

      await loadVideos();
    } catch (err) {
      setFileUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setFileUploading(false);
      setFileUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  function handleBrowseClick() {
    fileInputRef.current?.click();
  }

  function handleFileInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) handleFileSelected(file);
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) handleFileSelected(file);
  }

  function handleDragOver(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
  }

  async function handleDeleteVideo(videoId: string) {
    if (!confirm('Delete this video?')) return;
    setOperationVideoId(videoId);
    const result = await deleteVideo(videoId);
    if (result.success) {
      setVideos((prev) => prev.filter((video) => video.id !== videoId));
    }
    setOperationVideoId(null);
  }

  async function handleProcessVideo(videoId: string) {
    setOperationVideoId(videoId);
    const result = await startVideoProcessing(videoId);
    if (result.success) {
      loadVideos();
    }
    setOperationVideoId(null);
  }

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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-white">AI Video Studio</h1>
        <p className="text-[#C8FF00]/70 mt-2">Upload, generate and repurpose video content in one place</p>
      </div>

      {/* Tab navigation */}
      <div className="flex flex-wrap gap-2 border-b border-[#C8FF00]/10 pb-3">
        {STUDIO_TABS.map((tab) => {
          const TabIcon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition ${
                isActive
                  ? 'bg-[#C8FF00]/10 text-[#C8FF00] ring-1 ring-inset ring-[#C8FF00]/30'
                  : 'text-[#C8FF00]/50 hover:bg-white/5 hover:text-white'
              }`}
            >
              <TabIcon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'generator' && (
        <ScriptWorkspace
          businessId={currentBusiness?.id || ''}
          workspace="generator"
          heading="AI Video Generator"
          description="Describe the video you want, review the AI-generated storyboard, then render it once a video provider is connected."
          promptLabel="Describe the video you want"
          promptPlaceholder="e.g. A 30-second product demo for a skincare brand, warm lighting, close-up shots of the product texture..."
        />
      )}

      {activeTab === 'marketing' && (
        <ScriptWorkspace
          businessId={currentBusiness?.id || ''}
          workspace="marketing"
          heading="AI Marketing Video Studio"
          description="Product ads, campaigns, brand storytelling and launch videos — grounded in your real brand strategy when available."
          promptLabel="Describe the product, campaign or offer"
          promptPlaceholder="e.g. Launch ad for our new Pro plan, targeting small business owners, emphasizing speed and simplicity..."
        />
      )}

      {activeTab === 'script_to_video' && (
        <ScriptWorkspace
          businessId={currentBusiness?.id || ''}
          workspace="script_to_video"
          heading="Script-to-Video"
          description="Paste an existing script or brief — get a scene breakdown, visual prompts, subtitles and social metadata without losing your words."
          promptLabel="Paste your script or brief"
          promptPlaceholder="Paste the script, voiceover copy or brief you already have..."
        />
      )}

      {activeTab === 'clips' && (
        <ClipStudioWorkspace videos={videos} onVideoUpdated={loadVideos} />
      )}

      {activeTab === 'library' && loading && (
        <div className="flex items-center justify-center p-12">
          <div className="text-center space-y-4">
            <div className="inline-block w-8 h-8 border-4 border-[#C8FF00]/20 border-t-[#C8FF00] rounded-full animate-spin"></div>
            <p className="text-[#C8FF00]/70">Loading videos...</p>
          </div>
        </div>
      )}

      {activeTab === 'library' && !loading && error && (
        <div className="flex items-center justify-center p-12">
          <div className="text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
            <p className="text-red-400">{error}</p>
            <button
              onClick={loadVideos}
              className="px-4 py-2 bg-[#C8FF00] text-[#07070A] rounded-lg font-semibold hover:bg-[#C8FF00]/90 transition"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {activeTab === 'library' && !loading && !error && (
      <>
      {/* Library header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Video Library</h2>
          <p className="text-[#C8FF00]/70 mt-1 text-sm">Your uploaded video assets</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2 px-4 py-2 bg-[#C8FF00] text-[#07070A] rounded-lg font-semibold hover:bg-[#C8FF00]/90 transition" size="sm">
              <Upload className="w-5 h-5" />
              Upload Video
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Upload new video</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateVideo} className="space-y-4 pt-2">
              {videoFormError && (
                <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
                  {videoFormError}
                </div>
              )}
              <div className="grid gap-4">
                <label className="space-y-2 text-sm text-[#C8FF00]/70">
                  Title
                  <input
                    type="text"
                    value={newVideoTitle}
                    onChange={(e) => setNewVideoTitle(e.target.value)}
                    className="w-full rounded-3xl border border-[#C8FF00]/10 bg-[#07070A] px-4 py-3 text-white outline-none focus:border-[#C8FF00]"
                    placeholder="Enter video title"
                    required
                  />
                </label>
                <label className="space-y-2 text-sm text-[#C8FF00]/70">
                  Description
                  <textarea
                    value={newVideoDescription}
                    onChange={(e) => setNewVideoDescription(e.target.value)}
                    rows={4}
                    className="w-full rounded-3xl border border-[#C8FF00]/10 bg-[#07070A] px-4 py-3 text-white outline-none focus:border-[#C8FF00]"
                    placeholder="Video description"
                  />
                </label>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-2 text-sm text-[#C8FF00]/70">
                    Source URL
                    <input
                      type="url"
                      required
                      value={newVideoSourceUrl}
                      onChange={(e) => setNewVideoSourceUrl(e.target.value)}
                      className="w-full rounded-3xl border border-[#C8FF00]/10 bg-[#07070A] px-4 py-3 text-white outline-none focus:border-[#C8FF00]"
                      placeholder="https://"
                    />
                  </label>
                  <label className="space-y-2 text-sm text-[#C8FF00]/70">
                    Duration (seconds)
                    <input
                      type="number"
                      min={0}
                      value={newVideoDuration}
                      onChange={(e) => setNewVideoDuration(e.target.value)}
                      className="w-full rounded-3xl border border-[#C8FF00]/10 bg-[#07070A] px-4 py-3 text-white outline-none focus:border-[#C8FF00]"
                      placeholder="120"
                    />
                  </label>
                </div>
                <label className="space-y-2 text-sm text-[#C8FF00]/70">
                  File size (bytes)
                  <input
                    type="number"
                    min={0}
                    value={newVideoFileSize}
                    onChange={(e) => setNewVideoFileSize(e.target.value)}
                    className="w-full rounded-3xl border border-[#C8FF00]/10 bg-[#07070A] px-4 py-3 text-white outline-none focus:border-[#C8FF00]"
                    placeholder="42000000"
                  />
                </label>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={creatingVideo}>
                  {creatingVideo ? 'Uploading...' : 'Create video'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
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
            className="p-4 bg-[#0E1116] border border-[#C8FF00]/10 rounded-lg space-y-2"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-[#C8FF00]/70">{stat.label}</p>
              <span className="text-xl">{stat.icon}</span>
            </div>
            <p className="text-2xl font-bold text-[#C8FF00]">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Videos Grid */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-white">Your Videos</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-[#C8FF00]/50">No videos uploaded yet</p>
            </div>
          ) : (
            videos.map((video) => (
              <div
                key={video.id}
                className="group bg-[#0E1116] border border-[#C8FF00]/10 rounded-xl overflow-hidden hover:border-[#C8FF00]/30 transition"
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
                    <div className="w-full h-full flex items-center justify-center text-[#C8FF00]/30">
                      <Play className="w-12 h-12" />
                    </div>
                  )}
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition flex items-center justify-center">
                    <button title="Play video" className="p-2 bg-[#C8FF00] text-[#07070A] rounded-full opacity-0 group-hover:opacity-100 transition">
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
                    <h3 className="font-semibold text-white group-hover:text-[#C8FF00] transition">
                      {video.title}
                    </h3>
                    <button title="More options" className="p-1 text-[#C8FF00]/50 hover:text-[#C8FF00] opacity-0 group-hover:opacity-100 transition">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-sm text-[#C8FF00]/70">
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
                  <div className="flex flex-wrap gap-2 pt-2">
                    <button
                      onClick={() => handleProcessVideo(video.id)}
                      disabled={video.status === 'processing' || operationVideoId === video.id}
                      className="flex-1 min-w-[120px] px-3 py-1.5 bg-[#C8FF00]/20 text-[#C8FF00] rounded text-sm font-medium hover:bg-[#C8FF00]/30 transition disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {operationVideoId === video.id ? 'Working…' : 'Process'}
                    </button>
                    <button className="flex-1 min-w-[120px] px-3 py-1.5 bg-[#C8FF00]/10 text-[#C8FF00]/50 rounded text-sm font-medium hover:bg-[#C8FF00]/20 transition">
                      Clip
                    </button>
                    <button
                      onClick={() => handleDeleteVideo(video.id)}
                      className="flex-1 min-w-[120px] px-3 py-1.5 bg-red-500/10 text-red-400 rounded text-sm font-medium hover:bg-red-500/20 transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}

          {/* Upload Card */}
          <div
            onClick={fileUploading ? undefined : handleBrowseClick}
            onDrop={fileUploading ? undefined : handleDrop}
            onDragOver={fileUploading ? undefined : handleDragOver}
            onDragLeave={fileUploading ? undefined : handleDragLeave}
            onKeyDown={(e) => {
              if (!fileUploading && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                handleBrowseClick();
              }
            }}
            role="button"
            tabIndex={0}
            aria-label="Upload new video"
            className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition group ${
              fileUploading
                ? 'border-[#C8FF00]/30 cursor-not-allowed'
                : isDragging
                  ? 'border-[#C8FF00] bg-[#C8FF00]/5 cursor-pointer'
                  : 'border-[#C8FF00]/20 hover:border-[#C8FF00]/40 cursor-pointer'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="video/mp4,video/quicktime,video/webm,video/x-matroska,video/x-msvideo,video/mpeg"
              className="hidden"
              onChange={handleFileInputChange}
              disabled={fileUploading}
            />

            {fileUploading ? (
              <>
                <Loader2 className="w-12 h-12 text-[#C8FF00] animate-spin mb-3" />
                <p className="font-semibold text-white">Uploading… {fileUploadProgress}%</p>
                <div className="w-full max-w-[200px] h-1.5 rounded-full bg-[#C8FF00]/10 mt-3 overflow-hidden">
                  <div
                    className="h-full bg-[#C8FF00] transition-all"
                    style={{ width: `${fileUploadProgress}%` }}
                  />
                </div>
              </>
            ) : (
              <>
                <Upload className="w-12 h-12 text-[#C8FF00]/50 group-hover:text-[#C8FF00] transition mb-3" />
                <p className="font-semibold text-white group-hover:text-[#C8FF00] transition">
                  Upload New Video
                </p>
                <p className="text-sm text-[#C8FF00]/50 mt-1">
                  Drag and drop or click to browse
                </p>
              </>
            )}

            {fileUploadError && (
              <p className="text-sm text-red-400 mt-3 max-w-[220px]">{fileUploadError}</p>
            )}
          </div>
        </div>
      </div>
      </>
      )}
    </div>
  );
}


