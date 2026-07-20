import os
from fastapi import APIRouter, Header, HTTPException, Depends, BackgroundTasks
from pydantic import BaseModel
from supabase import create_client, ClientOptions

# Assuming rag_service is in the parent/sibling directory services
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from services.rag_service import RAGService

router = APIRouter()

class ProcessDocumentRequest(BaseModel):
    document_id: str
    project_id: str
    file_path: str

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

async def process_document_task(document_id: str, project_id: str, file_path: str, supabase_client):
    rag = RAGService(supabase_client)
    await rag.process_document(document_id, project_id, file_path)

@router.post("/process")
async def process_document(req: ProcessDocumentRequest, background_tasks: BackgroundTasks, supabase_data=Depends(get_supabase_client)):
    supabase, token = supabase_data
    # Verify user auth context
    try:
        auth_resp = supabase.auth.get_user(token)
        if not auth_resp or not auth_resp.user:
             raise HTTPException(status_code=401, detail="Unauthorized")
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Unauthorized: {str(e)}")
        
    # Send processing to background task to not block the frontend
    background_tasks.add_task(process_document_task, req.document_id, req.project_id, req.file_path, supabase)
    
    return {"status": "success", "message": "Document processing started in background"}
