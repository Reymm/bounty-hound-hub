import { Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ReportUserDialog } from './ReportUserDialog';

interface ReportUserButtonProps {
  reportedUserId: string;
  reportedUserName?: string;
  bountyId?: string;
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'sm' | 'default';
}

export function ReportUserButton({ 
  reportedUserId, 
  reportedUserName, 
  bountyId,
  variant = 'ghost',
  size = 'sm'
}: ReportUserButtonProps) {
  return (
    <ReportUserDialog 
      reportedUserId={reportedUserId}
      reportedUserName={reportedUserName}
      bountyId={bountyId}
    >
      <Button variant={variant} size={size} className="text-muted-foreground hover:text-destructive">
        <Flag className="w-4 h-4 mr-1" />
        Report
      </Button>
    </ReportUserDialog>
  );
}