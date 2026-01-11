import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { 
  FileText, 
  Mail, 
  Globe, 
  Users, 
  Check, 
  X, 
  Eye,
  Loader2 
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PartnerApplication {
  id: string;
  name: string;
  email: string;
  business_name: string | null;
  website_url: string | null;
  social_media_handles: string | null;
  audience_size: string | null;
  message: string;
  status: string;
  admin_notes: string | null;
  created_at: string;
  reviewed_at: string | null;
}

export function AdminPartnerApplications() {
  const [applications, setApplications] = useState<PartnerApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<PartnerApplication | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [updating, setUpdating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('partner_applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (error) {
      console.error('Error loading applications:', error);
      toast({
        title: 'Error',
        description: 'Failed to load partner applications.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateApplicationStatus = async (appId: string, status: 'approved' | 'rejected') => {
    setUpdating(true);
    try {
      // Get the application details for the email
      const app = applications.find(a => a.id === appId);
      if (!app) throw new Error('Application not found');

      const { error } = await supabase
        .from('partner_applications')
        .update({
          status,
          admin_notes: adminNotes || null,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', appId);

      if (error) throw error;

      // Send email notification
      try {
        const emailResponse = await supabase.functions.invoke('send-partner-status-email', {
          body: {
            email: app.email,
            name: app.name,
            status,
          },
        });
        
        if (emailResponse.error) {
          console.error('Failed to send email:', emailResponse.error);
        }
      } catch (emailError) {
        console.error('Email notification failed:', emailError);
        // Don't fail the whole operation if email fails
      }

      toast({
        title: status === 'approved' ? 'Application approved' : 'Application rejected',
        description: status === 'approved' 
          ? 'Email sent! Remember to add them as a partner manually.' 
          : 'Email sent. The application has been rejected.',
      });

      setSelectedApp(null);
      setAdminNotes('');
      loadApplications();
    } catch (error) {
      console.error('Error updating application:', error);
      toast({
        title: 'Error',
        description: 'Failed to update application.',
        variant: 'destructive',
      });
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'approved':
        return <Badge className="bg-green-500/10 text-green-600 border-green-200">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getAudienceSizeLabel = (size: string | null) => {
    if (!size) return 'Not specified';
    const labels: Record<string, string> = {
      'under-1k': 'Under 1K',
      '1k-10k': '1K - 10K',
      '10k-50k': '10K - 50K',
      '50k-100k': '50K - 100K',
      '100k-500k': '100K - 500K',
      '500k+': '500K+',
    };
    return labels[size] || size;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const pendingCount = applications.filter(a => a.status === 'pending').length;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Partner Applications
            {pendingCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {pendingCount} pending
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Review and manage incoming partner applications
          </CardDescription>
        </CardHeader>
        <CardContent>
          {applications.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No applications yet</p>
              <p className="text-sm">Partner applications will appear here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {applications.map((app) => (
                <div
                  key={app.id}
                  className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">{app.name}</span>
                        {getStatusBadge(app.status)}
                        {app.business_name && (
                          <span className="text-sm text-muted-foreground">
                            ({app.business_name})
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3.5 w-3.5" />
                          {app.email}
                        </span>
                        {app.website_url && (
                          <a
                            href={app.website_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 hover:text-foreground"
                          >
                            <Globe className="h-3.5 w-3.5" />
                            Website
                          </a>
                        )}
                        {app.audience_size && (
                          <span className="flex items-center gap-1">
                            <Users className="h-3.5 w-3.5" />
                            {getAudienceSizeLabel(app.audience_size)}
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {app.message}
                      </p>

                      <p className="text-xs text-muted-foreground">
                        Applied {format(new Date(app.created_at), 'MMM d, yyyy')}
                      </p>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedApp(app);
                        setAdminNotes(app.admin_notes || '');
                      }}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Review
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedApp} onOpenChange={(open) => !open && setSelectedApp(null)}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review Application</DialogTitle>
            <DialogDescription>
              {selectedApp?.name} - {selectedApp?.email}
            </DialogDescription>
          </DialogHeader>

          {selectedApp && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-muted-foreground">Business Name</p>
                  <p>{selectedApp.business_name || 'Not provided'}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Audience Size</p>
                  <p>{getAudienceSizeLabel(selectedApp.audience_size)}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Website</p>
                  {selectedApp.website_url ? (
                    <a
                      href={selectedApp.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {selectedApp.website_url}
                    </a>
                  ) : (
                    <p>Not provided</p>
                  )}
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Social Media</p>
                  <p>{selectedApp.social_media_handles || 'Not provided'}</p>
                </div>
              </div>

              <div>
                <p className="font-medium text-muted-foreground mb-1">Message</p>
                <div className="p-3 bg-muted rounded-lg text-sm whitespace-pre-wrap">
                  {selectedApp.message}
                </div>
              </div>

              <div>
                <p className="font-medium text-muted-foreground mb-1">Admin Notes</p>
                <Textarea
                  placeholder="Add internal notes about this application..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            {selectedApp?.status === 'pending' ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => updateApplicationStatus(selectedApp.id, 'rejected')}
                  disabled={updating}
                  className="text-destructive hover:text-destructive"
                >
                  <X className="h-4 w-4 mr-1" />
                  Reject
                </Button>
                <Button
                  onClick={() => updateApplicationStatus(selectedApp.id, 'approved')}
                  disabled={updating}
                >
                  {updating ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4 mr-1" />
                  )}
                  Approve
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={() => setSelectedApp(null)}>
                Close
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
