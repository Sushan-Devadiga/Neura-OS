import logging
from typing import Dict, Any, List, Optional
import json
from services.n8n_service import N8NService

logger = logging.getLogger(__name__)

class ToolService:
    def __init__(self, supabase_client, user_id: str):
        self.supabase = supabase_client
        self.user_id = user_id
        
        self.n8n_service = N8NService()
        
        # Keep a log of tool executions to display in chat
        self.execution_logs = []
        
    def add_log(self, log_msg: str):
        self.execution_logs.append(log_msg)

    # ------------------
    # PROJECTS
    # ------------------
    def create_project(self, name: str, description: str = "") -> Dict[str, Any]:
        """
        Create a new project.
        
        Args:
            name: The name of the project.
            description: A short description of the project.
        """
        self.add_log(f"🔧 Creating project '{name}'...")
        try:
            resp = self.supabase.table("projects").insert({
                "user_id": self.user_id,
                "name": name,
                "description": description or ""
            }).execute()
            self.add_log("✅ Project created successfully.")
            return {"status": "success", "data": resp.data[0]}
        except Exception as e:
            err = str(e)
            self.add_log(f"❌ Failed to create project: {err}")
            return {"status": "error", "error": err}

    # ------------------
    # NOTES
    # ------------------
    def create_note(self, project_id: str, title: str, content: str) -> Dict[str, Any]:
        """
        Create a new note in the specified project.
        
        Args:
            project_id: The ID of the project.
            title: The title of the note.
            content: The content of the note.
        """
        self.add_log(f"🔧 Creating note '{title}'...")
        try:
            resp = self.supabase.table("notes").insert({
                "user_id": self.user_id,
                "project_id": project_id,
                "title": title,
                "content": content
            }).execute()
            self.add_log("✅ Note created successfully.")
            return {"status": "success", "data": resp.data[0]}
        except Exception as e:
            err = str(e)
            self.add_log(f"❌ Failed to create note: {err}")
            return {"status": "error", "error": err}
            
    def update_note(self, note_id: str, title: str = "", content: str = "") -> Dict[str, Any]:
        """
        Update an existing note's title or content. At least one of title or content must be provided.
        
        Args:
            note_id: The ID of the note to update.
            title: The new title. Leave empty to not update.
            content: The new content. Leave empty to not update.
        """
        self.add_log(f"🔧 Updating note {note_id}...")
        try:
            updates = {}
            if title: updates["title"] = title
            if content: updates["content"] = content
            if not updates:
                return {"status": "success", "message": "No fields to update."}
                
            resp = self.supabase.table("notes").update(updates).eq("id", note_id).eq("user_id", self.user_id).execute()
            if not resp.data:
                self.add_log("❌ Failed to update note (not found or access denied).")
                return {"status": "error", "error": "Note not found or access denied"}
            self.add_log("✅ Note updated successfully.")
            return {"status": "success", "data": resp.data[0]}
        except Exception as e:
            err = str(e)
            self.add_log(f"❌ Failed to update note: {err}")
            return {"status": "error", "error": err}
            
    def delete_note(self, note_id: str, **kwargs) -> Dict[str, Any]:
        """
        Delete a note.
        
        Args:
            note_id: The ID of the note to delete.
        """
        user_confirmed = kwargs.get("user_confirmed", False)
        if not user_confirmed:
            return {"status": "error", "error": "Action requires user confirmation. Please ask the user to confirm before calling this tool again with user_confirmed=True."}
            
        self.add_log(f"🔧 Deleting note {note_id}...")
        try:
            resp = self.supabase.table("notes").delete().eq("id", note_id).eq("user_id", self.user_id).execute()
            self.add_log("✅ Note deleted successfully.")
            return {"status": "success", "message": "Note deleted"}
        except Exception as e:
            err = str(e)
            self.add_log(f"❌ Failed to delete note: {err}")
            return {"status": "error", "error": err}

    # ------------------
    # TASKS
    # ------------------
    def create_task(self, project_id: str, title: str, description: str = "", priority: str = "medium", status: str = "todo") -> Dict[str, Any]:
        """
        Create a new task in the specified project.
        
        Args:
            project_id: The ID of the project.
            title: The title of the task.
            description: Detailed description of the task.
            priority: Priority level ('low', 'medium', 'high').
            status: Status ('todo', 'in_progress', 'done').
        """
        self.add_log(f"🔧 Creating task '{title}'...")
        try:
            resp = self.supabase.table("tasks").insert({
                "user_id": self.user_id,
                "project_id": project_id,
                "title": title,
                "description": description or "",
                "priority": priority,
                "status": status
            }).execute()
            self.add_log("✅ Task created successfully.")
            return {"status": "success", "data": resp.data[0]}
        except Exception as e:
            err = str(e)
            self.add_log(f"❌ Failed to create task: {err}")
            return {"status": "error", "error": err}

    def update_task(self, task_id: str, title: str = "", description: str = "", priority: str = "", status: str = "") -> Dict[str, Any]:
        """
        Update an existing task.
        
        Args:
            task_id: The ID of the task to update.
            title: The new title. Leave empty to not update.
            description: The new description. Leave empty to not update.
            priority: The new priority ('low', 'medium', 'high'). Leave empty to not update.
            status: The new status ('todo', 'in_progress', 'done'). Leave empty to not update.
        """
        self.add_log(f"🔧 Updating task {task_id}...")
        try:
            updates = {}
            if title: updates["title"] = title
            if description: updates["description"] = description
            if priority: updates["priority"] = priority
            if status: updates["status"] = status
            
            if not updates:
                return {"status": "success", "message": "No fields to update."}
                
            resp = self.supabase.table("tasks").update(updates).eq("id", task_id).eq("user_id", self.user_id).execute()
            if not resp.data:
                self.add_log("❌ Failed to update task (not found or access denied).")
                return {"status": "error", "error": "Task not found or access denied"}
            self.add_log("✅ Task updated successfully.")
            return {"status": "success", "data": resp.data[0]}
        except Exception as e:
            err = str(e)
            self.add_log(f"❌ Failed to update task: {err}")
            return {"status": "error", "error": err}
            
    def delete_task(self, task_id: str, **kwargs) -> Dict[str, Any]:
        """
        Delete a task.
        
        Args:
            task_id: The ID of the task to delete.
        """
        user_confirmed = kwargs.get("user_confirmed", False)
        if not user_confirmed:
            return {"status": "error", "error": "Action requires user confirmation. Please ask the user to confirm before calling this tool again with user_confirmed=True."}
            
        self.add_log(f"🔧 Deleting task {task_id}...")
        try:
            resp = self.supabase.table("tasks").delete().eq("id", task_id).eq("user_id", self.user_id).execute()
            self.add_log("✅ Task deleted successfully.")
            return {"status": "success", "message": "Task deleted"}
        except Exception as e:
            err = str(e)
            self.add_log(f"❌ Failed to delete task: {err}")
            return {"status": "error", "error": err}

    # ------------------
    # SEARCH
    # ------------------
    def search_tasks(self, project_id: str, query: str = "") -> Dict[str, Any]:
        """
        Search for tasks in a project.
        
        Args:
            project_id: The ID of the project.
            query: The search term to match against task title or description. Leave empty to list all tasks.
        """
        self.add_log("🔧 Searching tasks...")
        try:
            req = self.supabase.table("tasks").select("id, title, status, priority").eq("project_id", project_id)
            if query:
                req = req.ilike("title", f"%{query}%")
            resp = req.execute()
            self.add_log(f"📄 Found {len(resp.data or [])} tasks.")
            return {"status": "success", "data": resp.data}
        except Exception as e:
            err = str(e)
            self.add_log(f"❌ Failed to search tasks: {err}")
            return {"status": "error", "error": err}

    def search_documents(self, project_id: str, query: str) -> Dict[str, Any]:
        """
        Search documents in a project (Basic keyword search).
        
        Args:
            project_id: The ID of the project.
            query: The search term.
        """
        self.add_log("🔧 Searching documents...")
        try:
            # We'll use the RAG service to find relevant chunks instead of ILIKE on a non-existent column
            from services.rag_service import RAGService
            rag = RAGService(self.supabase)
            chunks = rag.retrieve_relevant_chunks(project_id, query, limit=5)
            
            if not chunks:
                self.add_log("📄 Found 0 matching documents.")
                return {"status": "success", "data": []}
                
            self.add_log(f"📄 Found {len(chunks)} relevant document chunks.")
            return {"status": "success", "data": chunks}
        except Exception as e:
            err = str(e)
            self.add_log(f"❌ Failed to search documents: {err}")
            return {"status": "error", "error": err}

    def read_document(self, document_id: str) -> Dict[str, Any]:
        """
        Read the full text content of a specific document.
        
        Args:
            document_id: The ID of the document to read.
        """
        self.add_log(f"📖 Reading document {document_id}...")
        try:
            # Fetch doc metadata
            doc_resp = self.supabase.table("documents").select("id, title, file_name").eq("id", document_id).execute()
            if not doc_resp.data:
                return {"status": "error", "error": "Document not found"}
                
            # Fetch all chunks for this document to reconstruct content
            chunk_resp = self.supabase.table("document_chunks").select("content").eq("document_id", document_id).order("chunk_index").execute()
            
            content = ""
            if chunk_resp.data:
                content = "\n\n".join([c["content"] for c in chunk_resp.data])
                
            doc_data = doc_resp.data[0]
            doc_data["content"] = content
            
            self.add_log(f"✅ Document '{doc_data.get('title')}' read successfully.")
            return {"status": "success", "data": doc_data}
        except Exception as e:
            err = str(e)
            self.add_log(f"❌ Failed to read document: {err}")
            return {"status": "error", "error": err}

    def search_notes(self, project_id: str, query: str) -> Dict[str, Any]:
        """
        Search notes in a project.
        
        Args:
            project_id: The ID of the project.
            query: The search term to match against note title or content.
        """
        self.add_log("🔧 Searching notes...")
        try:
            resp = self.supabase.table("notes").select("id, title, updated_at").eq("project_id", project_id).ilike("content", f"%{query}%").execute()
            self.add_log(f"📄 Found {len(resp.data or [])} matching notes.")
            return {"status": "success", "data": resp.data}
        except Exception as e:
            err = str(e)
            self.add_log(f"❌ Failed to search notes: {err}")
            return {"status": "error", "error": err}

    def search_memories(self, project_id: str, query: str = "") -> Dict[str, Any]:
        """
        Search long-term memories in a project.
        
        Args:
            project_id: The ID of the project.
            query: The search term to match against memory content.
        """
        self.add_log("🔧 Searching memories...")
        try:
            req = self.supabase.table("memories").select("id, content, category, importance").eq("project_id", project_id).eq("is_archived", False)
            if query:
                req = req.ilike("content", f"%{query}%")
            resp = req.execute()
            self.add_log(f"📄 Found {len(resp.data or [])} memories.")
            return {"status": "success", "data": resp.data}
        except Exception as e:
            err = str(e)
            self.add_log(f"❌ Failed to search memories: {err}")
            return {"status": "error", "error": err}

    def search_knowledge_graph(self, project_id: str, query: str) -> Dict[str, Any]:
        """
        Search knowledge graph nodes in a project.
        
        Args:
            project_id: The ID of the project.
            query: The search term to match against node label.
        """
        self.add_log("🔧 Searching knowledge graph...")
        try:
            resp = self.supabase.table("knowledge_nodes").select("id, label, node_type, properties").eq("project_id", project_id).ilike("label", f"%{query}%").execute()
            self.add_log(f"📄 Found {len(resp.data or [])} knowledge graph nodes.")
            return {"status": "success", "data": resp.data}
        except Exception as e:
            err = str(e)
            self.add_log(f"❌ Failed to search knowledge graph: {err}")
            return {"status": "error", "error": err}

    def delete_document(self, document_id: str, **kwargs) -> Dict[str, Any]:
        """
        Delete a document.
        
        Args:
            document_id: The ID of the document to delete. Must be a valid UUID. Do not pass the document title. Use search_documents first if you don't know the ID.
        """
        user_confirmed = kwargs.get("user_confirmed", False)
        if not user_confirmed:
            return {"status": "requires_confirmation", "error": "Action requires user confirmation. Please ask the user to confirm before calling this tool again with user_confirmed=True."}
            
        self.add_log(f"🔧 Deleting document {document_id}...")
        try:
            resp = self.supabase.table("documents").delete().eq("id", document_id).eq("user_id", self.user_id).execute()
            self.add_log("✅ Document deleted successfully.")
            return {"status": "success", "message": "Document deleted"}
        except Exception as e:
            err = str(e)
            self.add_log(f"❌ Failed to delete document: {err}")
            return {"status": "error", "error": err}

    # ------------------
    # N8N WORKFLOWS
    # ------------------
    async def trigger_workflow(self, workflow_name: str, payload: Any = None) -> dict:
        """
        Trigger an n8n automation workflow.
        Use this whenever the user requests an action that should be performed by an external automation platform.
        
        Args:
            workflow_name: The workflow to execute.
            payload: JSON payload passed directly to the workflow.
        """
        self.add_log(f"🔧 Triggering n8n workflow '{workflow_name}'...")
        try:
            if not workflow_name:
                raise ValueError("Workflow name cannot be empty.")
            
            if payload is None:
                payload = {}
                
            if isinstance(payload, str):
                try:
                    payload = json.loads(payload)
                except json.JSONDecodeError:
                    raise ValueError("Payload string must be valid JSON.")
                    
            if not isinstance(payload, dict):
                raise ValueError(f"Payload must be a dictionary, got {type(payload).__name__}.")
                
            response = await self.n8n_service.trigger_workflow(workflow=workflow_name, payload=payload)
            
            if isinstance(response, dict) and response.get("status") == "error":
                err_msg = response.get("error", "Unknown workflow error")
                self.add_log(f"❌ Workflow '{workflow_name}' returned an error: {err_msg}")
                return {"status": "error", "error": err_msg}
                
            self.add_log(f"✅ Workflow '{workflow_name}' executed successfully.")
            
            result_data = response.get("result", response) if isinstance(response, dict) else response
            return {"status": "success", "data": result_data}
            
        except Exception as e:
            err = str(e)
            self.add_log(f"❌ Failed to trigger workflow '{workflow_name}': {err}")
            return {"status": "error", "error": err}

    async def send_email(self, to: str, subject: str, message: str) -> dict:
        """
        Send an email using the user's connected Gmail account.
        
        Args:
            to: The email address to send to.
            subject: The subject of the email.
            message: The content of the email.
        """
        self.add_log(f"📧 Sending email to '{to}' with subject '{subject}'...")
        try:
            response = await self.n8n_service.send_email(to=to, subject=subject, message=message)
            
            self.add_log("✅ Email sent successfully via n8n.")
            # Return the response directly if it's already structured, or wrap it
            return response if isinstance(response, dict) else {"success": True, "message": "Email sent successfully", "data": response}
            
        except Exception as e:
            err = str(e)
            self.add_log(f"❌ Failed to send email: {err}")
            return {"success": False, "message": "Failed to send email", "error": err}

    async def read_inbox(self, max_results: int = 5) -> dict:
        """
        Read unread Gmail messages from the user's inbox.
        
        Args:
            max_results: The maximum number of emails to retrieve (default is 5).
        """
        self.add_log(f"📥 Reading up to {max_results} unread emails...")
        try:
            response = await self.n8n_service.read_inbox(max_results=max_results)
            
            count = response.get("count", 0) if isinstance(response, dict) else 0
            self.add_log(f"✅ Retrieved {count} emails successfully via n8n.")
            
            # Ensure we return the structured JSON as requested
            return response
            
        except Exception as e:
            err = str(e)
            self.add_log(f"❌ Failed to read inbox: {err}")
            return {"success": False, "message": "Failed to read inbox", "error": err}

    async def search_emails(self, query: str, max_results: int = 10) -> dict:
        """
        Search for emails in the user's Gmail inbox.
        
        Args:
            query: The search query (e.g., 'from:john subject:urgent').
            max_results: The maximum number of emails to return (default: 10).
        """
        if not query:
            return {"status": "error", "error": "Missing required parameter: query"}
        return await self.trigger_workflow("search-emails", {"query": query, "max_results": max_results})

    async def reply_email(self, thread_id: str, message: str) -> dict:
        """
        Reply to an existing email thread in Gmail.
        
        Args:
            thread_id: The ID of the email thread to reply to.
            message: The content of the reply message.
        """
        if not thread_id or not message:
            return {"status": "error", "error": "Missing required parameters: thread_id, message"}
        return await self.trigger_workflow("reply-email", {"thread_id": thread_id, "message": message})

    async def draft_email(self, to: str, subject: str, message: str) -> dict:
        """
        Create a draft email in Gmail without sending it.
        
        Args:
            to: The email address of the recipient.
            subject: The subject of the email.
            message: The content of the email draft.
        """
        if not to or not subject or not message:
            return {"status": "error", "error": "Missing required parameters: to, subject, message"}
        return await self.trigger_workflow("draft-email", {"to": to, "subject": subject, "message": message})

    async def upload_drive_file(self, file_name: str, content: str, folder_id: str = "") -> dict:
        """
        Upload a file to Google Drive.
        
        Args:
            file_name: The name of the file to create.
            content: The text content of the file.
            folder_id: (Optional) The ID of the Google Drive folder to upload to.
        """
        if not file_name or not content:
            return {"status": "error", "error": "Missing required parameters: file_name, content"}
        return await self.trigger_workflow("upload-file", {"file_name": file_name, "content": content, "folder_id": folder_id})

    async def search_drive(self, query: str) -> dict:
        """
        Search for files or folders in Google Drive.
        
        Args:
            query: The search term to find in Google Drive.
        """
        if not query:
            return {"status": "error", "error": "Missing required parameter: query"}
        return await self.trigger_workflow("search-drive", {"query": query})

    async def create_drive_folder(self, folder_name: str, parent_id: str = "") -> dict:
        """
        Create a new folder in Google Drive.
        
        Args:
            folder_name: The name of the folder to create.
            parent_id: (Optional) The ID of the parent folder where this folder should be created.
        """
        if not folder_name:
            return {"status": "error", "error": "Missing required parameter: folder_name"}
        return await self.trigger_workflow("create-folder", {"folder_name": folder_name, "parent_id": parent_id})

    async def delete_drive_file(self, file_id: str, **kwargs) -> dict:
        """
        Delete a file or folder in Google Drive.
        
        Args:
            file_id: The ID of the file or folder to delete.
        """
        if not file_id:
            return {"status": "error", "error": "Missing required parameter: file_id"}
        user_confirmed = kwargs.get("user_confirmed", False)
        if not user_confirmed:
            return {"status": "requires_confirmation", "error": "Action requires user confirmation. Please ask the user to confirm before calling this tool again with user_confirmed=True."}
        return await self.trigger_workflow("delete-drive-file", {"file_id": file_id})

    async def create_file(self, file_name: str = None, content: str = None, path: str = None, owner: str = None, repository: str = None) -> dict:
        """
        Create a new file in the local/remote file management system or GitHub.
        
        Args:
            file_name: The name of the file to create (for local files).
            content: The content to write to the file.
            path: The directory path where the file should be created.
            owner: (Optional) GitHub repository owner.
            repository: (Optional) GitHub repository name.
        """
        if owner and repository:
            file_path = path or file_name
            if not file_path or not content:
                return {"status": "error", "error": "Missing required parameters for GitHub: path, content"}
            return await self.trigger_workflow("create_file", {"owner": owner, "repository": repository, "path": file_path, "content": content})
        else:
            if not file_name or not content:
                return {"status": "error", "error": "Missing required parameters: file_name, content"}
            local_path = path if path is not None else "/"
            return await self.trigger_workflow("create-file", {"file_name": file_name, "content": content, "path": local_path})

    async def read_file(self, file_name: str, path: str = "/") -> dict:
        """
        Read the contents of a file from the file management system.
        
        Args:
            file_name: The name of the file to read.
            path: The directory path where the file is located (default: "/").
        """
        if not file_name:
            return {"status": "error", "error": "Missing required parameter: file_name"}
        return await self.trigger_workflow("read-file", {"file_name": file_name, "path": path})

    async def move_file(self, file_name: str, source_path: str, destination_path: str) -> dict:
        """
        Move a file from one path to another in the file management system.
        
        Args:
            file_name: The name of the file to move.
            source_path: The current directory path of the file.
            destination_path: The target directory path to move the file to.
        """
        if not file_name or not source_path or not destination_path:
            return {"status": "error", "error": "Missing required parameters: file_name, source_path, destination_path"}
        return await self.trigger_workflow("move-file", {"file_name": file_name, "source_path": source_path, "destination_path": destination_path})

    async def copy_file(self, file_name: str, source_path: str, destination_path: str) -> dict:
        """
        Copy a file from one path to another in the file management system.
        
        Args:
            file_name: The name of the file to copy.
            source_path: The current directory path of the file.
            destination_path: The target directory path to copy the file to.
        """
        if not file_name or not source_path or not destination_path:
            return {"status": "error", "error": "Missing required parameters: file_name, source_path, destination_path"}
        return await self.trigger_workflow("copy-file", {"file_name": file_name, "source_path": source_path, "destination_path": destination_path})

    async def delete_file(self, file_name: str = None, path: str = None, owner: str = None, repository: str = None, **kwargs) -> dict:
        """
        Delete a file from the file management system or GitHub.
        
        Args:
            file_name: The name of the file to delete (local).
            path: The directory path where the file is located.
            owner: (Optional) GitHub repository owner.
            repository: (Optional) GitHub repository name.
        """
        user_confirmed = kwargs.get("user_confirmed", False)
        if not user_confirmed:
            return {"status": "requires_confirmation", "error": "Action requires user confirmation. Please ask the user to confirm before calling this tool again with user_confirmed=True."}
            
        if owner and repository:
            file_path = path or file_name
            if not file_path:
                return {"status": "error", "error": "Missing required parameter for GitHub: path"}
            return await self.trigger_workflow("delete_file", {"owner": owner, "repository": repository, "path": file_path})
        else:
            if not file_name:
                return {"status": "error", "error": "Missing required parameter: file_name"}
            local_path = path if path is not None else "/"
            return await self.trigger_workflow("delete-file", {"file_name": file_name, "path": local_path})

    async def search_files(self, query: str, path: str = "/") -> dict:
        """
        Search for files matching a query in the file management system.
        
        Args:
            query: The search term or pattern to match.
            path: The directory path to search in (default: "/").
        """
        if not query:
            return {"status": "error", "error": "Missing required parameter: query"}
        return await self.trigger_workflow("search-files", {"query": query, "path": path})

    async def list_files(self, path: str = "/", owner: str = None, repository: str = None) -> dict:
        """
        List all files and directories in a given path (local or GitHub).
        
        Args:
            path: The directory path to list contents of (default: "/").
            owner: (Optional) GitHub repository owner.
            repository: (Optional) GitHub repository name.
        """
        if not path:
            return {"status": "error", "error": "Missing required parameter: path"}
            
        if owner and repository:
            return await self.trigger_workflow("list_files", {"owner": owner, "repository": repository, "path": path})
        else:
            return await self.trigger_workflow("list-files", {"path": path})

    async def get_file_metadata(self, file_name: str, path: str = "/") -> dict:
        """
        Get metadata for a specific file (e.g., size, modified date).
        
        Args:
            file_name: The name of the file.
            path: The directory path where the file is located (default: "/").
        """
        if not file_name:
            return {"status": "error", "error": "Missing required parameter: file_name"}
        return await self.trigger_workflow("get-file-metadata", {"file_name": file_name, "path": path})

    # ------------------
    # GITHUB
    # ------------------
    async def create_repository(self, name: str, description: str = "", private: bool = False) -> dict:
        if not name:
            return {"status": "error", "error": "Missing required parameter: name"}
        return await self.trigger_workflow("create_repository", {"name": name, "description": description, "private": private})

    async def get_repository(self, owner: str, repository: str) -> dict:
        if not owner or not repository:
            return {"status": "error", "error": "Missing required parameters: owner, repository"}
        return await self.trigger_workflow("get_repository", {"owner": owner, "repository": repository})

    async def list_repositories(self, owner: str = "") -> dict:
        return await self.trigger_workflow("list_repositories", {"owner": owner})

    async def create_issue(self, owner: str, repository: str, title: str, body: str = "") -> dict:
        if not owner or not repository or not title:
            return {"status": "error", "error": "Missing required parameters: owner, repository, title"}
        return await self.trigger_workflow("create_issue", {"owner": owner, "repository": repository, "title": title, "body": body})

    async def edit_issue(self, owner: str, repository: str, issue_number: int, title: str = "", body: str = "") -> dict:
        if not owner or not repository or not issue_number:
            return {"status": "error", "error": "Missing required parameters: owner, repository, issue_number"}
        return await self.trigger_workflow("edit_issue", {"owner": owner, "repository": repository, "issue_number": issue_number, "title": title, "body": body})

    async def get_issue(self, owner: str, repository: str, issue_number: int) -> dict:
        if not owner or not repository or not issue_number:
            return {"status": "error", "error": "Missing required parameters: owner, repository, issue_number"}
        return await self.trigger_workflow("get_issue", {"owner": owner, "repository": repository, "issue_number": issue_number})

    async def create_issue_comment(self, owner: str, repository: str, issue_number: int, body: str) -> dict:
        if not owner or not repository or not issue_number or not body:
            return {"status": "error", "error": "Missing required parameters: owner, repository, issue_number, body"}
        return await self.trigger_workflow("create_issue_comment", {"owner": owner, "repository": repository, "issue_number": issue_number, "body": body})

    async def lock_issue(self, owner: str, repository: str, issue_number: int) -> dict:
        if not owner or not repository or not issue_number:
            return {"status": "error", "error": "Missing required parameters: owner, repository, issue_number"}
        return await self.trigger_workflow("lock_issue", {"owner": owner, "repository": repository, "issue_number": issue_number})

    async def edit_file(self, owner: str, repository: str, path: str, content: str, message: str = "Update file") -> dict:
        if not owner or not repository or not path or not content:
            return {"status": "error", "error": "Missing required parameters: owner, repository, path, content"}
        return await self.trigger_workflow("edit_file", {"owner": owner, "repository": repository, "path": path, "content": content, "message": message})

    async def get_file(self, owner: str, repository: str, path: str) -> dict:
        if not owner or not repository or not path:
            return {"status": "error", "error": "Missing required parameters: owner, repository, path"}
        return await self.trigger_workflow("get_file", {"owner": owner, "repository": repository, "path": path})

    def get_tool_map(self):
        """
        Returns a mapping of tool names to their corresponding callable methods.
        """
        return {
            "create_project": self.create_project,
            "create_note": self.create_note,
            "update_note": self.update_note,
            "delete_note": self.delete_note,
            "create_task": self.create_task,
            "update_task": self.update_task,
            "delete_task": self.delete_task,
            "search_tasks": self.search_tasks,
            "search_documents": self.search_documents,
            "read_document": self.read_document,
            "search_notes": self.search_notes,
            "search_memories": self.search_memories,
            "search_knowledge_graph": self.search_knowledge_graph,
            "delete_document": self.delete_document,
            "trigger_workflow": self.trigger_workflow,
            "send_email": self.send_email,
            "read_inbox": self.read_inbox,
            "search_emails": self.search_emails,
            "reply_email": self.reply_email,
            "draft_email": self.draft_email,
            "upload_drive_file": self.upload_drive_file,
            "search_drive": self.search_drive,
            "create_drive_folder": self.create_drive_folder,
            "delete_drive_file": self.delete_drive_file,
            "create_file": self.create_file,
            "read_file": self.read_file,
            "move_file": self.move_file,
            "copy_file": self.copy_file,
            "delete_file": self.delete_file,
            "search_files": self.search_files,
            "list_files": self.list_files,
            "get_file_metadata": self.get_file_metadata,
            "create_repository": self.create_repository,
            "get_repository": self.get_repository,
            "list_repositories": self.list_repositories,
            "create_issue": self.create_issue,
            "edit_issue": self.edit_issue,
            "get_issue": self.get_issue,
            "create_issue_comment": self.create_issue_comment,
            "lock_issue": self.lock_issue,
            "edit_file": self.edit_file,
            "get_file": self.get_file
        }
