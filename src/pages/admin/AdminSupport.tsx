import { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { AdminTicketList } from '@/components/admin/AdminTicketList';
import { AdminUserReportsList } from '@/components/admin/AdminUserReportsList';
import { adminSupportApi } from '@/lib/api/admin-support';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart3, 
  MessageSquare, 
  Settings,
  Shield,
  AlertTriangle
} from 'lucide-react';

export function AdminSupport() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        const hasAccess = await adminSupportApi.checkAdminStatus();
        setIsAdmin(hasAccess);
        
        if (!hasAccess) {
          toast({
            title: 'Access Denied',
            description: 'You do not have admin permissions to access this area.',
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
  }, [toast, navigate]);

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
          <h1 className="text-3xl font-bold">Support Admin</h1>
        </div>
        <p className="text-muted-foreground">
          Manage support tickets, respond to users, and monitor support metrics.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="tickets" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Support Tickets
          </TabsTrigger>
          <TabsTrigger value="disputes" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Disputes
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            User Reports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <AdminDashboard />
        </TabsContent>

        <TabsContent value="tickets" className="space-y-6">
          <AdminTicketList />
        </TabsContent>

        <TabsContent value="disputes" className="space-y-6">
          <Button onClick={() => navigate('/admin/disputes')} className="w-full">
            View All Disputed Submissions
          </Button>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <AdminUserReportsList />
        </TabsContent>
      </Tabs>
    </div>
  );
}