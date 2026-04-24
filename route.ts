import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { businessName, industry, country, currency, type = 'service_provider' } = body

    if (!businessName?.trim()) {
      return NextResponse.json({ error: 'Business name is required' }, { status: 400 })
    }

    // Check if user already has a business (one business per user per unique constraint)
    const { data: existing } = await supabase
      .from('businesses')
      .select('id, slug')
      .eq('owner_id', user.id)
      .maybeSingle()

    if (existing) {
      // Update existing business instead of inserting
      const { data, error } = await supabase
        .from('businesses')
        .update({
          business_name: businessName.trim(),
          name: businessName.trim(),
          industry: industry || '',
          country: country || 'Nigeria',
          currency: currency || 'NGN',
          type,
          onboarding_step: 3,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) return NextResponse.json({ error: error.message }, { status: 400 })
      return NextResponse.json({ success: true, business: data, action: 'updated' })
    }

    // Insert new business
    const { data, error } = await supabase
      .from('businesses')
      .insert({
        business_name: businessName.trim(),
        name: businessName.trim(),
        industry: industry || '',
        country: country || 'Nigeria',
        currency: currency || 'NGN',
        type,
        owner_id: user.id,
        user_id: user.id,
        created_by: user.id,
        status: 'active',
        onboarding_step: 3,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ success: true, business: data, action: 'created' }, { status: 201 })

  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data, error } = await supabase
      .from('businesses')
      .select('*')
      .eq('owner_id', user.id)
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 404 })
    return NextResponse.json({ business: data })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
