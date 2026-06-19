from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.schemas.schemas import AIModelCreate, AIModelUpdate, AIModelResponse
from app.services.model_service import model_service

router = APIRouter()


@router.post("/models", response_model=AIModelResponse, summary="创建模型")
def create_model(data: AIModelCreate, db: Session = Depends(get_db)):
    model = model_service.create(
        db,
        name=data.name,
        provider=data.provider,
        model_type=data.model_type,
        model_name=data.model_name,
        api_key=data.api_key,
        base_url=data.base_url,
        config=data.config,
    )
    return model


@router.get("/models", response_model=List[AIModelResponse], summary="查询模型列表")
def list_models(model_type: Optional[str] = None, db: Session = Depends(get_db)):
    return model_service.get_all(db, model_type)


@router.get("/models/{model_id}", response_model=AIModelResponse, summary="查询单个模型")
def get_model(model_id: int, db: Session = Depends(get_db)):
    model = model_service.get(db, model_id)
    if not model:
        raise HTTPException(404, "模型不存在")
    return model


@router.put("/models/{model_id}", response_model=AIModelResponse, summary="更新模型")
def update_model(model_id: int, data: AIModelUpdate, db: Session = Depends(get_db)):
    model = model_service.update(
        db, model_id,
        name=data.name,
        provider=data.provider,
        model_type=data.model_type,
        model_name=data.model_name,
        api_key=data.api_key,
        base_url=data.base_url,
        config=data.config,
        status=data.status,
    )
    if not model:
        raise HTTPException(404, "模型不存在")
    return model


@router.delete("/models/{model_id}", summary="删除模型")
def delete_model(model_id: int, db: Session = Depends(get_db)):
    if not model_service.delete(db, model_id):
        raise HTTPException(400, "模型不存在或为内置模型，不可删除")
    return {"code": 200, "message": "模型已删除"}


@router.post("/models/{model_id}/set-default", summary="设为默认模型")
def set_default_model(model_id: int, db: Session = Depends(get_db)):
    if not model_service.set_default(db, model_id):
        raise HTTPException(404, "模型不存在")
    return {"code": 200, "message": "已设为默认模型"}


@router.post("/models/{model_id}/test", summary="测试模型连接")
def test_model(model_id: int, db: Session = Depends(get_db)):
    result = model_service.test_connection(db, model_id)
    if not result.get("success"):
        raise HTTPException(400, result.get("error", "连接测试失败"))
    return {"code": 200, "data": result}
