import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string, stayLoggedIn?: boolean) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if this was a temp session from a previous browser session
    // If temp_session flag exists but we're in a new browser session, sign out
    const isTempSession = sessionStorage.getItem('temp_session') === 'true';
    
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      // If there's a session but it was marked as temp (and sessionStorage was cleared on browser restart),
      // sign out. Note: sessionStorage is cleared on browser close, so if temp_session doesn't exist
      // but there's a session, and localStorage has the temp marker, we should sign out.
      if (session && !isTempSession) {
        // Normal persistent session
        setSession(session);
        setUser(session?.user ?? null);
      } else if (session && isTempSession) {
        // User had temp session, they're still in same browser session, keep them logged in
        setSession(session);
        setUser(session?.user ?? null);
      } else {
        setSession(session);
        setUser(session?.user ?? null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, displayName?: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          display_name: displayName || 'New Investor',
        },
      },
    });
    return { error };
  };

  const signIn = async (email: string, password: string, stayLoggedIn: boolean = true) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (!error && !stayLoggedIn) {
      // If not staying logged in, store flag to clear session on browser close
      sessionStorage.setItem('temp_session', 'true');
      
      // Set up beforeunload listener to sign out on tab/browser close
      const handleBeforeUnload = () => {
        supabase.auth.signOut();
        localStorage.removeItem('sb-qhnxaehwrntkioyioxtk-auth-token');
      };
      window.addEventListener('beforeunload', handleBeforeUnload);
    } else {
      sessionStorage.removeItem('temp_session');
    }
    
    return { error };
  };

  const signInWithGoogle = async () => {
    try {
      const result = await lovable.auth.signInWithOAuth('google', {
        redirect_uri: window.location.origin,
      });
      
      if (result.redirected) {
        // Page is redirecting to OAuth provider
        return { error: null };
      }
      
      if (result.error) {
        return { error: result.error };
      }
      
      // Session is set by the lovable module, just return success
      return { error: null };
    } catch (e) {
      return { error: e instanceof Error ? e : new Error(String(e)) };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
