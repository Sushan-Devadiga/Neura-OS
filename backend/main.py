import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from routes import chat, document, memory, graph, prompts, agents, tool_router, n8n
load_dotenv()

app = FastAPI(title="NeuraOS AI Backend")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173", 
        "http://127.0.0.1:5173",
        "http://localhost:8080",
        "http://127.0.0.1:8080"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat.router, prefix="/api/chat")
app.include_router(document.router, prefix="/api/documents")
app.include_router(memory.router, prefix="/api/memories")
app.include_router(graph.router, prefix="/api/graph")
app.include_router(prompts.router, prefix="/api/prompts")
app.include_router(agents.router, prefix="/api/agents")
app.include_router(tool_router.router, prefix="/api/tools")
app.include_router(n8n.router, prefix="/api/n8n")

@app.get("/health")
def health_check():
    return {"status": "ok"}
