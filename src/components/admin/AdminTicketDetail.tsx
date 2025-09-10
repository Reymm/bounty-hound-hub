import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { adminSupportApi, type AdminTicketDetails, type SupportTicketStatus, type SupportTicketPriority } from '@/lib/api/admin-support';
import type { SupportMessage } from '@/lib/api/support';
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
  ArrowLeft,
  Save,
  ExternalLink,
  Edit3
} from 'lucide-react';
import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Link } from 'react-router-dom';

const messageSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty').max(2000, 'Message is too long')
});

const notesSchema = z.object({
  notes: z.string().max(1000, 'Notes are too long')
});

type MessageFormData = z.infer<typeof messageSchema>;
type NotesFormData = z.infer<typeof notesSchema>;

interface AdminTicketDetailProps {
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

export function AdminTicketDetail({ ticketId }: AdminTicketDetailProps) {
  const [ticket, setTicket] = useState<AdminTicketDetails | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const { toast } = useToast();

  const messageForm = useForm<MessageFormData>({
    resolver: zodResolver(messageSchema),
    defaultValues: { message: '' }
  });

  const notesForm = useForm<NotesFormData>({
    resolver: zodResolver(notesSchema),
    defaultValues: { notes: '' }
  });

  const loadTicketData = async () => {
    try {
      setLoading(true);
      const [ticketData, messagesData] = await Promise.all([
        adminSupportApi.getTicketDetails(ticketId),
        adminSupportApi.getTicketMessages(ticketId)
      ]);

      if (!ticketData) {
        toast({
          title: 'Not Found',
          description: 'Support ticket not found.',
          variant: 'destructive'
        });
        return;
      }

      setTicket(ticketData);
      setMessages(messagesData);
      notesForm.setValue('notes', ticketData.internal_notes || '');
    } catch (error) {
      console.error('Error loading ticket data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load ticket data. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTicketData();
  }, [ticketId]);

  const onSendMessage = async (data: MessageFormData) => {
    if (!ticket) return;
    
    setSending(true);
    try {
      await adminSupportApi.sendAdminMessage(ticket.id, data.message);
      await loadTicketData(); // Reload to get updated messages
      messageForm.reset();
      toast({
        title: 'Message Sent',
        description: 'Your reply has been sent successfully.'
      });
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

  const onUpdateStatus = async (newStatus: SupportTicketStatus) => {
    if (!ticket) return;
    
    setUpdating(true);
    try {
      await adminSupportApi.updateTicketStatus(ticket.id, newStatus);
      setTicket({ ...ticket, status: newStatus });
      toast({
        title: 'Status Updated',
        description: `Ticket status changed to ${statusLabels[newStatus]}.`
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update ticket status.',
        variant: 'destructive'
      });
    } finally {
      setUpdating(false);
    }
  };

  const onUpdatePriority = async (newPriority: SupportTicketPriority) => {
    if (!ticket) return;
    
    setUpdating(true);
    try {
      await adminSupportApi.updateTicketPriority(ticket.id, newPriority);
      setTicket({ ...ticket, priority: newPriority });
      toast({
        title: 'Priority Updated',
        description: `Ticket priority changed to ${priorityLabels[newPriority]}.`
      });
    } catch (error) {
      console.error('Error updating priority:', error);
      toast({
        title: 'Error',
        description: 'Failed to update ticket priority.',
        variant: 'destructive'
      });
    } finally {
      setUpdating(false);
    }
  };

  const onSaveNotes = async (data: NotesFormData) => {
    if (!ticket) return;
    
    setUpdating(true);
    try {
      await adminSupportApi.updateInternalNotes(ticket.id, data.notes);
      setTicket({ ...ticket, internal_notes: data.notes });
      setEditingNotes(false);
      toast({
        title: 'Notes Saved',
        description: 'Internal notes have been updated.'
      });
    } catch (error) {
      console.error('Error saving notes:', error);
      toast({
        title: 'Error',
        description: 'Failed to save internal notes.',
        variant: 'destructive'
      });
    } finally {
      setUpdating(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return MessageSquare;
      case 'in_progress': return Clock;
      case 'waiting_for_user': return AlertCircle;
      case 'resolved': return CheckCircle2;
      case 'closed': return XCircle;
      default: return MessageSquare;
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
            The support ticket you're looking for doesn't exist.
          </p>
          <Button asChild>
            <Link to="/admin/support">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Tickets
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const StatusIcon = getStatusIcon(ticket.status);

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="outline" asChild>
        <Link to="/admin/support">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to All Tickets
        </Link>
      </Button>

      {/* Ticket Header & Actions */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <CardTitle className="text-xl">{ticket.title}</CardTitle>
                  <CardDescription>{ticket.description}</CardDescription>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-3 w-3" />
                    <span>{ticket.creator_email}</span>
                    {ticket.creator_username && (
                      <>
                        <span>•</span>
                        <span>@{ticket.creator_username}</span>
                      </>
                    )}
                    <span>•</span>
                    <span>Created {format(new Date(ticket.created_at), 'MMM d, yyyy \'at\' h:mm a')}</span>
                  </div>
                  {ticket.bounty_title && (
                    <div className="flex items-center gap-2 text-sm">
                      <ExternalLink className="h-3 w-3" />
                      <span>Related bounty: {ticket.bounty_title}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Actions Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={ticket.status} onValueChange={onUpdateStatus} disabled={updating}>
                <SelectTrigger>
                  <div className="flex items-center gap-2">
                    <StatusIcon className="h-4 w-4" />
                    <span>{statusLabels[ticket.status]}</span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="waiting_for_user">Waiting for User</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Priority</label>
              <Select value={ticket.priority} onValueChange={onUpdatePriority} disabled={updating}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Internal Notes</label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingNotes(!editingNotes)}
                >
                  <Edit3 className="h-3 w-3" />
                </Button>
              </div>
              
              {editingNotes ? (
                <Form {...notesForm}>
                  <form onSubmit={notesForm.handleSubmit(onSaveNotes)} className="space-y-2">
                    <FormField
                      control={notesForm.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Textarea
                              placeholder="Add internal notes..."
                              className="min-h-20 text-sm"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex gap-2">
                      <Button type="submit" size="sm" disabled={updating}>
                        <Save className="h-3 w-3 mr-1" />
                        Save
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingNotes(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </Form>
              ) : (
                <div className="text-sm text-muted-foreground bg-muted p-3 rounded">
                  {ticket.internal_notes || 'No internal notes yet.'}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Messages */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Conversation ({messages.length} message{messages.length !== 1 ? 's' : ''})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6 max-h-96 overflow-y-auto mb-6">
            {messages.map((message) => (
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
                      {message.is_admin_reply ? 'Support Team' : ticket.creator_email}
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
          </div>

          <Separator className="mb-6" />
          
          <Form {...messageForm}>
            <form onSubmit={messageForm.handleSubmit(onSendMessage)} className="space-y-4">
              <FormField
                control={messageForm.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reply to {ticket.creator_email}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Type your reply here..."
                        className="min-h-24 resize-none"
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
                      Send Reply
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}