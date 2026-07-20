-- SQL script to create the Documents table and Storage Bucket

-- 1. Create the documents table
CREATE TABLE IF NOT EXISTS public.documents (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL,
  project_id uuid REFERENCES public.projects ON DELETE CASCADE NOT NULL,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size bigint NOT NULL,
  mime_type text NOT NULL,
  storage_bucket text NOT NULL DEFAULT 'project_documents',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable Row Level Security (RLS) on the table
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies for documents table
-- Select policy: users can only see documents in their projects
CREATE POLICY "Users can view documents in their own projects" 
ON public.documents FOR SELECT 
USING (auth.uid() = user_id);

-- Insert policy: users can only insert documents for themselves
CREATE POLICY "Users can insert documents into their own projects" 
ON public.documents FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Update policy: users can only update their own documents
CREATE POLICY "Users can update their own documents" 
ON public.documents FOR UPDATE 
USING (auth.uid() = user_id);

-- Delete policy: users can only delete their own documents
CREATE POLICY "Users can delete their own documents" 
ON public.documents FOR DELETE 
USING (auth.uid() = user_id);

-- 4. Create trigger to automatically update 'updated_at'
CREATE TRIGGER on_documents_updated
  BEFORE UPDATE ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 5. Create storage bucket for project documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('project_documents', 'project_documents', true)
ON CONFLICT (id) DO NOTHING;

-- 6. Setup Storage RLS Policies

-- Allow users to view their own documents
CREATE POLICY "Users can view their own documents in storage" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'project_documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to upload documents
CREATE POLICY "Users can upload documents" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'project_documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to delete their own documents
CREATE POLICY "Users can delete their own documents" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'project_documents' AND auth.uid()::text = (storage.foldername(name))[1]);
