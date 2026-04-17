import { createServerClient } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';
import { createSuccessResponse, handleApiError } from '@/lib/utils/api';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('status', 'active')
      .order('price', { ascending: true });

    if (error) {
      throw error;
    }

    return createSuccessResponse(data || []);
  } catch (error) {
    return handleApiError(error);
  }
}
