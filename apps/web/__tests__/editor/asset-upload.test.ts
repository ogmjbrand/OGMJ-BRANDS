import { describe, expect, it, vi, beforeEach } from 'vitest';

let uploadResult: { error: unknown } = { error: null };
let removeResult: { error: unknown } = { error: null };
let uploadCalls: Array<{ path: string; file: unknown; options: unknown }> = [];
let removeCalls: string[][] = [];

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    storage: {
      from: (bucket: string) => ({
        upload: async (path: string, file: unknown, options: unknown) => {
          uploadCalls.push({ path, file, options });
          return uploadResult;
        },
        getPublicUrl: (path: string) => ({ data: { publicUrl: `https://example.supabase.co/storage/v1/object/public/${bucket}/${path}` } }),
        remove: async (paths: string[]) => {
          removeCalls.push(paths);
          return removeResult;
        },
      }),
    },
  }),
}));

import {
  ACCEPTED_IMAGE_TYPES,
  MAX_IMAGE_SIZE_BYTES,
  WEBSITE_ASSETS_BUCKET,
  deleteUploadedImage,
  storagePathFromPublicUrl,
  uploadImageFile,
  validateImageFile,
} from '@/lib/services/asset-upload';

function makeFile(name: string, type: string, size: number): File {
  const blob = new Blob([new Uint8Array(size)], { type });
  return new File([blob], name, { type });
}

describe('validateImageFile', () => {
  it('accepts every type in ACCEPTED_IMAGE_TYPES', () => {
    for (const type of ACCEPTED_IMAGE_TYPES) {
      expect(validateImageFile(makeFile('a.img', type, 100))).toBeNull();
    }
  });

  it('rejects an unsupported mime type', () => {
    const result = validateImageFile(makeFile('a.exe', 'application/octet-stream', 100));
    expect(result?.message).toMatch(/isn't a supported image format/);
  });

  it('rejects a file over MAX_IMAGE_SIZE_BYTES', () => {
    const result = validateImageFile(makeFile('big.png', 'image/png', MAX_IMAGE_SIZE_BYTES + 1));
    expect(result?.message).toMatch(/too large/);
  });

  it('rejects an empty file', () => {
    const result = validateImageFile(makeFile('empty.png', 'image/png', 0));
    expect(result?.message).toMatch(/empty/);
  });
});

describe('storagePathFromPublicUrl', () => {
  it('recovers the bucket-relative path from a URL this module produced', () => {
    const url = `https://example.supabase.co/storage/v1/object/public/${WEBSITE_ASSETS_BUCKET}/biz-1/abc-photo.jpg`;
    expect(storagePathFromPublicUrl(url)).toBe('biz-1/abc-photo.jpg');
  });

  it('returns undefined for a hand-entered "add by URL" asset that never went through this bucket', () => {
    expect(storagePathFromPublicUrl('https://cdn.example.com/photo.jpg')).toBeUndefined();
  });

  it('url-decodes a path with encoded characters', () => {
    const url = `https://example.supabase.co/storage/v1/object/public/${WEBSITE_ASSETS_BUCKET}/biz-1/my%20photo.jpg`;
    expect(storagePathFromPublicUrl(url)).toBe('biz-1/my photo.jpg');
  });
});

describe('uploadImageFile', () => {
  beforeEach(() => {
    uploadResult = { error: null };
    uploadCalls = [];
  });

  it('refuses to upload an invalid file WITHOUT ever calling storage', async () => {
    await expect(uploadImageFile(makeFile('a.exe', 'application/octet-stream', 100), 'biz-1')).rejects.toThrow('supported image format');
    expect(uploadCalls).toHaveLength(0);
  });

  it('uploads to a {businessId}/{file} path and returns the public URL', async () => {
    const { url, path } = await uploadImageFile(makeFile('photo.jpg', 'image/jpeg', 100), 'biz-1');
    expect(uploadCalls).toHaveLength(1);
    expect(uploadCalls[0].path.startsWith('biz-1/')).toBe(true);
    expect(path.startsWith('biz-1/')).toBe(true);
    expect(url).toContain(`/public/${WEBSITE_ASSETS_BUCKET}/`);
  });

  it('surfaces a clear message when the bucket has not been created yet (migration not applied)', async () => {
    uploadResult = { error: { message: 'Bucket not found' } };
    await expect(uploadImageFile(makeFile('photo.jpg', 'image/jpeg', 100), 'biz-1')).rejects.toThrow('not available on this deployment');
  });

  it('surfaces any other storage error message as-is', async () => {
    uploadResult = { error: { message: 'Payload too large' } };
    await expect(uploadImageFile(makeFile('photo.jpg', 'image/jpeg', 100), 'biz-1')).rejects.toThrow('Payload too large');
  });
});

describe('deleteUploadedImage', () => {
  beforeEach(() => {
    removeResult = { error: null };
    removeCalls = [];
  });

  it('removes the given path', async () => {
    await deleteUploadedImage('biz-1/old.jpg');
    expect(removeCalls).toEqual([['biz-1/old.jpg']]);
  });

  it('throws the storage error message on failure', async () => {
    removeResult = { error: { message: 'Not found' } };
    await expect(deleteUploadedImage('biz-1/missing.jpg')).rejects.toThrow('Not found');
  });
});
