'use client';

import React, { useEffect, useState } from 'react';
import { Sparkles, Loader2, AlertCircle, Info, PlayCircle, RefreshCcw, Trash2, Hash, Mic } from 'lucide-react';
import {
  generateVideoScript,
  listAIVideoProjects,
  checkRenderStatus,
  updateAIVideoProject,
  deleteAIVideoProject,
  renderAIVideoProject,
  generateVoiceovers,
  type AIVideoProject,
  type AIVideoWorkspace,
  type AIVideoScene,
} from '@/lib/services/ai-video.service';

const VIDEO_TYPES = ['Product ad', 'Explainer', 'Brand story', 'Social ad', 'Launch video', 'Educational', 'Other'];
const STYLES = ['Cinematic', 'Minimal', 'Energetic', 'Documentary', 'Playful', 'Premium/luxury'];
const ASPECT_RATIOS: { value: '16:9' | '9:16' | '1:1'; label: string }[] = [
  { value: '16:9', label: '16:9 — YouTube/landscape' },
  { value: '9:16', label: '9:16 — TikTok/Reels/Shorts' },
  { value: '1:1', label: '1:1 — Square' },
];

interface ScriptWorkspaceProps {
  businessId: string;
  workspace: AIVideoWorkspace;
  heading: string;
  description: string;
  promptLabel: string;
  promptPlaceholder: string;
}

export default function ScriptWorkspace({
  businessId,
  workspace,
  heading,
  description,
  promptLabel,
  promptPlaceholder,
}: ScriptWorkspaceProps) {
  const [projects, setProjects] = useState<AIVideoProject[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [selectedProject, setSelectedProject] = useState<AIVideoProject | null>(null);

  const [prompt, setPrompt] = useState('');
  const [videoType, setVideoType] = useState(VIDEO_TYPES[0]);
  const [style, setStyle] = useState(STYLES[0]);
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '1:1'>('16:9');
  const [targetDuration, setTargetDuration] = useState('30');

  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  const [savingEdits, setSavingEdits] = useState(false);
  const [rendering, setRendering] = useState(false);
  const [renderNotice, setRenderNotice] = useState<string | null>(null);
  const [generatingVoiceovers, setGeneratingVoiceovers] = useState(false);
  const [voiceoverNotice, setVoiceoverNotice] = useState<string | null>(null);

  async function loadProjects() {
    setLoadingProjects(true);
    const result = await listAIVideoProjects(businessId, workspace);
    if (result.success && result.data) {
      setProjects(result.data);
    }
    setLoadingProjects(false);
  }

  useEffect(() => {
    if (businessId) loadProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId, workspace]);

  // Rendering happens async via a provider webhook, not in the request
  // that kicked it off — poll while a project is rendering, capped so a
  // project that never completes doesn't poll forever. Each tick also
  // actively reconciles against fal.ai's own status API (not just the
  // cached DB row), so a dropped webhook delivery still gets picked up.
  useEffect(() => {
    if (!selectedProject || selectedProject.status !== 'rendering') return;

    let attempts = 0;
    const interval = setInterval(async () => {
      attempts += 1;
      const result = await checkRenderStatus(selectedProject.id);
      if (result.success && result.data) {
        setSelectedProject(result.data);
        setProjects((prev) => prev.map((p) => (p.id === result.data!.id ? result.data! : p)));
        if (result.data.status !== 'rendering') {
          clearInterval(interval);
        }
      }
      if (attempts >= 60) clearInterval(interval); // ~5 minutes at 5s intervals
    }, 5000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProject?.id, selectedProject?.status]);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!prompt.trim()) {
      setGenerateError('Describe the video first.');
      return;
    }
    setGenerating(true);
    setGenerateError(null);
    setRenderNotice(null);

    const result = await generateVideoScript({
      businessId,
      workspace,
      prompt: prompt.trim(),
      videoType,
      style,
      aspectRatio,
      targetDurationSeconds: targetDuration ? parseInt(targetDuration, 10) : undefined,
    });

    if (!result.success || !result.data) {
      setGenerateError(result.error?.message || 'Failed to generate script');
      setGenerating(false);
      return;
    }

    setProjects((prev) => [result.data!, ...prev]);
    setSelectedProject(result.data);
    setGenerating(false);
  }

  function updateScene(index: number, patch: Partial<AIVideoScene>) {
    if (!selectedProject?.script) return;
    const scenes = selectedProject.script.scenes.map((s, i) => (i === index ? { ...s, ...patch } : s));
    setSelectedProject({ ...selectedProject, script: { ...selectedProject.script, scenes } });
  }

  async function handleSaveEdits() {
    if (!selectedProject?.script) return;
    setSavingEdits(true);
    const result = await updateAIVideoProject(selectedProject.id, { script: selectedProject.script });
    if (result.success && result.data) {
      setProjects((prev) => prev.map((p) => (p.id === result.data!.id ? result.data! : p)));
    }
    setSavingEdits(false);
  }

  async function handleRender() {
    if (!selectedProject?.script) return;
    const sceneCount = selectedProject.script.scenes.length;
    const confirmed = confirm(
      `This will submit ${sceneCount} scene${sceneCount === 1 ? '' : 's'} for AI video generation — each scene is a separate paid render. Continue?`
    );
    if (!confirmed) return;

    setRendering(true);
    setRenderNotice(null);
    const result = await renderAIVideoProject(selectedProject.id);
    if (!result.success) {
      setRenderNotice(result.error?.message || 'Rendering is not available yet.');
    } else if (result.data) {
      // 'rendering' here means jobs were submitted, not completed — the
      // polling effect above picks up the real result as the provider's
      // webhook delivers each scene.
      setSelectedProject(result.data);
      setProjects((prev) => prev.map((p) => (p.id === result.data!.id ? result.data! : p)));
    }
    setRendering(false);
  }

  async function handleGenerateVoiceovers() {
    if (!selectedProject?.script) return;
    const sceneCount = selectedProject.script.scenes.length;
    const confirmed = confirm(
      `This will generate narration audio for ${sceneCount} scene${sceneCount === 1 ? '' : 's'} via ElevenLabs — a paid text-to-speech call per scene. Continue?`
    );
    if (!confirmed) return;

    setGeneratingVoiceovers(true);
    setVoiceoverNotice(null);
    const result = await generateVoiceovers(selectedProject.id);
    if (!result.success) {
      setVoiceoverNotice(result.error?.message || 'Voiceover generation is not available yet.');
    } else if (result.data) {
      setSelectedProject(result.data);
      setProjects((prev) => prev.map((p) => (p.id === result.data!.id ? result.data! : p)));
    }
    setGeneratingVoiceovers(false);
  }

  async function handleDeleteProject(projectId: string) {
    if (!confirm('Delete this project?')) return;
    const result = await deleteAIVideoProject(projectId);
    if (result.success) {
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
      if (selectedProject?.id === projectId) setSelectedProject(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white">{heading}</h2>
        <p className="text-sm text-[#C8FF00]/60 mt-1">{description}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        {/* Generation form */}
        <form onSubmit={handleGenerate} className="space-y-4 rounded-2xl border border-[#C8FF00]/10 bg-[#0E1116] p-5">
          {generateError && (
            <div className="flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              {generateError}
            </div>
          )}

          <label className="block space-y-1.5 text-sm text-[#C8FF00]/70">
            {promptLabel}
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={5}
              placeholder={promptPlaceholder}
              className="w-full rounded-xl border border-[#C8FF00]/15 bg-[#07070A] px-3 py-2.5 text-sm text-white outline-none focus:border-[#C8FF00]/50"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1.5 text-sm text-[#C8FF00]/70">
              Video type
              <select
                value={videoType}
                onChange={(e) => setVideoType(e.target.value)}
                className="w-full rounded-xl border border-[#C8FF00]/15 bg-[#07070A] px-3 py-2.5 text-sm text-white outline-none focus:border-[#C8FF00]/50"
              >
                {VIDEO_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </label>
            <label className="block space-y-1.5 text-sm text-[#C8FF00]/70">
              Style
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                className="w-full rounded-xl border border-[#C8FF00]/15 bg-[#07070A] px-3 py-2.5 text-sm text-white outline-none focus:border-[#C8FF00]/50"
              >
                {STYLES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1.5 text-sm text-[#C8FF00]/70">
              Aspect ratio
              <select
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value as '16:9' | '9:16' | '1:1')}
                className="w-full rounded-xl border border-[#C8FF00]/15 bg-[#07070A] px-3 py-2.5 text-sm text-white outline-none focus:border-[#C8FF00]/50"
              >
                {ASPECT_RATIOS.map((a) => (
                  <option key={a.value} value={a.value}>{a.label}</option>
                ))}
              </select>
            </label>
            <label className="block space-y-1.5 text-sm text-[#C8FF00]/70">
              Target duration (sec)
              <input
                type="number"
                min={5}
                value={targetDuration}
                onChange={(e) => setTargetDuration(e.target.value)}
                className="w-full rounded-xl border border-[#C8FF00]/15 bg-[#07070A] px-3 py-2.5 text-sm text-white outline-none focus:border-[#C8FF00]/50"
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={generating}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#C8FF00] py-3 text-sm font-semibold text-[#07070A] hover:bg-[#C8FF00]/90 disabled:opacity-60 transition"
          >
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {generating ? 'Generating script…' : 'Generate script & storyboard'}
          </button>

          {/* Past projects */}
          <div className="pt-2 border-t border-[#C8FF00]/10">
            <p className="text-xs uppercase tracking-wide text-[#C8FF00]/40 mt-3 mb-2">Previous projects</p>
            {loadingProjects ? (
              <p className="text-sm text-[#C8FF00]/40">Loading…</p>
            ) : projects.length === 0 ? (
              <p className="text-sm text-[#C8FF00]/40">No projects yet.</p>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {projects.map((p) => (
                  <div
                    key={p.id}
                    className={`flex items-center justify-between gap-2 rounded-lg px-3 py-2 cursor-pointer transition ${
                      selectedProject?.id === p.id ? 'bg-[#C8FF00]/10 text-white' : 'text-[#C8FF00]/70 hover:bg-white/5'
                    }`}
                    onClick={() => { setSelectedProject(p); setRenderNotice(null); }}
                  >
                    <span className="truncate text-sm">{p.title}</span>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleDeleteProject(p.id); }}
                      className="text-[#C8FF00]/30 hover:text-red-400 flex-shrink-0"
                      aria-label="Delete project"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </form>

        {/* Review panel */}
        <div className="rounded-2xl border border-[#C8FF00]/10 bg-[#0E1116] p-5">
          {!selectedProject || !selectedProject.script ? (
            <div className="flex h-full min-h-[300px] flex-col items-center justify-center text-center text-[#C8FF00]/40">
              <Sparkles className="h-10 w-10 mb-3" />
              <p>Generate a script to review scenes, captions and thumbnails here.</p>
            </div>
          ) : (
            <div className="space-y-5">
              <div>
                <h3 className="text-lg font-semibold text-white">{selectedProject.script.title}</h3>
                <p className="text-sm text-[#C8FF00]/60 italic mt-1">"{selectedProject.script.hook}"</p>
              </div>

              <div className="space-y-3">
                {selectedProject.script.scenes.map((scene, idx) => (
                  <div key={idx} className="rounded-xl border border-[#C8FF00]/10 bg-[#07070A] p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#C8FF00]">Scene {scene.sceneNumber}</span>
                      <div className="flex items-center gap-2">
                        {scene.renderStatus === 'pending' && (
                          <span className="flex items-center gap-1 text-xs text-amber-300">
                            <Loader2 className="h-3 w-3 animate-spin" /> Rendering
                          </span>
                        )}
                        {scene.renderStatus === 'completed' && scene.videoUrl && (
                          <a href={scene.videoUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-emerald-300 underline">
                            <PlayCircle className="h-3 w-3" /> View clip
                          </a>
                        )}
                        {scene.renderStatus === 'failed' && (
                          <span className="text-xs text-red-400" title={scene.renderError}>Failed</span>
                        )}
                        <span className="text-xs text-[#C8FF00]/40">{scene.durationSeconds}s</span>
                      </div>
                    </div>
                    <p className="text-sm text-white/80">{scene.description}</p>
                    <label className="block text-xs text-[#C8FF00]/50">
                      Narration
                      <textarea
                        value={scene.narration}
                        onChange={(e) => updateScene(idx, { narration: e.target.value })}
                        rows={2}
                        className="mt-1 w-full rounded-lg border border-[#C8FF00]/10 bg-[#0E1116] px-2 py-1.5 text-sm text-white outline-none focus:border-[#C8FF00]/40"
                      />
                    </label>
                    {scene.voiceoverStatus === 'completed' && scene.voiceoverUrl && (
                      <audio controls src={scene.voiceoverUrl} className="w-full h-8" />
                    )}
                    {scene.voiceoverStatus === 'failed' && (
                      <p className="text-xs text-red-400" title={scene.voiceoverError}>Voiceover failed</p>
                    )}
                    <label className="block text-xs text-[#C8FF00]/50">
                      Visual prompt
                      <textarea
                        value={scene.visualPrompt}
                        onChange={(e) => updateScene(idx, { visualPrompt: e.target.value })}
                        rows={2}
                        className="mt-1 w-full rounded-lg border border-[#C8FF00]/10 bg-[#0E1116] px-2 py-1.5 text-sm text-white outline-none focus:border-[#C8FF00]/40"
                      />
                    </label>
                  </div>
                ))}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-[#C8FF00]/10 bg-[#07070A] p-3">
                  <p className="text-xs uppercase tracking-wide text-[#C8FF00]/40 mb-1.5">Thumbnail concepts</p>
                  <ul className="space-y-1 text-sm text-white/70">
                    {selectedProject.script.thumbnailConcepts.map((t, i) => <li key={i}>• {t}</li>)}
                  </ul>
                </div>
                <div className="rounded-xl border border-[#C8FF00]/10 bg-[#07070A] p-3">
                  <p className="text-xs uppercase tracking-wide text-[#C8FF00]/40 mb-1.5 flex items-center gap-1">
                    <Hash className="h-3 w-3" /> Social caption
                  </p>
                  <p className="text-sm text-white/70">{selectedProject.script.socialCaption}</p>
                  <p className="text-xs text-[#C8FF00]/50 mt-1.5">{selectedProject.script.hashtags.join(' ')}</p>
                </div>
              </div>

              {renderNotice && (
                <div className="flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-200">
                  <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  {renderNotice}
                </div>
              )}

              {voiceoverNotice && (
                <div className="flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-200">
                  <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  {voiceoverNotice}
                </div>
              )}

              {selectedProject.status === 'rendering' && (
                <div className="flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-200">
                  <Loader2 className="h-4 w-4 flex-shrink-0 animate-spin" />
                  Rendering in the background — this page checks for updates automatically every few seconds.
                </div>
              )}

              {selectedProject.status === 'completed' && selectedProject.output_video_url && (
                <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-200">
                  <PlayCircle className="h-4 w-4 flex-shrink-0" />
                  Video ready: <a href={selectedProject.output_video_url} target="_blank" rel="noreferrer" className="underline">view output</a>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleSaveEdits}
                  disabled={savingEdits || selectedProject.status === 'rendering'}
                  className="flex-1 rounded-xl border border-[#C8FF00]/20 py-2.5 text-sm font-medium text-[#C8FF00] hover:bg-[#C8FF00]/10 disabled:opacity-60 transition"
                >
                  {savingEdits ? 'Saving…' : 'Save edits'}
                </button>
                <button
                  onClick={handleGenerateVoiceovers}
                  disabled={generatingVoiceovers || selectedProject.status === 'rendering'}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-[#C8FF00]/20 py-2.5 text-sm font-medium text-[#C8FF00] hover:bg-[#C8FF00]/10 disabled:opacity-60 transition"
                >
                  {generatingVoiceovers ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mic className="h-4 w-4" />}
                  {generatingVoiceovers ? 'Generating…' : 'Generate voiceovers'}
                </button>
                <button
                  onClick={handleRender}
                  disabled={rendering || selectedProject.status === 'rendering'}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#C8FF00] py-2.5 text-sm font-semibold text-[#07070A] hover:bg-[#C8FF00]/90 disabled:opacity-60 transition"
                >
                  {rendering || selectedProject.status === 'rendering' ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
                  {rendering ? 'Submitting…' : selectedProject.status === 'rendering' ? 'Rendering…' : 'Generate video'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
