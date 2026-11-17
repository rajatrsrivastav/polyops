import { profileSchema, type Profile } from '@/features/auth/schemas/profile-schema';
import { getSupabase } from '@/shared/lib/supabase';

export async function fetchProfile(userId: string): Promise<Profile> {
  const supabase = getSupabase();
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error('No profile found for this account. Ask the factory owner to set up your access.');
  }

  const parsed = profileSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error('Profile data is invalid. Contact support.');
  }

  return parsed.data;
}
