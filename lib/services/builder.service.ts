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
  slug: string;
  description?: string;
  domain?: string;
  customDomain?: string;
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
  slug?: string;
  description?: string;
  domain?: string;
  customDomain?: string;
  templateId?: string;
}

export interface UpdateWebsiteInput {
  name?: string;
  slug?: string;
  description?: string;
  domain?: string;
  customDomain?: string;
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

    // Transform data to match service interface
    const websites = result.data?.map((site: any) => ({
      id: site.id,
      name: site.name,
      slug: site.slug,
      description: site.description,
      domain: site.domain,
      customDomain: site.custom_domain,
      status: site.status,
      templateId: site.template_id,
      publishedAt: site.published_at,
      createdAt: site.created_at,
      updatedAt: site.updated_at,
      pages: 0, // TODO: calculate from pages table
      visitors: 0, // TODO: calculate from analytics
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

export async function getPages(websiteId: string): Promise<APIResponse<Page[]>> {
  try {
    const response = await fetch(`/api/builder/pages?websiteId=${websiteId}`, {
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
      data: result.data || [],
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