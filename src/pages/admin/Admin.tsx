import { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { AdminTicketList } from '@/components/admin/AdminTicketList';
import { AdminUserReportsList } from '@/components/admin/AdminUserReportsList';
import { AdminFinances } from '@/components/admin/AdminFinances';
import { AdminPartnerManagement } from '@/components/admin/AdminPartnerManagement';
import { AdminPartnerPayouts } from '@/components/admin/AdminPartnerPayouts';
import { AdminPartnerApplications } from '@/components/admin/AdminPartnerApplications';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  LayoutDashboard, 
  DollarSign,
  MessageSquare, 
  Shield,
  Users,
  AlertTriangle
} from 'lucide-react';

export function Admin() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  const setActiveTab = (tab: string) => {
    setSearchParams({ tab });
  };

  useEffect(() => {
    if (loading) return;
    
    if (!user) {
      setIsAdmin(false);
      navigate('/');
      return;
    }

    const checkAdminAccess = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('is_support_admin')
          .eq('id', user.id)
          .single();

        console.log('Admin check for user:', user.id, 'result:', data, 'error:', error);
        
        const hasAccess = data?.is_support_admin || false;
        setIsAdmin(hasAccess);
        
        if (!hasAccess) {
          toast({
            title: 'Access Denied',
            description: 'You do not have admin permissions.',
            variant: 'destructive'
          });
          navigate('/');
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
        navigate('/');
      }
    };

    checkAdminAccess();
  }, [user, loading, toast, navigate]);

  if (isAdmin === null) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Checking permissions...</p>
          </div>
        </div>
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="text-center py-12">
            <Shield className="h-12 w-12 mx-auto mb-4 text-destructive" />
            <h3 className="font-medium text-lg mb-2">Access Denied</h3>
            <p className="text-muted-foreground">
              You do not have permission to access the admin area.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        </div>
        <p className="text-muted-foreground">
          Platform management and finances
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <LayoutDashboard className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="finances" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Finances
          </TabsTrigger>
          <TabsTrigger value="tickets" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Tickets
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Reports
          </TabsTrigger>
          <TabsTrigger value="partners" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Partners
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <AdminDashboard />
        </TabsContent>

        <TabsContent value="finances" className="space-y-6">
          <AdminFinances />
        </TabsContent>

        <TabsContent value="tickets" className="space-y-6">
          <AdminTicketList />
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <AdminUserReportsList />
        </TabsContent>

        <TabsContent value="partners" className="space-y-6">
          <Tabs defaultValue="applications" className="space-y-4">
            <TabsList>
              <TabsTrigger value="applications">Applications</TabsTrigger>
              <TabsTrigger value="management">Partners</TabsTrigger>
              <TabsTrigger value="payouts">Payouts</TabsTrigger>
            </TabsList>
            <TabsContent value="applications">
              <AdminPartnerApplications />
            </TabsContent>
            <TabsContent value="management">
              <AdminPartnerManagement />
            </TabsContent>
            <TabsContent value="payouts">
              <AdminPartnerPayouts />
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>
    </div>
  );
}
