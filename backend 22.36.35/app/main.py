from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.core.database import engine
from app.models.base import Base
from app.api.auth import router as auth_router
from app.api.knowledge_bases import router as kb_router
from app.api.documents import router as doc_router
from app.api.rag import router as rag_router
from app.services.vector_service import vector_service


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    vector_service.ensure_collection()
    yield
    await engine.dispose()


app = FastAPI(title="Gali RAG Knowledge Base", version="1.0.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth_router)
app.include_router(kb_router)
app.include_router(doc_router)
app.include_router(rag_router)


@app.get("/api/health")
async def health_check():
    return {"status": "ok"}
