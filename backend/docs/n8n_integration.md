# Neura-OS n8n Workflow Integration

This document outlines the 27 n8n workflows integrated into Neura-OS through the `ToolService`. These tools are seamlessly exposed to the Gemini AI agents.

## Exposed Tools

### Email (Gmail)
- `send_email(to: str, subject: str, message: str)`: Sends an email.
- `read_inbox(max_results: int = 5)`: Fetches unread emails.
- `search_emails(query: str, max_results: int = 10)`: Searches the Gmail inbox.
- `reply_email(thread_id: str, message: str)`: Replies to a specific email thread.
- `draft_email(to: str, subject: str, message: str)`: Creates a draft email without sending.

### Google Drive
- `upload_drive_file(file_name: str, content: str, folder_id: str = "")`: Uploads a text file to Drive.
- `search_drive(query: str)`: Searches Drive files and folders.
- `create_drive_folder(folder_name: str, parent_id: str = "")`: Creates a new Drive folder.
- `delete_drive_file(file_id: str)`: Deletes a Drive file or folder (requires user confirmation).

### File Management
- `create_file(file_name: str = None, content: str = None, path: str = None, owner: str = None, repository: str = None)`: Creates a file. Supports GitHub if owner/repository are provided.
- `read_file(file_name: str, path: str = "/")`: Reads a file's content.
- `move_file(file_name: str, source_path: str, destination_path: str)`: Moves a file.
- `copy_file(file_name: str, source_path: str, destination_path: str)`: Copies a file.
- `delete_file(file_name: str = None, path: str = None, owner: str = None, repository: str = None)`: Deletes a file (requires user confirmation). Supports GitHub if owner/repository are provided.
- `search_files(query: str, path: str = "/")`: Searches for matching files.
- `list_files(path: str = "/", owner: str = None, repository: str = None)`: Lists contents of a directory. Supports GitHub if owner/repository are provided.
- `get_file_metadata(file_name: str, path: str = "/")`: Gets metadata like size and last modified date.

### GitHub
- `create_repository(name: str, description: str = "", private: bool = False)`: Creates a new repository.
- `get_repository(owner: str, repository: str)`: Gets details of a repository.
- `list_repositories(owner: str = "")`: Lists repositories for an owner or the authenticated user.
- `create_issue(owner: str, repository: str, title: str, body: str = "")`: Creates an issue.
- `edit_issue(owner: str, repository: str, issue_number: int, title: str = "", body: str = "")`: Edits an issue.
- `get_issue(owner: str, repository: str, issue_number: int)`: Gets details of an issue.
- `create_issue_comment(owner: str, repository: str, issue_number: int, body: str)`: Adds a comment to an issue.
- `lock_issue(owner: str, repository: str, issue_number: int)`: Locks an issue.
- `edit_file(owner: str, repository: str, path: str, content: str, message: str = "Update file")`: Edits a file in a repository.
- `get_file(owner: str, repository: str, path: str)`: Gets file content from a repository.

## Execution Flow

1. **User Request**: The user asks an agent to perform an action (e.g., "Draft an email to john@example.com").
2. **AI Inference**: The Gemini model uses the `system_instruction` examples to map the intent to the corresponding tool (e.g., `draft_email`).
3. **Tool Execution**: `ToolService` intercepts the tool call, validates the parameters (e.g., ensures `to`, `subject`, and `message` are not empty), and calls `N8NService.trigger_workflow()`.
4. **n8n Webhook**: The payload is sent via an HTTP POST request to the n8n webhook (e.g., `http://localhost:5678/webhook/draft-email`).
5. **Response**: The structured JSON response from n8n is returned to the agent and relayed to the user.

## Error Handling

If a required parameter is missing, `ToolService` immediately returns a structured JSON error (e.g., `{"status": "error", "error": "Missing required parameter"}`). 
If n8n is unreachable or times out, `N8NService` will return a descriptive error which is logged and returned to the agent.
