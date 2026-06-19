from fastapi import APIRouter
from app.api.v1 import chat, prompts, conversations, system, models, agents

api_router = APIRouter()

api_router.include_router(models.router, tags=["模型管理"])
api_router.include_router(chat.router, tags=["知识库管理"])
api_router.include_router(agents.router, tags=["智能体管理"])
api_router.include_router(prompts.router, tags=["Prompt配置管理"])
api_router.include_router(conversations.router, tags=["会话管理"])
api_router.include_router(system.router, tags=["系统配置"])
