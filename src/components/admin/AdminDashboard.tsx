import { useState, useEffect } from 'react';
import { 
  Ticket, 
  Flag,
  Clock, 
  CheckCircle
} from 'lucide-react';
import { AdminDemoSeeder } from './AdminDemoSeeder';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AdminTicketList } from './AdminTicketList';
import { adminSupportApi } from '@/lib/api/admin-support';
import { getAdminUserReports, updateUserReportStatus } from '@/lib/api/user-reports';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface AdminTicket {
  id: string;
  title: string;
  description: string;
  type: string;
  status: string;
  priority: string;
  created_by: string;
  assigned_to?: string;
  bounty_id?: string;
  submission_id?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  internal_notes?: string;
  message_count: number;
  last_message_at?: string;
  last_message_preview?: string;
  creator_email: string;
  bounty_title?: string;
}

interface AdminUserReport {
  id: string;
  reporter_id: string;
  reported_user_id: string;
  report_type: string;
  description: string;
  bounty_id?: string;
  status: string;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  reporter_email: string;
  reported_user_email: string;
  bounty_title?: string;
}

export function AdminDashboard() {
  const [tickets, setTickets] = useState<AdminTicket[]>([]);
  const [userReports, setUserReports] = useState<AdminUserReport[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [ticketsData, reportsData] = await Promise.all([
        adminSupportApi.getAllTickets(),
        getAdminUserReports()
      ]);
      setTickets(ticketsData);
      setUserReports(reportsData);
    } catch (error) {
      console.error('Error loading admin data:', error);
      toast({
        title: "Error",
        description: "Failed to load admin data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReportStatusUpdate = async (reportId: string, status: string, notes?: string) => {
    try {
      await updateUserReportStatus(reportId, status, notes);
      await loadData(); // Refresh data
      toast({
        title: "Report updated",
        description: "The report status has been updated successfully.",
      });
    } catch (error) {
      console.error('Error updating report:', error);
      toast({
        title: "Error",
        description: "Failed to update report status.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const pendingTickets = tickets.filter(t => t.status === 'open' || t.status === 'in_progress');
  const pendingReports = userReports.filter(r => r.status === 'pending');

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tickets.length}</div>
            <p className="text-xs text-muted-foreground">
              {pendingTickets.length} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">User Reports</CardTitle>
            <Flag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userReports.length}</div>
            <p className="text-xs text-muted-foreground">
              {pendingReports.length} pending review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.4hrs</div>
            <p className="text-xs text-muted-foreground">
              24hrs target
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolution Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">94%</div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different admin functions */}
      <Tabs defaultValue="tickets" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tickets">Support Tickets</TabsTrigger>
          <TabsTrigger value="reports">User Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="tickets" className="space-y-4">
          <AdminTicketList />
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Reports</CardTitle>
              <CardDescription>
                Review and manage user reports for inappropriate behavior
              </CardDescription>
            </CardHeader>
            <CardContent>
              {userReports.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Flag className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No user reports found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {userReports.map((report) => (
                    <div key={report.id} className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 flex-1">
                          <p className="font-medium">
                            Report: {report.report_type.replace('_', ' ')}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            <strong>Reporter:</strong> {report.reporter_email}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            <strong>Reported User:</strong> {report.reported_user_email}
                          </p>
                          <p className="text-sm mt-2">
                            <strong>Description:</strong> {report.description}
                          </p>
                          {report.bounty_title && (
                            <p className="text-xs text-muted-foreground">
                              <strong>Related Bounty:</strong> {report.bounty_title}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2 ml-4">
                          <Badge variant={report.status === 'pending' ? 'default' : 'secondary'}>
                            {report.status}
                          </Badge>
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(report.created_at), 'MMM dd, yyyy')}
                          </div>
                        </div>
                      </div>
                      
                      {report.admin_notes && (
                        <div className="pt-2 border-t">
                          <p className="text-sm text-muted-foreground">
                            <strong>Admin Notes:</strong> {report.admin_notes}
                          </p>
                        </div>
                      )}

                      {report.status === 'pending' && (
                        <div className="pt-2 border-t flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleReportStatusUpdate(report.id, 'investigating', 'Under investigation')}
                          >
                            Investigate
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleReportStatusUpdate(report.id, 'resolved', 'Report reviewed and action taken')}
                          >
                            Resolve
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleReportStatusUpdate(report.id, 'dismissed', 'Report dismissed - no action needed')}
                          >
                            Dismiss
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Developer Tools Section */}
      <AdminDemoSeeder />
    </div>
  );
}