from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import os

router = APIRouter()

# Default workspace directory
WORKSPACE_DIR = r"c:\Users\Susha\Desktop\Neura-OS"

class FileNode(BaseModel):
    name: str
    path: str
    is_dir: bool
    children: list['FileNode'] | None = None

# Prevent infinite recursion / huge payloads
IGNORED_DIRS = {
    "node_modules", ".git", "venv", "__pycache__", ".next", "dist", "build", ".vite", ".vscode", ".gemini"
}

def get_file_tree(dir_path: str) -> list[FileNode]:
    nodes = []
    try:
        entries = sorted(os.scandir(dir_path), key=lambda e: (not e.is_dir(), e.name.lower()))
        for entry in entries:
            if entry.name in IGNORED_DIRS:
                continue
            
            node = FileNode(
                name=entry.name,
                path=entry.path,
                is_dir=entry.is_dir()
            )
            
            if entry.is_dir():
                # For deeply nested directories, maybe we shouldn't fetch all at once.
                # But for a simple MVP IDE, getting the whole tree (excluding node_modules) is usually fine.
                try:
                    node.children = get_file_tree(entry.path)
                except PermissionError:
                    node.children = []
            
            nodes.append(node)
    except Exception as e:
        pass
    return nodes

@router.get("/files", response_model=list[FileNode])
async def list_files():
    """Returns the entire file tree for the workspace."""
    if not os.path.exists(WORKSPACE_DIR):
        raise HTTPException(status_code=404, detail="Workspace directory not found")
    
    return get_file_tree(WORKSPACE_DIR)

@router.get("/read")
async def read_file(path: str):
    """Reads the content of a file."""
    # Security: ensure path is within WORKSPACE_DIR
    abs_path = os.path.abspath(path)
    if not abs_path.startswith(os.path.abspath(WORKSPACE_DIR)):
        raise HTTPException(status_code=403, detail="Access denied")
        
    if not os.path.exists(abs_path) or os.path.isdir(abs_path):
        raise HTTPException(status_code=404, detail="File not found")
        
    try:
        with open(abs_path, 'r', encoding='utf-8') as f:
            content = f.read()
        return {"content": content}
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="Cannot read binary file")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class IDEChatRequest(BaseModel):
    message: str
    file_path: str | None = None
    file_content: str | None = None

@router.post("/chat")
async def ide_chat(req: IDEChatRequest):
    """Provides a simple AI copilot for the IDE without needing project/auth context."""
    from openai import OpenAI
    
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="OpenAI API key not configured")
        
    client = OpenAI(api_key=api_key)
    
    system_prompt = "You are NeuraOS Copilot, an expert AI programming assistant embedded in the user's IDE."
    if req.file_path:
        system_prompt += f"\nThe user is currently looking at the file: {req.file_path}."
        if req.file_content:
            system_prompt += f"\n\nHere is the current content of the file:\n\n```\n{req.file_content}\n```"
            
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": req.message}
            ],
            temperature=0.3
        )
        return {"response": response.choices[0].message.content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Error: {str(e)}")
