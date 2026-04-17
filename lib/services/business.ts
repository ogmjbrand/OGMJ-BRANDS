/**
 * OGMJ BRANDS — Business Service
 * Last Updated: April 17, 2026
 */

import { createBrowserClient } from "../supabase/client";
import { getCurrentUser } from "../auth";
import type {
  Business,
  BusinessUser,
  CreateBusinessInput,
  APIResponse,
} from "../types";

// ================================
// CREATE BUSINESS
// ================================

export async function createBusiness(
  input: CreateBusinessInput
): Promise<APIResponse<Business>> {
  try {
    const supabase = createBrowserClient();
    const user = await getCurrentUser();

    if (!user) {
      return {
        success: false,
        error: { code: "UNAUTHORIZED", message: "User not authenticated" },
        timestamp: new Date().toISOString(),
      };
    }

    // Generate slug
    const slug = input.name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    // Create business
    const { data: business, error: businessError } = await (supabase as any)
      .from("businesses")
      .insert({
        name: input.name,
        slug,
        industry: input.industry,
        country: input.country,
        team_size: input.team_size,
        currency: input.currency || "NGN",
        timezone: input.timezone || "UTC",
        created_by: user.id,
      })
      .select()
      .single();

    if (businessError) {
      throw businessError;
    }

    // Add creator as admin
    const { error: memberError } = await (supabase as any)
      .from("business_users")
      .insert({
        business_id: business.id,
        user_id: user.id,
        role: "admin",
        status: "active",
        joined_at: new Date().toISOString(),
      });

    if (memberError) {
      throw memberError;
    }

    // Record audit log
    await recordAuditLog({
      business_id: business.id,
      user_id: user.id,
      action: "BUSINESS_CREATED",
      resource_type: "business",
      resource_id: business.id,
      status: "success",
    });

    return {
      success: true,
      data: business,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Business creation failed";
    return {
      success: false,
      error: { code: "CREATE_BUSINESS_ERROR", message },
      timestamp: new Date().toISOString(),
    };
  }
}

// ================================
// GET BUSINESS
// ================================

export async function getBusiness(businessId: string): Promise<APIResponse<Business>> {
  try {
    const supabase = createBrowserClient();

    const { data, error } = await supabase
      .from("businesses")
      .select("*")
      .eq("id", businessId)
      .single();

    if (error) {
      throw error;
    }

    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch business";
    return {
      success: false,
      error: { code: "GET_BUSINESS_ERROR", message },
      timestamp: new Date().toISOString(),
    };
  }
}

// ================================
// LIST USER BUSINESSES
// ================================

export async function listUserBusinesses(): Promise<APIResponse<Business[]>> {
  try {
    const supabase = createBrowserClient();
    const user = await getCurrentUser();

    if (!user) {
      return {
        success: false,
        error: { code: "UNAUTHORIZED", message: "User not authenticated" },
        timestamp: new Date().toISOString(),
      };
    }

    const { data, error } = await supabase
      .from("business_users")
      .select("business_id, businesses(*)")
      .eq("user_id", user.id)
      .eq("status", "active");

    if (error) {
      throw error;
    }

    const businesses = data.map((item: any) => item.businesses) as Business[];

    return {
      success: true,
      data: businesses,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to list businesses";
    return {
      success: false,
      error: { code: "LIST_BUSINESSES_ERROR", message },
      timestamp: new Date().toISOString(),
    };
  }
}

// ================================
// UPDATE BUSINESS
// ================================

export async function updateBusiness(
  businessId: string,
  updates: Partial<Business>
): Promise<APIResponse<Business>> {
  try {
    const supabase = createBrowserClient();
    const user = await getCurrentUser();

    if (!user) {
      return {
        success: false,
        error: { code: "UNAUTHORIZED", message: "User not authenticated" },
        timestamp: new Date().toISOString(),
      };
    }

    // Check if user is admin
    const { data: businessUser } = await supabase
      .from("business_users")
      .select("role")
      .eq("business_id", businessId)
      .eq("user_id", user.id)
      .single();

    if (!businessUser || (businessUser as any).role !== "admin") {
      return {
        success: false,
        error: { code: "FORBIDDEN", message: "Only admins can update business" },
        timestamp: new Date().toISOString(),
      };
    }

    const { data, error } = await (supabase as any)
      .from("businesses")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", businessId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Record audit log
    await recordAuditLog({
      business_id: businessId,
      user_id: user.id,
      action: "BUSINESS_UPDATED",
      resource_type: "business",
      resource_id: businessId,
      status: "success",
      changes: updates,
    });

    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Business update failed";
    return {
      success: false,
      error: { code: "UPDATE_BUSINESS_ERROR", message },
      timestamp: new Date().toISOString(),
    };
  }
}

// ================================
// DELETE BUSINESS
// ================================

export async function deleteBusiness(businessId: string): Promise<APIResponse<null>> {
  try {
    const supabase = createBrowserClient();
    const user = await getCurrentUser();

    if (!user) {
      return {
        success: false,
        error: { code: "UNAUTHORIZED", message: "User not authenticated" },
        timestamp: new Date().toISOString(),
      };
    }

    // Check if user is admin
    const { data: businessUser } = await supabase
      .from("business_users")
      .select("role")
      .eq("business_id", businessId)
      .eq("user_id", user.id)
      .single();

    if (!businessUser || (businessUser as any).role !== "admin") {
      return {
        success: false,
        error: { code: "FORBIDDEN", message: "Only admins can delete business" },
        timestamp: new Date().toISOString(),
      };
    }

    // Delete business (cascades to all related data)
    const { error } = await (supabase as any)
      .from("businesses")
      .delete()
      .eq("id", businessId);

    if (error) {
      throw error;
    }

    // Record audit log
    await recordAuditLog({
      business_id: businessId,
      user_id: user.id,
      action: "BUSINESS_DELETED",
      resource_type: "business",
      resource_id: businessId,
      status: "success",
    });

    return {
      success: true,
      data: null,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Business deletion failed";
    return {
      success: false,
      error: { code: "DELETE_BUSINESS_ERROR", message },
      timestamp: new Date().toISOString(),
    };
  }
}

// ================================
// LIST BUSINESS MEMBERS
// ================================

export async function listBusinessMembers(
  businessId: string
): Promise<APIResponse<(BusinessUser & { email?: string })[]>> {
  try {
    const supabase = createBrowserClient();

    const { data, error } = await supabase
      .from("business_users")
      .select("*, auth.users(email)")
      .eq("business_id", businessId)
      .eq("status", "active");

    if (error) {
      throw error;
    }

    return {
      success: true,
      data: data as any,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to list members";
    return {
      success: false,
      error: { code: "LIST_MEMBERS_ERROR", message },
      timestamp: new Date().toISOString(),
    };
  }
}

// ================================
// INVITE USER
// ================================

export async function inviteUser(
  businessId: string,
  email: string,
  role: "admin" | "editor" | "viewer" | "manager" | "member" = "member"
): Promise<APIResponse<{ token: string }>> {
  try {
    const supabase = createBrowserClient();
    const user = await getCurrentUser();

    if (!user) {
      return {
        success: false,
        error: { code: "UNAUTHORIZED", message: "User not authenticated" },
        timestamp: new Date().toISOString(),
      };
    }

    // Check if inviter is admin
    const { data: businessUser } = await supabase
      .from("business_users")
      .select("role")
      .eq("business_id", businessId)
      .eq("user_id", user.id)
      .single();

    if (!businessUser || (businessUser as any).role !== "admin") {
      return {
        success: false,
        error: { code: "FORBIDDEN", message: "Only admins can invite users" },
        timestamp: new Date().toISOString(),
      };
    }

    // Generate invitation token
    const token = Math.random().toString(36).substring(2, 15);

    // Create invitation
    const { data, error } = await (supabase as any)
      .from("invitations")
      .insert({
        business_id: businessId,
        email,
        role,
        token,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // TODO: Send invitation email

    return {
      success: true,
      data: { token },
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invitation failed";
    return {
      success: false,
      error: { code: "INVITE_USER_ERROR", message },
      timestamp: new Date().toISOString(),
    };
  }
}

// ================================
// ACCEPT INVITATION
// ================================

export async function acceptInvitation(token: string): Promise<APIResponse<BusinessUser>> {
  try {
    const supabase = createBrowserClient();
    const user = await getCurrentUser();

    if (!user) {
      return {
        success: false,
        error: { code: "UNAUTHORIZED", message: "User not authenticated" },
        timestamp: new Date().toISOString(),
      };
    }

    // Get invitation
    const { data: invitation, error: invError } = await (supabase as any)
      .from("invitations")
      .select("*")
      .eq("token", token)
      .single();

    if (invError || !invitation) {
      return {
        success: false,
        error: { code: "INVALID_TOKEN", message: "Invitation token is invalid or expired" },
        timestamp: new Date().toISOString(),
      };
    }

    // Check if expired
    if (new Date((invitation as any).expires_at) < new Date()) {
      return {
        success: false,
        error: { code: "EXPIRED_TOKEN", message: "Invitation has expired" },
        timestamp: new Date().toISOString(),
      };
    }

    // Add user to business
    const { data, error } = await (supabase as any)
      .from("business_users")
      .insert({
        business_id: (invitation as any).business_id,
        user_id: user.id,
        role: (invitation as any).role,
        status: "active",
        joined_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Mark invitation as redeemed
    await (supabase as any)
      .from("invitations")
      .update({
        redeemed_at: new Date().toISOString(),
        redeemed_by: user.id,
      })
      .eq("id", (invitation as any).id);

    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to accept invitation";
    return {
      success: false,
      error: { code: "ACCEPT_INVITATION_ERROR", message },
      timestamp: new Date().toISOString(),
    };
  }
}

// ================================
// HELPER: AUDIT LOG
// ================================

async function recordAuditLog({
  business_id,
  user_id,
  action,
  resource_type,
  resource_id,
  status,
  changes,
}: {
  business_id: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  status: "success" | "failed";
  changes?: any;
}) {
  try {
    const supabase = createBrowserClient();

    await (supabase as any).from("audit_logs").insert({
      business_id,
      user_id,
      action,
      resource_type,
      resource_id,
      status,
      changes,
    });
  } catch (error) {
    console.error("Error recording audit log:", error);
  }
}
