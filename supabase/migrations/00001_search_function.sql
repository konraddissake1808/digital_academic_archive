-- Full-text search setup for the resources table
-- Run this in the Supabase SQL Editor after Prisma migrations

-- Add a generated tsvector column for full-text search
ALTER TABLE resources
ADD COLUMN IF NOT EXISTS fts tsvector
GENERATED ALWAYS AS (
  setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(description, '')), 'B')
) STORED;

-- Create a GIN index for fast full-text search
CREATE INDEX IF NOT EXISTS resources_fts_idx ON resources USING GIN (fts);

-- Create the RPC function callable from Supabase client
CREATE OR REPLACE FUNCTION search_resources(search_query text)
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  file_url text,
  cover_url text,
  price numeric,
  is_free boolean,
  is_published boolean,
  file_type text,
  category_id uuid,
  created_by_id uuid,
  created_at timestamptz,
  updated_at timestamptz,
  rank real
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.id,
    r.title,
    r.description,
    r.file_url,
    r.cover_url,
    r.price,
    r.is_free,
    r.is_published,
    r.file_type,
    r.category_id,
    r.created_by_id,
    r.created_at,
    r.updated_at,
    ts_rank(r.fts, websearch_to_tsquery('english', search_query)) AS rank
  FROM resources r
  WHERE r.is_published = true
    AND r.fts @@ websearch_to_tsquery('english', search_query)
  ORDER BY rank DESC;
END;
$$;
