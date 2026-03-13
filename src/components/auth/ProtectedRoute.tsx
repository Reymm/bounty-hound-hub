import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowIncompleteProfile?: boolean;
}

export function ProtectedRoute({ children, allowIncompleteProfile = false }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [profileCheck, setProfileCheck] = useState<{ loading: boolean; hasUsername: boolean }>({
    loading: true,
    hasUsername: false,
  });

  useEffect(() => {
    if (!user) {
      setProfileCheck({ loading: false, hasUsername: false });
      return;
    }

    const checkUsername = async () => {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', user.id)
          .single();

        setProfileCheck({
          loading: false,
          hasUsername: !!data?.username,
        });
      } catch {
        setProfileCheck({ loading: false, hasUsername: false });
      }
    };

    checkUsername();
  }, [user]);

  if (loading || profileCheck.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth?tab=signin" state={{ from: location }} replace />;
  }

  // If user has no username and isn't already on the setup page/admin routes,
  // redirect unless this route explicitly allows incomplete profiles.
  if (!profileCheck.hasUsername && !allowIncompleteProfile && location.pathname !== '/setup' && !location.pathname.startsWith('/admin')) {
    return <Navigate to="/setup" replace />;
  }

  return <>{children}</>;
}
