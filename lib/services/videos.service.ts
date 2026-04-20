/**
 * OGMJ BRANDS — Videos Service
 * Last Updated: April 19, 2026
 */

import type { APIResponse } from "../types";

// ================================
// VIDEO TYPES
// ================================

export interface Video {
  id: string;
  title: string;
  description?: string;
  sourceUrl?: string;
  sourceType?: string;
  fileUrl?: string;
  thumbnailUrl?: string;
  durationSeconds?: number;
  fileSizeBytes?: number;
  status: 'processing' | 'processed' | 'failed';
  transcription?: string;
  transcriptStatus?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVideoInput {
  businessId: string;
  title: string;
  description?: string;
  sourceUrl?: string;
  sourceType?: string;
  fileUrl?: string;
  thumbnailUrl?: string;
  durationSeconds?: number;
  fileSizeBytes?: number;
}

export interface UpdateVideoInput {
  title?: string;
  description?: string;
  thumbnailUrl?: string;
  metadata?: Record<string, any>;
}

// ================================
// VIDEO CLIP TYPES
// ================================

export interface VideoClip {
  id: string;
  title?: string;
  description?: string;
  startTimeSeconds: number;
  endTimeSeconds: number;
  durationSeconds: number;
  aspectRatio: string;
  fileUrl?: string;
  thumbnailUrl?: string;
  hasCaptions: boolean;
  captionFileUrl?: string;
  highlightedKeywords: string[];
  viralScore: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVideoClipInput {
  title?: string;
  description?: string;
  startTimeSeconds: number;
  endTimeSeconds: number;
  aspectRatio?: string;
  fileUrl?: string;
  thumbnailUrl?: string;
  hasCaptions?: boolean;
  captionFileUrl?: string;
  highlightedKeywords?: string[];
}

// ================================
// VIDEO FUNCTIONS
// ================================

export async function getVideos(
  businessId: string,
  filters?: {
    status?: string;
    limit?: number;
    offset?: number;
  }
): Promise<APIResponse<{ videos: Video[]; total: number }>> {
  try {
    const queryParams = new URLSearchParams({
      businessId,
      ...(filters?.status && { status: filters.status }),
      ...(filters?.limit && { limit: filters.limit.toString() }),
      ...(filters?.offset && { offset: filters.offset.toString() }),
    });

    const response = await fetch(`/api/videos?${queryParams}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: normalizeServiceError(errorData, 'FETCH_VIDEOS_ERROR', 'Failed to fetch videos'),
        timestamp: new Date().toISOString(),
      };
    }

    const data = await response.json();
    return {
      success: true,
      data: data.data,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Videos fetch failed';
    return {
      success: false,
      error: { code: 'FETCH_VIDEOS_ERROR', message },
      timestamp: new Date().toISOString(),
    };
  }
}

export async function getVideo(videoId: string): Promise<APIResponse<Video>> {
  try {
    const response = await fetch(`/api/videos/${videoId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: normalizeServiceError(errorData, 'FETCH_VIDEO_ERROR', 'Failed to fetch video'),
        timestamp: new Date().toISOString(),
      };
    }

    const data = await response.json();
    return {
      success: true,
      data: data.data,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Video fetch failed';
    return {
      success: false,
      error: { code: 'FETCH_VIDEO_ERROR', message },
      timestamp: new Date().toISOString(),
    };
  }
}

export async function createVideo(
  businessId: string,
  input: CreateVideoInput
): Promise<APIResponse<Video>> {
  try {
    const response = await fetch('/api/videos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...input, businessId }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: normalizeServiceError(errorData, 'CREATE_VIDEO_ERROR', 'Failed to create video'),
        timestamp: new Date().toISOString(),
      };
    }

    const data = await response.json();
    return {
      success: true,
      data: data.data,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Video creation failed';
    return {
      success: false,
      error: { code: 'CREATE_VIDEO_ERROR', message },
      timestamp: new Date().toISOString(),
    };
  }
}

export async function updateVideo(
  videoId: string,
  input: UpdateVideoInput
): Promise<APIResponse<Video>> {
  try {
    const response = await fetch(`/api/videos/${videoId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: normalizeServiceError(errorData, 'UPDATE_VIDEO_ERROR', 'Failed to update video'),
        timestamp: new Date().toISOString(),
      };
    }

    const data = await response.json();
    return {
      success: true,
      data: data.data,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Video update failed';
    return {
      success: false,
      error: { code: 'UPDATE_VIDEO_ERROR', message },
      timestamp: new Date().toISOString(),
    };
  }
}

export async function deleteVideo(videoId: string): Promise<APIResponse<{ success: boolean }>> {
  try {
    const response = await fetch(`/api/videos/${videoId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: normalizeServiceError(errorData, 'DELETE_VIDEO_ERROR', 'Failed to delete video'),
        timestamp: new Date().toISOString(),
      };
    }

    return {
      success: true,
      data: { success: true },
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Video deletion failed';
    return {
      success: false,
      error: { code: 'DELETE_VIDEO_ERROR', message },
      timestamp: new Date().toISOString(),
    };
  }
}

// ================================
// VIDEO PROCESSING FUNCTIONS
// ================================

export async function startVideoProcessing(videoId: string): Promise<APIResponse<{ message: string; estimatedDuration: string }>> {
  try {
    const response = await fetch(`/api/videos/${videoId}/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: normalizeServiceError(errorData, 'START_PROCESSING_ERROR', 'Failed to start video processing'),
        timestamp: new Date().toISOString(),
      };
    }

    const data = await response.json();
    return {
      success: true,
      data: data.data,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Video processing start failed';
    return {
      success: false,
      error: { code: 'START_PROCESSING_ERROR', message },
      timestamp: new Date().toISOString(),
    };
  }
}

export async function getVideoProcessingStatus(videoId: string): Promise<APIResponse<{
  videoId: string;
  status: string;
  isProcessing: boolean;
  isProcessed: boolean;
  isFailed: boolean;
}>> {
  try {
    const response = await fetch(`/api/videos/${videoId}/process`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: normalizeServiceError(errorData, 'GET_PROCESSING_STATUS_ERROR', 'Failed to get processing status'),
        timestamp: new Date().toISOString(),
      };
    }

    const data = await response.json();
    return {
      success: true,
      data: data.data,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Processing status fetch failed';
    return {
      success: false,
      error: { code: 'GET_PROCESSING_STATUS_ERROR', message },
      timestamp: new Date().toISOString(),
    };
  }
}

// ================================
// VIDEO CLIP FUNCTIONS
// ================================

export async function getVideoClips(
  videoId: string,
  filters?: {
    limit?: number;
    offset?: number;
  }
): Promise<APIResponse<{ clips: VideoClip[]; total: number }>> {
  try {
    const queryParams = new URLSearchParams({
      ...(filters?.limit && { limit: filters.limit.toString() }),
      ...(filters?.offset && { offset: filters.offset.toString() }),
    });

    const response = await fetch(`/api/videos/${videoId}/clips?${queryParams}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: normalizeServiceError(errorData, 'FETCH_VIDEO_CLIPS_ERROR', 'Failed to fetch video clips'),
        timestamp: new Date().toISOString(),
      };
    }

    const data = await response.json();
    return {
      success: true,
      data: data.data,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Video clips fetch failed';
    return {
      success: false,
      error: { code: 'FETCH_VIDEO_CLIPS_ERROR', message },
      timestamp: new Date().toISOString(),
    };
  }
}

export async function createVideoClip(
  videoId: string,
  input: CreateVideoClipInput
): Promise<APIResponse<VideoClip>> {
  try {
    const response = await fetch(`/api/videos/${videoId}/clips`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: normalizeServiceError(errorData, 'CREATE_VIDEO_CLIP_ERROR', 'Failed to create video clip'),
        timestamp: new Date().toISOString(),
      };
    }

    const data = await response.json();
    return {
      success: true,
      data: data.data,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Video clip creation failed';
    return {
      success: false,
      error: { code: 'CREATE_VIDEO_CLIP_ERROR', message },
      timestamp: new Date().toISOString(),
    };
  }
}

// ================================
// UTILITY FUNCTIONS
// ================================

function normalizeServiceError(
  errorData: any,
  fallbackCode: string,
  fallbackMessage: string
): { code: string; message: string } {
  if (!errorData || typeof errorData !== 'object') {
    return { code: fallbackCode, message: fallbackMessage };
  }

  if (typeof errorData.error === 'string') {
    return { code: fallbackCode, message: errorData.error };
  }

  if (typeof errorData.error === 'object' && errorData.error !== null) {
    return {
      code: errorData.error.code || fallbackCode,
      message: errorData.error.message || fallbackMessage,
    };
  }

  return { code: fallbackCode, message: fallbackMessage };
}

// ================================
// VALIDATION FUNCTIONS
// ================================

export function validateVideoInput(input: CreateVideoInput): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!input.title || input.title.trim().length === 0) {
    errors.push('Title is required');
  }

  if (input.title && input.title.length > 255) {
    errors.push('Title must be less than 255 characters');
  }

  if (input.durationSeconds !== undefined && input.durationSeconds < 0) {
    errors.push('Duration must be positive');
  }

  if (input.fileSizeBytes !== undefined && input.fileSizeBytes < 0) {
    errors.push('File size must be positive');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validateVideoClipInput(input: CreateVideoClipInput): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (input.startTimeSeconds === undefined || input.startTimeSeconds < 0) {
    errors.push('Start time is required and must be non-negative');
  }

  if (input.endTimeSeconds === undefined || input.endTimeSeconds < 0) {
    errors.push('End time is required and must be non-negative');
  }

  if (input.startTimeSeconds !== undefined && input.endTimeSeconds !== undefined && input.startTimeSeconds >= input.endTimeSeconds) {
    errors.push('Start time must be less than end time');
  }

  if (input.title && input.title.length > 255) {
    errors.push('Title must be less than 255 characters');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}