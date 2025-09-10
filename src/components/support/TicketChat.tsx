import { useEffect, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { supportApi, type SupportTicketWithMessages, type SupportMessage } from '@/lib/api/support';
import { useToast } from '@/hooks/use-toast';
import { 
  Send, 
  User, 
  UserCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  MessageSquare,
  ArrowLeft
} from 'lucide-react';
import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Link } from 'react-router-dom';

const messageSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty').max(2000, 'Message is too long')
});

type MessageFormData = z.infer<typeof messageSchema>;

interface TicketChatProps {
  ticketId: string;
}

const statusColors = {
  open: 'bg-blue-100 text-blue-800 border-blue-200',
  in_progress: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  waiting_for_user: 'bg-orange-100 text-orange-800 border-orange-200',
  resolved: 'bg-green-100 text-green-800 border-green-200',
  closed: 'bg-gray-100 text-gray-800 border-gray-200'
};

const statusLabels = {
  open: 'Open',
  in_progress: 'In Progress',
  waiting_for_user: 'Waiting for You',
  resolved: 'Resolved',
  closed: 'Closed'
};

export function TicketChat({ ticketId }: TicketChatProps) {
  const [ticket, setTicket] = useState<SupportTicketWithMessages | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const form = useForm<MessageFormData>({
    resolver: zodResolver(messageSchema),
    defaultValues: {
      message: ''
    }
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadTicket = async () => {
    try {
      setLoading(true);
      const data = await supportApi.getTicket(ticketId);
      if (!data) {
        toast({
          title: 'Not Found',
          description: 'Support ticket not found or you do not have permission to view it.',
          variant: 'destructive'
        });
        return;
      }
      setTicket(data);
    } catch (error) {
      console.error('Error loading ticket:', error);
      toast({
        title: 'Error',
        description: 'Failed to load support ticket. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: MessageFormData) => {
    if (!ticket) return;
    
    setSending(true);
    try {
      await supportApi.sendMessage(ticket.id, data.message);
      
      // Reload ticket to get updated messages
      await loadTicket();
      
      form.reset();
      toast({
        title: 'Message Sent',
        description: 'Your message has been sent successfully.'
      });
      
      // Scroll to bottom after a short delay to ensure new message is rendered
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    loadTicket();
  }, [ticketId]);

  useEffect(() => {
    if (ticket && ticket.messages.length > 0) {
      scrollToBottom();
    }
  }, [ticket]);

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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
          <h3 className="font-medium text-lg mb-2">Ticket Not Found</h3>
          <p className="text-muted-foreground mb-4">
            The support ticket you're looking for doesn't exist or you don't have permission to view it.
          </p>
          <Button asChild>
            <Link to="/support">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Support
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const StatusIcon = getStatusIcon(ticket.status);
  const canSendMessages = !['resolved', 'closed'].includes(ticket.status);

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="outline" asChild>
        <Link to="/support">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Support
        </Link>
      </Button>

      {/* Ticket Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <CardTitle className="text-xl">{ticket.title}</CardTitle>
              <CardDescription>{ticket.description}</CardDescription>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Created {format(new Date(ticket.created_at), 'MMM d, yyyy \'at\' h:mm a')}</span>
                {ticket.bounty && (
                  <>
                    <span>•</span>
                    <span>Related to bounty: {ticket.bounty.title}</span>
                  </>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge variant="outline" className={statusColors[ticket.status]}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {statusLabels[ticket.status]}
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Messages */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Conversation ({ticket.messages.length} {ticket.messages.length === 1 ? 'message' : 'messages'})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6 max-h-96 overflow-y-auto">
            {ticket.messages.map((message, index) => (
              <div key={message.id} className="flex gap-3">
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarFallback className={message.is_admin_reply ? "bg-primary text-primary-foreground" : "bg-secondary"}>
                    {message.is_admin_reply ? (
                      <UserCheck className="h-4 w-4" />
                    ) : (
                      <User className="h-4 w-4" />
                    )}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">
                      {message.is_admin_reply ? 'Support Team' : 'You'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(message.created_at), 'MMM d, h:mm a')}
                    </span>
                  </div>
                  
                  <div className={`p-3 rounded-lg text-sm ${
                    message.is_admin_reply 
                      ? 'bg-primary/10 border border-primary/20' 
                      : 'bg-muted border border-border'
                  }`}>
                    {message.message}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {canSendMessages && (
            <>
              <Separator className="my-6" />
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea
                            placeholder="Type your message here..."
                            className="min-h-20 resize-none"
                            disabled={sending}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-end">
                    <Button type="submit" disabled={sending}>
                      {sending ? (
                        <>
                          <Clock className="h-4 w-4 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Send Message
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </>
          )}

          {!canSendMessages && (
            <div className="mt-6 p-4 bg-muted rounded-lg text-center">
              <p className="text-sm text-muted-foreground">
                This ticket has been {ticket.status}. You can no longer send messages.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}