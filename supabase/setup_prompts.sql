-- SQL script to create the Prompts table for the Prompt Library

CREATE TABLE IF NOT EXISTS public.prompts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  description text,
  folder text DEFAULT 'General',
  category text,
  tags text[] DEFAULT '{}'::text[],
  is_favorite boolean DEFAULT false NOT NULL,
  is_archived boolean DEFAULT false NOT NULL,
  version integer DEFAULT 1 NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Safely add columns if table existed
ALTER TABLE public.prompts ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users;
ALTER TABLE public.prompts ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE public.prompts ADD COLUMN IF NOT EXISTS content text;
ALTER TABLE public.prompts ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.prompts ADD COLUMN IF NOT EXISTS folder text DEFAULT 'General';
ALTER TABLE public.prompts ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE public.prompts ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}'::text[];
ALTER TABLE public.prompts ADD COLUMN IF NOT EXISTS is_favorite boolean DEFAULT false;
ALTER TABLE public.prompts ADD COLUMN IF NOT EXISTS is_archived boolean DEFAULT false;
ALTER TABLE public.prompts ADD COLUMN IF NOT EXISTS version integer DEFAULT 1;
ALTER TABLE public.prompts ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT timezone('utc'::text, now());
ALTER TABLE public.prompts ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT timezone('utc'::text, now());

-- Enable RLS
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view their own prompts" ON public.prompts;
CREATE POLICY "Users can view their own prompts" 
ON public.prompts FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own prompts" ON public.prompts;
CREATE POLICY "Users can insert their own prompts" 
ON public.prompts FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own prompts" ON public.prompts;
CREATE POLICY "Users can update their own prompts" 
ON public.prompts FOR UPDATE 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own prompts" ON public.prompts;
CREATE POLICY "Users can delete their own prompts" 
ON public.prompts FOR DELETE 
USING (auth.uid() = user_id);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS on_prompts_updated ON public.prompts;
CREATE TRIGGER on_prompts_updated
  BEFORE UPDATE ON public.prompts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
