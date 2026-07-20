export type EntityType = 'project' | 'note' | 'document' | 'task' | 'memory' | 'chat';

export interface KnowledgeNode {
  id: string;
  project_id: string;
  entity_type: EntityType;
  entity_id?: string;
  label: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeEdge {
  id: string;
  project_id: string;
  source_id: string;
  target_id: string;
  relation_type: string;
  weight: number;
  created_at: string;
}

export interface GraphData {
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
}
