/**
 * OGMJ BRANDS — AI Video Projects Service
 */

import type { APIResponse } from '../types';

export type AIVideoWorkspace = 'generator' | 'marketing' | 'script_to_video';
export type AIVideoStatus = 'draft' | 'script_ready' | 'rendering' | 'completed' | 'failed';

export interface AIVideoScene {
  sceneNumber: number;
  description: string;
  visualPrompt: string;
  narration: string;
  durationSeconds: number;
  onScreenText?: string | null;
}

export interface AIVideoScript {
  title: string;
  hook: string;
  scenes: AIVideoScene[];
  captions: string[];
  thumbnailConcepts: string[];
  socialCaption: string;
  hashtags: string[];
}

export interface AIVideoProject {
  id: string;
  business_id: string;
  created_by: string;
  workspace: AIVideoWorkspace;
  title: string;
  inputs: Record<string, unknown>;
  video_type: string | null;
  style: string | null;
  aspect_ratio: '16:9' | '9:16' | '1:1';
  target_duration_seconds: number | null;
  script: AIVideoScript | null;
  status: AIVideoStatus;
  render_provider: string | null;
  render_error: string | null;
  output_video_url: string | null;
  created_at: string;
  updated_at: string;
}

function normalizeError(errorData: any, fallback: string): { code: string; message: string } {
  return {
    code: 'AI_VIDEO_ERROR',
    message: errorData?.error || fallback,
  };
}

export async function listAIVideoProjects(
  businessId: string,
  workspace?: AIVideoWorkspace
): Promise<APIResponse<AIVideoProject[]>> {
  try {
    const params = new URLSearchParams({ businessId, ...(workspace && { workspace }) });
    const response = await fetch(`/api/videos/ai/projects?${params}`);
    const body = await response.json();
    if (!response.ok) {
      return { success: false, error: normalizeError(body, 'Failed to load projects'), timestamp: new Date().toISOString() };
    }
    return { success: true, data: body.data, timestamp: new Date().toISOString() };
  } catch (error) {
    return {
      success: false,
      error: { code: 'AI_VIDEO_ERROR', message: error instanceof Error ? error.message : 'Failed to load projects' },
      timestamp: new Date().toISOString(),
    };
  }
}

export async function generateVideoScript(input: {
  businessId: string;
  workspace: AIVideoWorkspace;
  title?: string;
  prompt: string;
  videoType?: string;
  style?: string;
  aspectRatio?: '16:9' | '9:16' | '1:1';
  targetDurationSeconds?: number;
}): Promise<APIResponse<AIVideoProject>> {
  try {
    const response = await fetch('/api/videos/ai/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    const body = await response.json();
    if (!response.ok) {
      return { success: false, error: normalizeError(body, 'Failed to generate script'), timestamp: new Date().toISOString() };
    }
    return { success: true, data: body.data, timestamp: new Date().toISOString() };
  } catch (error) {
    return {
      success: false,
      error: { code: 'AI_VIDEO_ERROR', message: error instanceof Error ? error.message : 'Failed to generate script' },
      timestamp: new Date().toISOString(),
    };
  }
}

export async function updateAIVideoProject(
  projectId: string,
  input: { title?: string; script?: AIVideoScript }
): Promise<APIResponse<AIVideoProject>> {
  try {
    const response = await fetch(`/api/videos/ai/projects/${projectId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    const body = await response.json();
    if (!response.ok) {
      return { success: false, error: normalizeError(body, 'Failed to update project'), timestamp: new Date().toISOString() };
    }
    return { success: true, data: body.data, timestamp: new Date().toISOString() };
  } catch (error) {
    return {
      success: false,
      error: { code: 'AI_VIDEO_ERROR', message: error instanceof Error ? error.message : 'Failed to update project' },
      timestamp: new Date().toISOString(),
    };
  }
}

export async function deleteAIVideoProject(projectId: string): Promise<APIResponse<null>> {
  try {
    const response = await fetch(`/api/videos/ai/projects/${projectId}`, { method: 'DELETE' });
    const body = await response.json();
    if (!response.ok) {
      return { success: false, error: normalizeError(body, 'Failed to delete project'), timestamp: new Date().toISOString() };
    }
    return { success: true, data: null, timestamp: new Date().toISOString() };
  } catch (error) {
    return {
      success: false,
      error: { code: 'AI_VIDEO_ERROR', message: error instanceof Error ? error.message : 'Failed to delete project' },
      timestamp: new Date().toISOString(),
    };
  }
}

export async function renderAIVideoProject(projectId: string): Promise<APIResponse<AIVideoProject>> {
  try {
    const response = await fetch(`/api/videos/ai/projects/${projectId}/render`, { method: 'POST' });
    const body = await response.json();
    if (!response.ok) {
      return {
        success: false,
        error: { code: 'PROVIDER_NOT_CONFIGURED', message: body?.hint || body?.error || 'Render failed' },
        timestamp: new Date().toISOString(),
      };
    }
    return { success: true, data: body.data, timestamp: new Date().toISOString() };
  } catch (error) {
    return {
      success: false,
      error: { code: 'AI_VIDEO_ERROR', message: error instanceof Error ? error.message : 'Render failed' },
      timestamp: new Date().toISOString(),
    };
  }
}

export async function transcribeVideoAsset(videoId: string): Promise<APIResponse<{ transcript_status: string }>> {
  try {
    const response = await fetch(`/api/videos/${videoId}/transcribe`, { method: 'POST' });
    const body = await response.json();
    if (!response.ok) {
      return {
        success: false,
        error: { code: 'PROVIDER_NOT_CONFIGURED', message: body?.hint || body?.error || 'Transcription failed' },
        timestamp: new Date().toISOString(),
      };
    }
    return { success: true, data: body.data, timestamp: new Date().toISOString() };
  } catch (error) {
    return {
      success: false,
      error: { code: 'AI_VIDEO_ERROR', message: error instanceof Error ? error.message : 'Transcription failed' },
      timestamp: new Date().toISOString(),
    };
  }
}
