import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

interface AuthUser {
  id: string;
  username: string;
  displayName: string;
  role: 'faculty' | 'student';
  suffix?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  supabaseUser: User | null;
  loading: boolean;
  login: (username: string, password: string, role: 'faculty' | 'student') => Promise<void>;
  logout: () => Promise<void>;
}

  const fetchProfile = async (sbUser: User) => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', sbUser.id)
      .single();

    if (profile) {
      let suffix: string | undefined;
      if (profile.role === 'student') {
        const { data: student } = await supabase
          .from('students')
          .select('suffix')
          .eq('user_id', sbUser.id)
          .single();
        suffix = student?.suffix;
      }
      setUser({
        id: sbUser.id,
        username: profile.username,
        displayName: profile.display_name,
        role: profile.role as 'faculty' | 'student',
        suffix,
      });
    }
  };

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSupabaseUser(null);
  }, []);


  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setSupabaseUser(session.user);
        setTimeout(() => fetchProfile(session.user), 0);
      } else {
        setSupabaseUser(null);
        setUser(null);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setSupabaseUser(session.user);
        fetchProfile(session.user);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (username: string, password: string, role: 'faculty' | 'student') => {
    const email = role === 'faculty'
      ? `${username}@gvp.faculty`
      : `${username}@gvp.student`;

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ user, supabaseUser, loading, sessionRemaining, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
