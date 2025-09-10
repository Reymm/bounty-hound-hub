import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { adminSupportApi } from '@/lib/api/admin-support';
import { useToast } from '@/hooks/use-toast';
import { 
  MessageSquare, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  TrendingUp,
  Calendar,
  Bug,
  DollarSign,
  Shield,
  Star,
  HelpCircle
} from 'lucide-react';

interface AdminStats {
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  resolvedTickets: number;
  criticalTickets: number;
  thisWeekTickets: number;
  ticketsByType: {
    platform_issue: number;
    bounty_dispute: number;
    submission_dispute: number;
    payment_issue: number;
    account_issue: number;
    bug_report: number;
    feature_request: number;
    other: number;
  };
}

const typeIcons = {
  platform_issue: AlertTriangle,
  bounty_dispute: Shield,
  submission_dispute: Shield,
  payment_issue: DollarSign,
  account_issue: MessageSquare,
  bug_report: Bug,
  feature_request: Star,
  other: HelpCircle
};

const typeLabels = {
  platform_issue: 'Platform Issues',
  bounty_dispute: 'Bounty Disputes',
  submission_dispute: 'Submission Disputes',
  payment_issue: 'Payment Issues',
  account_issue: 'Account Issues',
  bug_report: 'Bug Reports',
  feature_request: 'Feature Requests',
  other: 'Other'
};

export function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadStats = async () => {
    try {
      const data = await adminSupportApi.getAdminStats();
      setStats(data);
    } catch (error) {
      console.error('Error loading admin stats:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard statistics.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

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

  if (!stats) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-destructive" />
          <h3 className="font-medium text-lg mb-2">Unable to Load Stats</h3>
          <p className="text-muted-foreground">
            There was an error loading the dashboard statistics.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTickets}</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.openTickets}</div>
            <p className="text-xs text-muted-foreground">Need attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.inProgressTickets}</div>
            <p className="text-xs text-muted-foreground">Being worked on</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Priority</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.criticalTickets}</div>
            <p className="text-xs text-muted-foreground">Urgent attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Activity and Type Breakdown */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>Ticket metrics for the current week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">New This Week</span>
                </div>
                <Badge variant="outline">{stats.thisWeekTickets}</Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">Resolved</span>
                </div>
                <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                  {stats.resolvedTickets}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">Resolution Rate</span>
                </div>
                <Badge variant="outline">
                  {stats.totalTickets > 0 
                    ? Math.round((stats.resolvedTickets / stats.totalTickets) * 100)
                    : 0}%
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ticket Types Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Tickets by Type
            </CardTitle>
            <CardDescription>Distribution of support request categories</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(stats.ticketsByType)
                .filter(([, count]) => count > 0)
                .sort(([, a], [, b]) => b - a)
                .map(([type, count]) => {
                  const Icon = typeIcons[type as keyof typeof typeIcons];
                  const label = typeLabels[type as keyof typeof typeLabels];
                  const percentage = stats.totalTickets > 0 ? (count / stats.totalTickets) * 100 : 0;
                  
                  return (
                    <div key={type} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-sm text-muted-foreground">
                          {percentage.toFixed(1)}%
                        </div>
                        <Badge variant="outline">{count}</Badge>
                      </div>
                    </div>
                  );
                })}
              
              {Object.values(stats.ticketsByType).every(count => count === 0) && (
                <div className="text-center text-muted-foreground text-sm py-4">
                  No tickets yet
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common support management tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <div>
                <div className="font-medium text-sm">Critical Tickets</div>
                <div className="text-xs text-muted-foreground">
                  {stats.criticalTickets} require immediate attention
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <Clock className="h-5 w-5 text-yellow-500" />
              <div>
                <div className="font-medium text-sm">Pending Response</div>
                <div className="text-xs text-muted-foreground">
                  {stats.openTickets} tickets waiting for response
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <div>
                <div className="font-medium text-sm">This Week</div>
                <div className="text-xs text-muted-foreground">
                  {stats.thisWeekTickets} new tickets created
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}