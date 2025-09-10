import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { supportApi, type SupportTicket, type SupportTicketType, type SupportTicketStatus, type SupportTicketPriority } from '@/lib/api/support';
import { useToast } from '@/hooks/use-toast';
import { 
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
  HelpCircle
} from 'lucide-react';
import { format } from 'date-fns';

interface TicketListProps {
  onTicketSelect?: (ticketId: string) => void;
}

const ticketTypeIcons: Record<SupportTicketType, React.ComponentType<any>> = {
  platform_issue: AlertCircle,
  bounty_dispute: Shield,
  submission_dispute: Shield,
  payment_issue: DollarSign,
  account_issue: MessageSquare,
  bug_report: Bug,
  feature_request: Star,
  other: HelpCircle
};

const statusColors: Record<SupportTicketStatus, string> = {
  open: 'bg-blue-100 text-blue-800 border-blue-200',
  in_progress: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  waiting_for_user: 'bg-orange-100 text-orange-800 border-orange-200',
  resolved: 'bg-green-100 text-green-800 border-green-200',
  closed: 'bg-gray-100 text-gray-800 border-gray-200'
};

const priorityColors: Record<SupportTicketPriority, string> = {
  low: 'bg-gray-100 text-gray-600 border-gray-200',
  medium: 'bg-blue-100 text-blue-700 border-blue-200',
  high: 'bg-orange-100 text-orange-700 border-orange-200',
  critical: 'bg-red-100 text-red-700 border-red-200'
};

const statusLabels: Record<SupportTicketStatus, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  waiting_for_user: 'Waiting for You',
  resolved: 'Resolved',
  closed: 'Closed'
};

const priorityLabels: Record<SupportTicketPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical'
};

const typeLabels: Record<SupportTicketType, string> = {
  platform_issue: 'Platform Issue',
  bounty_dispute: 'Bounty Dispute',
  submission_dispute: 'Submission Dispute',
  payment_issue: 'Payment Issue',
  account_issue: 'Account Issue',
  bug_report: 'Bug Report',
  feature_request: 'Feature Request',
  other: 'Other'
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

export function TicketList({ onTicketSelect }: TicketListProps) {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadTickets = async () => {
    try {
      setLoading(true);
      const data = await supportApi.getUserTickets();
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

  const getStatusIcon = (status: SupportTicketStatus) => {
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

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <TicketSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="font-medium text-lg mb-2">No support tickets yet</h3>
          <p className="text-muted-foreground mb-4">
            When you create support tickets, they'll appear here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {tickets.map((ticket) => {
        const TypeIcon = ticketTypeIcons[ticket.type];
        const StatusIcon = getStatusIcon(ticket.status);
        
        return (
          <Card key={ticket.id} className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-3 flex-1 min-w-0">
                  <div className="flex items-start gap-3">
                    <TypeIcon className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-lg leading-tight truncate">
                        {ticket.title}
                      </h3>
                      <p className="text-muted-foreground text-sm mt-1 line-clamp-2">
                        {ticket.description}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{typeLabels[ticket.type]}</span>
                    <span>•</span>
                    <span>Created {format(new Date(ticket.created_at), 'MMM d, yyyy')}</span>
                    <span>•</span>
                    <span>Updated {format(new Date(ticket.updated_at), 'MMM d, h:mm a')}</span>
                  </div>
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
                </div>
              </div>

              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  {ticket.bounty_id && (
                    <span>Related to bounty</span>
                  )}
                  {ticket.submission_id && (
                    <span>Related to submission</span>
                  )}
                  {!ticket.bounty_id && !ticket.submission_id && (
                    <span>General support</span>
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="ml-auto"
                >
                  <Link to={`/support/${ticket.id}`}>
                    View Messages
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}