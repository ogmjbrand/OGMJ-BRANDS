import { createServerClient } from '@/lib/supabase/server';
import { getCurrentUserServer as getCurrentUser } from '@/lib/auth.server';
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

  if (!['owner', 'admin'].includes(data.role)) {
    throw new ApiError('Admin access required', 403);
  }

  return data;
}

function calculateEndDate(billingPeriod: string, startDate?: string) {
  const start = startDate ? new Date(startDate) : new Date();
  const end = new Date(start);
  if (billingPeriod === 'yearly') {
    end.setFullYear(end.getFullYear() + 1);
  } else {
    end.setMonth(end.getMonth() + 1);
  }
  return end.toISOString().slice(0, 10);
}

function calculateProratedAmount(currentPlan: any, newPlan: any, currentPeriodEnd: string) {
  const now = new Date();
  const end = new Date(currentPeriodEnd);
  const totalDays = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (totalDays <= 0) return 0;

  // Canonical price column is price_ngn (price_usd for USD plans)
  const currentPrice = Number(currentPlan.price_ngn) || 0;
  const newPrice = Number(newPlan.price_ngn) || 0;
  const currentDailyRate = currentPrice / (currentPlan.billing_period === 'yearly' ? 365 : 30);
  const newDailyRate = newPrice / (newPlan.billing_period === 'yearly' ? 365 : 30);

  return Math.max(0, (newDailyRate - currentDailyRate) * totalDays);
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return createErrorResponse('Unauthorized', 401);
    }

    const body = await request.json();
    const { businessId, newPlanId, paymentMethod = 'card' } = body;

    if (!businessId || !newPlanId) {
      return createErrorResponse('Business ID and new plan ID are required', 400);
    }

    const supabase = await createServerClient();
    await verifyBusinessAdmin(supabase, user.id, businessId);

    // Get current active subscription
    const { data: currentSubscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*, subscription_plans(*)')
      .eq('business_id', businessId)
      .eq('status', 'active')
      .single();

    if (subError || !currentSubscription) {
      throw new ApiError('No active subscription found', 404);
    }

    // Get new plan
    const { data: newPlan, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', newPlanId)
      .single();

    if (planError || !newPlan) {
      throw new ApiError('New plan not found', 404);
    }

    // Check if upgrading to same plan
    if (currentSubscription.plan_id === newPlanId) {
      throw new ApiError('Already subscribed to this plan', 400);
    }

    // Calculate prorated amount
    const proratedAmount = calculateProratedAmount(
      currentSubscription.subscription_plans,
      newPlan,
      currentSubscription.current_period_end
    );

    // Upgrades that cost money must go through the Paystack flow
    // (/api/payments/initialize with the new plan). Only free changes
    // (downgrades / equal price) are applied directly here.
    if (proratedAmount > 0) {
      throw new ApiError(
        'This upgrade requires payment. Use the payment flow with the new plan.',
        402
      );
    }

    // Update subscription
    const updatePayload = {
      plan_id: newPlanId,
      amount: Number(newPlan.price_ngn) || 0,
      billing_period: newPlan.billing_period,
      currency: newPlan.currency || 'NGN',
      updated_at: new Date().toISOString(),
      metadata: {
        ...currentSubscription.metadata,
        upgradedBy: user.id,
        upgradedAt: new Date().toISOString(),
        previousPlanId: currentSubscription.plan_id,
        proratedAmount,
      },
    };

    const { data: updatedSubscription, error: updateError } = await supabase
      .from('subscriptions')
      .update(updatePayload)
      .eq('id', currentSubscription.id)
      .select('*, subscription_plans(*)')
      .single();

    if (updateError) {
      throw updateError;
    }

    return createSuccessResponse({
      subscription: updatedSubscription,
      proratedAmount,
      upgradeDetails: {
        fromPlan: currentSubscription.subscription_plans.name,
        toPlan: newPlan.name,
        priceDifference:
          (Number(newPlan.price_ngn) || 0) -
          (Number(currentSubscription.subscription_plans.price_ngn) || 0),
      },
    }, 'Subscription upgraded successfully');
  } catch (error) {
    return handleApiError(error);
  }
}

