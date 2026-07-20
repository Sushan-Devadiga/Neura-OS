# API Endpoints

### Agents
- **Route:** `GET /api/agents`
  - **Purpose:** Get all available agents.
  - **Authentication:** Not explicitly required in this route (based on current code).
  - **Implemented in:** `routes/agents.py`
  - **Service:** `AgentService.get_all_agents()`

- **Route:** `GET /api/agents/{agent_id}`
  - **Purpose:** Get details of a specific agent.
  - **Authentication:** Not explicitly required.
  - **Implemented in:** `routes/agents.py`
  - **Service:** `AgentService.get_agent()`

### Chat
- **Route:** `POST /api/chat`
  - **Purpose:** Send a message to an AI agent in a chat session.
  - **Input JSON:** `{ "project_id": "uuid", "chat_session_id": "uuid", "message": "string", "agent_id": "string" }`
  - **Output JSON:** `{ "status": "success", "message": "string" }` or requires confirmation object.
  - **Implemented in:** `routes/chat.py`
  - **Service:** `AgentService.execute_agent()` and `ChatService`
  - **Authentication:** Required (Bearer Token)

### Documents
- **Route:** `POST /api/documents/process`
  - **Purpose:** Process a document for RAG (Retrieval-Augmented Generation) in the background.
  - **Input JSON:** `{ "document_id": "uuid", "project_id": "uuid", "file_path": "string" }`
  - **Output JSON:** `{ "status": "success", "message": "string" }`
  - **Implemented in:** `routes/document.py`
  - **Service:** `RAGService.process_document()`
  - **Authentication:** Required (Bearer Token)

### Graph
- **Route:** `GET /api/graph/{project_id}`
  - **Purpose:** Retrieve the knowledge graph for a project.
  - **Implemented in:** `routes/graph.py`
  - **Service:** `GraphService.get_graph()`
  - **Authentication:** Required

- **Route:** `POST /api/graph/{project_id}/sync`
  - **Purpose:** Trigger a sync of the project's knowledge graph.
  - **Implemented in:** `routes/graph.py`
  - **Service:** `GraphService.sync_project_graph()`
  - **Authentication:** Required

### Memories
- **Route:** `GET /api/memories/project/{project_id}`
  - **Purpose:** Get all memories for a project.
  - **Implemented in:** `routes/memory.py`
  - **Authentication:** Required

- **Route:** `POST /api/memories`
  - **Purpose:** Create a new memory.
  - **Input JSON:** `{ "project_id": "uuid", "content": "string", "category": "string", "importance": "string" }`
  - **Implemented in:** `routes/memory.py`
  - **Authentication:** Required

- **Route:** `PUT /api/memories/{memory_id}`
  - **Purpose:** Update a memory.
  - **Implemented in:** `routes/memory.py`
  - **Authentication:** Required

- **Route:** `DELETE /api/memories/{memory_id}`
  - **Purpose:** Delete a memory.
  - **Implemented in:** `routes/memory.py`
  - **Authentication:** Required

### Prompts
- **Route:** `GET /api/prompts/`
  - **Purpose:** Get all prompts for the user.
  - **Implemented in:** `routes/prompts.py`
  - **Authentication:** Required
- **Route:** `POST /api/prompts/`
  - **Purpose:** Create a new prompt.
  - **Implemented in:** `routes/prompts.py`
  - **Authentication:** Required
- **Route:** `PUT /api/prompts/{prompt_id}`
  - **Purpose:** Update a prompt.
  - **Implemented in:** `routes/prompts.py`
  - **Authentication:** Required
- **Route:** `DELETE /api/prompts/{prompt_id}`
  - **Purpose:** Delete a prompt.
  - **Implemented in:** `routes/prompts.py`
  - **Authentication:** Required
- **Route:** `POST /api/prompts/import`
  - **Purpose:** Import multiple prompts.
  - **Implemented in:** `routes/prompts.py`
  - **Authentication:** Required

### Tools
- **Route:** `POST /api/tools/execute`
  - **Purpose:** Execute a specific tool manually.
  - **Input JSON:** `{ "tool_name": "string", "args": {} }`
  - **Implemented in:** `routes/tool_router.py`
  - **Service:** `ToolService`
  - **Authentication:** Required
