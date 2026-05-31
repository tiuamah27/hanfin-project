// ============================================
// Auth Hook
// ============================================

import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/types';
import { useState, useEffect } from 'react';

export function useAuth() {
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    
    const init = async () => {
      const { data: { user: u } } = await supabase.auth.getUser();
      if (u) {
        setUser({ id: u.id, email: u.email });
        const { data: p } = await supabase.from('profiles').select('*').eq('id', u.id).single();
        if (p) {
          setProfile(p as Profile);
        } else {
          const name = u.email?.split('@')[0] || 'User';
          const { data: newP } = await supabase
            .from('profiles')
            .upsert({ id: u.id, name, role: 'husband' }, { onConflict: 'id' })
            .select('*')
            .single();
          setProfile((newP || { id: u.id, name, role: 'husband' }) as Profile);
        }
      }
      setLoading(false);
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
      } else if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  return { user, profile, loading, signOut };
}
