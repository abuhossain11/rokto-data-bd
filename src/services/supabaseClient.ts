import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Safe environment variable retrieval for Vite browser and Node.js/tsx environments
const getEnvVar = (key: string): string => {
  try {
    if (typeof import.meta !== 'undefined' && (import.meta as unknown as { env?: Record<string, string> }).env) {
      return (import.meta as unknown as { env: Record<string, string> }).env[key] || '';
    }
  } catch {
    // Ignore and fallback to process.env
  }
  try {
    if (typeof process !== 'undefined' && process.env) {
      return process.env[key] || '';
    }
  } catch {
    // Ignore
  }
  return '';
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY');


// Validate URL format safely
const isValidHttpUrl = (string: string) => {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  isValidHttpUrl(supabaseUrl) &&
  supabaseAnonKey &&
  supabaseAnonKey.length > 20 &&
  !supabaseUrl.includes('your-project-id')
);

// Instantiate real client if configured, otherwise initialize client with dummy URL for types/safe fallback
export const supabase: SupabaseClient = createClient(
  isSupabaseConfigured ? supabaseUrl : 'https://rokto-data-placeholder.supabase.co',
  isSupabaseConfigured ? supabaseAnonKey : 'placeholder-anon-key-placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

export interface SupabaseConfigStatus {
  isConfigured: boolean;
  hasUrl: boolean;
  hasAnonKey: boolean;
  urlHost?: string;
  authProviders: {
    phoneOtp: boolean;
    googleOAuth: boolean;
  };
  instructions: {
    bn: string;
    en: string;
  };
}

export const getSupabaseConfigStatus = (): SupabaseConfigStatus => {
  let urlHost: string | undefined;
  try {
    if (supabaseUrl && isValidHttpUrl(supabaseUrl)) {
      urlHost = new URL(supabaseUrl).host;
    }
  } catch {
    urlHost = undefined;
  }

  return {
    isConfigured: isSupabaseConfigured,
    hasUrl: Boolean(supabaseUrl && isValidHttpUrl(supabaseUrl) && !supabaseUrl.includes('your-project-id')),
    hasAnonKey: Boolean(supabaseAnonKey && supabaseAnonKey.length > 20 && !supabaseAnonKey.includes('your-anon-public-key')),
    urlHost,
    authProviders: {
      phoneOtp: true,
      googleOAuth: true,
    },
    instructions: {
      bn: isSupabaseConfigured
        ? 'সুপাবেস ডাটাবেজ সফলভাবে সংযুক্ত রয়েছে।'
        : 'সুপাবেস সংযোগের জন্য .env ফাইলে VITE_SUPABASE_URL ও VITE_SUPABASE_ANON_KEY যুক্ত করুন। বর্তমান মোডে সুরক্ষিত লোকাল স্টোরেজ ও ডেমো মোড সক্রিয় রয়েছে।',
      en: isSupabaseConfigured
        ? 'Supabase database is connected and active.'
        : 'Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file to enable live cloud sync. Local sandbox mode is currently active.',
    },
  };
};

// RPC helper: match donors nearby using PostGIS ST_DWithin
export const matchDonorsNearby = async (
  bloodGroup: string | null,
  lat: number,
  lng: number,
  radiusKm: number = 10
) => {
  if (!isSupabaseConfigured) return { data: null, error: new Error('Supabase not configured') };

  const { data, error } = await supabase.rpc('match_donors_nearby', {
    p_blood_group: bloodGroup,
    p_lat: lat,
    p_lng: lng,
    p_radius_km: radiusKm,
  });

  return { data, error };
};

// RPC helper: assign user role (Strictly server-checked; fails if caller is not super_admin)
export const assignUserRoleRpc = async (
  targetUserId: string,
  newRole: string,
  districtScope?: string
) => {
  if (!isSupabaseConfigured) return { data: null, error: new Error('Supabase not configured') };

  const { data, error } = await supabase.rpc('assign_user_role', {
    p_target_user_id: targetUserId,
    p_role: newRole,
    p_district_scope: districtScope || null,
  });

  return { data, error };
};
