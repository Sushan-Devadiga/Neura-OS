import pytest
import sys
import os
from unittest.mock import AsyncMock, MagicMock

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.tool_service import ToolService

@pytest.fixture
def tool_service():
    supabase_mock = MagicMock()
    service = ToolService(supabase_mock, "test_user_id")
    # Mock the internal trigger_workflow to isolate tests
    service.trigger_workflow = AsyncMock()
    return service

@pytest.mark.asyncio
async def test_search_emails_success(tool_service):
    tool_service.trigger_workflow.return_value = {"status": "success", "data": [{"id": "1"}]}
    result = await tool_service.search_emails("urgent")
    assert result["status"] == "success"
    tool_service.trigger_workflow.assert_called_once_with("search-emails", {"query": "urgent", "max_results": 10})

@pytest.mark.asyncio
async def test_search_emails_missing_param(tool_service):
    result = await tool_service.search_emails("")
    assert result["status"] == "error"
    assert "Missing required parameter" in result["error"]
    tool_service.trigger_workflow.assert_not_called()

@pytest.mark.asyncio
async def test_reply_email_success(tool_service):
    tool_service.trigger_workflow.return_value = {"status": "success"}
    result = await tool_service.reply_email("thread123", "Yes")
    assert result["status"] == "success"
    tool_service.trigger_workflow.assert_called_once_with("reply-email", {"thread_id": "thread123", "message": "Yes"})

@pytest.mark.asyncio
async def test_draft_email_missing_params(tool_service):
    result = await tool_service.draft_email("", "Subj", "Msg")
    assert result["status"] == "error"
    tool_service.trigger_workflow.assert_not_called()

@pytest.mark.asyncio
async def test_upload_drive_file_success(tool_service):
    tool_service.trigger_workflow.return_value = {"status": "success"}
    result = await tool_service.upload_drive_file("file.txt", "content")
    assert result["status"] == "success"
    tool_service.trigger_workflow.assert_called_once_with("upload-file", {"file_name": "file.txt", "content": "content", "folder_id": ""})

@pytest.mark.asyncio
async def test_search_drive_success(tool_service):
    tool_service.trigger_workflow.return_value = {"status": "success"}
    result = await tool_service.search_drive("report")
    assert result["status"] == "success"
    tool_service.trigger_workflow.assert_called_once_with("search-drive", {"query": "report"})

@pytest.mark.asyncio
async def test_create_drive_folder_success(tool_service):
    tool_service.trigger_workflow.return_value = {"status": "success"}
    result = await tool_service.create_drive_folder("AI Notes")
    assert result["status"] == "success"
    tool_service.trigger_workflow.assert_called_once_with("create-folder", {"folder_name": "AI Notes", "parent_id": ""})

@pytest.mark.asyncio
async def test_delete_drive_file_requires_confirmation(tool_service):
    result = await tool_service.delete_drive_file("file123") # user_confirmed is False by default
    assert result["status"] == "requires_confirmation"
    tool_service.trigger_workflow.assert_not_called()

@pytest.mark.asyncio
async def test_delete_drive_file_confirmed(tool_service):
    tool_service.trigger_workflow.return_value = {"status": "success"}
    result = await tool_service.delete_drive_file("file123", user_confirmed=True)
    assert result["status"] == "success"
    tool_service.trigger_workflow.assert_called_once_with("delete-drive-file", {"file_id": "file123"})

@pytest.mark.asyncio
async def test_create_file_success(tool_service):
    tool_service.trigger_workflow.return_value = {"status": "success"}
    result = await tool_service.create_file("test.txt", "content", "/docs")
    assert result["status"] == "success"
    tool_service.trigger_workflow.assert_called_once_with("create-file", {"file_name": "test.txt", "content": "content", "path": "/docs"})

@pytest.mark.asyncio
async def test_read_file_success(tool_service):
    tool_service.trigger_workflow.return_value = {"status": "success", "data": "content"}
    result = await tool_service.read_file("test.txt")
    assert result["status"] == "success"
    tool_service.trigger_workflow.assert_called_once_with("read-file", {"file_name": "test.txt", "path": "/"})

@pytest.mark.asyncio
async def test_move_file_success(tool_service):
    tool_service.trigger_workflow.return_value = {"status": "success"}
    result = await tool_service.move_file("test.txt", "/src", "/dest")
    assert result["status"] == "success"
    tool_service.trigger_workflow.assert_called_once_with("move-file", {"file_name": "test.txt", "source_path": "/src", "destination_path": "/dest"})

@pytest.mark.asyncio
async def test_copy_file_success(tool_service):
    tool_service.trigger_workflow.return_value = {"status": "success"}
    result = await tool_service.copy_file("test.txt", "/src", "/dest")
    assert result["status"] == "success"
    tool_service.trigger_workflow.assert_called_once_with("copy-file", {"file_name": "test.txt", "source_path": "/src", "destination_path": "/dest"})

@pytest.mark.asyncio
async def test_delete_file_confirmed(tool_service):
    tool_service.trigger_workflow.return_value = {"status": "success"}
    result = await tool_service.delete_file("test.txt", user_confirmed=True)
    assert result["status"] == "success"
    tool_service.trigger_workflow.assert_called_once_with("delete-file", {"file_name": "test.txt", "path": "/"})

@pytest.mark.asyncio
async def test_search_files_success(tool_service):
    tool_service.trigger_workflow.return_value = {"status": "success"}
    result = await tool_service.search_files("pattern")
    assert result["status"] == "success"
    tool_service.trigger_workflow.assert_called_once_with("search-files", {"query": "pattern", "path": "/"})

@pytest.mark.asyncio
async def test_list_files_success(tool_service):
    tool_service.trigger_workflow.return_value = {"status": "success"}
    result = await tool_service.list_files("/dir")
    assert result["status"] == "success"
    tool_service.trigger_workflow.assert_called_once_with("list-files", {"path": "/dir"})

@pytest.mark.asyncio
async def test_get_file_metadata_success(tool_service):
    tool_service.trigger_workflow.return_value = {"status": "success"}
    result = await tool_service.get_file_metadata("test.txt")
    assert result["status"] == "success"
    tool_service.trigger_workflow.assert_called_once_with("get-file-metadata", {"file_name": "test.txt", "path": "/"})
