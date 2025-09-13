-- Continue fixing remaining functions with search_path issues

CREATE OR REPLACE FUNCTION public.update_submission_status(submission_id uuid, new_status text, rejection_reason text DEFAULT NULL::text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  -- Check if user is the bounty poster
  IF NOT EXISTS (
    SELECT 1 FROM public."Submissions" s
    JOIN public."Bounties" b ON b.id = s.bounty_id
    WHERE s.id = submission_id AND b.poster_id = auth.uid()
  ) THEN
    RETURN false;
  END IF;

  -- Update the submission
  UPDATE public."Submissions"
  SET 
    status = new_status,
    rejection_reason = CASE WHEN new_status = 'rejected' THEN rejection_reason ELSE NULL END
  WHERE id = submission_id;

  RETURN FOUND;
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $function$
BEGIN
  new.updated_at = now();
  return new;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  insert into public.profiles (id, full_name, avatar_url, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name',''),
    coalesce(new.raw_user_meta_data->>'avatar_url',''),
    null
  );
  return new;
END;
$function$;

CREATE OR REPLACE FUNCTION public.increment_bounty_views_secure(bounty_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  -- Only allow incrementing view_count, nothing else
  UPDATE public."Bounties" 
  SET view_count = COALESCE(view_count, 0) + 1 
  WHERE id = bounty_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $function$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.increment_bounty_views(bounty_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  UPDATE public."Bounties" 
  SET view_count = COALESCE(view_count, 0) + 1 
  WHERE id = bounty_id;
END;
$function$;