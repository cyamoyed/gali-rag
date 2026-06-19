from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.schemas import SystemResourceResponse
from app.services.system_service import sys_service

router = APIRouter()


@router.get("/resources", response_model=SystemResourceResponse, summary="查询系统资源")
def get_resources(db: Session = Depends(get_db)):
    return sys_service.get_resources(db)
