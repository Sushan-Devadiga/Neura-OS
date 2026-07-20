import os
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from fastapi import APIRouter, Header, HTTPException, Depends
from supabase import create_client, ClientOptions

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

class PromptCreate(BaseModel):
    title: str
    content: str
    description: Optional[str] = None
    folder: Optional[str] = 'General'
    category: Optional[str] = None
    tags: Optional[List[str]] = []
    is_favorite: Optional[bool] = False

class PromptUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    description: Optional[str] = None
    folder: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[List[str]] = None
    is_favorite: Optional[bool] = None
    is_archived: Optional[bool] = None

@router.get("/")
async def get_prompts(supabase_data=Depends(get_supabase_client)):
    supabase, token = supabase_data
    user_id = get_user_id(supabase, token)
    
    resp = supabase.table("prompts").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
    return {"status": "success", "data": resp.data or []}

@router.post("/")
async def create_prompt(prompt: PromptCreate, supabase_data=Depends(get_supabase_client)):
    supabase, token = supabase_data
    user_id = get_user_id(supabase, token)
    
    payload = prompt.dict(exclude_unset=True)
    payload["user_id"] = user_id
    
    resp = supabase.table("prompts").insert(payload).execute()
    if not resp.data:
        raise HTTPException(status_code=500, detail="Failed to create prompt")
    return {"status": "success", "data": resp.data[0]}

@router.put("/{prompt_id}")
async def update_prompt(prompt_id: str, prompt: PromptUpdate, supabase_data=Depends(get_supabase_client)):
    supabase, token = supabase_data
    user_id = get_user_id(supabase, token)
    
    # Verify ownership
    existing = supabase.table("prompts").select("id, version").eq("id", prompt_id).eq("user_id", user_id).execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Prompt not found")
        
    payload = prompt.dict(exclude_unset=True)
    if "content" in payload or "title" in payload:
        payload["version"] = existing.data[0].get("version", 1) + 1
        
    resp = supabase.table("prompts").update(payload).eq("id", prompt_id).execute()
    return {"status": "success", "data": resp.data[0] if resp.data else None}

@router.delete("/{prompt_id}")
async def delete_prompt(prompt_id: str, supabase_data=Depends(get_supabase_client)):
    supabase, token = supabase_data
    user_id = get_user_id(supabase, token)
    
    supabase.table("prompts").delete().eq("id", prompt_id).eq("user_id", user_id).execute()
    return {"status": "success"}

@router.post("/import")
async def import_prompts(prompts: List[PromptCreate], supabase_data=Depends(get_supabase_client)):
    supabase, token = supabase_data
    user_id = get_user_id(supabase, token)
    
    payloads = []
    for p in prompts:
        data = p.dict(exclude_unset=True)
        data["user_id"] = user_id
        payloads.append(data)
        
    if payloads:
        supabase.table("prompts").insert(payloads).execute()
    
    return {"status": "success", "count": len(payloads)}
