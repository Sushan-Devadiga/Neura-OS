from fastapi import APIRouter
from services.agent_service import agent_service

router = APIRouter()

@router.get("")
async def get_agents():
    return agent_service.get_all_agents()

@router.get("/{agent_id}")
async def get_agent(agent_id: str):
    return agent_service.get_agent(agent_id)
