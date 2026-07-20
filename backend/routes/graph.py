import os
from fastapi import APIRouter, Header, HTTPException, Depends, BackgroundTasks
from supabase import create_client, ClientOptions
import sys

router = APIRouter()

def get_supabase_client(authorization: str = Header(...)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing Authorization header")
    token = authorization.split(" ")[1]
    
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_ANON_KEY")
    
    if not supabase_url or not supabase_key:
        raise HTTPException(status_code=500, detail="Supabase configuration is missing")
    
    try:
        client = create_client(
            supabase_url, 
            supabase_key,
            options=ClientOptions(headers={'Authorization': f'Bearer {token}'})
        )
        return client, token
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create Supabase client: {str(e)}")

def get_user_id(supabase, token):
    try:
        auth_resp = supabase.auth.get_user(token)
        if not auth_resp or not auth_resp.user:
            raise HTTPException(status_code=401, detail="Unauthorized")
        return auth_resp.user.id
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Unauthorized: {str(e)}")

def verify_project_access(supabase, project_id: str, user_id: str):
    resp = supabase.table("projects").select("id").eq("id", project_id).eq("user_id", user_id).execute()
    if not resp.data:
        raise HTTPException(status_code=403, detail="Project not found or access denied")

@router.get("/{project_id}")
async def get_graph_data(project_id: str, supabase_data=Depends(get_supabase_client)):
    supabase, token = supabase_data
    user_id = get_user_id(supabase, token)
    verify_project_access(supabase, project_id, user_id)
    
    sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    from services.graph_service import GraphService
    
    service = GraphService(supabase)
    try:
        graph = await service.get_graph(project_id)
        return {"status": "success", "data": graph}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

async def background_sync_task(supabase, project_id: str):
    sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    from services.graph_service import GraphService
    service = GraphService(supabase)
    await service.sync_project_graph(project_id)

@router.post("/{project_id}/sync")
async def sync_graph_data(project_id: str, background_tasks: BackgroundTasks, supabase_data=Depends(get_supabase_client)):
    supabase, token = supabase_data
    user_id = get_user_id(supabase, token)
    verify_project_access(supabase, project_id, user_id)
    
    # We can run it synchronously if we want immediate feedback, but background is better for large graphs.
    # For now, we'll run it synchronously so the frontend can refresh immediately upon success.
    sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    from services.graph_service import GraphService
    service = GraphService(supabase)
    
    try:
        result = await service.sync_project_graph(project_id)
        return {"status": "success", "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
