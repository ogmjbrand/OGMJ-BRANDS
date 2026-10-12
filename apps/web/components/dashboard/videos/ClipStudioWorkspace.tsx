'use client';

import React, { useState } from 'react';
import { Scissors, Info, Loader2, FileText } from 'lucide-react';
import { transcribeVideoAsset } from '@/lib/services/ai-video.service';
import type { Video } from '@/lib/services/videos.service';

interface ClipStudioWorkspaceProps {
  videos: Video[];
  onVideoUpdated: () => void;
}

export default function ClipStudioWorkspace({ videos, onVideoUpdated }: ClipStudioWorkspaceProps) {
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [transcribing, setTranscribing] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const selectedVideo = videos.find((v) => v.id === selectedVideoId) || null;

  async function handleTranscribe() {
    if (!selectedVideoId) return;
    setTranscribing(true);
    setNotice(null);
    const result = await transcribeVideoAsset(selectedVideoId);
    if (!result.success) {
      setNotice(result.error?.message || 'Transcription is not available yet.');
    } else {
      onVideoUpdated();
    }
    setTranscribing(false);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white">Viral Clip Repurposing</h2>
        <p className="text-sm text-[#C8FF00]/60 mt-1">
          Turn long-form videos — interviews, webinars, podcasts — into short-form clips. Upload a video in the
          Library tab first, then select it here to transcribe and find clip-worthy moments.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <div className="rounded-2xl border border-[#C8FF00]/10 bg-[#0E1116] p-5 space-y-3">
          <p className="text-xs uppercase tracking-wide text-[#C8FF00]/40">Select a source video</p>
          {videos.length === 0 ? (
            <p className="text-sm text-[#C8FF00]/40">No videos uploaded yet — add one in the Library tab.</p>
          ) : (
            <div className="space-y-1.5 max-h-80 overflow-y-auto">
              {videos.map((video) => (
                <button
                  key={video.id}
                  onClick={() => { setSelectedVideoId(video.id); setNotice(null); }}
                  className={`w-full text-left rounded-lg px-3 py-2.5 text-sm transition ${
                    selectedVideoId === video.id ? 'bg-[#C8FF00]/10 text-white' : 'text-[#C8FF00]/70 hover:bg-white/5'
                  }`}
                >
                  <p className="font-medium truncate">{video.title}</p>
                  <p className="text-xs text-[#C8FF00]/40">
                    {video.transcriptStatus === 'completed' ? 'Transcribed' : 'Not transcribed'}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-[#C8FF00]/10 bg-[#0E1116] p-5">
          {!selectedVideo ? (
            <div className="flex h-full min-h-[260px] flex-col items-center justify-center text-center text-[#C8FF00]/40">
              <Scissors className="h-10 w-10 mb-3" />
              <p>Select a video to transcribe and find clip-worthy moments.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">{selectedVideo.title}</h3>

              {selectedVideo.transcription ? (
                <div className="rounded-xl border border-[#C8FF00]/10 bg-[#07070A] p-3 max-h-64 overflow-y-auto">
                  <p className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-[#C8FF00]/40 mb-2">
                    <FileText className="h-3 w-3" /> Transcript
                  </p>
                  <p className="text-sm text-white/70 whitespace-pre-wrap">{selectedVideo.transcription}</p>
                </div>
              ) : (
                <>
                  {notice && (
                    <div className="flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-200">
                      <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
                      {notice}
                    </div>
                  )}
                  <button
                    onClick={handleTranscribe}
                    disabled={transcribing}
                    className="flex items-center justify-center gap-2 rounded-xl bg-[#C8FF00] px-4 py-2.5 text-sm font-semibold text-[#07070A] hover:bg-[#C8FF00]/90 disabled:opacity-60 transition"
                  >
                    {transcribing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Scissors className="h-4 w-4" />}
                    {transcribing ? 'Transcribing…' : 'Transcribe & find clips'}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
