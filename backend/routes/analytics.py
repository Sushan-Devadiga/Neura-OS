from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel
import sys
import os
import logging
from typing import Dict, Any

# Ensure services can be imported if needed
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from services.supabase_client import get_supabase_client

logger = logging.getLogger(__name__)

router = APIRouter()

class AnalyticsResponse(BaseModel):
    kpis: Dict[str, Any]
    memoryNodesData: list[Dict[str, Any]]

@router.get("/", response_model=AnalyticsResponse)
async def get_analytics(request: Request):
    """
    Get real analytics counts from the database for the active user's projects.
    """
    try:
        supabase = get_supabase_client()
        auth_header = request.headers.get("Authorization")
        
        if not auth_header:
            raise HTTPException(status_code=401, detail="No authorization header")
        
        # Get user
        user_res = supabase.auth.get_user(auth_header.replace("Bearer ", ""))
        if not user_res or not user_res.user:
            raise HTTPException(status_code=401, detail="Invalid token")
            
        user_id = user_res.user.id
        
        # Fetch counts using supabase python client
        def get_count(table_name):
            try:
                # supabase-py count="exact" returns an APIResponse with count and data
                res = supabase.table(table_name).select("id", count="exact").eq("user_id", user_id).execute()
                return res.count if hasattr(res, 'count') and res.count is not None else len(res.data)
            except Exception as e:
                logger.error(f"Error fetching count for {table_name}: {e}")
                return 0

        # We need counts for notes, tasks, documents, memories
        notes_count = get_count("notes")
        tasks_count = get_count("tasks")
        docs_count = get_count("documents")
        memories_count = get_count("memories")

        # Get node types for Knowledge Graph Pie Chart
        # Since knowledge_nodes doesn't seem to have user_id, let's just get everything, or skip it
        # Wait, if knowledge_nodes has user_id we can query it. If it only has project_id, we need to join.
        # For simplicity, let's just count total memories, tasks, etc directly from nodes if possible.
        try:
            # First get user's projects
            proj_res = supabase.table("projects").select("id").eq("user_id", user_id).execute()
            project_ids = [p["id"] for p in proj_res.data]
            
            node_counts = {}
            if project_ids:
                nodes_res = supabase.table("knowledge_nodes").select("entity_type").in_("project_id", project_ids).execute()
                for node in nodes_res.data:
                    ntype = node.get("entity_type", "Unknown")
                    node_counts[ntype] = node_counts.get(ntype, 0) + 1
                    
            memory_nodes_chart_data = [{"name": k.capitalize(), "value": v} for k, v in node_counts.items()]
            if not memory_nodes_chart_data:
                memory_nodes_chart_data = [
                    {"name": "No Data", "value": 1}
                ]
        except Exception as e:
            logger.error(f"Error fetching knowledge nodes: {e}")
            memory_nodes_chart_data = [{"name": "Error", "value": 1}]

        kpis = {
            "tasks": {
                "title": "Total Tasks",
                "value": str(tasks_count),
                "change": "active",
                "trend": "up",
                "hue": "ai-blue"
            },
            "documents": {
                "title": "Documents Uploaded",
                "value": str(docs_count),
                "change": "active",
                "trend": "up",
                "hue": "ai-purple"
            },
            "memories": {
                "title": "Total Memories",
                "value": str(memories_count),
                "change": "stored",
                "trend": "up",
                "hue": "ai-cyan"
            },
            "notes": {
                "title": "Total Notes",
                "value": str(notes_count),
                "change": "stored",
                "trend": "up",
                "hue": "ai-orange"
            }
        }
        
        return AnalyticsResponse(
            kpis=kpis,
            memoryNodesData=memory_nodes_chart_data
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Analytics error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
