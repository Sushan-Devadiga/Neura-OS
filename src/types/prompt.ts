export interface Prompt {
  id: string;
  user_id: string;
  title: string;
  content: string;
  description: string | null;
  folder: string | null;
  category: string | null;
  tags: string[];
  is_favorite: boolean;
  is_archived: boolean;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface PromptCreate {
  title: string;
  content: string;
  description?: string;
  folder?: string;
  category?: string;
  tags?: string[];
  is_favorite?: boolean;
}

export interface PromptUpdate {
  title?: string;
  content?: string;
  description?: string;
  folder?: string;
  category?: string;
  tags?: string[];
  is_favorite?: boolean;
  is_archived?: boolean;
}
