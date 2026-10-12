/**
 * OGMJ BRANDS — Video Upload Service (client-only)
 *
 * The Free-tier Supabase project caps a single standard upload request at
 * roughly 50MB — too small for real video files. Supabase's resumable
 * (TUS) protocol chunks the upload instead of sending it as one request,
 * so this is used for every upload regardless of file size rather than
 * branching between two upload paths.
 */

import * as tus from 'tus-js-client';

export const ACCEPTED_VIDEO_TYPES = [
  'video/mp4',
  'video/quicktime',
  'video/webm',
  'video/x-matroska',
  'video/x-msvideo',
  'video/mpeg',
];

export const MAX_VIDEO_SIZE_BYTES = 1024 * 1024 * 1024; // 1GB, matches the bucket's file_size_limit

export interface VideoUploadValidationError {
  message: string;
}

export function validateVideoFile(file: File): VideoUploadValidationError | null {
  if (!ACCEPTED_VIDEO_TYPES.includes(file.type)) {
    return { message: `"${file.name}" isn't a supported video format. Use MP4, MOV, WebM, MKV, AVI or MPEG.` };
  }
  if (file.size > MAX_VIDEO_SIZE_BYTES) {
    const limitGb = (MAX_VIDEO_SIZE_BYTES / (1024 * 1024 * 1024)).toFixed(0);
    return { message: `"${file.name}" is too large. Max file size is ${limitGb}GB.` };
  }
  if (file.size === 0) {
    return { message: `"${file.name}" is empty.` };
  }
  return null;
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}

/** Best-effort — resolves null rather than rejecting if the browser can't read it. */
export function getVideoDurationSeconds(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    try {
      const video = document.createElement('video');
      video.preload = 'metadata';
      const url = URL.createObjectURL(file);
      video.onloadedmetadata = () => {
        URL.revokeObjectURL(url);
        resolve(Number.isFinite(video.duration) ? Math.round(video.duration) : null);
      };
      video.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(null);
      };
      video.src = url;
    } catch {
      resolve(null);
    }
  });
}

export interface UploadVideoFileOptions {
  file: File;
  businessId: string;
  accessToken: string;
  onProgress?: (percent: number) => void;
}

export interface UploadVideoFileResult {
  path: string;
}

export function uploadVideoFile({
  file,
  businessId,
  accessToken,
  onProgress,
}: UploadVideoFileOptions): Promise<UploadVideoFileResult> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    return Promise.reject(new Error('Supabase is not configured on this deployment'));
  }

  const objectName = `${businessId}/${crypto.randomUUID()}-${sanitizeFilename(file.name)}`;

  return new Promise((resolve, reject) => {
    const upload = new tus.Upload(file, {
      endpoint: `${supabaseUrl.replace(/\/$/, '')}/storage/v1/upload/resumable`,
      retryDelays: [0, 3000, 5000, 10000, 20000],
      headers: {
        authorization: `Bearer ${accessToken}`,
        'x-upsert': 'false',
      },
      // Supabase's resumable endpoint requires chunks to be a multiple of
      // 6MB, except the final chunk.
      chunkSize: 6 * 1024 * 1024,
      metadata: {
        bucketName: 'videos',
        objectName,
        contentType: file.type,
        cacheControl: '3600',
      },
      onError: (error) => reject(error),
      onProgress: (bytesSent, bytesTotal) => {
        if (onProgress) onProgress(Math.round((bytesSent / bytesTotal) * 100));
      },
      onSuccess: () => resolve({ path: objectName }),
    });

    upload.findPreviousUploads().then((previousUploads) => {
      if (previousUploads.length > 0) {
        upload.resumeFromPreviousUpload(previousUploads[0]);
      }
      upload.start();
    });
  });
}
