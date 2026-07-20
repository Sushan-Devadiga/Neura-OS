from typing import List, Dict, Any

class AgentService:
    def __init__(self):
        self.agents = [
            {
                "id": "general",
                "name": "General Assistant",
                "description": "A versatile assistant for everyday queries.",
                "icon": "Bot",
                "color": "var(--color-ai-blue)",
                "system_prompt": "You are a helpful AI assistant for NeuraOS. You help users with their notes, documents, and tasks.",
                "specialization": ["General conversations", "Q&A"],
                "available_tools": ["Chat", "Memory", "Context", "RAG"],
                "enabled": True,
                "temperature": 0.7,
                "model": "gemini-2.5-flash"
            },
            {
                "id": "coding",
                "name": "Coding Agent",
                "description": "Expert software engineer for building applications.",
                "icon": "Code2",
                "color": "var(--color-ai-green)",
                "system_prompt": "You are an expert software engineer helping build production-grade applications. Always provide clean, scalable and maintainable solutions. Focus on Python, FastAPI, React, TypeScript, PostgreSQL, and Supabase.",
                "specialization": ["Python", "FastAPI", "React", "TypeScript", "PostgreSQL", "Supabase", "SQL", "Debugging", "Architecture"],
                "available_tools": ["Project Context", "Documents", "Notes", "Memory", "Prompt Library"],
                "enabled": True,
                "temperature": 0.2,
                "model": "gemini-2.5-pro"
            },
            {
                "id": "research",
                "name": "Research Agent",
                "description": "Analyzes and compares uploaded documents.",
                "icon": "Search",
                "color": "var(--color-ai-purple)",
                "system_prompt": "You are an expert research assistant. Always search uploaded documents before answering. Rely strictly on retrieved facts and provide citations.",
                "specialization": ["RAG", "Document Analysis", "Comparisons", "Summaries"],
                "available_tools": ["Documents", "RAG", "Knowledge Graph"],
                "enabled": True,
                "temperature": 0.3,
                "model": "gemini-2.5-pro"
            },
            {
                "id": "writing",
                "name": "Writing Agent",
                "description": "Improves your writing and drafts content.",
                "icon": "PenTool",
                "color": "var(--color-ai-pink)",
                "system_prompt": "You are an expert writing assistant. Help users write clear, engaging, and professional content. Structure your responses well.",
                "specialization": ["Blogs", "Documentation", "Emails", "Reports", "Resume improvements"],
                "available_tools": ["Notes", "Documents", "Prompt Library"],
                "enabled": True,
                "temperature": 0.7,
                "model": "gemini-2.5-flash"
            },
            {
                "id": "planning",
                "name": "Planning Agent",
                "description": "Breaks down projects and plans sprints.",
                "icon": "Calendar",
                "color": "var(--color-ai-orange)",
                "system_prompt": "You are an expert project manager. Help users organize their tasks, plan sprints, and create roadmaps. Be concise and actionable.",
                "specialization": ["Sprint planning", "Task breakdown", "Roadmaps", "Milestones"],
                "available_tools": ["Tasks", "Memories", "Notes", "Project Context"],
                "enabled": True,
                "temperature": 0.5,
                "model": "gemini-2.5-flash"
            },
            {
                "id": "review",
                "name": "Review Agent",
                "description": "Provides critical reviews and feedback.",
                "icon": "CheckSquare",
                "color": "var(--color-ai-cyan)",
                "system_prompt": "You are an expert reviewer. Provide critical, constructive, and thorough reviews for architecture, code, resumes, or documents.",
                "specialization": ["Architecture Reviews", "Resume Reviews", "Code Reviews", "Document Reviews"],
                "available_tools": ["Documents", "Notes", "Memory", "Knowledge Graph"],
                "enabled": True,
                "temperature": 0.3,
                "model": "gemini-2.5-pro"
            }
        ]

    def get_all_agents(self) -> List[Dict[str, Any]]:
        return self.agents

    def get_agent(self, agent_id: str) -> Dict[str, Any]:
        for agent in self.agents:
            if agent["id"] == agent_id:
                return agent
        return self.agents[0] # Fallback to general agent

    def execute_agent(self, agent_id: str, project_id: str, user_id: str, user_message: str, history: list, supabase) -> tuple:
        agent = self.get_agent(agent_id)
        
        # Apply system prompt
        system_instruction = agent["system_prompt"]
        
        system_instruction += "\n\nCRITICAL TOOL INSTRUCTION: When asked to perform a destructive action (like deleting a note, task, project, or document), DO NOT ask the user for confirmation in chat. Simply execute the corresponding tool immediately. The system will automatically pause and show a secure UI confirmation popup to the user. Also, you must ALWAYS use valid UUIDs for IDs. If you only know the title of a document/note/task, use the search tool first to find its UUID."
        
        system_instruction += "\n\nN8N WORKFLOW TOOLS INSTRUCTION: You have access to various n8n workflow tools. You must automatically infer the correct tool based on the user's request. Examples:"
        system_instruction += "\n- 'Reply to John's latest email.' -> reply_email()"
        system_instruction += "\n- 'Find the resume stored in Drive.' -> search_drive()"
        system_instruction += "\n- 'Create a folder called AI Notes.' -> create_drive_folder()"
        system_instruction += "\n- 'Search project documents.' -> search_files()"
        system_instruction += "\n- 'Move report.pdf to Archive.' -> move_file()"
        system_instruction += "\n- 'Create a GitHub issue' -> create_issue()"
        system_instruction += "\n- 'Show repository' -> get_repository()"
        system_instruction += "\n- 'List my repositories' -> list_repositories()"
        system_instruction += "\n- 'Edit issue number 5' -> edit_issue()"
        system_instruction += "\n- 'Comment on issue 4' -> create_issue_comment()"
        system_instruction += "\n- 'Lock issue 12' -> lock_issue()"
        system_instruction += "\n- 'Create README.md' -> create_file()"
        system_instruction += "\n- 'Open main.py' -> get_file()"
        system_instruction += "\n- 'Update requirements.txt' -> edit_file()"
        system_instruction += "\n- 'Delete old.txt' -> delete_file()"
        
        # Load enabled tools
        available_tools = agent.get("available_tools", [])
        
        if "Project Context" in available_tools or "Context" in available_tools:
            try:
                from context_engine import ProjectContextEngine
                context_engine = ProjectContextEngine(supabase)
                proj_context = context_engine.build_context(project_id)
                if proj_context:
                    system_instruction += "\n\n--- PROJECT CONTEXT ---\n" + proj_context
            except Exception as e:
                import logging
                logging.getLogger(__name__).error(f"Error retrieving project context: {e}")
        
        if "Memory" in available_tools or "Memories" in available_tools:
            try:
                from services.memory_service import MemoryService
                mem_service = MemoryService(supabase)
                memories_context = mem_service.retrieve_relevant_memories(project_id)
                if memories_context:
                    system_instruction += "\n\n--- MEMORIES ---\n" + memories_context
            except Exception as e:
                import logging
                logging.getLogger(__name__).error(f"Error retrieving memories: {e}")
                
        if "RAG" in available_tools or "Documents" in available_tools:
            try:
                from services.rag_service import RAGService
                rag = RAGService(supabase)
                chunks = rag.retrieve_relevant_chunks(project_id, user_message, limit=5)
                if chunks:
                    system_instruction += "\n\n--- RELEVANT DOCUMENT CHUNKS ---\n"
                    for chunk in chunks:
                        system_instruction += f"{chunk.get('content')}\n---\n"
                    system_instruction += "\nINSTRUCTION: You must strictly base your answer on the above relevant document chunks when applicable. Always include clear citations specifying which document you used."
            except Exception as e:
                import logging
                logging.getLogger(__name__).error(f"Error retrieving RAG chunks: {e}")

        # Map tools using ToolService
        from services.tool_service import ToolService
        tool_service = ToolService(supabase, user_id)
        all_tools_map = tool_service.get_tool_map()
        
        # Map agent specific tools based on rules in phase 5.9
        agent_mapped_tools = []
        if agent_id == "general":
            agent_mapped_tools = ["create_note", "create_task", "search_documents", "delete_document"]
        elif agent_id == "coding":
            agent_mapped_tools = ["search_documents", "search_notes", "create_note", "delete_document"]
        elif agent_id == "research":
            agent_mapped_tools = ["search_documents", "search_knowledge_graph"]
        elif agent_id == "planning":
            agent_mapped_tools = ["create_task", "update_task", "search_tasks", "delete_task"]
        elif agent_id == "writing":
            agent_mapped_tools = ["create_note", "update_note", "delete_note"]
        elif agent_id == "review":
            agent_mapped_tools = ["search_documents", "search_notes"]
            
        if "trigger_workflow" not in agent_mapped_tools:
            agent_mapped_tools.append("trigger_workflow")
            
        # Register all n8n workflow tools
        n8n_tools = [
            "send_email", "read_inbox", "search_emails", "reply_email", "draft_email",
            "upload_drive_file", "search_drive", "create_drive_folder", "delete_drive_file",
            "create_file", "read_file", "move_file", "copy_file", "delete_file",
            "search_files", "list_files", "get_file_metadata",
            "create_repository", "get_repository", "list_repositories",
            "create_issue", "edit_issue", "get_issue", "create_issue_comment", "lock_issue",
            "edit_file", "get_file"
        ]
        
        for tool in n8n_tools:
            if tool not in agent_mapped_tools:
                agent_mapped_tools.append(tool)
            
        executable_tools = [all_tools_map[t] for t in agent_mapped_tools if t in all_tools_map]

        # Call existing Chat Service
        from services.chat_service import ChatService
        chat_service = ChatService()
        response_text = chat_service.generate_response(
            system_instruction=system_instruction,
            history=history,
            last_message=user_message,
            model_name=agent["model"],
            temperature=agent["temperature"],
            tools=executable_tools
        )
        
        return response_text, tool_service.execution_logs

# Singleton instance for easy import if needed
agent_service = AgentService()
