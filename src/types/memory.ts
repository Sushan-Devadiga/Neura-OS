export type MemoryCategory = 
  | 'preference'
  | 'project decision'
  | 'architecture'
  | 'goal'
  | 'fact'
  | 'coding style'
  | 'writing style';

export type MemoryImportance = 'low' | 'medium' | 'high';

export interface Memory {
  id: string;
  user_id: string;
  project_id: string;
  content: string;
  category: MemoryCategory;
  importance: MemoryImportance;
  is_pinned: boolean;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}
