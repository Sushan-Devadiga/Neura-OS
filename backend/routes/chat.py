import os
from fastapi import APIRouter, Header, HTTPException, Depends, BackgroundTasks
from pydantic import BaseModel
from supabase import create_client, ClientOptions
from openai import OpenAI

router = APIRouter()

class ChatRequest(BaseModel):
    project_id: str
    chat_session_id: str
    message: str
    agent_id: str = "general"

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

async def extract_memories_task(supabase_client, user_message: str, ai_response: str, project_id: str, user_id: str):
    import sys
    sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    from services.memory_service import MemoryService
    mem_service = MemoryService(supabase_client)
    await mem_service.extract_and_save_memories(user_message, ai_response, project_id, user_id)

@router.post("")
async def chat_endpoint(req: ChatRequest, background_tasks: BackgroundTasks, supabase_data=Depends(get_supabase_client)):
    supabase, token = supabase_data
    # 1. Verify user auth context
    try:
        auth_resp = supabase.auth.get_user(token)
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Unauthorized: {str(e)}")
        
    if not auth_resp or not auth_resp.user:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    user_id = auth_resp.user.id
    
    # 2. Verify project ownership (optional but good practice, RLS handles it too)
    proj_resp = supabase.table("projects").select("id").eq("id", req.project_id).execute()
    if not proj_resp.data:
        raise HTTPException(status_code=403, detail="Project not found or access denied")
        
    # 3. Save user's message to Supabase
    try:
        user_msg_resp = supabase.table("messages").insert({
            "session_id": req.chat_session_id,
            "user_id": user_id,
            "role": "user",
            "content": req.message
        }).execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save user message: {str(e)}")
        
    # 4. Fetch conversation history for context
    try:
        history_resp = supabase.table("messages").select("role, content").eq("session_id", req.chat_session_id).order("created_at", desc=False).execute()
        history = history_resp.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch conversation history: {str(e)}")

    # 5. Prepare messages for Gemini
    gemini_messages = []
    for msg in history:
        role = "user" if msg["role"] == "user" else "model"
        gemini_messages.append({
            "role": role,
            "parts": [msg["content"]]
        })
        
    import sys
    import os
    sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    from services.agent_service import agent_service
    
    # 6. Execute Agent
    try:
        history_for_chat = gemini_messages[:-1] if len(gemini_messages) > 1 else []
        ai_response_content, tool_logs = agent_service.execute_agent(
            agent_id=req.agent_id,
            project_id=req.project_id,
            user_id=user_id,
            user_message=req.message,
            history=history_for_chat,
            supabase=supabase
        )
        
        # Prepend tool logs to the response if any
        if tool_logs:
            logs_str = "\n".join(tool_logs)
            ai_response_content = f"{logs_str}\n\n{ai_response_content}"
            
    except Exception as e:
        if type(e).__name__ == "RequiresConfirmationError":
            # Return special response for the frontend to show popup
            return {
                "status": "requires_confirmation",
                "tool_name": e.tool_name,
                "tool_args": e.tool_args,
                "message": e.message
            }
            
        error_str = str(e)
        if "Quota exceeded" in error_str or "429" in error_str:
            raise HTTPException(status_code=429, detail="API rate limit exceeded (Free Tier quota reached). Please wait a moment and try again.")
        raise HTTPException(status_code=500, detail=f"Agent Execution Error: {error_str}")


    # 7. Save assistant's response to Supabase
    try:
        ai_msg_resp = supabase.table("messages").insert({
            "session_id": req.chat_session_id,
            "user_id": user_id,
            "role": "assistant",
            "content": ai_response_content
        }).execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save assistant message: {str(e)}")

    # 8. Extract memories in background
    background_tasks.add_task(extract_memories_task, supabase, req.message, ai_response_content, req.project_id, user_id)

    return {"status": "success", "message": ai_response_content}
