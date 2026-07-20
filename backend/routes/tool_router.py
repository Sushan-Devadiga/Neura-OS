from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel
from typing import Optional, Dict, Any
import os
from supabase import create_client, ClientOptions

from services.tool_service import ToolService

router = APIRouter()

def get_supabase_client(authorization: str = Header(...)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")
    
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

class ToolCallRequest(BaseModel):
    tool_name: str
    args: Dict[str, Any]

@router.post("/execute")
async def execute_tool(req: ToolCallRequest, supabase_data=Depends(get_supabase_client)):
    supabase, token = supabase_data
    user_id = get_user_id(supabase, token)
    
    tool_service = ToolService(supabase, user_id)
    tool_map = tool_service.get_tool_map()
    
    if req.tool_name not in tool_map:
        raise HTTPException(status_code=400, detail=f"Tool '{req.tool_name}' not found.")
        
    func = tool_map[req.tool_name]
    try:
        result = func(**req.args)
        return {
            "status": "success",
            "logs": tool_service.execution_logs,
            "result": result
        }
    except TypeError as e:
        raise HTTPException(status_code=400, detail=f"Invalid arguments for {req.tool_name}: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error executing tool {req.tool_name}: {str(e)}")
