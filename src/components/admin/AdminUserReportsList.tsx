import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { getAdminUserReports, updateUserReportStatus, type AdminUserReport } from '@/lib/api/user-reports';
import { useToast } from '@/hooks/use-toast';
import { 
  Search,
  Filter,
  Flag, 
  CheckCircle2, 
  AlertCircle, 
  Clock,
  User,
  FileText,
  ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';

const reportTypeLabels = {
  spam: 'Spam',
  fraud: 'Fraud',
  harassment: 'Harassment',
  inappropriate_content: 'Inappropriate Content',
  suspicious_activity: 'Suspicious Activity',
  other: 'Other'
};

const reportTypeColors = {
  spam: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  fraud: 'bg-red-100 text-red-800 border-red-200',
  harassment: 'bg-orange-100 text-orange-800 border-orange-200',
  inappropriate_content: 'bg-purple-100 text-purple-800 border-purple-200',
  suspicious_activity: 'bg-amber-100 text-amber-800 border-amber-200',
  other: 'bg-gray-100 text-gray-800 border-gray-200'
};

const statusColors = {
  pending: 'bg-blue-100 text-blue-800 border-blue-200',
  investigating: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  resolved: 'bg-green-100 text-green-800 border-green-200',
  dismissed: 'bg-gray-100 text-gray-800 border-gray-200'
};

function ReportSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-1/4" />
          </div>
          <div className="flex flex-col items-end gap-2">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-6 w-12" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ReportDetailDialog({ report, onStatusUpdate }: { report: AdminUserReport; onStatusUpdate: () => void }) {
  const [status, setStatus] = useState(report.status);
  const [adminNotes, setAdminNotes] = useState(report.admin_notes || '');
  const [updating, setUpdating] = useState(false);
  const { toast } = useToast();

  const handleUpdate = async () => {
    try {
      setUpdating(true);
      await updateUserReportStatus(report.id, status, adminNotes);
      toast({
        title: 'Success',
        description: 'Report updated successfully',
      });
      onStatusUpdate();
    } catch (error) {
      console.error('Error updating report:', error);
      toast({
        title: 'Error',
        description: 'Failed to update report',
        variant: 'destructive'
      });
    } finally {
      setUpdating(false);
    }
  };

  return (
    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>User Report Details</DialogTitle>
      </DialogHeader>
      
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold mb-2">Report Type</h3>
          <Badge variant="outline" className={reportTypeColors[report.report_type]}>
            {reportTypeLabels[report.report_type]}
          </Badge>
        </div>

        <div>
          <h3 className="font-semibold mb-2">Reporter</h3>
          <p className="text-sm text-muted-foreground">{report.reporter_email}</p>
        </div>

        <div>
          <h3 className="font-semibold mb-2">Reported User</h3>
          <p className="text-sm text-muted-foreground">{report.reported_user_email}</p>
        </div>

        {report.bounty_title && (
          <div>
            <h3 className="font-semibold mb-2">Related Bounty</h3>
            <Link 
              to={`/b/${report.bounty_id}`}
              className="text-sm text-primary hover:underline"
            >
              {report.bounty_title}
            </Link>
          </div>
        )}

        <div>
          <h3 className="font-semibold mb-2">Description</h3>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{report.description}</p>
        </div>

        <div>
          <h3 className="font-semibold mb-2">Reported On</h3>
          <p className="text-sm text-muted-foreground">
            {format(new Date(report.created_at), 'MMM d, yyyy h:mm a')}
          </p>
        </div>

        <div className="border-t pt-4">
          <h3 className="font-semibold mb-2">Admin Actions</h3>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="investigating">Investigating</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="dismissed">Dismissed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Admin Notes</label>
              <Textarea
                placeholder="Add internal notes about this report..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={4}
              />
            </div>

            <Button 
              onClick={handleUpdate} 
              disabled={updating}
              className="w-full"
            >
              {updating ? 'Updating...' : 'Update Report'}
            </Button>
          </div>
        </div>
      </div>
    </DialogContent>
  );
}

export function AdminUserReportsList() {
  const [reports, setReports] = useState<AdminUserReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const { toast } = useToast();

  const loadReports = async () => {
    try {
      setLoading(true);
      const data = await getAdminUserReports();
      setReports(data);
    } catch (error) {
      console.error('Error loading reports:', error);
      toast({
        title: 'Error',
        description: 'Failed to load user reports. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return Clock;
      case 'investigating':
        return AlertCircle;
      case 'resolved':
        return CheckCircle2;
      case 'dismissed':
        return FileText;
      default:
        return Clock;
    }
  };

  // Filter reports based on search and filters
  const filteredReports = reports.filter(report => {
    const matchesSearch = searchQuery === '' || 
      report.reporter_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.reported_user_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || report.status === statusFilter;
    const matchesType = typeFilter === 'all' || report.report_type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <ReportSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search reports by email or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="investigating">Investigating</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="dismissed">Dismissed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="spam">Spam</SelectItem>
                <SelectItem value="fraud">Fraud</SelectItem>
                <SelectItem value="harassment">Harassment</SelectItem>
                <SelectItem value="inappropriate_content">Inappropriate Content</SelectItem>
                <SelectItem value="suspicious_activity">Suspicious Activity</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          {filteredReports.length} report{filteredReports.length !== 1 ? 's' : ''} 
          {searchQuery && ` matching "${searchQuery}"`}
        </h2>
        <Button onClick={loadReports} variant="outline" size="sm">
          Refresh
        </Button>
      </div>

      {/* Reports */}
      <div className="space-y-4">
        {filteredReports.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Flag className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="font-medium text-lg mb-2">No reports found</h3>
              <p className="text-muted-foreground">
                {searchQuery || statusFilter !== 'all' || typeFilter !== 'all'
                  ? 'Try adjusting your filters or search terms.'
                  : 'All user reports will appear here when users report others.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredReports.map((report) => {
            const StatusIcon = getStatusIcon(report.status);
            
            return (
              <Card key={report.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-3 flex-1 min-w-0">
                      <div className="flex items-start gap-3">
                        <Flag className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className={reportTypeColors[report.report_type]}>
                              {reportTypeLabels[report.report_type]}
                            </Badge>
                          </div>
                          <p className="text-muted-foreground text-sm mt-1 line-clamp-2">
                            {report.description}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          Reporter: {report.reporter_email}
                        </div>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          Reported: {report.reported_user_email}
                        </div>
                        <span>•</span>
                        <span>{format(new Date(report.created_at), 'MMM d, yyyy')}</span>
                      </div>

                      {report.bounty_title && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">Related bounty: </span>
                          <Link 
                            to={`/b/${report.bounty_id}`}
                            className="text-primary hover:underline"
                          >
                            {report.bounty_title}
                          </Link>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-2 ml-4 flex-shrink-0">
                      <Badge variant="outline" className={statusColors[report.status]}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                      </Badge>

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2"
                          >
                            Review
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        </DialogTrigger>
                        <ReportDetailDialog report={report} onStatusUpdate={loadReports} />
                      </Dialog>
                    </div>
                  </div>

                  {report.admin_notes && (
                    <div className="mt-4 pt-4 border-t">
                      <div className="text-sm">
                        <span className="font-medium text-amber-600">Admin Notes: </span>
                        <span className="text-muted-foreground">{report.admin_notes}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
