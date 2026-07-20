# AI Pipeline

The system uses a synchronous/asynchronous mix pipeline to interact with AI models (Gemini) while processing background tasks like memory extraction.

1. **User** inputs a message in the chat UI.
2. **Frontend** (React) sends a `POST` request to `/api/chat` with the message, session ID, and agent ID, along with the Supabase JWT token.
3. **Backend** (FastAPI) receives the request at the **Router** (`routes/chat.py`).
4. **Router** authenticates the user, verifies project access, and logs the user's message into the Supabase database.
5. **Router** delegates the logic to the **AgentService** (`agent_service.py`), passing the conversation history, user ID, and Supabase client.
6. **AgentService** initializes context tools like `ProjectContextEngine`, `MemoryService`, `RAGService`, and `ToolService`. It bundles these into a list of functions available to the LLM.
7. **AgentService** delegates to the **ChatService** (`chat_service.py`).
8. **ChatService** configures the Gemini API client and sends the conversation to the **LLM** (`gemini-2.5-flash` or `gemini-2.5-pro`).
9. **LLM** may decide to call a tool (e.g., query database). The **ChatService** intercepts the tool call, executes the corresponding Python function in `ToolService`, and sends the result back to the LLM.
10. **LLM** generates the final response.
11. **ChatService** returns the final text to the **AgentService**, which returns it to the **Router**.
12. **Router** saves the AI response to the Supabase **Database**.
13. **Router** kicks off a Background Task to extract memories from the conversation using **MemoryService**.
14. **Router** returns the JSON **Response** to the Frontend.
15. **Frontend** updates the UI.
