/**
 * OGMJ BRANDS — Team Collaboration Service (client)
 */

import type { APIResponse } from "../types";
import { createClient } from "../supabase/client";

export type TeamRole = "owner" | "admin" | "manager" | "member";

export interface TeamMember {
  id: string;
  user_id: string;
  role: TeamRole;
  status: string;
  invited_at: string | null;
  joined_at: string | null;
  invited_by: string | null;
  profile: { id: string; email: string; name: string | null; avatar_url: string | null } | null;
}

export interface PendingInvitation {
  id: string;
  email: string;
  role: TeamRole;
  status: string;
  expires_at: string | null;
  created_at: string;
  invited_by: string;
}

export interface ActivityEntry {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  entity_name: string | null;
  metadata: Record<string, any>;
  created_at: string;
  actor: { id: string; email: string; name: string | null; avatar_url: string | null } | null;
}

async function parseResponse<T>(response: Response, fallbackCode: string): Promise<APIResponse<T>> {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    return {
      success: false,
      error: { code: fallbackCode, message: body?.error || "Request failed" },
      timestamp: new Date().toISOString(),
    };
  }
  return { success: true, data: body.data, timestamp: new Date().toISOString() };
}

export async function listTeamMembers(businessId: string): Promise<APIResponse<TeamMember[]>> {
  try {
    const response = await fetch(`/api/businesses/${businessId}/members`);
    return parseResponse(response, "LIST_MEMBERS_ERROR");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load team members";
    return { success: false, error: { code: "LIST_MEMBERS_ERROR", message }, timestamp: new Date().toISOString() };
  }
}

export async function inviteMember(
  businessId: string,
  email: string,
  role: Exclude<TeamRole, "owner">
): Promise<APIResponse<any>> {
  try {
    const response = await fetch(`/api/businesses/${businessId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, role }),
    });
    return parseResponse(response, "INVITE_MEMBER_ERROR");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to invite member";
    return { success: false, error: { code: "INVITE_MEMBER_ERROR", message }, timestamp: new Date().toISOString() };
  }
}

export async function updateMemberRole(
  businessId: string,
  userId: string,
  role: Exclude<TeamRole, "owner">
): Promise<APIResponse<any>> {
  try {
    const response = await fetch(`/api/businesses/${businessId}/members/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    return parseResponse(response, "UPDATE_ROLE_ERROR");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update role";
    return { success: false, error: { code: "UPDATE_ROLE_ERROR", message }, timestamp: new Date().toISOString() };
  }
}

export async function removeMember(businessId: string, userId: string): Promise<APIResponse<null>> {
  try {
    const response = await fetch(`/api/businesses/${businessId}/members/${userId}`, { method: "DELETE" });
    return parseResponse(response, "REMOVE_MEMBER_ERROR");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to remove member";
    return { success: false, error: { code: "REMOVE_MEMBER_ERROR", message }, timestamp: new Date().toISOString() };
  }
}

export async function listPendingInvitations(businessId: string): Promise<APIResponse<PendingInvitation[]>> {
  try {
    const response = await fetch(`/api/businesses/${businessId}/invitations`);
    return parseResponse(response, "LIST_INVITATIONS_ERROR");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load invitations";
    return { success: false, error: { code: "LIST_INVITATIONS_ERROR", message }, timestamp: new Date().toISOString() };
  }
}

export async function revokeInvitation(businessId: string, invitationId: string): Promise<APIResponse<null>> {
  try {
    const response = await fetch(`/api/businesses/${businessId}/invitations/${invitationId}`, { method: "DELETE" });
    return parseResponse(response, "REVOKE_INVITATION_ERROR");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to revoke invitation";
    return { success: false, error: { code: "REVOKE_INVITATION_ERROR", message }, timestamp: new Date().toISOString() };
  }
}

export async function listActivity(businessId: string, limit = 30): Promise<APIResponse<ActivityEntry[]>> {
  try {
    const response = await fetch(`/api/businesses/${businessId}/activity?limit=${limit}`);
    return parseResponse(response, "LIST_ACTIVITY_ERROR");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load activity";
    return { success: false, error: { code: "LIST_ACTIVITY_ERROR", message }, timestamp: new Date().toISOString() };
  }
}

// ── Invitation acceptance (public /invite/[token] page) ────────────────────
// Runs entirely through the user's own Supabase session: accept_invitation
// is a SECURITY DEFINER RPC, so it can insert the new business_members row
// even though the invitee isn't a member yet (RLS would otherwise block it).

export interface InvitationPreview {
  id: string;
  business_id: string;
  email: string;
  role: TeamRole;
  status: string;
  expires_at: string | null;
}

export async function getInvitationPreview(token: string): Promise<InvitationPreview | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("invitations")
    .select("id, business_id, email, role, status, expires_at")
    .eq("token", token)
    .maybeSingle();
  return (data as any) ?? null;
}

export async function acceptInvitation(
  token: string
): Promise<{ success: boolean; businessId?: string; error?: string }> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("accept_invitation", { p_token: token });
  if (error) {
    return { success: false, error: error.message };
  }
  const result = data as { success: boolean; business_id?: string; error?: string };
  return { success: result.success, businessId: result.business_id, error: result.error };
}
