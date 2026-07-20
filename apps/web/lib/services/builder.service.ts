/**
 * OGMJ BRANDS — Builder Service
 * Last Updated: April 19, 2026
 */

import type { APIResponse } from "../types";

// ================================
// WEBSITE TYPES
// ================================

export interface Website {
  id: string;
  name: string;
  description?: string;
  status: 'draft' | 'published' | 'archived';
  templateId?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  pages?: number;
  visitors?: number;
  lastModified?: string;
}

export interface CreateWebsiteInput {
  businessId: string;
  name: string;
  description?: string;
  templateId?: string;
}

export interface UpdateWebsiteInput {
  name?: string;
  description?: string;
  status?: 'draft' | 'published' | 'archived';
}

// ================================
// WEBSITE FUNCTIONS
// ================================

export async function getWebsites(
  businessId: string
): Promise<APIResponse<Website[]>> {
  try {
    const response = await fetch(`/api/builder/sites?businessId=${businessId}`, {
      method: 'GET',
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: {
          message: result.error || 'Failed to fetch websites',
          code: response.status.toString(),
        },
        timestamp: new Date().toISOString(),
      };
    }

    const websites = result.data?.websites?.map((site: any) => ({
      id: site.id,
      name: site.name,
      description: site.description,
      status: site.status,
      templateId: site.template_id,
      publishedAt: site.published_at,
      createdAt: site.created_at,
      updatedAt: site.updated_at,
      pages: site.web_pages?.length || 0,
      visitors: 0,
      lastModified: site.updated_at,
    })) || [];

    return {
      success: true,
      data: websites,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'An error occurred',
        code: 'NETWORK_ERROR',
      },
      timestamp: new Date().toISOString(),
    };
  }
}

export async function createWebsite(
  businessId: string,
  input: CreateWebsiteInput
): Promise<APIResponse<Website>> {
  try {
    const response = await fetch('/api/builder/sites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...input,
        businessId,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: {
          message: result.error || 'Failed to create website',
          code: response.status.toString(),
        },
        timestamp: new Date().toISOString(),
      };
    }

    return {
      success: true,
      data: result.data,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'An error occurred',
        code: 'NETWORK_ERROR',
      },
      timestamp: new Date().toISOString(),
    };
  }
}

export async function updateWebsite(
  websiteId: string,
  input: UpdateWebsiteInput
): Promise<APIResponse<Website>> {
  try {
    const response = await fetch(`/api/builder/sites/${websiteId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: {
          message: result.error || 'Failed to update website',
          code: response.status.toString(),
        },
        timestamp: new Date().toISOString(),
      };
    }

    return {
      success: true,
      data: result.data,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'An error occurred',
        code: 'NETWORK_ERROR',
      },
      timestamp: new Date().toISOString(),
    };
  }
}

export async function deleteWebsite(
  websiteId: string
): Promise<APIResponse<{ success: boolean }>> {
  try {
    const response = await fetch(`/api/builder/sites/${websiteId}`, {
      method: 'DELETE',
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: {
          message: result.error || 'Failed to delete website',
          code: response.status.toString(),
        },
        timestamp: new Date().toISOString(),
      };
    }

    return {
      success: true,
      data: { success: true },
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'An error occurred',
        code: 'NETWORK_ERROR',
      },
      timestamp: new Date().toISOString(),
    };
  }
}

// ================================
// TEMPLATE TYPES + FUNCTIONS
// ================================

export interface Template {
  id: string;
  name: string;
  category?: string;
  previewImage?: string;
  isActive: boolean;
  createdAt: string;
}

export async function getTemplates(category?: string): Promise<APIResponse<Template[]>> {
  try {
    const response = await fetch(`/api/builder/templates${category ? `?category=${category}` : ''}`, {
      method: 'GET',
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: {
          message: result.error || 'Failed to fetch templates',
          code: response.status.toString(),
        },
        timestamp: new Date().toISOString(),
      };
    }

    const templates = result.data?.templates?.map((template: any) => ({
      id: template.id,
      name: template.name,
      category: template.category,
      previewImage: template.preview_image,
      isActive: template.is_active,
      createdAt: template.created_at,
    })) || [];

    return {
      success: true,
      data: templates,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'An error occurred',
        code: 'NETWORK_ERROR',
      },
      timestamp: new Date().toISOString(),
    };
  }
}

// ================================
// PAGE TYPES
// ================================

export interface Page {
  id: string;
  websiteId: string;
  title: string;
  slug: string;
  path?: string;
  layoutId?: string;
  sections: any[]; // JSON array of component blocks
  metaTitle?: string;
  metaDescription?: string;
  ogImage?: string;
  status: 'draft' | 'published';
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePageInput {
  businessId: string;
  websiteId: string;
  title: string;
  slug: string;
  path?: string;
  content?: string;
  layoutId?: string;
  sections?: any[];
  metaTitle?: string;
  metaDescription?: string;
  ogImage?: string;
}

export interface UpdatePageInput {
  title?: string;
  slug?: string;
  path?: string;
  content?: string;
  layoutId?: string;
  sections?: any[];
  metaTitle?: string;
  metaDescription?: string;
  ogImage?: string;
  status?: 'draft' | 'published';
}

export interface UpdatePageSectionsInput {
  sections: any[];
}

export interface CreateTemplateInput {
  name: string;
  description?: string;
  category?: string;
  content: any;
  tags?: string[];
}

// ================================
// PAGE FUNCTIONS
// ================================

export async function getPages(businessId: string, websiteId: string): Promise<APIResponse<Page[]>> {
  try {
    const response = await fetch(`/api/builder/pages?businessId=${businessId}&websiteId=${websiteId}`, {
      method: 'GET',
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: {
          message: result.error || 'Failed to fetch pages',
          code: response.status.toString(),
        },
        timestamp: new Date().toISOString(),
      };
    }

    return {
      success: true,
      data: result.data?.pages || [],
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'An error occurred',
        code: 'NETWORK_ERROR',
      },
      timestamp: new Date().toISOString(),
    };
  }
}

export async function getPage(pageId: string): Promise<APIResponse<Page>> {
  try {
    const response = await fetch(`/api/builder/pages/${pageId}`, {
      method: 'GET',
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: {
          message: result.error || 'Failed to fetch page',
          code: response.status.toString(),
        },
        timestamp: new Date().toISOString(),
      };
    }

    return {
      success: true,
      data: result.data,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'An error occurred',
        code: 'NETWORK_ERROR',
      },
      timestamp: new Date().toISOString(),
    };
  }
}

export async function createPage(input: CreatePageInput): Promise<APIResponse<Page>> {
  try {
    const response = await fetch('/api/builder/pages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: {
          message: result.error || 'Failed to create page',
          code: response.status.toString(),
        },
        timestamp: new Date().toISOString(),
      };
    }

    return {
      success: true,
      data: result.data,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'An error occurred',
        code: 'NETWORK_ERROR',
      },
      timestamp: new Date().toISOString(),
    };
  }
}

export async function updatePage(pageId: string, input: UpdatePageInput): Promise<APIResponse<Page>> {
  try {
    const response = await fetch(`/api/builder/pages/${pageId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: {
          message: result.error || 'Failed to update page',
          code: response.status.toString(),
        },
        timestamp: new Date().toISOString(),
      };
    }

    return {
      success: true,
      data: result.data,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'An error occurred',
        code: 'NETWORK_ERROR',
      },
      timestamp: new Date().toISOString(),
    };
  }
}

export async function deletePage(pageId: string): Promise<APIResponse<{ success: boolean }>> {
  try {
    const response = await fetch(`/api/builder/pages/${pageId}`, {
      method: 'DELETE',
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: {
          message: result.error || 'Failed to delete page',
          code: response.status.toString(),
        },
        timestamp: new Date().toISOString(),
      };
    }

    return {
      success: true,
      data: { success: true },
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'An error occurred',
        code: 'NETWORK_ERROR',
      },
      timestamp: new Date().toISOString(),
    };
  }
}

export async function publishPage(pageId: string): Promise<APIResponse<Page>> {
  try {
    const response = await fetch(`/api/builder/pages/${pageId}/publish`, {
      method: 'POST',
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: {
          message: result.error || 'Failed to publish page',
          code: response.status.toString(),
        },
        timestamp: new Date().toISOString(),
      };
    }

    return {
      success: true,
      data: result.data,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'An error occurred',
        code: 'NETWORK_ERROR',
      },
      timestamp: new Date().toISOString(),
    };
  }
}

