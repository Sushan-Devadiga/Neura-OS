import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any
import sys
import os

# Ensure services can be imported if needed
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from services.n8n_service import N8NService

logger = logging.getLogger(__name__)

router = APIRouter()

class N8NTestRequest(BaseModel):
    message: str

@router.post("/test")
async def test_n8n(request: N8NTestRequest):
    """
    Test endpoint for n8n webhook integration.
    """
    service = N8NService()
    payload = request.model_dump()
    
    try:
        response_data = await service.execute_workflow(payload)
        return {"status": "success", "data": response_data}
    except Exception as e:
        logger.error(f"Error in /test endpoint: {str(e)}")
        error_msg = str(e)
        # Return clean FastAPI HTTPExceptions
        if "Timeout" in error_msg:
            raise HTTPException(status_code=504, detail=error_msg)
        elif "Connection Error" in error_msg:
            raise HTTPException(status_code=502, detail=error_msg)
        elif "HTTP Error: 4" in error_msg:
            raise HTTPException(status_code=400, detail=error_msg)
        elif "HTTP Error" in error_msg:
            raise HTTPException(status_code=502, detail=error_msg)
        else:
            raise HTTPException(status_code=500, detail=error_msg)

class EmailRequest(BaseModel):
    to: str
    subject: str
    message: str

@router.post("/send-email")
async def send_email_endpoint(request: EmailRequest):
    """
    Test endpoint for the send_email n8n workflow integration.
    """
    service = N8NService()
    try:
        response_data = await service.send_email(
            to=request.to,
            subject=request.subject,
            message=request.message
        )
        return {"success": True, "message": "Email sent successfully", "data": response_data}
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error in /send-email endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

from pydantic import Field

class ReadInboxRequest(BaseModel):
    max_results: int = 5

class EmailSummary(BaseModel):
    id: str
    sender: str = Field(alias="from")
    subject: str
    date: str
    snippet: str
    threadId: str

class ReadInboxResponse(BaseModel):
    success: bool
    count: int
    emails: list[EmailSummary]

@router.post("/read-inbox", response_model=ReadInboxResponse)
async def read_inbox_endpoint(request: ReadInboxRequest):
    """
    Test endpoint for the read_inbox n8n workflow integration.
    """
    service = N8NService()
    try:
        response_data = await service.read_inbox(max_results=request.max_results)
        return response_data
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error in /read-inbox endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
