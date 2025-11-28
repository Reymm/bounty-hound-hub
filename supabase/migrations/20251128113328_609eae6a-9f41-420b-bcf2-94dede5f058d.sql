-- Add updated_at column to Submissions so existing update trigger works
ALTER TABLE public."Submissions"
ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();