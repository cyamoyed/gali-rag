from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.models import KnowledgeBaseCategory, KnowledgeBase


class CategoryService:
    def create(self, db: Session, **kwargs) -> KnowledgeBaseCategory:
        cat = KnowledgeBaseCategory(**kwargs)
        db.add(cat)
        db.commit()
        db.refresh(cat)
        return cat

    def get(self, db: Session, cat_id: int) -> Optional[KnowledgeBaseCategory]:
        return db.query(KnowledgeBaseCategory).filter(KnowledgeBaseCategory.id == cat_id).first()

    def get_all(self, db: Session) -> List[KnowledgeBaseCategory]:
        return db.query(KnowledgeBaseCategory).order_by(KnowledgeBaseCategory.sort_order, KnowledgeBaseCategory.id).all()

    def get_children(self, db: Session, parent_id: Optional[int] = None) -> List[KnowledgeBaseCategory]:
        q = db.query(KnowledgeBaseCategory)
        if parent_id is None:
            q = q.filter(KnowledgeBaseCategory.parent_id.is_(None))
        else:
            q = q.filter(KnowledgeBaseCategory.parent_id == parent_id)
        return q.order_by(KnowledgeBaseCategory.sort_order, KnowledgeBaseCategory.id).all()

    def get_tree(self, db: Session) -> List[dict]:
        all_cats = self.get_all(db)
        kb_counts = {}
        rows = db.query(
            KnowledgeBase.category_id,
            func.count(KnowledgeBase.id)
        ).filter(
            KnowledgeBase.category_id.isnot(None)
        ).group_by(KnowledgeBase.category_id).all()
        for cat_id, count in rows:
            kb_counts[cat_id] = count

        cat_map = {}
        for cat in all_cats:
            cat_map[cat.id] = {
                "id": cat.id,
                "name": cat.name,
                "parent_id": cat.parent_id,
                "description": cat.description or "",
                "sort_order": cat.sort_order or 0,
                "children": [],
                "kb_count": kb_counts.get(cat.id, 0),
                "created_at": cat.created_at.isoformat() if cat.created_at else None,
            }

        roots = []
        for cat_id, node in cat_map.items():
            if node["parent_id"] is not None and node["parent_id"] in cat_map:
                cat_map[node["parent_id"]]["children"].append(node)
            else:
                roots.append(node)
        return roots

    def update(self, db: Session, cat_id: int, **kwargs) -> Optional[KnowledgeBaseCategory]:
        cat = self.get(db, cat_id)
        if not cat:
            return None
        for key, value in kwargs.items():
            if value is not None and hasattr(cat, key):
                setattr(cat, key, value)
        db.commit()
        db.refresh(cat)
        return cat

    def delete(self, db: Session, cat_id: int) -> bool:
        cat = self.get(db, cat_id)
        if not cat:
            return False
        db.query(KnowledgeBase).filter(KnowledgeBase.category_id == cat_id).update({"category_id": None})
        db.query(KnowledgeBaseCategory).filter(KnowledgeBaseCategory.parent_id == cat_id).update({"parent_id": cat.parent_id})
        db.delete(cat)
        db.commit()
        return True


category_service = CategoryService()
