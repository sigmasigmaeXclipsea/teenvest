import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

/**
 * OAuth callback handler. Supabase redirects here with #access_token=...
 * The client recovers the session from the hash, then we redirect to /dashboard.
 */
const AuthCallbackPage = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let tid: ReturnType<typeof setTimeout>;
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) navigate('/dashboard', { replace: true });
      }
    );

    tid = setTimeout(() => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) navigate('/dashboard', { replace: true });
        else setError('Sign-in could not be completed. Please try again.');
      });
    }, 2500);

    return () => {
      clearTimeout(tid);
      subscription.unsubscribe();
    };
  }, [navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-4 bg-background">
        <p className="text-destructive text-center">{error}</p>
        <a href="/login" className="text-primary hover:underline">Back to login</a>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-4 bg-background">
      <Loader2 className="w-10 h-10 animate-spin text-primary" />
      <p className="text-muted-foreground">Completing sign in...</p>
    </div>
  );
};

export default AuthCallbackPage;
