import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createServerClient } from '@/lib/supabase/server';
import { getCurrentUserServer as getCurrentUser } from '@/lib/auth.server';
import { isFlutterwaveConfigured } from '@/lib/payments/flutterwave';

interface FlutterwaveInitializePayload {
  businessId: string;
  planId: string;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isFlutterwaveConfigured()) {
      return NextResponse.json({ error: 'Flutterwave configuration missing' }, { status: 500 });
    }

    const body: FlutterwaveInitializePayload = await request.json();
    const { businessId, planId } = body;

    if (!businessId || !planId) {
      return NextResponse.json({ error: 'Business ID and plan ID required' }, { status: 400 });
    }

    const supabase = await createServerClient();

    // Only owners/admins of the business can start a payment for it
    const { data: membership } = await supabase
      .from('business_users')
      .select('role')
      .eq('business_id', businessId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (!membership || !['owner', 'admin'].includes((membership as any).role)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // The amount is derived from the plan server-side — never from the client
    const { data: plan } = await supabase
      .from('subscription_plans')
      .select('id, price_ngn, status')
      .eq('id', planId)
      .single();

    if (!plan || (plan as any).status !== 'active') {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    // Flutterwave amounts are whole-currency-unit (Naira), unlike Paystack's
    // kobo — no /100 conversion here.
    const amount = Number((plan as any).price_ngn);
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: 'Plan has no valid price' }, { status: 400 });
    }

    const txRef = `flw_${crypto.randomBytes(16).toString('hex')}`;

    return NextResponse.json(
      {
        success: true,
        data: {
          txRef,
          amount,
          currency: 'NGN',
          email: user.email,
          meta: { businessId, planId, userId: user.id },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Flutterwave initialization error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
