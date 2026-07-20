/**
 * OGMJ BRANDS — Business Service
 * Last Updated: April 17, 2026
 */

import { createClient } from "../supabase/client";
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
    const supabase = createClient();
    const user = await getCurrentUser();

    if (!user) {
      return {
        success: false,
        error: { code: "UNAUTHORIZED", message: "User not authenticated" },
        timestamp: new Date().toISOString(),
      };
    }

    // Create business. DB triggers handle the rest: handle_business_upsert
    // generates a unique slug and syncs name/business_name; on_business_created
    // adds the owner to business_members (synced to business_users), plus
    // onboarding_progress, default pipeline, and workspace.
    //
    // Upsert on owner_id (rather than a plain insert) so a retried/duplicate
    // submission updates the existing row instead of raising a raw
    // constraint violation. owner_id/user_id/created_by are always set to
    // the same value by handle_business_upsert(), so a concurrent duplicate
    // can still lose the race against this ON CONFLICT target if it hits
    // businesses_user_id_unique or businesses_created_by_unique first —
    // the 23505 fallback below recovers from that by fetching the row that
    // actually won instead of surfacing a failure that didn't happen.
    const { data: business, error: businessError } = await (supabase as any)
      .from("businesses")
      .upsert(
        {
          name: input.name,
          industry: input.industry,
          country: input.country,
          team_size: input.team_size,
          currency: input.currency || "NGN",
          timezone: input.timezone || "UTC",
          owner_id: user.id,
          created_by: user.id,
        },
        { onConflict: "owner_id" }
      )
      .select()
      .single();

    if (businessError) {
      if ((businessError as any).code === "23505") {
        const { data: existing } = await supabase
          .from("businesses")
          .select("*")
          .eq("owner_id", user.id)
          .maybeSingle();
        if (existing) {
          return {
            success: true,
            data: existing as any,
            timestamp: new Date().toISOString(),
          };
        }
      }
      throw businessError;
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
    const supabase = createClient();

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

export async function listUserBusinesses(): Promise<APIResponse<(Business & { role?: string })[]>> {
  try {
    const supabase = createClient();
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
      .select("business_id, role, businesses(*)")
      .eq("user_id", user.id)
      .eq("status", "active");

    if (error) {
      throw error;
    }

    const businesses = data.map((item: any) => ({ ...item.businesses, role: item.role })) as (Business & { role?: string })[];

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
    const supabase = createClient();
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

    if (!businessUser || !["owner", "admin"].includes((businessUser as any).role)) {
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
    const supabase = createClient();
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

    if (!businessUser || !["owner", "admin"].includes((businessUser as any).role)) {
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
    const supabase = createClient();

    // business_users FKs point at auth.users (not embeddable via PostgREST),
    // so fetch profiles separately for email/name.
    const { data, error } = await supabase
      .from("business_users")
      .select("*")
      .eq("business_id", businessId)
      .eq("status", "active");

    if (error) {
      throw error;
    }

    const userIds = (data ?? []).map((m: any) => m.user_id).filter(Boolean);
    let profilesById: Record<string, { email?: string; name?: string | null }> = {};
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, email, name")
        .in("id", userIds);
      profilesById = Object.fromEntries(
        (profiles ?? []).map((p: any) => [p.id, { email: p.email, name: p.name }])
      );
    }

    const members = (data ?? []).map((m: any) => ({
      ...m,
      email: profilesById[m.user_id]?.email,
      name: profilesById[m.user_id]?.name,
    }));

    return {
      success: true,
      data: members as any,
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
  // Must match the business_role enum (minus owner, which is never invited)
  role: "admin" | "manager" | "member" = "member"
): Promise<APIResponse<{ token: string }>> {
  try {
    const supabase = createClient();
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

    if (!businessUser || !["owner", "admin"].includes((businessUser as any).role)) {
      return {
        success: false,
        error: { code: "FORBIDDEN", message: "Only admins can invite users" },
        timestamp: new Date().toISOString(),
      };
    }

    // Generate invitation token
    const token = crypto.randomUUID();

    // Create invitation (invited_by is NOT NULL in the canonical schema)
    const { data, error } = await (supabase as any)
      .from("invitations")
      .insert({
        business_id: businessId,
        email,
        role,
        token,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        invited_by: user.id,
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
    const supabase = createClient();
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

    // Check if already redeemed or expired
    if ((invitation as any).redeemed_at) {
      return {
        success: false,
        error: { code: "INVALID_TOKEN", message: "Invitation has already been used" },
        timestamp: new Date().toISOString(),
      };
    }

    if (new Date((invitation as any).expires_at) < new Date()) {
      return {
        success: false,
        error: { code: "EXPIRED_TOKEN", message: "Invitation has expired" },
        timestamp: new Date().toISOString(),
      };
    }

    // Add user to business_members (canonical membership table; a trigger
    // syncs business_users from it). Map the invitation role into the
    // business_role enum, falling back to member for unknown values.
    const validRoles = ["admin", "manager", "member"];
    const role = validRoles.includes((invitation as any).role)
      ? (invitation as any).role
      : "member";

    const { data, error } = await (supabase as any)
      .from("business_members")
      .insert({
        business_id: (invitation as any).business_id,
        user_id: user.id,
        role,
        invited_by: (invitation as any).invited_by,
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
        accepted_at: new Date().toISOString(),
        status: "accepted",
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
    const supabase = createClient();

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


