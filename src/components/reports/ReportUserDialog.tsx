import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Flag, Loader2 } from 'lucide-react';
import { createUserReport } from '@/lib/api/user-reports';
import { useToast } from '@/hooks/use-toast';

interface ReportUserDialogProps {
  reportedUserId: string;
  reportedUserName?: string;
  bountyId?: string;
  children?: React.ReactNode;
}

const REPORT_TYPES = [
  { value: 'fraud', label: 'Fraud or Scam' },
  { value: 'harassment', label: 'Harassment or Abuse' },
  { value: 'spam', label: 'Spam or Inappropriate Content' },
  { value: 'inappropriate_behavior', label: 'Inappropriate Behavior' },
  { value: 'non_delivery', label: 'Non-delivery of Services' },
  { value: 'other', label: 'Other' },
] as const;

export function ReportUserDialog({ 
  reportedUserId, 
  reportedUserName, 
  bountyId,
  children 
}: ReportUserDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState<string>('');
  const [description, setDescription] = useState('');

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to report a user.",
        variant: "destructive",
      });
      return;
    }

    if (!reportType || !description.trim()) {
      toast({
        title: "Missing information",
        description: "Please select a report type and provide a description.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await createUserReport({
        reported_user_id: reportedUserId,
        report_type: reportType as any,
        description: description.trim(),
        bounty_id: bountyId,
      });

      toast({
        title: "Report submitted",
        description: "Thank you for your report. Our team will review it shortly.",
      });

      setOpen(false);
      setReportType('');
      setDescription('');
    } catch (error) {
      console.error('Error submitting report:', error);
      toast({
        title: "Error",
        description: "Failed to submit report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Don't allow users to report themselves
  if (user?.id === reportedUserId) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive">
            <Flag className="w-4 h-4 mr-1" />
            Report User
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Report User</DialogTitle>
          <DialogDescription>
            Report {reportedUserName ? `"${reportedUserName}"` : 'this user'} for inappropriate behavior.
            All reports are reviewed by our support team.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="report-type">Report Type</Label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger>
                <SelectValue placeholder="Select reason for reporting" />
              </SelectTrigger>
              <SelectContent>
                {REPORT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Please provide details about why you're reporting this user..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-20"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={loading || !reportType || !description.trim()}
          >
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Submit Report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}