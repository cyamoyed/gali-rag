import json
from typing import Optional, List
from sqlalchemy.orm import Session
from app.models.models import AIModel
import logging

logger = logging.getLogger(__name__)


class ModelService:
    def create(self, db: Session, **kwargs) -> AIModel:
        model = AIModel(**kwargs)
        db.add(model)
        db.commit()
        db.refresh(model)
        return model

    def get(self, db: Session, model_id: int) -> Optional[AIModel]:
        return db.query(AIModel).filter(AIModel.id == model_id).first()

    def get_all(self, db: Session, model_type: Optional[str] = None) -> List[AIModel]:
        q = db.query(AIModel)
        if model_type:
            q = q.filter(AIModel.model_type == model_type)
        return q.order_by(AIModel.created_at.desc()).all()

    def get_default(self, db: Session, model_type: str) -> Optional[AIModel]:
        return db.query(AIModel).filter(
            AIModel.model_type == model_type,
            AIModel.is_default == True,
            AIModel.status == "active",
        ).first()

    def update(self, db: Session, model_id: int, **kwargs) -> Optional[AIModel]:
        model = self.get(db, model_id)
        if not model:
            return None
        for key, value in kwargs.items():
            if value is not None and hasattr(model, key):
                setattr(model, key, value)
        db.commit()
        db.refresh(model)
        return model

    def delete(self, db: Session, model_id: int) -> bool:
        model = self.get(db, model_id)
        if not model:
            return False
        if model.is_builtin:
            return False
        db.delete(model)
        db.commit()
        return True

    def set_default(self, db: Session, model_id: int) -> bool:
        model = self.get(db, model_id)
        if not model:
            return False
        db.query(AIModel).filter(
            AIModel.model_type == model.model_type,
            AIModel.is_default == True,
        ).update({"is_default": False})
        model.is_default = True
        db.commit()
        return True

    def test_connection(self, db: Session, model_id: int) -> dict:
        model = self.get(db, model_id)
        if not model:
            return {"success": False, "error": "模型不存在"}
        try:
            if model.model_type == "llm":
                return self._test_llm(model)
            elif model.model_type == "embedding":
                return self._test_embedding(model)
            return {"success": True, "message": "模型类型暂不支持连接测试"}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def _test_llm(self, model: AIModel) -> dict:
        import httpx
        config = json.loads(model.config) if model.config else {}
        base_url = model.base_url or "http://localhost:11434"
        if model.provider == "ollama":
            url = f"{base_url}/api/generate"
            payload = {"model": model.model_name, "prompt": "hi", "stream": False, "options": {"num_predict": 5}}
            with httpx.Client(timeout=30) as client:
                resp = client.post(url, json=payload)
                resp.raise_for_status()
                return {"success": True, "message": "Ollama连接成功"}
        else:
            url = f"{base_url}/chat/completions"
            headers = {"Content-Type": "application/json"}
            if model.api_key:
                headers["Authorization"] = f"Bearer {model.api_key}"
            payload = {"model": model.model_name, "messages": [{"role": "user", "content": "hi"}], "max_tokens": 5}
            with httpx.Client(timeout=30) as client:
                resp = client.post(url, json=payload, headers=headers)
                resp.raise_for_status()
                return {"success": True, "message": "API连接成功"}

    def _test_embedding(self, model: AIModel) -> dict:
        import httpx
        base_url = model.base_url or "http://localhost:11434"
        if model.provider == "ollama":
            url = f"{base_url}/api/embeddings"
            payload = {"model": model.model_name, "prompt": "test"}
            with httpx.Client(timeout=30) as client:
                resp = client.post(url, json=payload)
                resp.raise_for_status()
                embedding = resp.json().get("embedding", [])
                return {"success": True, "message": f"Embedding连接成功，维度: {len(embedding)}"}
        else:
            url = f"{base_url}/embeddings"
            headers = {"Content-Type": "application/json"}
            if model.api_key:
                headers["Authorization"] = f"Bearer {model.api_key}"
            payload = {"model": model.model_name, "input": "test"}
            with httpx.Client(timeout=30) as client:
                resp = client.post(url, json=payload, headers=headers)
                resp.raise_for_status()
                data = resp.json()
                dim = len(data.get("data", [{}])[0].get("embedding", []))
                return {"success": True, "message": f"Embedding连接成功，维度: {dim}"}

    def get_default_llm_client(self, db: Session):
        from app.rag.llm_client import LLMClient
        model = self.get_default(db, "llm")
        if not model:
            raise ValueError("未配置默认对话模型，请先在模型管理中设置一个默认 LLM 模型")
        client = LLMClient()
        client.configure(
            provider=model.provider,
            api_key=model.api_key or "",
            base_url=model.base_url or "",
            model=model.model_name,
        )
        return client


model_service = ModelService()
