import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';
import { toast } from 'sonner';

const SESSION_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes
const TICK_INTERVAL_MS = 1000;

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
  sessionRemaining: number; // seconds remaining
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
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const warningRef = useRef<ReturnType<typeof setTimeout>>();
  const tickRef = useRef<ReturnType<typeof setInterval>>();
  const deadlineRef = useRef<number>(Date.now() + SESSION_TIMEOUT_MS);

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

  // Session timeout: auto-logout after 10 min of inactivity
  const resetSessionTimer = useCallback(() => {
    clearTimeout(timeoutRef.current);
    clearTimeout(warningRef.current);

    // Warning at 9 minutes
    warningRef.current = setTimeout(() => {
      toast.warning('Session expiring in 1 minute', {
        description: 'Move your mouse or press a key to stay logged in.',
        duration: 10000,
      });
    }, SESSION_TIMEOUT_MS - 60 * 1000);

    // Auto-logout at 10 minutes
    timeoutRef.current = setTimeout(() => {
      toast.error('Session expired', {
        description: 'You have been logged out due to inactivity.',
        duration: 5000,
      });
      logout();
    }, SESSION_TIMEOUT_MS);
  }, [logout]);

  // Attach activity listeners when user is logged in
  useEffect(() => {
    if (!user) {
      clearTimeout(timeoutRef.current);
      clearTimeout(warningRef.current);
      return;
    }

    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove'];
    const handleActivity = () => resetSessionTimer();

    activityEvents.forEach(event => window.addEventListener(event, handleActivity, { passive: true }));
    resetSessionTimer(); // Start initial timer

    return () => {
      activityEvents.forEach(event => window.removeEventListener(event, handleActivity));
      clearTimeout(timeoutRef.current);
      clearTimeout(warningRef.current);
    };
  }, [user, resetSessionTimer]);

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
    <AuthContext.Provider value={{ user, supabaseUser, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
