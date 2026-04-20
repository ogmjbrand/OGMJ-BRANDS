/**
 * OGMJ BRANDS — Builder Validators
 * Last Updated: April 19, 2026
 */

import type { CreateWebsiteInput, UpdateWebsiteInput, CreatePageInput, UpdatePageInput, UpdatePageSectionsInput, CreateTemplateInput } from '../services/builder.service';

// ================================
// WEBSITE VALIDATION
// ================================

export function validateCreateWebsiteInput(input: CreateWebsiteInput): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Business ID validation
  if (!input.businessId || typeof input.businessId !== 'string') {
    errors.push('Business ID is required and must be a string');
  } else if (!isValidUUID(input.businessId)) {
    errors.push('Business ID must be a valid UUID');
  }

  // Name validation
  if (!input.name || typeof input.name !== 'string') {
    errors.push('Website name is required and must be a string');
  } else if (input.name.trim().length === 0) {
    errors.push('Website name cannot be empty');
  } else if (input.name.length > 100) {
    errors.push('Website name must be less than 100 characters');
  }

  // Slug validation
  if (input.slug !== undefined) {
    if (typeof input.slug !== 'string') {
      errors.push('Slug must be a string');
    } else if (input.slug.trim().length === 0) {
      errors.push('Slug cannot be empty');
    } else if (!isValidSlug(input.slug)) {
      errors.push('Slug must contain only lowercase letters, numbers, and hyphens');
    } else if (input.slug.length > 50) {
      errors.push('Slug must be less than 50 characters');
    }
  }

  // Description validation
  if (input.description !== undefined) {
    if (typeof input.description !== 'string') {
      errors.push('Description must be a string');
    } else if (input.description.length > 500) {
      errors.push('Description must be less than 500 characters');
    }
  }

  // Domain validation
  if (input.domain !== undefined) {
    if (typeof input.domain !== 'string') {
      errors.push('Domain must be a string');
    } else if (input.domain.trim().length === 0) {
      errors.push('Domain cannot be empty');
    } else if (!isValidDomain(input.domain)) {
      errors.push('Invalid domain format');
    }
  }

  // Custom domain validation
  if (input.customDomain !== undefined) {
    if (typeof input.customDomain !== 'string') {
      errors.push('Custom domain must be a string');
    } else if (input.customDomain.trim().length === 0) {
      errors.push('Custom domain cannot be empty');
    } else if (!isValidDomain(input.customDomain)) {
      errors.push('Invalid custom domain format');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validateUpdateWebsiteInput(input: UpdateWebsiteInput): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Name validation
  if (input.name !== undefined) {
    if (typeof input.name !== 'string') {
      errors.push('Website name must be a string');
    } else if (input.name.trim().length === 0) {
      errors.push('Website name cannot be empty');
    } else if (input.name.length > 100) {
      errors.push('Website name must be less than 100 characters');
    }
  }

  // Slug validation
  if (input.slug !== undefined) {
    if (typeof input.slug !== 'string') {
      errors.push('Slug must be a string');
    } else if (input.slug.trim().length === 0) {
      errors.push('Slug cannot be empty');
    } else if (!isValidSlug(input.slug)) {
      errors.push('Slug must contain only lowercase letters, numbers, and hyphens');
    } else if (input.slug.length > 50) {
      errors.push('Slug must be less than 50 characters');
    }
  }

  // Description validation
  if (input.description !== undefined) {
    if (typeof input.description !== 'string') {
      errors.push('Description must be a string');
    } else if (input.description.length > 500) {
      errors.push('Description must be less than 500 characters');
    }
  }

  // Domain validation
  if (input.domain !== undefined) {
    if (typeof input.domain !== 'string') {
      errors.push('Domain must be a string');
    } else if (input.domain.trim().length === 0) {
      errors.push('Domain cannot be empty');
    } else if (!isValidDomain(input.domain)) {
      errors.push('Invalid domain format');
    }
  }

  // Custom domain validation
  if (input.customDomain !== undefined) {
    if (typeof input.customDomain !== 'string') {
      errors.push('Custom domain must be a string');
    } else if (input.customDomain.trim().length === 0) {
      errors.push('Custom domain cannot be empty');
    } else if (!isValidDomain(input.customDomain)) {
      errors.push('Invalid custom domain format');
    }
  }

  // Status validation
  if (input.status !== undefined) {
    if (typeof input.status !== 'string') {
      errors.push('Status must be a string');
    } else if (!['draft', 'published', 'archived'].includes(input.status)) {
      errors.push('Status must be one of: draft, published, archived');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// ================================
// PAGE VALIDATION
// ================================

export function validateCreatePageInput(input: CreatePageInput): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Website ID validation
  if (!input.websiteId || typeof input.websiteId !== 'string') {
    errors.push('Website ID is required and must be a string');
  } else if (!isValidUUID(input.websiteId)) {
    errors.push('Website ID must be a valid UUID');
  }

  // Title validation
  if (!input.title || typeof input.title !== 'string') {
    errors.push('Page title is required and must be a string');
  } else if (input.title.trim().length === 0) {
    errors.push('Page title cannot be empty');
  } else if (input.title.length > 100) {
    errors.push('Page title must be less than 100 characters');
  }

  // Slug validation
  if (input.slug !== undefined) {
    if (typeof input.slug !== 'string') {
      errors.push('Slug must be a string');
    } else if (input.slug.trim().length === 0) {
      errors.push('Slug cannot be empty');
    } else if (!isValidSlug(input.slug)) {
      errors.push('Slug must contain only lowercase letters, numbers, and hyphens');
    } else if (input.slug.length > 50) {
      errors.push('Slug must be less than 50 characters');
    }
  }

  // Content validation
  if (input.content !== undefined) {
    if (typeof input.content !== 'string') {
      errors.push('Content must be a string');
    }
  }

  // Meta title validation
  if (input.metaTitle !== undefined) {
    if (typeof input.metaTitle !== 'string') {
      errors.push('Meta title must be a string');
    } else if (input.metaTitle.length > 60) {
      errors.push('Meta title must be less than 60 characters');
    }
  }

  // Meta description validation
  if (input.metaDescription !== undefined) {
    if (typeof input.metaDescription !== 'string') {
      errors.push('Meta description must be a string');
    } else if (input.metaDescription.length > 160) {
      errors.push('Meta description must be less than 160 characters');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validateUpdatePageInput(input: UpdatePageInput): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Title validation
  if (input.title !== undefined) {
    if (typeof input.title !== 'string') {
      errors.push('Page title must be a string');
    } else if (input.title.trim().length === 0) {
      errors.push('Page title cannot be empty');
    } else if (input.title.length > 100) {
      errors.push('Page title must be less than 100 characters');
    }
  }

  // Slug validation
  if (input.slug !== undefined) {
    if (typeof input.slug !== 'string') {
      errors.push('Slug must be a string');
    } else if (input.slug.trim().length === 0) {
      errors.push('Slug cannot be empty');
    } else if (!isValidSlug(input.slug)) {
      errors.push('Slug must contain only lowercase letters, numbers, and hyphens');
    } else if (input.slug.length > 50) {
      errors.push('Slug must be less than 50 characters');
    }
  }

  // Content validation
  if (input.content !== undefined) {
    if (typeof input.content !== 'string') {
      errors.push('Content must be a string');
    }
  }

  // Status validation
  if (input.status !== undefined) {
    if (typeof input.status !== 'string') {
      errors.push('Status must be a string');
    } else if (!['draft', 'published', 'archived'].includes(input.status)) {
      errors.push('Status must be one of: draft, published, archived');
    }
  }

  // Meta title validation
  if (input.metaTitle !== undefined) {
    if (typeof input.metaTitle !== 'string') {
      errors.push('Meta title must be a string');
    } else if (input.metaTitle.length > 60) {
      errors.push('Meta title must be less than 60 characters');
    }
  }

  // Meta description validation
  if (input.metaDescription !== undefined) {
    if (typeof input.metaDescription !== 'string') {
      errors.push('Meta description must be a string');
    } else if (input.metaDescription.length > 160) {
      errors.push('Meta description must be less than 160 characters');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validateUpdatePageSectionsInput(input: UpdatePageSectionsInput): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Sections validation
  if (!Array.isArray(input.sections)) {
    errors.push('Sections must be an array');
  } else {
    input.sections.forEach((section, index) => {
      if (typeof section !== 'object' || section === null) {
        errors.push(`Section at index ${index} must be an object`);
        return;
      }

      // Type validation
      if (!section.type || typeof section.type !== 'string') {
        errors.push(`Section at index ${index} must have a valid type`);
      }

      // Content validation
      if (section.content !== undefined && typeof section.content !== 'object') {
        errors.push(`Section content at index ${index} must be an object`);
      }

      // Order validation
      if (section.order !== undefined && typeof section.order !== 'number') {
        errors.push(`Section order at index ${index} must be a number`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// ================================
// TEMPLATE VALIDATION
// ================================

export function validateCreateTemplateInput(input: CreateTemplateInput): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Name validation
  if (!input.name || typeof input.name !== 'string') {
    errors.push('Template name is required and must be a string');
  } else if (input.name.trim().length === 0) {
    errors.push('Template name cannot be empty');
  } else if (input.name.length > 100) {
    errors.push('Template name must be less than 100 characters');
  }

  // Description validation
  if (input.description !== undefined) {
    if (typeof input.description !== 'string') {
      errors.push('Description must be a string');
    } else if (input.description.length > 500) {
      errors.push('Description must be less than 500 characters');
  }
  }

  // Category validation
  if (input.category !== undefined) {
    if (typeof input.category !== 'string') {
      errors.push('Category must be a string');
    } else if (input.category.trim().length === 0) {
      errors.push('Category cannot be empty');
    } else if (input.category.length > 50) {
      errors.push('Category must be less than 50 characters');
    }
  }

  // Content validation
  if (!input.content || typeof input.content !== 'object') {
    errors.push('Template content is required and must be an object');
  }

  // Tags validation
  if (input.tags !== undefined) {
    if (!Array.isArray(input.tags)) {
      errors.push('Tags must be an array');
    } else {
      input.tags.forEach((tag, index) => {
        if (typeof tag !== 'string') {
          errors.push(`Tag at index ${index} must be a string`);
        } else if (tag.trim().length === 0) {
          errors.push(`Tag at index ${index} cannot be empty`);
        } else if (tag.length > 30) {
          errors.push(`Tag at index ${index} must be less than 30 characters`);
        }
      });
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

function isValidSlug(slug: string): boolean {
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return slugRegex.test(slug);
}

function isValidDomain(domain: string): boolean {
  const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$/;
  return domainRegex.test(domain) && domain.length <= 253;
}

// ================================
// SANITIZATION FUNCTIONS
// ================================

export function sanitizeCreateWebsiteInput(input: CreateWebsiteInput): CreateWebsiteInput {
  return {
    ...input,
    name: input.name.trim(),
    slug: input.slug?.trim().toLowerCase(),
    description: input.description?.trim(),
    domain: input.domain?.trim().toLowerCase(),
    customDomain: input.customDomain?.trim().toLowerCase(),
  };
}

export function sanitizeUpdateWebsiteInput(input: UpdateWebsiteInput): UpdateWebsiteInput {
  return {
    ...input,
    name: input.name?.trim(),
    slug: input.slug?.trim().toLowerCase(),
    description: input.description?.trim(),
    domain: input.domain?.trim().toLowerCase(),
    customDomain: input.customDomain?.trim().toLowerCase(),
  };
}

export function sanitizeCreatePageInput(input: CreatePageInput): CreatePageInput {
  return {
    ...input,
    title: input.title.trim(),
    slug: input.slug?.trim().toLowerCase(),
    metaTitle: input.metaTitle?.trim(),
    metaDescription: input.metaDescription?.trim(),
  };
}

export function sanitizeUpdatePageInput(input: UpdatePageInput): UpdatePageInput {
  return {
    ...input,
    title: input.title?.trim(),
    slug: input.slug?.trim().toLowerCase(),
    metaTitle: input.metaTitle?.trim(),
    metaDescription: input.metaDescription?.trim(),
  };
}