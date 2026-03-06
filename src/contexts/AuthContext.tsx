import React, { createContext, useContext, useEffect, useState } from 'react';
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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setSupabaseUser(session.user);
        // Use setTimeout to avoid deadlock with Supabase auth
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
      ? `${username}@edutrack.faculty`
      : `${username}@edutrack.student`;

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSupabaseUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, supabaseUser, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
