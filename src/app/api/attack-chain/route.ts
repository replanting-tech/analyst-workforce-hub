import { supabase } from '@/integrations/supabase/client';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('attack_stage_counts')
      .select('name,count');

    if (error) {
      throw error;
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Database Error:', error);
    return NextResponse.json({ message: 'Failed to fetch attack chain data' }, { status: 500 });
  }
}
