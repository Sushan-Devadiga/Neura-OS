# Readme for AI Assistant

## Project Purpose
Neura-OS is an AI-powered operating system or workspace. It allows users to create projects, upload documents, manage tasks and notes, and interact with specialized AI agents that have full context of the project data (via RAG and Knowledge Graphs).

## Architecture
The system follows a modern decoupled architecture:
- **Frontend**: A React SPA built with Vite, Tailwind CSS, and TanStack Router.
- **Backend**: A FastAPI Python server handling business logic, AI orchestration, and tool execution.
- **Database/Auth**: Supabase (PostgreSQL + GoTrue Auth). The backend uses user-scoped JWT tokens to query the database, relying on Row Level Security (RLS) for data privacy.

## Backend Stack
Python, FastAPI, Uvicorn, Supabase Python Client, Google Generative AI SDK, sentence-transformers.

## Frontend Stack
React 19, TypeScript, Vite, TailwindCSS, Radix UI, TanStack Router, @supabase/supabase-js.

## Database & Authentication
- **Database**: PostgreSQL hosted on Supabase. Uses pgvector for embeddings. Schema migrations are in `supabase/setup_*.sql`.
- **Authentication**: Handled via Supabase. Frontend gets a JWT, sends it in the `Authorization` header, and the FastAPI backend verifies it before creating a scoped database client.

## AI Stack
- **Model**: Google Gemini (`gemini-2.5-flash` and `gemini-2.5-pro`).
- **Orchestration**: Custom Python classes (`AgentService`, `ChatService`). No heavy frameworks like LangChain/LangGraph are used for the core chat execution, favoring direct API tool calling.
- **Memory**: The system extracts memories in background tasks.
- **RAG**: The system chunks documents and uses Supabase vector search (`match_document_chunks` RPC).

## n8n Status
n8n is **NOT** currently integrated into this project. There are no webhooks or API calls to n8n.

## Current Development Phase
The core infrastructure (Database, Auth, FastAPI routing, Gemini integration, Tool calling) is built and functional. 

## Next Recommended Task
1. Verify the frontend and backend are successfully communicating across all endpoints.
2. If n8n integration is required, design the webhook flow and integrate it into the FastAPI routes.
3. Polish the specialized agent prompts in `AgentService` to better utilize the available tools.
