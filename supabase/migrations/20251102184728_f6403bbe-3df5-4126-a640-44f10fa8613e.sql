-- Create trigger function to send email when support ticket is created
CREATE OR REPLACE FUNCTION public.notify_support_ticket_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  creator_email text;
  creator_username text;
  admin_email text;
BEGIN
  -- Get ticket creator info
  SELECT au.email, p.username
  INTO creator_email, creator_username
  FROM auth.users au
  LEFT JOIN public.profiles p ON au.id = p.id
  WHERE au.id = NEW.created_by;
  
  -- Get admin email (you'll need to update this with your actual admin email)
  admin_email := 'admin@bountybay.co'; -- TODO: Update with actual admin email
  
  -- Call the notification edge function via HTTP
  PERFORM
    net.http_post(
      url := 'https://lenyuvobgktgdearflim.supabase.co/functions/v1/send-notification-email',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := jsonb_build_object(
        'type', 'support_ticket_created',
        'recipientEmail', admin_email,
        'recipientName', 'Admin',
        'senderName', COALESCE(creator_username, creator_email),
        'ticketId', NEW.id::text,
        'ticketTitle', NEW.title,
        'ticketDescription', NEW.description,
        'ticketType', NEW.type::text
      )
    );
  
  RETURN NEW;
EXCEPTION 
  WHEN OTHERS THEN
    -- Log error but don't fail the ticket creation
    RAISE WARNING 'Support ticket notification failed: %', SQLERRM;
    RETURN NEW;
END;
$function$;

-- Create trigger on support_tickets table
DROP TRIGGER IF EXISTS trigger_support_ticket_notification ON public.support_tickets;

CREATE TRIGGER trigger_support_ticket_notification
AFTER INSERT ON public.support_tickets
FOR EACH ROW
EXECUTE FUNCTION public.notify_support_ticket_created();