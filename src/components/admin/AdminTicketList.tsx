import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { adminSupportApi, type AdminTicketOverview } from '@/lib/api/admin-support';
import { useToast } from '@/hooks/use-toast';
import { 
  Search,
  Filter,
  MessageSquare, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  XCircle,
  ChevronRight,
  Bug,
  DollarSign,
  Shield,
  Star,
  HelpCircle,
  User
} from 'lucide-react';
import { format } from 'date-fns';

const ticketTypeIcons = {
  platform_issue: AlertCircle,
  bounty_dispute: Shield,
  submission_dispute: Shield,
  payment_issue: DollarSign,
  account_issue: MessageSquare,
  bug_report: Bug,
  feature_request: Star,
  other: HelpCircle
};

const statusColors = {
  open: 'bg-blue-100 text-blue-800 border-blue-200',
  in_progress: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  waiting_for_user: 'bg-orange-100 text-orange-800 border-orange-200',
  resolved: 'bg-green-100 text-green-800 border-green-200',
  closed: 'bg-gray-100 text-gray-800 border-gray-200'
};

const priorityColors = {
  low: 'bg-gray-100 text-gray-600 border-gray-200',
  medium: 'bg-blue-100 text-blue-700 border-blue-200',
  high: 'bg-orange-100 text-orange-700 border-orange-200',
  critical: 'bg-red-100 text-red-700 border-red-200'
};

const statusLabels = {
  open: 'Open',
  in_progress: 'In Progress',
  waiting_for_user: 'Waiting for User',
  resolved: 'Resolved',
  closed: 'Closed'
};

const priorityLabels = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical'
};

function TicketSkeleton() {
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

export function AdminTicketList() {
  const [tickets, setTickets] = useState<AdminTicketOverview[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const { toast } = useToast();

  const loadTickets = async () => {
    try {
      setLoading(true);
      const data = await adminSupportApi.getAllTickets();
      setTickets(data);
    } catch (error) {
      console.error('Error loading tickets:', error);
      toast({
        title: 'Error',
        description: 'Failed to load support tickets. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return MessageSquare;
      case 'in_progress':
        return Clock;
      case 'waiting_for_user':
        return AlertCircle;
      case 'resolved':
        return CheckCircle2;
      case 'closed':
        return XCircle;
      default:
        return MessageSquare;
    }
  };

  // Filter tickets based on search and filters
  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = searchQuery === '' || 
      ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.creator_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <TicketSkeleton key={i} />
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
                placeholder="Search tickets, users, or content..."
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
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="waiting_for_user">Waiting for User</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          {filteredTickets.length} ticket{filteredTickets.length !== 1 ? 's' : ''} 
          {searchQuery && ` matching "${searchQuery}"`}
        </h2>
        <Button onClick={loadTickets} variant="outline" size="sm">
          Refresh
        </Button>
      </div>

      {/* Tickets */}
      <div className="space-y-4">
        {filteredTickets.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="font-medium text-lg mb-2">No tickets found</h3>
              <p className="text-muted-foreground">
                {searchQuery || statusFilter !== 'all' || priorityFilter !== 'all'
                  ? 'Try adjusting your filters or search terms.'
                  : 'All support tickets will appear here when users create them.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredTickets.map((ticket) => {
            const TypeIcon = ticketTypeIcons[ticket.type];
            const StatusIcon = getStatusIcon(ticket.status);
            
            return (
              <Card key={ticket.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-3 flex-1 min-w-0">
                      <div className="flex items-start gap-3">
                        <TypeIcon className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-lg leading-tight">
                            {ticket.title}
                          </h3>
                          <p className="text-muted-foreground text-sm mt-1 line-clamp-2">
                            {ticket.description}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {ticket.creator_email}
                        </div>
                        <span>•</span>
                        <span>{ticket.message_count} message{ticket.message_count !== 1 ? 's' : ''}</span>
                        <span>•</span>
                        <span>Created {format(new Date(ticket.created_at), 'MMM d')}</span>
                        {ticket.last_message_at && (
                          <>
                            <span>•</span>
                            <span>Last activity {format(new Date(ticket.last_message_at), 'MMM d, h:mm a')}</span>
                          </>
                        )}
                      </div>

                      {ticket.last_message_preview && (
                        <div className="text-sm text-muted-foreground bg-muted p-2 rounded border-l-2 border-primary/20">
                          <span className="font-medium">Latest: </span>
                          {ticket.last_message_preview.substring(0, 100)}
                          {ticket.last_message_preview.length > 100 && '...'}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-2 ml-4 flex-shrink-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={statusColors[ticket.status]}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusLabels[ticket.status]}
                        </Badge>
                      </div>
                      
                      <Badge variant="outline" className={priorityColors[ticket.priority]}>
                        {priorityLabels[ticket.priority]} Priority
                      </Badge>

                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="mt-2"
                      >
                        <Link to={`/admin/support/${ticket.id}`}>
                          Manage
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Link>
                      </Button>
                    </div>
                  </div>

                  {(ticket.bounty_title || ticket.internal_notes) && (
                    <div className="flex items-center justify-between mt-4 pt-4 border-t">
                      <div className="text-sm text-muted-foreground">
                        {ticket.bounty_title && (
                          <span>Related to bounty: {ticket.bounty_title}</span>
                        )}
                        {ticket.internal_notes && (
                          <span className="text-amber-600">Has internal notes</span>
                        )}
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