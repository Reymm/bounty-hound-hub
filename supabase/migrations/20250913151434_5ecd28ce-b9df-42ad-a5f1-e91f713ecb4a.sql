-- Create a trigger to automatically send welcome emails when users sign up
-- This will call the send-welcome-email edge function whenever a new user is created

CREATE OR REPLACE FUNCTION public.trigger_welcome_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  response_data jsonb;
BEGIN
  -- Call the send-welcome-email edge function
  SELECT 
    extensions.http_post(
      url := 'https://lenyuvobgktgdearflim.supabase.co/functions/v1/send-welcome-email',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := jsonb_build_object(
        'email', NEW.email,
        'full_name', COALESCE(NEW.raw_user_meta_data->>'full_name', '')
      )
    ) INTO response_data;
  
  -- Log the response for debugging
  RAISE LOG 'Welcome email trigger response: %', response_data;
  
  RETURN NEW;
EXCEPTION 
  WHEN OTHERS THEN
    -- Log error but don't fail the user creation
    RAISE LOG 'Welcome email trigger failed: %', SQLERRM;
    RETURN NEW;
END;
$function$;

-- Create the trigger on auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created_welcome_email ON auth.users;
CREATE TRIGGER on_auth_user_created_welcome_email
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.trigger_welcome_email();