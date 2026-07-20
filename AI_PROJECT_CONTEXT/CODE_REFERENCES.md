# Code References

This document outlines the critical entry points and files in the project.

- **Main FastAPI entry point**
  - **File:** `backend/main.py`
  - **Explanation:** Initializes the FastAPI app, sets up CORS, and includes all routers.

- **Main React entry point**
  - **File:** `src/router.tsx` and `src/start.ts`
  - **Explanation:** Sets up the TanStack router and mounts the React application.

- **Chat router**
  - **File:** `backend/routes/chat.py`
  - **Function:** `chat_endpoint()`
  - **Explanation:** Handles POST requests for new chat messages, manages auth, and triggers the agent service.

- **Chat service**
  - **File:** `backend/services/chat_service.py`
  - **Class:** `ChatService`
  - **Function:** `generate_response()`
  - **Explanation:** Connects directly to the Gemini API, handles the tool-calling loop, and returns the final LLM response.

- **Agent service**
  - **File:** `backend/services/agent_service.py`
  - **Class:** `AgentService`
  - **Function:** `execute_agent()`
  - **Explanation:** Constructs the specific agent's context, tools, and system prompt before passing it to the ChatService.

- **Memory service**
  - **File:** `backend/services/memory_service.py`
  - **Class:** `MemoryService`
  - **Function:** `extract_and_save_memories()`
  - **Explanation:** Uses Gemini to extract facts from chat history and saves them to the database.

- **Authentication**
  - **File:** `backend/routes/chat.py` (and other routes)
  - **Function:** `get_supabase_client()`
  - **Explanation:** A FastAPI dependency that extracts the Bearer token and validates it via `supabase.auth.get_user()`.

- **Database connection & Supabase client**
  - **File:** `backend/routes/chat.py` (and other routes)
  - **Function:** `get_supabase_client()`
  - **Explanation:** Creates a user-scoped Supabase client using `create_client()` and the provided JWT token for RLS.

- **LLM client**
  - **File:** `backend/services/chat_service.py`
  - **Explanation:** Uses `google.generativeai` package to communicate with Gemini.

- **n8n integration & Webhook handlers**
  - **File:** None
  - **Explanation:** Does not currently exist in the codebase.

- **Configuration files**
  - **Files:** `package.json`, `vite.config.ts`, `backend/requirements.txt`, `backend/.env`
  - **Explanation:** Standard config files for Node/Vite and Python environments.
