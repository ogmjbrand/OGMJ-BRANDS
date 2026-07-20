import { createServerClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserServer as getCurrentUser } from '@/lib/auth.server';
import crypto from 'crypto';

function generateOrderNumber() {
  const stamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `OGMJ-${stamp}-${random}`;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const businessId = request.nextUrl.searchParams.get('businessId');
    if (!businessId) {
      return NextResponse.json({ error: 'Business ID required' }, { status: 400 });
    }

    const supabase = await createServerClient();

    const { data, error } = await supabase
      .from('marketplace_orders')
      .select('*, listing:marketplace_listings(id, title, slug, thumbnail_url)')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: data ?? [] }, { status: 200 });
  } catch (error) {
    console.error('Error listing marketplace orders:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { businessId, listingId, quantity = 1, requirements } = body;

    if (!businessId || !listingId) {
      return NextResponse.json({ error: 'Business ID and listing ID required' }, { status: 400 });
    }

    const supabase = await createServerClient();

    const { data: membership } = await supabase
      .from('business_users')
      .select('role')
      .eq('business_id', businessId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { data: listing, error: listingError } = await supabase
      .from('marketplace_listings')
      .select('id, price, sale_price, currency, delivery_days, status')
      .eq('id', listingId)
      .single();

    if (listingError || !listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }
    if ((listing as any).status !== 'active') {
      return NextResponse.json({ error: 'This listing is not currently available' }, { status: 400 });
    }

    const unitPrice = Number((listing as any).sale_price ?? (listing as any).price);
    const qty = Math.max(1, Number(quantity) || 1);
    const totalPrice = unitPrice * qty;
    const deliveryDays = (listing as any).delivery_days || 7;
    const deliveryDate = new Date(Date.now() + deliveryDays * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const { data, error } = await (supabase as any)
      .from('marketplace_orders')
      .insert({
        business_id: businessId,
        listing_id: listingId,
        buyer_id: user.id,
        order_number: generateOrderNumber(),
        quantity: qty,
        unit_price: unitPrice,
        total_price: totalPrice,
        currency: (listing as any).currency,
        requirements: requirements || null,
        delivery_date: deliveryDate,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data, message: 'Order placed' }, { status: 201 });
  } catch (error) {
    console.error('Error creating marketplace order:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
