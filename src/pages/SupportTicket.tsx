import { useParams } from 'react-router-dom';
import { TicketChat } from '@/components/support/TicketChat';

export function SupportTicket() {
  const { ticketId } = useParams<{ ticketId: string }>();

  if (!ticketId) {
    return <div>Invalid ticket ID</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <TicketChat ticketId={ticketId} />
    </div>
  );
}