import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { AdminPartnerManagement } from '@/components/admin/AdminPartnerManagement';
import { AdminPartnerApplications } from '@/components/admin/AdminPartnerApplications';
import { AdminPartnerPayouts } from '@/components/admin/AdminPartnerPayouts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, FileText, DollarSign } from 'lucide-react';

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
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Partner Management</h1>
        <p className="text-muted-foreground">
          Manage affiliate partners, applications, and payouts
        </p>
      </div>
      
      <Tabs defaultValue="partners" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="partners" className="gap-2">
            <Users className="h-4 w-4" />
            Partners
          </TabsTrigger>
          <TabsTrigger value="applications" className="gap-2">
            <FileText className="h-4 w-4" />
            Applications
          </TabsTrigger>
          <TabsTrigger value="payouts" className="gap-2">
            <DollarSign className="h-4 w-4" />
            Payouts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="partners">
          <AdminPartnerManagement />
        </TabsContent>

        <TabsContent value="applications">
          <AdminPartnerApplications />
        </TabsContent>

        <TabsContent value="payouts">
          <AdminPartnerPayouts />
        </TabsContent>
      </Tabs>
    </div>
  );
}