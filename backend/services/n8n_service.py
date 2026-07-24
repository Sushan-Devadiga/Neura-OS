import os
import httpx
import logging
from typing import Dict, Any, Optional
from fastapi import HTTPException

logger = logging.getLogger(__name__)

class N8NService:
    """
    Service to communicate with the n8n workflow engine.
    """
    def __init__(self):
        from dotenv import load_dotenv
        load_dotenv(override=True)
        # Default to production environment so active workflows work by default
        self.environment = os.getenv("ENVIRONMENT", "production")
        self.base_url = os.getenv("N8N_BASE_URL", "http://localhost:5678").rstrip("/")
        timeout_str = os.getenv("N8N_TIMEOUT", "30")
        try:
            self.timeout = float(timeout_str)
        except ValueError:
            self.timeout = 30.0

    def get_webhook_url(self, workflow: str) -> str:
        """
        Returns the appropriate webhook URL based on the environment.
        """
        if self.environment == "development":
            return f"{self.base_url}/webhook-test/{workflow}"
        return f"{self.base_url}/webhook/{workflow}"

    async def execute_workflow(self, payload: Dict[str, Any], url: str) -> Dict[str, Any]:
        """
        Sends a JSON payload to the n8n webhook and returns the parsed JSON response.
        """
        target_url = url
        logger.info("========== N8N WEBHOOK REQUEST ==========")
        logger.info(f"Webhook URL: {target_url}")
        logger.info(f"Payload: {payload}")
        
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.post(target_url, json=payload)
                
                logger.info(f"Status Code: {response.status_code}")
                logger.info(f"Response: {response.text}")
                
                if response.status_code == 404:
                    raise RuntimeError(f"Webhook returned 404: {target_url}")
                    
                response.raise_for_status()
                
                result = response.json()
                logger.info(f"Successfully received JSON response from n8n for {target_url}.")
                return result
                
            except httpx.TimeoutException as e:
                logger.error(f"Timeout while connecting to n8n: {str(e)}")
                raise RuntimeError(f"Timeout while connecting to n8n: {str(e)}")
                
            except httpx.ConnectError as e:
                logger.error(f"Connection failure to n8n: {str(e)}")
                raise RuntimeError(f"Could not connect to n8n: {str(e)}")
                
            except httpx.HTTPStatusError as e:
                if e.response.status_code != 404:
                    logger.error(f"n8n returned HTTP error status {e.response.status_code}: {e.response.text}")
                    raise RuntimeError(f"n8n Webhook Failed: {e.response.status_code} - {e.response.text}")
                raise e
                
            except ValueError as e: # JSON parsing errors
                logger.error(f"Invalid JSON response from n8n: {response.text}")
                raise RuntimeError(f"Invalid JSON returned from n8n. Please ensure your Webhook node in n8n is set to 'Respond: Last Node' or 'Respond to Webhook Node'. Raw response: {response.text}")
                
            except Exception as e:
                if isinstance(e, RuntimeError):
                    raise e
                logger.error(f"Unexpected exception during n8n request: {str(e)}")
                raise RuntimeError(f"Unexpected n8n Error: {str(e)}")

    async def trigger_workflow(self, workflow: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Triggers a specific n8n workflow by name, appending it to the base URL.
        """
        webhook_url = self.get_webhook_url(workflow)
        
        logger.info(f"Triggering workflow '{workflow}' with payload: {payload}")
        return await self.execute_workflow(payload=payload, url=webhook_url)

    async def send_email(self, to: str, subject: str, message: str) -> Dict[str, Any]:
        """
        Dedicated method to send an email using the send-email n8n workflow.
        """
        import time
        start_time = time.time()
        logger.info(f"Executing send_email for {to} with subject '{subject}'")
        
        try:
            result = await self.trigger_workflow(
                workflow="send-email",
                payload={
                    "to": to,
                    "subject": subject,
                    "message": message
                }
            )
            execution_time = time.time() - start_time
            logger.info(f"send_email completed in {execution_time:.2f}s")
            return result
        except Exception as e:
            execution_time = time.time() - start_time
            logger.error(f"send_email failed after {execution_time:.2f}s: {str(e)}")
            raise e

    async def read_inbox(self, max_results: int = 5) -> Dict[str, Any]:
        """
        Dedicated method to read unread emails using the read-inbox n8n workflow.
        """
        import time
        start_time = time.time()
        logger.info(f"Executing read_inbox with max_results={max_results}")
        
        try:
            result = await self.trigger_workflow(
                workflow="read-inbox",
                payload={
                    "max_results": max_results
                }
            )
            execution_time = time.time() - start_time
            # Try to log the count of emails returned if available
            count = result.get("count", "unknown") if isinstance(result, dict) else "unknown"
            logger.info(f"read_inbox completed in {execution_time:.2f}s. Number of emails returned: {count}")
            return result
        except Exception as e:
            execution_time = time.time() - start_time
            logger.error(f"read_inbox failed after {execution_time:.2f}s: {str(e)}")
            raise e

    async def create_github_issue(self, owner: str, repo: str, title: str, body: str) -> Dict[str, Any]:
        """Trigger n8n workflow to create a GitHub issue."""
        logger.info(f"Executing create_github_issue for {owner}/{repo}: {title}")
        return await self.trigger_workflow(
            workflow="create-github-issue",
            payload={
                "owner": owner,
                "repo": repo,
                "title": title,
                "body": body
            }
        )

    async def search_github_repo(self, query: str) -> Dict[str, Any]:
        """Trigger n8n workflow to search GitHub repositories."""
        logger.info(f"Executing search_github_repo with query: {query}")
        return await self.trigger_workflow(
            workflow="search-github-repo",
            payload={"query": query}
        )

    async def create_calendar_event(self, summary: str, description: str, start_time: str, end_time: str) -> Dict[str, Any]:
        """Trigger n8n workflow to create a Google Calendar event."""
        logger.info(f"Executing create_calendar_event: {summary}")
        return await self.trigger_workflow(
            workflow="create-calendar-event",
            payload={
                "summary": summary,
                "description": description,
                "start_time": start_time,
                "end_time": end_time
            }
        )
