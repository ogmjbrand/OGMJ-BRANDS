/**
 * OGMJ BRANDS — Website image upload (client-only).
 *
 * Mirrors video-upload.ts's shape (validate, sanitize filename, upload to
 * a per-business folder) but via a plain Supabase Storage upload rather
 * than the resumable (TUS) protocol video-upload.ts needs for huge files
 * -- a 10MB image ceiling is comfortably under the ~50MB standard-upload
 * cap that drove video-upload.ts to TUS in the first place.
 *
 * Requires the `website-assets` storage bucket, prepared (NOT applied) in
 * packages/db/supabase/migrations/20261120010000_create_website_assets_storage_bucket.sql
 * -- until an authorized operator applies that migration, every call here
 * will fail with a Supabase "bucket not found" error. That failure is
 * surfaced as a normal thrown Error (see uploadImageFile), not swallowed.
 */
import { createClient } from '@/lib/supabase/client';

export const WEBSITE_ASSETS_BUCKET = 'website-assets';

export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];

export const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB, matches the bucket's file_size_limit

export interface ImageUploadValidationError {
  message: string;
}

export function validateImageFile(file: File): ImageUploadValidationError | null {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return { message: `"${file.name}" isn't a supported image format. Use JPEG, PNG, WebP, GIF or SVG.` };
  }
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    const limitMb = (MAX_IMAGE_SIZE_BYTES / (1024 * 1024)).toFixed(0);
    return { message: `"${file.name}" is too large. Max file size is ${limitMb}MB.` };
  }
  if (file.size === 0) {
    return { message: `"${file.name}" is empty.` };
  }
  return null;
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}

export interface UploadImageFileResult {
  url: string;
  /** The bucket-relative storage path -- kept so deleteUploadedImage can remove the right object later (AssetRef itself stores only `url`, not a path; see storagePathFromPublicUrl). */
  path: string;
}

export async function uploadImageFile(file: File, businessId: string): Promise<UploadImageFileResult> {
  const validationError = validateImageFile(file);
  if (validationError) throw new Error(validationError.message);

  const supabase = createClient();
  const path = `${businessId}/${crypto.randomUUID()}-${sanitizeFilename(file.name)}`;
  const { error } = await supabase.storage.from(WEBSITE_ASSETS_BUCKET).upload(path, file, {
    contentType: file.type,
    cacheControl: '3600',
    upsert: false,
  });
  if (error) {
    throw new Error(
      error.message.toLowerCase().includes('bucket not found')
        ? 'Image upload is not available on this deployment yet (the storage bucket has not been created).'
        : error.message
    );
  }

  const { data } = supabase.storage.from(WEBSITE_ASSETS_BUCKET).getPublicUrl(path);
  return { url: data.publicUrl, path };
}

/** Recovers the bucket-relative storage path from a public URL this module produced -- undefined for any URL not shaped like one (e.g. a hand-entered "add by URL" asset), so callers can skip the storage delete for those instead of guessing. */
export function storagePathFromPublicUrl(url: string): string | undefined {
  const marker = `/object/public/${WEBSITE_ASSETS_BUCKET}/`;
  const index = url.indexOf(marker);
  if (index === -1) return undefined;
  return decodeURIComponent(url.slice(index + marker.length));
}

export async function deleteUploadedImage(path: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.storage.from(WEBSITE_ASSETS_BUCKET).remove([path]);
  if (error) throw new Error(error.message);
}
