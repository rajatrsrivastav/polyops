import { getSupabase } from '@/shared/lib/supabase';
import type { Factory } from '@/shared/types/database';

export async function getFactory(factoryId: string): Promise<Factory> {
  const { data, error } = await getSupabase()
    .from('factories')
    .select('*')
    .eq('id', factoryId)
    .single();

  if (error) throw new Error(error.message);
  return data as Factory;
}
