import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';
import { toast } from 'sonner';

const SESSION_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

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
  sessionRemaining: number;
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
  const [sessionRemaining, setSessionRemaining] = useState(SESSION_TIMEOUT_MS / 1000);
  const deadlineRef = useRef<number>(Date.now() + SESSION_TIMEOUT_MS);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const tickRef = useRef<ReturnType<typeof setInterval>>();

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

  // Fixed 10-minute session timer — only for students, not faculty
  useEffect(() => {
    if (!user) {
      clearTimeout(timeoutRef.current);
      clearInterval(tickRef.current);
      setSessionRemaining(SESSION_TIMEOUT_MS / 1000);
      return;
    }

    // Faculty has no session timeout
    if (user.role === 'faculty') {
      clearTimeout(timeoutRef.current);
      clearInterval(tickRef.current);
      setSessionRemaining(-1); // -1 signals no timeout
      return;
    }

    deadlineRef.current = Date.now() + SESSION_TIMEOUT_MS;
    setSessionRemaining(SESSION_TIMEOUT_MS / 1000);

    timeoutRef.current = setTimeout(() => {
      toast.error('Session expired', {
        description: 'You have been logged out. Please log in again.',
        duration: 5000,
      });
      logout();
    }, SESSION_TIMEOUT_MS);

    tickRef.current = setInterval(() => {
      const remaining = Math.max(0, Math.round((deadlineRef.current - Date.now()) / 1000));
      setSessionRemaining(remaining);
    }, 1000);

    return () => {
      clearTimeout(timeoutRef.current);
      clearInterval(tickRef.current);
    };
  }, [user, logout]);

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