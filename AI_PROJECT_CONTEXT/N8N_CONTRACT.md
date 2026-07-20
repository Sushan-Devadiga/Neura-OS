# N8N Universal Workflow Engine Contract

This document outlines the strict data contract between the NeuraOS FastAPI backend and the n8n automation engine. 

## Design Philosophy
The backend is completely workflow-agnostic. It does **not** hardcode logic for specific workflows (like Gmail, Calendar, Slack). 
Instead, it provides a universal gateway through `N8NService` and `ToolService.trigger_workflow()`. All future automations can be added instantly by creating a new n8n branch that handles the specific `workflow` keyword, without requiring any modifications to the FastAPI codebase.

## 1. Request Contract (FastAPI → n8n)

When the AI agent decides to trigger an external automation, the backend will **always** send a JSON payload in this exact format to the n8n production webhook:

```json
{
    "workflow": "<workflow_name>",
    "payload": {
        // Arbitrary JSON object specific to the workflow
    }
}
```

### Future Examples

**Send Email**
```json
{
    "workflow": "send_email",
    "payload": {
        "to": "user@example.com",
        "subject": "Hello",
        "body": "This is a test."
    }
}
```

**Calendar Event**
```json
{
    "workflow": "calendar_event",
    "payload": {
        "title": "Meeting",
        "start_time": "2026-07-03T10:00:00Z",
        "end_time": "2026-07-03T11:00:00Z"
    }
}
```

**Slack Notification**
```json
{
    "workflow": "slack_notification",
    "payload": {
        "channel": "#general",
        "message": "Deployment complete!"
    }
}
```

## 2. Response Contract (n8n → FastAPI)

Every n8n workflow must end with an HTTP Response node that returns JSON conforming to one of the following two schemas:

### Success Response
```json
{
    "status": "success",
    "workflow": "<workflow_name>",
    "result": {
        // Arbitrary JSON result data
    }
}
```

### Error Response
```json
{
    "status": "error",
    "workflow": "<workflow_name>",
    "error": "Detailed error message explaining what failed in n8n."
}
```

By adhering to this contract, the AI agent can dynamically interpret the success or failure of any arbitrary external automation without requiring hardcoded backend updates.
