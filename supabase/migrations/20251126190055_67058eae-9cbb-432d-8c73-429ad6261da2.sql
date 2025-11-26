-- Add requires_shipping field to Bounties table
ALTER TABLE "Bounties" 
ADD COLUMN requires_shipping boolean DEFAULT false;

-- Add tracking info to Submissions table
ALTER TABLE "Submissions"
ADD COLUMN tracking_number text,
ADD COLUMN shipped_at timestamp with time zone,
ADD COLUMN delivered_at timestamp with time zone;

-- Add dispute and revision tracking fields
ALTER TABLE "Submissions"
ADD COLUMN revision_requested boolean DEFAULT false,
ADD COLUMN revision_notes text,
ADD COLUMN dispute_opened boolean DEFAULT false,
ADD COLUMN dispute_reason text,
ADD COLUMN dispute_opened_at timestamp with time zone;

-- Add milestone support to Bounties
ALTER TABLE "Bounties"
ADD COLUMN has_milestones boolean DEFAULT false,
ADD COLUMN milestone_data jsonb;

-- Create milestones table for multi-phase bounties
CREATE TABLE IF NOT EXISTS public.bounty_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bounty_id uuid NOT NULL REFERENCES "Bounties"(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  amount numeric NOT NULL,
  order_index integer NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'submitted', 'completed', 'disputed')),
  submission_id uuid REFERENCES "Submissions"(id),
  created_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone
);

-- Enable RLS on milestones
ALTER TABLE public.bounty_milestones ENABLE ROW LEVEL SECURITY;

-- RLS policies for milestones
CREATE POLICY "Users can view milestones for bounties they can see"
  ON public.bounty_milestones FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "Bounties" b 
      WHERE b.id = bounty_id 
      AND (b.status = 'open' OR b.poster_id = auth.uid() OR EXISTS (
        SELECT 1 FROM "Submissions" s WHERE s.bounty_id = b.id AND s.hunter_id = auth.uid()
      ))
    )
  );

CREATE POLICY "Poster can manage their bounty milestones"
  ON public.bounty_milestones FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "Bounties" b 
      WHERE b.id = bounty_id AND b.poster_id = auth.uid()
    )
  );

-- Comments to describe the columns
COMMENT ON COLUMN "Bounties".requires_shipping IS 'Indicates if this bounty involves a physical item that needs shipping';
COMMENT ON COLUMN "Submissions".tracking_number IS 'Optional shipping tracking number provided by hunter';
COMMENT ON COLUMN "Submissions".shipped_at IS 'Timestamp when hunter marked item as shipped';
COMMENT ON COLUMN "Submissions".delivered_at IS 'Timestamp when poster confirmed delivery';
COMMENT ON COLUMN "Submissions".revision_requested IS 'Whether poster requested revisions before final acceptance';
COMMENT ON COLUMN "Submissions".dispute_opened IS 'Whether a formal dispute has been opened for this submission';
COMMENT ON COLUMN "Bounties".has_milestones IS 'Whether this bounty uses milestone-based payments';
COMMENT ON COLUMN "Bounties".milestone_data IS 'JSON data for milestone information (if not using separate table)';