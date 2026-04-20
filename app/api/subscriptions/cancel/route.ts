import { createServerClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth';
import { NextRequest } from 'next/server';
import { ApiError, createErrorResponse, createSuccessResponse, handleApiError } from '@/lib/utils/api';

async function verifyBusinessAdmin(supabase: any, userId: string, businessId: string) {
  const { data, error } = await supabase
    .from('business_users')
    .select('role')
    .eq('business_id', businessId)
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();

  if (error || !data) {
    throw new ApiError('Access denied', 403);
  }

  if (data.role !== 'admin') {
    throw new ApiError('Admin access required', 403);
  }

  return data;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return createErrorResponse('Unauthorized', 401);
    }

    const body = await request.json();
    const { businessId, subscriptionId } = body;

    if (!businessId || !subscriptionId) {
      return createErrorResponse('Business ID and subscription ID are required', 400);
    }

    const supabase = await createServerClient();
    await verifyBusinessAdmin(supabase, user.id, businessId);

    const updatePayload = {
      status: 'cancelled',
      cancel_at: new Date().toISOString().slice(0, 10),
      cancelled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('subscriptions')
      .update(updatePayload as any)
      .eq('id', subscriptionId)
      .eq('business_id', businessId)
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    return createSuccessResponse(data, 'Subscription cancelled successfully');
  } catch (error) {
    return handleApiError(error);
  }
}
