from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.schemas.schemas import (
    PromptCreate, PromptUpdate, PromptResponse,
    PresetCreate, PresetResponse, PresetBrief,
)
from app.services.prompt_service import prompt_service, CATEGORIES

router = APIRouter()


# ==================== Preset 端点 ====================

@router.get("/presets", response_model=List[PresetBrief], summary="获取所有模板套")
def list_presets(db: Session = Depends(get_db)):
    return prompt_service.get_presets(db)


@router.get("/presets/{preset_id}", response_model=PresetResponse, summary="获取单个模板套")
def get_preset(preset_id: int, db: Session = Depends(get_db)):
    preset = prompt_service.get_preset(db, preset_id)
    if not preset:
        raise HTTPException(404, "模板套不存在")
    return preset


@router.post("/presets", response_model=PresetResponse, summary="创建一套模板")
def create_preset(data: PresetCreate, db: Session = Depends(get_db)):
    categories_provided = {t.category for t in data.templates}
    missing = set(CATEGORIES) - categories_provided
    if missing:
        raise HTTPException(400, f"缺少以下类别的模板: {', '.join(missing)}")
    invalid = categories_provided - set(CATEGORIES)
    if invalid:
        raise HTTPException(400, f"无效的类别: {', '.join(invalid)}")
    templates_data = [t.model_dump() for t in data.templates]
    return prompt_service.create_preset(db, data.name, data.description, templates_data)


@router.post("/presets/{preset_id}/activate", response_model=PresetBrief, summary="激活一套模板")
def activate_preset(preset_id: int, db: Session = Depends(get_db)):
    preset = prompt_service.switch_preset(db, preset_id)
    if not preset:
        raise HTTPException(404, "模板套不存在")
    return preset


@router.post("/presets/{preset_id}/duplicate", response_model=PresetResponse, summary="复制一套模板")
def duplicate_preset(preset_id: int, new_name: str, db: Session = Depends(get_db)):
    preset = prompt_service.duplicate_preset(db, preset_id, new_name)
    if not preset:
        raise HTTPException(404, "源模板套不存在")
    return preset


@router.delete("/presets/{preset_id}", summary="删除一套模板")
def delete_preset(preset_id: int, db: Session = Depends(get_db)):
    if not prompt_service.delete_preset(db, preset_id):
        raise HTTPException(400, "系统内置模板套不可删除")
    return {"code": 200, "message": "模板套已删除"}


# ==================== 单模板端点（兼容保留）====================

@router.get("/prompts", response_model=List[PromptResponse], summary="查询提示词列表")
def list_prompts(category: str = None, preset_id: int = None, db: Session = Depends(get_db)):
    return prompt_service.get_prompts(db, category, preset_id)


@router.get("/prompts/{prompt_id}", response_model=PromptResponse, summary="查询单个提示词")
def get_prompt(prompt_id: int, db: Session = Depends(get_db)):
    pt = prompt_service.get_prompt(db, prompt_id)
    if not pt:
        raise HTTPException(404, "提示词不存在")
    return pt


@router.post("/prompts", response_model=PromptResponse, summary="创建自定义提示词")
def create_prompt(data: PromptCreate, db: Session = Depends(get_db)):
    return prompt_service.create_prompt(
        db,
        name=data.name,
        category=data.category,
        content=data.content,
        description=data.description,
        is_default=data.is_default,
        preset_id=data.preset_id,
        is_system=False,
    )


@router.put("/prompts/{prompt_id}", response_model=PromptResponse, summary="修改提示词")
def update_prompt(prompt_id: int, data: PromptUpdate, db: Session = Depends(get_db)):
    pt = prompt_service.update_prompt(
        db, prompt_id,
        name=data.name,
        content=data.content,
        description=data.description,
        is_default=data.is_default,
    )
    if not pt:
        raise HTTPException(404, "提示词不存在")
    return pt


@router.delete("/prompts/{prompt_id}", summary="删除提示词")
def delete_prompt(prompt_id: int, db: Session = Depends(get_db)):
    if not prompt_service.delete_prompt(db, prompt_id):
        raise HTTPException(400, "系统内置提示词不可删除")
    return {"code": 200, "message": "提示词已删除"}


@router.post("/prompts/{prompt_id}/reset", summary="重置为系统默认提示词")
def reset_prompt(prompt_id: int, db: Session = Depends(get_db)):
    pt = prompt_service.reset_to_default(db, prompt_id)
    if not pt:
        raise HTTPException(404, "提示词不存在")
    return {"code": 200, "message": "已重置为系统默认模板"}


@router.post("/prompts/{prompt_id}/set-default", summary="设为默认提示词")
def set_default_prompt(prompt_id: int, db: Session = Depends(get_db)):
    pt = prompt_service.update_prompt(db, prompt_id, is_default=True)
    if not pt:
        raise HTTPException(404, "提示词不存在")
    return {"code": 200, "message": f"已设为 {pt.category} 类别默认提示词"}
