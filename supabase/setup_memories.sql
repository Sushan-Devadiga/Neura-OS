-- SQL script to create or update the Memories table

CREATE TABLE IF NOT EXISTS public.memories (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY
);

-- Safely add columns if the table already existed with a different schema
ALTER TABLE public.memories ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users;
ALTER TABLE public.memories ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.projects ON DELETE CASCADE;
ALTER TABLE public.memories ADD COLUMN IF NOT EXISTS content text;
ALTER TABLE public.memories ADD COLUMN IF NOT EXISTS category text DEFAULT 'fact';

-- Handle the importance column which might be an integer from an older schema
DO $$ 
BEGIN
  -- Check if importance is integer
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'memories' AND column_name = 'importance' AND data_type = 'integer'
  ) THEN
    ALTER TABLE public.memories ALTER COLUMN importance TYPE text USING (
      CASE 
        WHEN importance <= 1 THEN 'low'
        WHEN importance = 2 THEN 'medium'
        ELSE 'high'
      END
    );
  END IF;
END $$;

ALTER TABLE public.memories ADD COLUMN IF NOT EXISTS importance text DEFAULT 'medium';
ALTER TABLE public.memories ADD COLUMN IF NOT EXISTS is_pinned boolean DEFAULT false;
ALTER TABLE public.memories ADD COLUMN IF NOT EXISTS is_archived boolean DEFAULT false;
ALTER TABLE public.memories ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT timezone('utc'::text, now());
ALTER TABLE public.memories ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT timezone('utc'::text, now());

-- Handle legacy columns if they exist (they were causing a NOT NULL constraint violation)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'memories' AND column_name = 'workspace_id'
  ) THEN
    ALTER TABLE public.memories ALTER COLUMN workspace_id DROP NOT NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'memories' AND column_name = 'title'
  ) THEN
    ALTER TABLE public.memories ALTER COLUMN title DROP NOT NULL;
  END IF;
END $$;

-- Update any null values before we can make them NOT NULL (optional, but good practice)
-- (We'll just leave them nullable if they already existed, or set defaults for boolean/text)
UPDATE public.memories SET category = 'fact' WHERE category IS NULL;
UPDATE public.memories SET importance = 'medium' WHERE importance IS NULL;
UPDATE public.memories SET is_pinned = false WHERE is_pinned IS NULL;
UPDATE public.memories SET is_archived = false WHERE is_archived IS NULL;


-- Enable Row Level Security (RLS)
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any (to allow re-running this script)
DROP POLICY IF EXISTS "Users can view memories in their own projects" ON public.memories;
DROP POLICY IF EXISTS "Users can insert memories into their own projects" ON public.memories;
DROP POLICY IF EXISTS "Users can update their own memories" ON public.memories;
DROP POLICY IF EXISTS "Users can delete their own memories" ON public.memories;

-- RLS Policies
CREATE POLICY "Users can view memories in their own projects" 
ON public.memories FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert memories into their own projects" 
ON public.memories FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own memories" 
ON public.memories FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own memories" 
ON public.memories FOR DELETE 
USING (auth.uid() = user_id);

-- Trigger to automatically update 'updated_at' (reuses the existing handle_updated_at function)
DROP TRIGGER IF EXISTS on_memories_updated ON public.memories;
CREATE TRIGGER on_memories_updated
  BEFORE UPDATE ON public.memories
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
