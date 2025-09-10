import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { AdminTicketDetail } from '@/components/admin/AdminTicketDetail';
import { adminSupportApi } from '@/lib/api/admin-support';
import { useToast } from '@/hooks/use-toast';
import { Shield, AlertTriangle } from 'lucide-react';

export function AdminSupportTicket() {
  const { ticketId } = useParams<{ ticketId: string }>();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
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

  if (!ticketId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="text-center py-12">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-destructive" />
            <h3 className="font-medium text-lg mb-2">Invalid Ticket</h3>
            <p className="text-muted-foreground">
              No ticket ID was provided.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

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
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <AdminTicketDetail ticketId={ticketId} />
    </div>
  );
}