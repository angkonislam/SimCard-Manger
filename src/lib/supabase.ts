import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials missing. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment.');
}

export const isSupabaseConfigured = Boolean(
  import.meta.env.VITE_SUPABASE_URL &&
  import.meta.env.VITE_SUPABASE_ANON_KEY &&
  !import.meta.env.VITE_SUPABASE_URL.includes('placeholder')
);

const STAY_SIGNED_IN_KEY = 'app:staySignedIn';

// Storage adapter: if "stay signed in" is true → localStorage (persists across browser restarts).
// Otherwise → sessionStorage (cleared when tab/browser closes).
const adaptiveStorage = {
  getItem: (key: string) => {
    if (typeof window === 'undefined') return null;
    const stay = localStorage.getItem(STAY_SIGNED_IN_KEY) === 'true';
    return (stay ? localStorage : sessionStorage).getItem(key);
  },
  setItem: (key: string, value: string) => {
    if (typeof window === 'undefined') return;
    const stay = localStorage.getItem(STAY_SIGNED_IN_KEY) === 'true';
    (stay ? localStorage : sessionStorage).setItem(key, value);
    // Clean up the other store so a stale token can't leak after a preference change.
    (stay ? sessionStorage : localStorage).removeItem(key);
  },
  removeItem: (key: string) => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  },
};

export const setStaySignedIn = (value: boolean) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STAY_SIGNED_IN_KEY, value ? 'true' : 'false');
};

export const getStaySignedIn = (): boolean => {
  if (typeof window === 'undefined') return true;
  const v = localStorage.getItem(STAY_SIGNED_IN_KEY);
  return v === null ? true : v === 'true';
};

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder_key',
  {
    auth: {
      storage: adaptiveStorage,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);
