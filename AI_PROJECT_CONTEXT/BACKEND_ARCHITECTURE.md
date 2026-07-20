# Backend Architecture

## Overview
The backend is built with FastAPI and runs on port 8000. It acts as the API layer between the React frontend, the Supabase database/auth, and the AI models (Google Gemini).

## Major Components

### FastAPI Architecture
- `main.py` is the entry point. It sets up CORS, loads environment variables, and includes routers for various endpoints.

### Folders and Responsibilities
- **`routes/`**: Contains the FastAPI route definitions (Controllers). They handle HTTP requests, validate auth tokens, and delegate business logic to services.
- **`services/`**: Contains the core business logic. They encapsulate interactions with external APIs (Gemini) and the database (Supabase).

### Dependency Injection
- Supabase client initialization is handled via a `get_supabase_client` dependency injected into endpoints. It extracts the `Bearer` token from the `Authorization` header and creates a user-scoped Supabase client.

### Authentication Flow
- The frontend authenticates users via Supabase Auth and receives a JWT token.
- Every API request to the backend includes this token in the `Authorization: Bearer <token>` header.
- The `get_supabase_client` dependency validates this token and initiates a Supabase client configured with it, enforcing Row Level Security (RLS) on database queries.

### Database Layer
- Supabase (PostgreSQL) is used as the primary database. The backend uses the official `supabase-py` client. All queries respect RLS as the client is scoped to the authenticated user's token.

### AI Architecture & Agent Architecture
- The system uses Google Gemini (`gemini-2.5-flash` and `gemini-2.5-pro`) for AI tasks.
- **`AgentService`**: Orchestrates agents. It provides a generalized `execute_agent` method. Different agents have different system prompts, specializations, and tools available.
- **`ChatService`**: Handles direct communication with Gemini API, managing chat sessions and tool calling loops.
- **`ToolService`**: Provides a suite of tools (functions) that the AI can invoke, such as querying the database, creating tasks, fetching documents, etc.

### Memory Architecture
- **`MemoryService`**: Handles extracting facts and memories from user conversations. Background tasks in the `chat.py` route trigger this service to asynchronously parse the conversation, extract memories via Gemini, and store them in the `memories` table.
