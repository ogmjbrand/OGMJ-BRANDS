/**
 * OGMJ BRANDS — CRM Service
 * Last Updated: April 17, 2026
 */

import { createClient } from "../supabase/client";
import { getCurrentUser } from "../auth";
import type {
  Contact,
  Deal,
  Interaction,
  CreateContactInput,
  CreateDealInput,
  CreateSupportTicketInput,
  APIResponse,
  PaginatedResponse,
  PipelineStage,
} from "../types";

// ================================
// CONTACTS
// ================================

export async function createContact(
  businessId: string,
  input: CreateContactInput
): Promise<APIResponse<Contact>> {
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

    // first_name and owner_id are NOT NULL in the canonical schema
    const { data, error } = await (supabase as any)
      .from("contacts")
      .insert({
        ...input,
        first_name:
          input.first_name || input.email?.split("@")[0] || "Unknown",
        business_id: businessId,
        owner_id: user.id,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Contact creation failed";
    return {
      success: false,
      error: { code: "CREATE_CONTACT_ERROR", message },
      timestamp: new Date().toISOString(),
    };
  }
}

export async function getContact(
  businessId: string,
  contactId: string
): Promise<APIResponse<Contact & { interactions: Interaction[] }>> {
  try {
    const supabase = createClient();

    const { data: contact, error: contactError } = await (supabase as any)
      .from("contacts")
      .select("*")
      .eq("id", contactId)
      .eq("business_id", businessId)
      .single();

    if (contactError) throw contactError;

    const { data: interactions } = await (supabase as any)
      .from("interactions")
      .select("*")
      .eq("contact_id", contactId)
      .order("created_at", { ascending: false });

    return {
      success: true,
      data: {
        ...(contact as any),
        interactions: interactions || [],
      },
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch contact";
    return {
      success: false,
      error: { code: "GET_CONTACT_ERROR", message },
      timestamp: new Date().toISOString(),
    };
  }
}

export async function listContacts(
  businessId: string,
  options?: {
    page?: number;
    pageSize?: number;
    status?: string;
    search?: string;
  }
): Promise<APIResponse<PaginatedResponse<Contact>>> {
  try {
    const supabase = createClient();
    const page = options?.page || 1;
    const pageSize = options?.pageSize || 20;
    const offset = (page - 1) * pageSize;

    let query = supabase
      .from("contacts")
      .select("*", { count: "exact" })
      .eq("business_id", businessId);

    if (options?.status) {
      query = query.eq("status", options.status);
    }

    if (options?.search) {
      query = query.or(
        `first_name.ilike.%${options.search}%,last_name.ilike.%${options.search}%,email.ilike.%${options.search}%`
      );
    }

    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (error) throw error;

    return {
      success: true,
      data: {
        items: data,
        total: count || 0,
        page,
        pageSize,
        hasNextPage: (count || 0) > offset + pageSize,
      },
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to list contacts";
    return {
      success: false,
      error: { code: "LIST_CONTACTS_ERROR", message },
      timestamp: new Date().toISOString(),
    };
  }
}

export async function updateContact(
  businessId: string,
  contactId: string,
  updates: Partial<Contact>
): Promise<APIResponse<Contact>> {
  try {
    const supabase = createClient();
    const user = await getCurrentUser();

    const { data, error } = await (supabase as any)
      .from("contacts")
      .update({
        ...updates,
        updated_by: user?.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", contactId)
      .eq("business_id", businessId)
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Contact update failed";
    return {
      success: false,
      error: { code: "UPDATE_CONTACT_ERROR", message },
      timestamp: new Date().toISOString(),
    };
  }
}

export async function deleteContact(
  businessId: string,
  contactId: string
): Promise<APIResponse<null>> {
  try {
    const supabase = createClient();

    const { error } = await supabase
      .from("contacts")
      .delete()
      .eq("id", contactId)
      .eq("business_id", businessId);

    if (error) throw error;

    return {
      success: true,
      data: null,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Contact deletion failed";
    return {
      success: false,
      error: { code: "DELETE_CONTACT_ERROR", message },
      timestamp: new Date().toISOString(),
    };
  }
}

// ================================
// DEALS
// ================================

// Fetches a business's default pipeline and its real stages (id, name,
// position, color), ordered by position. The pipeline + its stages are
// auto-created for every business by the on_business_created DB trigger,
// so this should always resolve for a valid businessId.
export async function listPipelineStages(
  businessId: string
): Promise<APIResponse<{ pipelineId: string; stages: PipelineStage[] }>> {
  try {
    const supabase = createClient();

    const { data: pipeline, error: pipelineError } = await supabase
      .from("pipelines")
      .select("id")
      .eq("business_id", businessId)
      .order("is_default", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (pipelineError) throw pipelineError;
    if (!pipeline) throw new Error("No pipeline exists for this business");

    const { data: stages, error: stagesError } = await supabase
      .from("pipeline_stages")
      .select("id, name, position, color")
      .eq("pipeline_id", (pipeline as any).id)
      .order("position", { ascending: true });

    if (stagesError) throw stagesError;

    return {
      success: true,
      data: { pipelineId: (pipeline as any).id, stages: (stages as any) || [] },
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch pipeline stages";
    return {
      success: false,
      error: { code: "LIST_PIPELINE_STAGES_ERROR", message },
      timestamp: new Date().toISOString(),
    };
  }
}

// Resolves a deal's canonical stage_id + display stage name together, so
// they can never drift apart: falls back to the pipeline's first stage
// (by position) when neither is specified, and always re-derives `stage`
// (the display/legacy text column) from the resolved stage_id's real name
// rather than trusting caller-supplied text.
async function resolveDealStage(
  supabase: ReturnType<typeof createClient>,
  businessId: string,
  pipelineIdInput: string | undefined,
  stageIdInput: string | undefined
): Promise<{ pipelineId: string; stageId: string; stageName: string }> {
  let pipelineId = pipelineIdInput;

  if (!pipelineId) {
    const { data: pipeline } = await supabase
      .from("pipelines")
      .select("id")
      .eq("business_id", businessId)
      .order("is_default", { ascending: false })
      .limit(1)
      .maybeSingle();
    pipelineId = (pipeline as any)?.id;
  }

  if (!pipelineId) {
    throw new Error("No pipeline exists for this business");
  }

  let stage: { id: string; name: string } | null = null;

  if (stageIdInput) {
    const { data } = await supabase
      .from("pipeline_stages")
      .select("id, name")
      .eq("id", stageIdInput)
      .eq("pipeline_id", pipelineId)
      .maybeSingle();
    stage = data as any;
  }

  if (!stage) {
    const { data } = await supabase
      .from("pipeline_stages")
      .select("id, name")
      .eq("pipeline_id", pipelineId)
      .order("position", { ascending: true })
      .limit(1)
      .maybeSingle();
    stage = data as any;
  }

  if (!stage) {
    throw new Error("The pipeline has no stages");
  }

  return { pipelineId, stageId: stage.id, stageName: stage.name };
}

export async function createDeal(
  businessId: string,
  input: CreateDealInput
): Promise<APIResponse<Deal>> {
  try {
    const supabase = createClient();
    const user = await getCurrentUser();

    const { pipelineId, stageId, stageName } = await resolveDealStage(
      supabase,
      businessId,
      input.pipeline_id,
      input.stage_id
    );

    const { data, error } = await (supabase as any)
      .from("deals")
      .insert({
        ...input,
        pipeline_id: pipelineId,
        stage_id: stageId,
        stage: stageName,
        business_id: businessId,
        created_by: user?.id,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Deal creation failed";
    return {
      success: false,
      error: { code: "CREATE_DEAL_ERROR", message },
      timestamp: new Date().toISOString(),
    };
  }
}

export async function getDeal(
  businessId: string,
  dealId: string
): Promise<APIResponse<Deal>> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("deals")
      .select("*")
      .eq("id", dealId)
      .eq("business_id", businessId)
      .single();

    if (error) throw error;

    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch deal";
    return {
      success: false,
      error: { code: "GET_DEAL_ERROR", message },
      timestamp: new Date().toISOString(),
    };
  }
}

export async function listDeals(
  businessId: string,
  options?: {
    page?: number;
    pageSize?: number;
    status?: string;
    stage?: string;
  }
): Promise<APIResponse<PaginatedResponse<Deal>>> {
  try {
    const supabase = createClient();
    const page = options?.page || 1;
    const pageSize = options?.pageSize || 20;
    const offset = (page - 1) * pageSize;

    let query = supabase
      .from("deals")
      .select("*", { count: "exact" })
      .eq("business_id", businessId);

    if (options?.status) {
      query = query.eq("status", options.status);
    }

    if (options?.stage) {
      query = query.eq("stage", options.stage);
    }

    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (error) throw error;

    return {
      success: true,
      data: {
        items: data,
        total: count || 0,
        page,
        pageSize,
        hasNextPage: (count || 0) > offset + pageSize,
      },
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to list deals";
    return {
      success: false,
      error: { code: "LIST_DEALS_ERROR", message },
      timestamp: new Date().toISOString(),
    };
  }
}

export async function updateDeal(
  businessId: string,
  dealId: string,
  updates: Partial<Deal>
): Promise<APIResponse<Deal>> {
  try {
    const supabase = createClient();
    const user = await getCurrentUser();

    // If the caller is moving the deal to a different stage, re-derive the
    // display `stage` name from the real stage_id so the two never drift —
    // never trust caller-supplied `stage` text on its own.
    let stageSync: { stage_id: string; stage: string } | null = null;
    if (updates.stage_id) {
      const { data: stage } = await supabase
        .from("pipeline_stages")
        .select("id, name")
        .eq("id", updates.stage_id)
        .maybeSingle();
      if (stage) stageSync = { stage_id: (stage as any).id, stage: (stage as any).name };
    }

    const { data, error } = await (supabase as any)
      .from("deals")
      .update({
        ...updates,
        ...(stageSync || {}),
        updated_by: user?.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", dealId)
      .eq("business_id", businessId)
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Deal update failed";
    return {
      success: false,
      error: { code: "UPDATE_DEAL_ERROR", message },
      timestamp: new Date().toISOString(),
    };
  }
}

export async function deleteDeal(
  businessId: string,
  dealId: string
): Promise<APIResponse<null>> {
  try {
    const supabase = createClient();

    const { error } = await supabase
      .from("deals")
      .delete()
      .eq("id", dealId)
      .eq("business_id", businessId);

    if (error) throw error;

    return {
      success: true,
      data: null,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Deal deletion failed";
    return {
      success: false,
      error: { code: "DELETE_DEAL_ERROR", message },
      timestamp: new Date().toISOString(),
    };
  }
}

// ================================
// INTERACTIONS
// ================================

export async function createInteraction(
  businessId: string,
  contactId: string,
  data: Partial<Interaction>
): Promise<APIResponse<Interaction>> {
  try {
    const supabase = createClient();
    const user = await getCurrentUser();

    const { data: interaction, error } = await (supabase as any)
      .from("interactions")
      .insert({
        ...data,
        business_id: businessId,
        contact_id: contactId,
        created_by: user?.id,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      data: interaction,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Interaction creation failed";
    return {
      success: false,
      error: { code: "CREATE_INTERACTION_ERROR", message },
      timestamp: new Date().toISOString(),
    };
  }
}

// ================================
// SUPPORT TICKETS
// ================================

export async function createSupportTicket(
  businessId: string,
  input: CreateSupportTicketInput
): Promise<APIResponse<any>> {
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

    // Canonical support_tickets columns: subject, description, priority,
    // status (no ticket_number column)
    const { data, error } = await (supabase as any)
      .from("support_tickets")
      .insert({
        ...input,
        business_id: businessId,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ticket creation failed";
    return {
      success: false,
      error: { code: "CREATE_TICKET_ERROR", message },
      timestamp: new Date().toISOString(),
    };
  }
}

export async function listSupportTickets(
  businessId: string,
  options?: {
    page?: number;
    pageSize?: number;
    status?: string;
    priority?: string;
  }
): Promise<APIResponse<PaginatedResponse<any>>> {
  try {
    const supabase = createClient();
    const page = options?.page || 1;
    const pageSize = options?.pageSize || 20;
    const offset = (page - 1) * pageSize;

    let query = supabase
      .from("support_tickets")
      .select("*", { count: "exact" })
      .eq("business_id", businessId);

    if (options?.status) {
      query = query.eq("status", options.status);
    }

    if (options?.priority) {
      query = query.eq("priority", options.priority);
    }

    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (error) throw error;

    return {
      success: true,
      data: {
        items: data,
        total: count || 0,
        page,
        pageSize,
        hasNextPage: (count || 0) > offset + pageSize,
      },
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to list tickets";
    return {
      success: false,
      error: { code: "LIST_TICKETS_ERROR", message },
      timestamp: new Date().toISOString(),
    };
  }
}


