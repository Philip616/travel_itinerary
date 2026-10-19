import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { 
  supabase, 
  isSupabaseConfigured, 
  signInWithGoogle as apiSignInWithGoogle, 
  signInWithFacebook as apiSignInWithFacebook, 
  signOutUser as apiSignOutUser 
} from '@/lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isConfigured: boolean;
  userName: string;
  userAvatar: string;
  userEmail: string;
  provider: string;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  signInWithFacebook: () => Promise<{ error: string | null }>;
  signOut: () => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  isConfigured: false,
  userName: '',
  userAvatar: '',
  userEmail: '',
  provider: '',
  signInWithGoogle: async () => ({ error: 'Not initialized' }),
  signInWithFacebook: async () => ({ error: 'Not initialized' }),
  signOut: async () => ({ error: null }),
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    // 1. 初始化讀取當前 Session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    }).catch((err) => {
      console.warn('取得 Supabase Auth Session 失敗:', err);
      setLoading(false);
    });

    // 2. 監聽登入/登出狀態即時變更
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = async () => {
    return await apiSignInWithGoogle();
  };

  const signInWithFacebook = async () => {
    return await apiSignInWithFacebook();
  };

  const signOut = async () => {
    const res = await apiSignOutUser();
    setUser(null);
    setSession(null);
    return res;
  };

  const userName = useMemo(() => {
    if (!user) return '';
    return (
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.user_metadata?.user_name ||
      user.email?.split('@')[0] ||
      '旅行者'
    );
  }, [user]);

  const userAvatar = useMemo(() => {
    if (!user) return '';
    return (
      user.user_metadata?.avatar_url ||
      user.user_metadata?.picture ||
      ''
    );
  }, [user]);

  const userEmail = useMemo(() => {
    return user?.email || '';
  }, [user]);

  const provider = useMemo(() => {
    if (!user) return '';
    return (user.app_metadata?.provider as string) || '';
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        isConfigured: isSupabaseConfigured,
        userName,
        userAvatar,
        userEmail,
        provider,
        signInWithGoogle,
        signInWithFacebook,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
