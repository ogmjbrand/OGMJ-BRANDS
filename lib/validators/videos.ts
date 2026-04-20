/**
 * OGMJ BRANDS — Videos Validators
 * Last Updated: April 19, 2026
 */

import type { CreateVideoInput, UpdateVideoInput, CreateVideoClipInput } from '../services/videos.service';

// ================================
// VIDEO VALIDATION
// ================================

export function validateCreateVideoInput(input: CreateVideoInput): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Business ID validation
  if (!input.businessId || typeof input.businessId !== 'string') {
    errors.push('Business ID is required and must be a string');
  } else if (!isValidUUID(input.businessId)) {
    errors.push('Business ID must be a valid UUID');
  }

  // Title validation
  if (!input.title || typeof input.title !== 'string') {
    errors.push('Video title is required and must be a string');
  } else if (input.title.trim().length === 0) {
    errors.push('Video title cannot be empty');
  } else if (input.title.length > 255) {
    errors.push('Video title must be less than 255 characters');
  }

  // Description validation
  if (input.description !== undefined) {
    if (typeof input.description !== 'string') {
      errors.push('Description must be a string');
    } else if (input.description.length > 2000) {
      errors.push('Description must be less than 2000 characters');
    }
  }

  // Source URL validation
  if (input.sourceUrl !== undefined) {
    if (typeof input.sourceUrl !== 'string') {
      errors.push('Source URL must be a string');
    } else if (input.sourceUrl.trim().length === 0) {
      errors.push('Source URL cannot be empty');
    } else if (!isValidUrl(input.sourceUrl)) {
      errors.push('Invalid source URL format');
    }
  }

  // Source type validation
  if (input.sourceType !== undefined) {
    if (typeof input.sourceType !== 'string') {
      errors.push('Source type must be a string');
    } else if (!['upload', 'youtube', 'vimeo', 'url'].includes(input.sourceType)) {
      errors.push('Source type must be one of: upload, youtube, vimeo, url');
    }
  }

  // File URL validation
  if (input.fileUrl !== undefined) {
    if (typeof input.fileUrl !== 'string') {
      errors.push('File URL must be a string');
    } else if (input.fileUrl.trim().length === 0) {
      errors.push('File URL cannot be empty');
    } else if (!isValidUrl(input.fileUrl)) {
      errors.push('Invalid file URL format');
    }
  }

  // Thumbnail URL validation
  if (input.thumbnailUrl !== undefined) {
    if (typeof input.thumbnailUrl !== 'string') {
      errors.push('Thumbnail URL must be a string');
    } else if (input.thumbnailUrl.trim().length === 0) {
      errors.push('Thumbnail URL cannot be empty');
    } else if (!isValidUrl(input.thumbnailUrl)) {
      errors.push('Invalid thumbnail URL format');
    }
  }

  // Duration validation
  if (input.durationSeconds !== undefined) {
    if (typeof input.durationSeconds !== 'number') {
      errors.push('Duration must be a number');
    } else if (input.durationSeconds < 0) {
      errors.push('Duration cannot be negative');
    } else if (input.durationSeconds > 43200) { // 12 hours max
      errors.push('Duration cannot exceed 12 hours');
    }
  }

  // File size validation
  if (input.fileSizeBytes !== undefined) {
    if (typeof input.fileSizeBytes !== 'number') {
      errors.push('File size must be a number');
    } else if (input.fileSizeBytes < 0) {
      errors.push('File size cannot be negative');
    } else if (input.fileSizeBytes > 10737418240) { // 10GB max
      errors.push('File size cannot exceed 10GB');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validateUpdateVideoInput(input: UpdateVideoInput): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Title validation
  if (input.title !== undefined) {
    if (typeof input.title !== 'string') {
      errors.push('Video title must be a string');
    } else if (input.title.trim().length === 0) {
      errors.push('Video title cannot be empty');
    } else if (input.title.length > 255) {
      errors.push('Video title must be less than 255 characters');
    }
  }

  // Description validation
  if (input.description !== undefined) {
    if (typeof input.description !== 'string') {
      errors.push('Description must be a string');
    } else if (input.description.length > 2000) {
      errors.push('Description must be less than 2000 characters');
    }
  }

  // Thumbnail URL validation
  if (input.thumbnailUrl !== undefined) {
    if (typeof input.thumbnailUrl !== 'string') {
      errors.push('Thumbnail URL must be a string');
    } else if (input.thumbnailUrl.trim().length === 0) {
      errors.push('Thumbnail URL cannot be empty');
    } else if (!isValidUrl(input.thumbnailUrl)) {
      errors.push('Invalid thumbnail URL format');
    }
  }

  // Metadata validation
  if (input.metadata !== undefined) {
    if (typeof input.metadata !== 'object' || input.metadata === null) {
      errors.push('Metadata must be an object');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// ================================
// VIDEO CLIP VALIDATION
// ================================

export function validateCreateVideoClipInput(input: CreateVideoClipInput): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Start time validation
  if (input.startTimeSeconds === undefined || typeof input.startTimeSeconds !== 'number') {
    errors.push('Start time is required and must be a number');
  } else if (input.startTimeSeconds < 0) {
    errors.push('Start time cannot be negative');
  }

  // End time validation
  if (input.endTimeSeconds === undefined || typeof input.endTimeSeconds !== 'number') {
    errors.push('End time is required and must be a number');
  } else if (input.endTimeSeconds < 0) {
    errors.push('End time cannot be negative');
  }

  // Time range validation
  if (input.startTimeSeconds !== undefined && input.endTimeSeconds !== undefined) {
    if (input.startTimeSeconds >= input.endTimeSeconds) {
      errors.push('Start time must be less than end time');
    }
    if (input.endTimeSeconds - input.startTimeSeconds > 600) { // 10 minutes max
      errors.push('Clip duration cannot exceed 10 minutes');
    }
  }

  // Title validation
  if (input.title !== undefined) {
    if (typeof input.title !== 'string') {
      errors.push('Title must be a string');
    } else if (input.title.trim().length === 0) {
      errors.push('Title cannot be empty');
    } else if (input.title.length > 255) {
      errors.push('Title must be less than 255 characters');
    }
  }

  // Description validation
  if (input.description !== undefined) {
    if (typeof input.description !== 'string') {
      errors.push('Description must be a string');
    } else if (input.description.length > 1000) {
      errors.push('Description must be less than 1000 characters');
    }
  }

  // Aspect ratio validation
  if (input.aspectRatio !== undefined) {
    if (typeof input.aspectRatio !== 'string') {
      errors.push('Aspect ratio must be a string');
    } else if (!['16:9', '4:3', '1:1', '9:16'].includes(input.aspectRatio)) {
      errors.push('Aspect ratio must be one of: 16:9, 4:3, 1:1, 9:16');
    }
  }

  // File URL validation
  if (input.fileUrl !== undefined) {
    if (typeof input.fileUrl !== 'string') {
      errors.push('File URL must be a string');
    } else if (input.fileUrl.trim().length === 0) {
      errors.push('File URL cannot be empty');
    } else if (!isValidUrl(input.fileUrl)) {
      errors.push('Invalid file URL format');
    }
  }

  // Thumbnail URL validation
  if (input.thumbnailUrl !== undefined) {
    if (typeof input.thumbnailUrl !== 'string') {
      errors.push('Thumbnail URL must be a string');
    } else if (input.thumbnailUrl.trim().length === 0) {
      errors.push('Thumbnail URL cannot be empty');
    } else if (!isValidUrl(input.thumbnailUrl)) {
      errors.push('Invalid thumbnail URL format');
    }
  }

  // Has captions validation
  if (input.hasCaptions !== undefined && typeof input.hasCaptions !== 'boolean') {
    errors.push('Has captions must be a boolean');
  }

  // Caption file URL validation
  if (input.captionFileUrl !== undefined) {
    if (typeof input.captionFileUrl !== 'string') {
      errors.push('Caption file URL must be a string');
    } else if (input.captionFileUrl.trim().length === 0) {
      errors.push('Caption file URL cannot be empty');
    } else if (!isValidUrl(input.captionFileUrl)) {
      errors.push('Invalid caption file URL format');
    }
  }

  // Highlighted keywords validation
  if (input.highlightedKeywords !== undefined) {
    if (!Array.isArray(input.highlightedKeywords)) {
      errors.push('Highlighted keywords must be an array');
    } else {
      input.highlightedKeywords.forEach((keyword, index) => {
        if (typeof keyword !== 'string') {
          errors.push(`Keyword at index ${index} must be a string`);
        } else if (keyword.trim().length === 0) {
          errors.push(`Keyword at index ${index} cannot be empty`);
        } else if (keyword.length > 50) {
          errors.push(`Keyword at index ${index} must be less than 50 characters`);
        }
      });
      if (input.highlightedKeywords.length > 10) {
        errors.push('Cannot have more than 10 highlighted keywords');
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// ================================
// UTILITY FUNCTIONS
// ================================

function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// ================================
// SANITIZATION FUNCTIONS
// ================================

export function sanitizeCreateVideoInput(input: CreateVideoInput): CreateVideoInput {
  return {
    ...input,
    title: input.title.trim(),
    description: input.description?.trim(),
    sourceUrl: input.sourceUrl?.trim(),
    fileUrl: input.fileUrl?.trim(),
    thumbnailUrl: input.thumbnailUrl?.trim(),
  };
}

export function sanitizeUpdateVideoInput(input: UpdateVideoInput): UpdateVideoInput {
  return {
    ...input,
    title: input.title?.trim(),
    description: input.description?.trim(),
    thumbnailUrl: input.thumbnailUrl?.trim(),
  };
}

export function sanitizeCreateVideoClipInput(input: CreateVideoClipInput): CreateVideoClipInput {
  return {
    ...input,
    title: input.title?.trim(),
    description: input.description?.trim(),
    fileUrl: input.fileUrl?.trim(),
    thumbnailUrl: input.thumbnailUrl?.trim(),
    captionFileUrl: input.captionFileUrl?.trim(),
    highlightedKeywords: input.highlightedKeywords?.map(k => k.trim().toLowerCase()),
  };
}