-- SQL script to create or update the Knowledge Graph tables

-- 1. Create knowledge_nodes table
CREATE TABLE IF NOT EXISTS public.knowledge_nodes (
  id uuid PRIMARY KEY, -- We'll use the original entity's UUID as the node ID
  project_id uuid REFERENCES public.projects ON DELETE CASCADE NOT NULL,
  entity_type text NOT NULL, -- 'project', 'note', 'document', 'task', 'memory', 'chat'
  entity_id uuid, -- Reference to the original item (often same as id)
  label text NOT NULL, -- Title or preview content
  metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Safely add columns if the table already existed with a different schema
ALTER TABLE public.knowledge_nodes ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.projects ON DELETE CASCADE;
ALTER TABLE public.knowledge_nodes ADD COLUMN IF NOT EXISTS entity_type text;
ALTER TABLE public.knowledge_nodes ADD COLUMN IF NOT EXISTS entity_id uuid;
ALTER TABLE public.knowledge_nodes ADD COLUMN IF NOT EXISTS label text;
ALTER TABLE public.knowledge_nodes ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;
ALTER TABLE public.knowledge_nodes ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT timezone('utc'::text, now());
ALTER TABLE public.knowledge_nodes ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT timezone('utc'::text, now());

-- 2. Create knowledge_edges table
CREATE TABLE IF NOT EXISTS public.knowledge_edges (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid REFERENCES public.projects ON DELETE CASCADE NOT NULL,
  source_id uuid REFERENCES public.knowledge_nodes(id) ON DELETE CASCADE NOT NULL,
  target_id uuid REFERENCES public.knowledge_nodes(id) ON DELETE CASCADE NOT NULL,
  relation_type text NOT NULL, -- 'contains', 'references', 'generates', etc.
  weight float DEFAULT 1.0 NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.knowledge_edges ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.projects ON DELETE CASCADE;
ALTER TABLE public.knowledge_edges ADD COLUMN IF NOT EXISTS source_id uuid REFERENCES public.knowledge_nodes(id) ON DELETE CASCADE;
ALTER TABLE public.knowledge_edges ADD COLUMN IF NOT EXISTS target_id uuid REFERENCES public.knowledge_nodes(id) ON DELETE CASCADE;
ALTER TABLE public.knowledge_edges ADD COLUMN IF NOT EXISTS relation_type text;
ALTER TABLE public.knowledge_edges ADD COLUMN IF NOT EXISTS weight float DEFAULT 1.0;
ALTER TABLE public.knowledge_edges ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT timezone('utc'::text, now());

-- Handle legacy workspace_id column if it exists (it was causing a NOT NULL constraint violation)
DO $$ 
BEGIN
  -- For knowledge_nodes
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'knowledge_nodes' AND column_name = 'workspace_id'
  ) THEN
    ALTER TABLE public.knowledge_nodes ALTER COLUMN workspace_id DROP NOT NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'knowledge_nodes' AND column_name = 'name'
  ) THEN
    ALTER TABLE public.knowledge_nodes ALTER COLUMN name DROP NOT NULL;
  END IF;

  -- For knowledge_edges
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'knowledge_edges' AND column_name = 'workspace_id'
  ) THEN
    ALTER TABLE public.knowledge_edges ALTER COLUMN workspace_id DROP NOT NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'knowledge_edges' AND column_name = 'source_node_id'
  ) THEN
    ALTER TABLE public.knowledge_edges ALTER COLUMN source_node_id DROP NOT NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'knowledge_edges' AND column_name = 'target_node_id'
  ) THEN
    ALTER TABLE public.knowledge_edges ALTER COLUMN target_node_id DROP NOT NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'knowledge_edges' AND column_name = 'relationship'
  ) THEN
    ALTER TABLE public.knowledge_edges ALTER COLUMN relationship DROP NOT NULL;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE public.knowledge_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_edges ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view graph nodes in their own projects" ON public.knowledge_nodes;
DROP POLICY IF EXISTS "Users can view graph edges in their own projects" ON public.knowledge_edges;
DROP POLICY IF EXISTS "Users can manage graph nodes in their own projects" ON public.knowledge_nodes;
DROP POLICY IF EXISTS "Users can manage graph edges in their own projects" ON public.knowledge_edges;

-- Create basic project-owner policies
-- For simplicity, since nodes/edges are strictly tied to a project, we check project ownership
-- Assuming project has a user_id, we can verify via a subquery or join, but a simpler policy is often just
-- trusting the backend if the backend handles insertions, or creating a subquery policy:
CREATE POLICY "Users can manage graph nodes in their own projects" 
ON public.knowledge_nodes FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = knowledge_nodes.project_id 
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can manage graph edges in their own projects" 
ON public.knowledge_edges FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = knowledge_edges.project_id 
    AND projects.user_id = auth.uid()
  )
);
