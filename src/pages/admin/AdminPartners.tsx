import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { AdminPartnerManagement } from '@/components/admin/AdminPartnerManagement';
import { AdminPartnerApplications } from '@/components/admin/AdminPartnerApplications';

export function AdminPartners() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) {
        navigate('/auth');
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('is_support_admin')
        .eq('id', user.id)
        .single();

      if (error || !data?.is_support_admin) {
        navigate('/');
        return;
      }

      setIsAdmin(true);
      setLoading(false);
    };

    checkAdmin();
  }, [user, navigate]);

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl space-y-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Partner Management</h1>
        <p className="text-muted-foreground">
          Add and manage affiliate partners with custom commission rates
        </p>
      </div>
      
      <AdminPartnerApplications />
      <AdminPartnerManagement />
    </div>
  );
}