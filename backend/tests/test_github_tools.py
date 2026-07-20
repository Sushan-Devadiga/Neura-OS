import pytest
from unittest.mock import AsyncMock, MagicMock
from services.tool_service import ToolService

@pytest.fixture
def mock_supabase():
    return MagicMock()

@pytest.fixture
def tool_service(mock_supabase):
    service = ToolService(mock_supabase, user_id="test_user")
    service.n8n_service = MagicMock()
    service.n8n_service.trigger_workflow = AsyncMock()
    return service

@pytest.mark.anyio
async def test_create_issue_success(tool_service):
    tool_service.n8n_service.trigger_workflow.return_value = {"status": "success", "result": {"id": 123}}
    
    response = await tool_service.create_issue(
        owner="octocat", 
        repository="Hello-World", 
        title="Found a bug", 
        body="There is a bug in the code."
    )
    
    assert response["status"] == "success"
    assert response["data"] == {"id": 123}
    tool_service.n8n_service.trigger_workflow.assert_called_once_with(
        workflow="create_issue",
        payload={
            "owner": "octocat",
            "repository": "Hello-World",
            "title": "Found a bug",
            "body": "There is a bug in the code."
        }
    )

@pytest.mark.anyio
async def test_create_issue_missing_parameter(tool_service):
    response = await tool_service.create_issue(
        owner="", # Missing owner
        repository="Hello-World", 
        title="Found a bug"
    )
    
    assert response["status"] == "error"
    assert "Missing required parameters" in response["error"]
    tool_service.n8n_service.trigger_workflow.assert_not_called()

@pytest.mark.anyio
async def test_get_repository_success(tool_service):
    tool_service.n8n_service.trigger_workflow.return_value = {"status": "success", "result": {"full_name": "octocat/Hello-World"}}
    
    response = await tool_service.get_repository(owner="octocat", repository="Hello-World")
    
    assert response["status"] == "success"
    assert response["data"] == {"full_name": "octocat/Hello-World"}
    tool_service.n8n_service.trigger_workflow.assert_called_once_with(
        workflow="get_repository",
        payload={"owner": "octocat", "repository": "Hello-World"}
    )

@pytest.mark.anyio
async def test_create_file_overlapping_github(tool_service):
    tool_service.n8n_service.trigger_workflow.return_value = {"status": "success", "result": {"content": "ok"}}
    
    response = await tool_service.create_file(
        path="README.md",
        content="# Hello",
        owner="octocat",
        repository="Hello-World"
    )
    
    assert response["status"] == "success"
    tool_service.n8n_service.trigger_workflow.assert_called_once_with(
        workflow="create_file",
        payload={
            "owner": "octocat",
            "repository": "Hello-World",
            "path": "README.md",
            "content": "# Hello"
        }
    )

@pytest.mark.anyio
async def test_create_file_overlapping_local(tool_service):
    tool_service.n8n_service.trigger_workflow.return_value = {"status": "success", "result": {"content": "ok"}}
    
    response = await tool_service.create_file(
        file_name="local.txt",
        content="local content",
        path="/docs"
    )
    
    assert response["status"] == "success"
    tool_service.n8n_service.trigger_workflow.assert_called_once_with(
        workflow="create-file",
        payload={
            "file_name": "local.txt",
            "content": "local content",
            "path": "/docs"
        }
    )

@pytest.mark.anyio
async def test_workflow_failure_handling(tool_service):
    tool_service.n8n_service.trigger_workflow.side_effect = Exception("n8n is unreachable")
    
    response = await tool_service.create_issue(
        owner="octocat", 
        repository="Hello-World", 
        title="Found a bug"
    )
    
    assert response["status"] == "error"
    assert "n8n is unreachable" in response["error"]
