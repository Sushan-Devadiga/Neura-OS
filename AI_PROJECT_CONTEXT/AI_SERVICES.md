# AI Services

## LLM Wrappers
- **`ChatService`** (`backend/services/chat_service.py`): The core wrapper around `google.generativeai`. It handles starting chats, sending messages, catching tool-call requests from the LLM, executing the python function, and feeding the result back into the LLM.

## Agent Classes
- **`AgentService`** (`backend/services/agent_service.py`): Manages the configuration of different "agents" (e.g., Code Expert, Content Writer). It builds the system prompt and injects the necessary tools before passing execution to `ChatService`.

## Prompt Builders
- **`ProjectContextEngine`** (`backend/context_engine.py`): Gathers context about a project (notes, tasks, documents) and builds a context string to inject into prompts so the LLM is aware of the project state.

## Memory Classes
- **`MemoryService`** (`backend/services/memory_service.py`): Uses Gemini (`gemini-2.5-flash`) to analyze chat turns and extract factual memories, which are then stored in the database.

## RAG and Embeddings
- **`RAGService`** (`backend/services/rag_service.py`): Handles chunking documents and interacting with Supabase to store and search vector embeddings. The actual embedding model depends on the configuration, but it leverages Supabase `pgvector` (`rpc('match_document_chunks')`) for vector search.

## Tools
- **`ToolService`** (`backend/services/tool_service.py`): Exposes a variety of functions that Gemini can call as "tools". This includes:
  - Creating/updating/deleting notes
  - Creating/updating/deleting tasks
  - Querying tasks, documents, notes, memories
  - Querying the knowledge graph
