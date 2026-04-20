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

function calculateEndDate(billingPeriod: string) {
  const start = new Date();
  const end = new Date(start);
  if (billingPeriod === 'yearly') {
    end.setFullYear(end.getFullYear() + 1);
  } else {
    end.setMonth(end.getMonth() + 1);
  }
  return end.toISOString().slice(0, 10);
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return createErrorResponse('Unauthorized', 401);
    }

    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');
    if (!businessId) {
      return createErrorResponse('Business ID required', 400);
    }

    const supabase = await createServerClient();
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('*, subscription_plans(*)')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      throw error;
    }

    return createSuccessResponse(subscription || null);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return createErrorResponse('Unauthorized', 401);
    }

    const body = await request.json();
    const { businessId, planId, paymentMethod = 'card' } = body;

    if (!businessId || !planId) {
      return createErrorResponse('Business ID and plan ID are required', 400);
    }

    const supabase = await createServerClient();
    await verifyBusinessAdmin(supabase, user.id, businessId);

    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', planId)
      .single();

    if (planError || !plan) {
      throw new ApiError('Plan not found', 404);
    }

    const now = new Date();
    const subscriptionPayload = {
      business_id: businessId,
      plan_id: planId,
      status: 'active',
      currency: (plan as any).currency || 'NGN',
      amount: (plan as any).price,
      billing_period: (plan as any).billing_period,
      current_period_start: now.toISOString().slice(0, 10),
      current_period_end: calculateEndDate((plan as any).billing_period),
      payment_method: paymentMethod,
      reference_id: `SUB_${Date.now()}`,
      metadata: {
        createdBy: user.id,
      },
    };

    const { data: subscription, error: createError } = await supabase
      .from('subscriptions')
      .insert(subscriptionPayload as any)
      .select('*')
      .single();

    if (createError) {
      throw createError;
    }

    return createSuccessResponse(subscription, 'Subscription created successfully');
  } catch (error) {
    return handleApiError(error);
  }
}
