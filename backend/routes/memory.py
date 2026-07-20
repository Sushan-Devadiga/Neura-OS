import os
from fastapi import APIRouter, Header, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List
from supabase import create_client, ClientOptions

router = APIRouter()

class MemoryCreate(BaseModel):
    project_id: str
    content: str
    category: str = "fact"
    importance: str = "medium"

class MemoryUpdate(BaseModel):
    content: Optional[str] = None
    category: Optional[str] = None
    importance: Optional[str] = None
    is_pinned: Optional[bool] = None
    is_archived: Optional[bool] = None

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

@router.get("/project/{project_id}")
async def get_memories(project_id: str, supabase_data=Depends(get_supabase_client)):
    supabase, token = supabase_data
    user_id = get_user_id(supabase, token)
    
    try:
        resp = supabase.table("memories").select("*").eq("project_id", project_id).order("is_pinned", desc=True).order("created_at", desc=True).execute()
        return {"status": "success", "data": resp.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("")
async def create_memory(req: MemoryCreate, supabase_data=Depends(get_supabase_client)):
    supabase, token = supabase_data
    user_id = get_user_id(supabase, token)
    
    try:
        resp = supabase.table("memories").insert({
            "user_id": user_id,
            "project_id": req.project_id,
            "content": req.content,
            "category": req.category,
            "importance": req.importance
        }).execute()
        return {"status": "success", "data": resp.data[0] if resp.data else None}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{memory_id}")
async def update_memory(memory_id: str, req: MemoryUpdate, supabase_data=Depends(get_supabase_client)):
    supabase, token = supabase_data
    user_id = get_user_id(supabase, token)
    
    updates = {k: v for k, v in req.dict().items() if v is not None}
    if not updates:
        return {"status": "success"}
        
    try:
        resp = supabase.table("memories").update(updates).eq("id", memory_id).execute()
        return {"status": "success", "data": resp.data[0] if resp.data else None}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{memory_id}")
async def delete_memory(memory_id: str, supabase_data=Depends(get_supabase_client)):
    supabase, token = supabase_data
    user_id = get_user_id(supabase, token)
    
    try:
        supabase.table("memories").delete().eq("id", memory_id).execute()
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
