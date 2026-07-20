export interface Note {
  id: string;
  project_id: string;
  user_id: string;
  title: string;
  content: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateNoteInput {
  project_id: string;
  title: string;
  content?: string;
}

export interface UpdateNoteInput {
  title?: string;
  content?: string;
}
