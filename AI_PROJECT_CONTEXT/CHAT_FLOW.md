# Chat Flow

Exactly what happens when a user sends a chat message:

1. **React Page**: The user types a message in the chat interface and clicks send.
2. **API Request**: The frontend makes an HTTP POST request to `/api/chat` with `project_id`, `chat_session_id`, `message`, and `agent_id`.
3. **FastAPI Route (`backend/routes/chat.py`)**: 
   - Validates the `Authorization: Bearer <token>` header.
   - Verifies the user using Supabase Auth.
   - Checks project access.
   - Inserts the user's message into the `messages` table in Supabase.
   - Fetches the conversation history from the `messages` table.
4. **Service (`backend/services/agent_service.py`)**: 
   - `execute_agent` is called. It retrieves the specific agent's configuration (system prompt, specialization).
   - Initializes all available tools via `ToolService`, `MemoryService`, `RAGService`.
5. **Agent / LLM (`backend/services/chat_service.py`)**: 
   - `generate_response` is called. It formats the history and system instructions for the Gemini API.
   - Sends the payload to Google Gemini.
   - If the LLM requests a tool call, `ChatService` executes it and loops back the result to Gemini.
   - The final string is returned.
6. **Database (`backend/routes/chat.py`)**:
   - The assistant's response is inserted into the `messages` table in Supabase.
7. **Memory (`backend/services/memory_service.py`)**:
   - A FastAPI background task (`extract_memories_task`) is triggered. It uses Gemini asynchronously to analyze the new user message and assistant response to extract and save relevant facts/memories to the `memories` table.
8. **Response**: 
   - The route returns `{"status": "success", "message": "<AI Output>"}` to the React frontend to display.
