
-- Add full-text search vector column to Bounties
ALTER TABLE public."Bounties" ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Populate search_vector for existing rows
UPDATE public."Bounties" SET search_vector = 
  to_tsvector('english', 
    COALESCE(title, '') || ' ' || 
    COALESCE(description, '') || ' ' || 
    COALESCE(category, '') || ' ' || 
    COALESCE(subcategory, '') || ' ' ||
    COALESCE(array_to_string(tags, ' '), '')
  );

-- Create GIN index for fast full-text search
CREATE INDEX IF NOT EXISTS idx_bounties_search_vector ON public."Bounties" USING GIN(search_vector);

-- Create trigger to auto-update search_vector on INSERT/UPDATE
CREATE OR REPLACE FUNCTION public.update_bounty_search_vector()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  NEW.search_vector := to_tsvector('english',
    COALESCE(NEW.title, '') || ' ' ||
    COALESCE(NEW.description, '') || ' ' ||
    COALESCE(NEW.category, '') || ' ' ||
    COALESCE(NEW.subcategory, '') || ' ' ||
    COALESCE(array_to_string(NEW.tags, ' '), '')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_bounties_search_vector
  BEFORE INSERT OR UPDATE OF title, description, category, subcategory, tags
  ON public."Bounties"
  FOR EACH ROW
  EXECUTE FUNCTION public.update_bounty_search_vector();

-- Create RPC function for full-text search
CREATE OR REPLACE FUNCTION public.search_bounties_fts(
  search_query text,
  category_filter text DEFAULT NULL,
  status_filter text DEFAULT 'open',
  result_limit integer DEFAULT 50,
  result_offset integer DEFAULT 0
)
RETURNS TABLE(
  id uuid,
  title text,
  description text,
  amount numeric,
  category text,
  subcategory text,
  images text[],
  tags text[],
  location text,
  deadline timestamptz,
  status text,
  poster_id uuid,
  created_at timestamp,
  view_count integer,
  requires_shipping boolean,
  hunter_purchases_item boolean,
  rank real
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id,
    b.title,
    b.description,
    b.amount,
    b.category,
    b.subcategory,
    b.images,
    b.tags,
    b.location,
    b.deadline,
    b.status,
    b.poster_id,
    b.created_at,
    b.view_count,
    b.requires_shipping,
    b.hunter_purchases_item,
    ts_rank(b.search_vector, plainto_tsquery('english', search_query)) as rank
  FROM public."Bounties" b
  WHERE 
    b.search_vector @@ plainto_tsquery('english', search_query)
    AND (status_filter IS NULL OR b.status = status_filter)
    AND (category_filter IS NULL OR b.category = category_filter)
    AND b.shipping_details IS NULL  -- Don't expose shipping details
  ORDER BY rank DESC, b.created_at DESC
  LIMIT result_limit
  OFFSET result_offset;
END;
$$;
