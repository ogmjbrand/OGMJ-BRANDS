import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getCurrentUserServer as getCurrentUser } from '@/lib/auth.server';

interface PaystackInitializePayload {
  businessId: string;
  planId: string;
  metadata?: Record<string, any>;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: PaystackInitializePayload = await request.json();
    const { businessId, planId, metadata = {} } = body;

    if (!businessId || !planId) {
      return NextResponse.json(
        { error: 'Business ID and plan ID required' },
        { status: 400 }
      );
    }

    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackSecretKey) {
      return NextResponse.json(
        { error: 'Paystack configuration missing' },
        { status: 500 }
      );
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

    const amountKobo = Math.round(Number((plan as any).price_ngn) * 100);
    if (!Number.isFinite(amountKobo) || amountKobo <= 0) {
      return NextResponse.json(
        { error: 'Plan has no valid price' },
        { status: 400 }
      );
    }

    // Initialize transaction with Paystack
    const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amountKobo,
        email: user.email,
        metadata: {
          ...metadata,
          businessId,
          planId,
          userId: user.id,
        },
      }),
    });

    const paystackData = await paystackResponse.json();

    if (!paystackResponse.ok) {
      return NextResponse.json(
        { error: paystackData.message || 'Paystack error' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          authorizationUrl: paystackData.data.authorization_url,
          accessCode: paystackData.data.access_code,
          reference: paystackData.data.reference,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Payment initialization error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
