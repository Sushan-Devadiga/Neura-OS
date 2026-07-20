import logging
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

class GraphService:
    def __init__(self, supabase_client):
        self.supabase = supabase_client

    async def get_graph(self, project_id: str) -> Dict[str, List[Dict[str, Any]]]:
        """
        Retrieves all nodes and edges for a given project.
        """
        try:
            nodes_resp = self.supabase.table("knowledge_nodes").select("*").eq("project_id", project_id).execute()
            edges_resp = self.supabase.table("knowledge_edges").select("*").eq("project_id", project_id).execute()
            
            return {
                "nodes": nodes_resp.data or [],
                "edges": edges_resp.data or []
            }
        except Exception as e:
            logger.error(f"Error fetching graph for project {project_id}: {e}")
            raise

    async def sync_project_graph(self, project_id: str):
        """
        Synchronizes the knowledge graph for a project by reading all entities
        and rebuilding nodes and edges.
        """
        try:
            # We will gather all entities and construct nodes and edges in memory,
            # then upsert them. This is a simplified deterministic approach.
            
            nodes_to_upsert = []
            edges_to_upsert = []
            
            # 1. Project Node
            proj_resp = self.supabase.table("projects").select("*").eq("id", project_id).single().execute()
            project = proj_resp.data
            if project:
                nodes_to_upsert.append({
                    "id": project_id,
                    "project_id": project_id,
                    "entity_type": "project",
                    "entity_id": project_id,
                    "label": project.get("name", "Unknown Project"),
                    "metadata": {"description": project.get("description")}
                })
                
            # 2. Notes
            notes_resp = self.supabase.table("notes").select("*").eq("project_id", project_id).execute()
            for note in (notes_resp.data or []):
                node_id = note["id"]
                nodes_to_upsert.append({
                    "id": node_id,
                    "project_id": project_id,
                    "entity_type": "note",
                    "entity_id": node_id,
                    "label": note.get("title", "Untitled Note"),
                    "metadata": {}
                })
                edges_to_upsert.append({
                    "project_id": project_id,
                    "source_id": project_id,
                    "target_id": node_id,
                    "relation_type": "contains"
                })

            # 3. Documents
            docs_resp = self.supabase.table("documents").select("*").eq("project_id", project_id).execute()
            for doc in (docs_resp.data or []):
                node_id = doc["id"]
                nodes_to_upsert.append({
                    "id": node_id,
                    "project_id": project_id,
                    "entity_type": "document",
                    "entity_id": node_id,
                    "label": doc.get("file_name", "Unknown Document"),
                    "metadata": {"size": doc.get("file_size")}
                })
                edges_to_upsert.append({
                    "project_id": project_id,
                    "source_id": project_id,
                    "target_id": node_id,
                    "relation_type": "contains"
                })

            # 4. Tasks
            tasks_resp = self.supabase.table("tasks").select("*").eq("project_id", project_id).execute()
            for task in (tasks_resp.data or []):
                node_id = task["id"]
                nodes_to_upsert.append({
                    "id": node_id,
                    "project_id": project_id,
                    "entity_type": "task",
                    "entity_id": node_id,
                    "label": task.get("title", "Untitled Task"),
                    "metadata": {"status": task.get("status")}
                })
                edges_to_upsert.append({
                    "project_id": project_id,
                    "source_id": project_id,
                    "target_id": node_id,
                    "relation_type": "contains"
                })

            # 5. Memories
            mems_resp = self.supabase.table("memories").select("*").eq("project_id", project_id).execute()
            for mem in (mems_resp.data or []):
                node_id = mem["id"]
                label = mem.get("content", "Memory")
                if len(label) > 30:
                    label = label[:27] + "..."
                nodes_to_upsert.append({
                    "id": node_id,
                    "project_id": project_id,
                    "entity_type": "memory",
                    "entity_id": node_id,
                    "label": label,
                    "metadata": {"category": mem.get("category"), "importance": mem.get("importance")}
                })
                edges_to_upsert.append({
                    "project_id": project_id,
                    "source_id": project_id,
                    "target_id": node_id,
                    "relation_type": "remembers"
                })

            # Instead of a direct upsert, we can just wipe and recreate for simplicity in V1
            # In a production app, we would use an intelligent merge.
            # Wipe existing edges and nodes for this project
            self.supabase.table("knowledge_edges").delete().eq("project_id", project_id).execute()
            self.supabase.table("knowledge_nodes").delete().eq("project_id", project_id).execute()
            
            # Insert new ones in batches
            if nodes_to_upsert:
                # Supabase handles up to ~1000 rows well in one insert
                self.supabase.table("knowledge_nodes").insert(nodes_to_upsert).execute()
            if edges_to_upsert:
                self.supabase.table("knowledge_edges").insert(edges_to_upsert).execute()
                
            return {"status": "success", "nodes_count": len(nodes_to_upsert), "edges_count": len(edges_to_upsert)}

        except Exception as e:
            logger.error(f"Error syncing graph for project {project_id}: {e}")
            raise
