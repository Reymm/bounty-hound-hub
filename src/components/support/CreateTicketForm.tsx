import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { supportApi, type SupportTicketType, type SupportTicketPriority } from '@/lib/api/support';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const createTicketSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  type: z.enum(['platform_issue', 'bounty_dispute', 'submission_dispute', 'payment_issue', 'account_issue', 'bug_report', 'feature_request', 'other']),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  bounty_id: z.string().optional(),
  submission_id: z.string().optional()
});

type CreateTicketFormData = z.infer<typeof createTicketSchema>;

interface CreateTicketFormProps {
  onSuccess?: () => void;
  preselectedBountyId?: string;
  preselectedSubmissionId?: string;
}

const ticketTypeLabels: Record<SupportTicketType, string> = {
  platform_issue: 'Platform Issue',
  bounty_dispute: 'Bounty Dispute',
  submission_dispute: 'Submission Dispute',
  payment_issue: 'Payment Issue',
  account_issue: 'Account / Privacy Request',
  bug_report: 'Bug Report',
  feature_request: 'Feature Request',
  other: 'Other'
};

const priorityLabels: Record<SupportTicketPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical'
};

export function CreateTicketForm({ onSuccess, preselectedBountyId, preselectedSubmissionId }: CreateTicketFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bounties, setBounties] = useState<Array<{ id: string; title: string }>>([]);
  const [submissions, setSubmissions] = useState<Array<{ id: string; message: string; bounty_title: string }>>([]);
  const [showRelatedItems, setShowRelatedItems] = useState(false);
  const { toast } = useToast();

  const form = useForm<CreateTicketFormData>({
    resolver: zodResolver(createTicketSchema),
    defaultValues: {
      title: '',
      description: '',
      type: 'platform_issue',
      priority: 'medium',
      bounty_id: preselectedBountyId || undefined,
      submission_id: preselectedSubmissionId || undefined
    }
  });

  // Load related items when needed
  const loadRelatedItems = async () => {
    if (showRelatedItems) return;
    
    try {
      const [bountiesData, submissionsData] = await Promise.all([
        supportApi.getUserBountiesForTicket(),
        supportApi.getUserSubmissionsForTicket()
      ]);
      setBounties(bountiesData);
      setSubmissions(submissionsData);
      setShowRelatedItems(true);
    } catch (error) {
      console.error('Error loading related items:', error);
    }
  };

  const onSubmit = async (data: CreateTicketFormData) => {
    setIsSubmitting(true);
    try {
      // Ensure required fields are present
      const ticketData = {
        title: data.title,
        description: data.description,
        type: data.type,
        priority: data.priority,
        bounty_id: data.bounty_id || null,
        submission_id: data.submission_id || null
      };
      
      await supportApi.createTicket(ticketData);
      toast({
        title: 'Ticket Created',
        description: 'Your support ticket has been created successfully. We will respond within 24-48 hours.'
      });
      form.reset();
      onSuccess?.();
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast({
        title: 'Error',
        description: 'Failed to create support ticket. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedType = form.watch('type');
  const showBountySelection = ['bounty_dispute', 'payment_issue'].includes(selectedType);
  const showSubmissionSelection = ['submission_dispute', 'payment_issue'].includes(selectedType);

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Create Support Ticket</CardTitle>
        <CardDescription>
          Describe your issue and we'll help you resolve it. We respond within 24-48 hours.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Brief description of your issue" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Issue Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select issue type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(ticketTypeLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(priorityLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {(showBountySelection || showSubmissionSelection) && (
              <div className="space-y-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={loadRelatedItems}
                  className="w-full"
                >
                  Load Related Items
                </Button>

                {showRelatedItems && showBountySelection && (
                  <FormField
                    control={form.control}
                    name="bounty_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Related Bounty (Optional)</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select related bounty" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">No bounty selected</SelectItem>
                            {bounties.map((bounty) => (
                              <SelectItem key={bounty.id} value={bounty.id}>
                                {bounty.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {showRelatedItems && showSubmissionSelection && (
                  <FormField
                    control={form.control}
                    name="submission_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Related Submission (Optional)</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select related submission" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">No submission selected</SelectItem>
                            {submissions.map((submission) => (
                              <SelectItem key={submission.id} value={submission.id}>
                                {submission.bounty_title} - {submission.message.substring(0, 50)}...
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            )}

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Please provide a detailed description of your issue, including any relevant steps or information that might help us assist you."
                      className="min-h-32"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Ticket
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}