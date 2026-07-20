import logging
from typing import Optional

logger = logging.getLogger(__name__)

class ProjectContextEngine:
    def __init__(self, supabase_client):
        """
        Initialize the context engine with a Supabase client.
        The client should already be authenticated with the user's token
        to ensure all queries respect RLS and project ownership.
        """
        self.supabase = supabase_client

    def build_context(self, project_id: str) -> Optional[str]:
        """
        Retrieves project details, notes, tasks, and documents to build
        a comprehensive context string for the AI.
        Returns None if context generation fails.
        """
        try:
            # 1. Fetch Project Details
            proj_resp = self.supabase.table("projects").select("name, description").eq("id", project_id).execute()
            if not proj_resp.data:
                logger.warning(f"ProjectContextEngine: Project {project_id} not found.")
                return None
            
            project = proj_resp.data[0]
            project_name = project.get("name", "Unknown Project")
            project_desc = project.get("description") or "No description provided."

            # 2. Fetch 5 most recently updated notes
            notes_resp = self.supabase.table("notes").select("title, content").eq("project_id", project_id).order("updated_at", desc=True).limit(5).execute()
            notes = notes_resp.data or []

            # 3. Fetch 5 most recently updated tasks
            tasks_resp = self.supabase.table("tasks").select("title, status, priority, description").eq("project_id", project_id).order("updated_at", desc=True).limit(5).execute()
            tasks = tasks_resp.data or []

            # 4. Fetch 5 most recently uploaded documents
            docs_resp = self.supabase.table("documents").select("file_name").eq("project_id", project_id).order("updated_at", desc=True).limit(5).execute()
            documents = docs_resp.data or []

            # 5. Construct the context string
            context_lines = [
                f"You are a helpful AI assistant for NeuraOS, a project management tool.",
                f"You are currently assisting a user in the project '{project_name}'.",
                f"Project Description: {project_desc}",
                "\n--- CURRENT PROJECT CONTEXT ---"
            ]

            if notes:
                context_lines.append("\nRecent Notes:")
                for i, note in enumerate(notes, 1):
                    content_snippet = note.get("content", "") or ""
                    # Truncate content to avoid overwhelming the prompt
                    if len(content_snippet) > 150:
                        content_snippet = content_snippet[:147] + "..."
                    context_lines.append(f"{i}. {note.get('title')} - {content_snippet}")
            else:
                context_lines.append("\nRecent Notes: None")

            if tasks:
                context_lines.append("\nRecent Tasks:")
                for i, task in enumerate(tasks, 1):
                    status = task.get("status", "unknown")
                    priority = task.get("priority", "unknown")
                    desc = task.get("description") or ""
                    if len(desc) > 100:
                        desc = desc[:97] + "..."
                    context_lines.append(f"{i}. [{status.upper()}] ({priority.upper()} priority) {task.get('title')} - {desc}")
            else:
                context_lines.append("\nRecent Tasks: None")

            if documents:
                context_lines.append("\nRecent Documents:")
                for i, doc in enumerate(documents, 1):
                    context_lines.append(f"{i}. {doc.get('file_name')}")
            else:
                context_lines.append("\nRecent Documents: None")

            context_lines.append("\n-------------------------------")
            context_lines.append("Use the above context to answer the user's queries accurately.")
            
            return "\n".join(context_lines)

        except Exception as e:
            logger.error(f"ProjectContextEngine: Error building context for project {project_id}: {str(e)}")
            return None
