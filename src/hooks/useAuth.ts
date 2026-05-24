// Extracted from App.tsx — auth session + role fetch.
// Single hook returns { session, authChecked, userRole, roleChecked }.

import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Role } from '../lib/roles';

export interface AuthState {
  session: Session | null;
  authChecked: boolean;
  userRole: Role | null;
  roleChecked: boolean;
}

export function useAuth(): AuthState {
  const [session, setSession] = useState<Session | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [userRole, setUserRole] = useState<Role | null>(null);
  const [roleChecked, setRoleChecked] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setAuthChecked(true);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthChecked(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      if (!sess) {
        setUserRole(null);
        setRoleChecked(false);
      }
    });
    return () => { sub.subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured || !session?.user) return;
    let cancelled = false;
    (async () => {
      const uid = session.user.id;
      const email = session.user.email ?? '';

      const { data: row } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', uid)
        .maybeSingle();

      if (cancelled) return;

      if (row?.role) {
        setUserRole(row.role as Role);
        setRoleChecked(true);
        return;
      }

      // First user bootstraps as admin
      const { count } = await supabase
        .from('user_profiles')
        .select('id', { count: 'exact', head: true });
      const firstUser = (count ?? 0) === 0;
      const newRole: Role = firstUser ? 'admin' : 'staff';

      const { error: insErr } = await supabase
        .from('user_profiles')
        .insert({ id: uid, email, role: newRole });
      if (insErr) console.error('Profile bootstrap failed:', insErr);

      if (!cancelled) {
        setUserRole(newRole);
        setRoleChecked(true);
      }
    })();
    return () => { cancelled = true; };
  }, [session?.user?.id]);

  return { session, authChecked, userRole, roleChecked };
}
