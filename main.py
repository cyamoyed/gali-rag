"""Gali-RAG 私有化知识库问答服务入口。

提供 FastAPI 应用初始化、CORS 配置、API Key 鉴权中间件和全局异常处理。
启动时自动初始化数据库表和默认Prompt模板。
"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import logging
import time
import uuid

from app.core.config import settings
from app.core.database import init_db, SessionLocal, engine
from app.services.prompt_service import prompt_service
from app.api.v1.router import api_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

PUBLIC_PATHS = {"/health", "/docs", "/redoc", "/openapi.json"}


def _run_schema_migrations():
    """自动检测并补全新增的数据库列，无需手动执行迁移脚本。"""
    import sqlite3
    from app.core.config import settings as _s
    db_path = _s.DATABASE_URL.replace("sqlite:///", "")
    if not db_path or not db_path.endswith(".db"):
        return
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute("CREATE TABLE IF NOT EXISTS prompt_presets (id INTEGER PRIMARY KEY AUTOINCREMENT, name VARCHAR(128) NOT NULL UNIQUE, description TEXT DEFAULT '', is_system BOOLEAN DEFAULT 0, is_active BOOLEAN DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP)")
        cursor.execute("CREATE INDEX IF NOT EXISTS ix_prompt_presets_name ON prompt_presets (name)")
        for table, col, ddl in [
            ("prompt_templates", "preset_id", "ALTER TABLE prompt_templates ADD COLUMN preset_id INTEGER REFERENCES prompt_presets(id) ON DELETE CASCADE"),
            ("agents", "preset_id", "ALTER TABLE agents ADD COLUMN preset_id INTEGER REFERENCES prompt_presets(id) ON DELETE SET NULL"),
        ]:
            cols = {r[1] for r in cursor.execute(f"PRAGMA table_info({table})").fetchall()}
            if col not in cols:
                cursor.execute(ddl)
                logger.info(f"自动迁移: {table}.{col} 已添加")
        conn.commit()
        conn.close()
    except Exception as e:
        logger.warning(f"自动迁移跳过: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("正在初始化数据库...")
    _run_schema_migrations()
    init_db()
    db = SessionLocal()
    try:
        prompt_service.init_default_prompts(db)
        logger.info("默认Prompt模板已初始化")
    finally:
        db.close()
    logger.info("服务启动完成，监听地址: http://0.0.0.0:8000")
    logger.info("API文档地址: http://localhost:8000/docs")
    yield
    logger.info("服务正在关闭...")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="私有化RAG知识库问答服务后端API",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

if settings.CORS_ORIGINS:
    cors_origins = [o.strip() for o in settings.CORS_ORIGINS.split(",") if o.strip()]
else:
    cors_origins = ["http://localhost:3000", "http://localhost:5173", "http://localhost:8080"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def auth_and_log_middleware(request: Request, call_next):
    if request.url.path not in PUBLIC_PATHS and not request.url.path.startswith("/docs") \
            and not request.url.path.startswith("/redoc") and not request.url.path.startswith("/openapi"):
        if settings.API_KEY:
            api_key = request.headers.get("X-API-Key", "") or request.query_params.get("api_key", "")
            if not api_key:
                return JSONResponse(
                    status_code=401,
                    content={"code": 401, "message": "未授权：无效或缺失的API Key", "data": None},
                )
            if api_key == settings.API_KEY:
                pass  # 系统级API Key，直接放行
            elif api_key.startswith("agent_"):
                from app.core.database import SessionLocal
                from app.services.agent_service import agent_service
                db = SessionLocal()
                try:
                    agent = agent_service.get_by_api_key(db, api_key)
                    if not agent:
                        return JSONResponse(
                            status_code=401,
                            content={"code": 401, "message": "未授权：无效的Agent API Key", "data": None},
                        )
                finally:
                    db.close()
            else:
                return JSONResponse(
                    status_code=401,
                    content={"code": 401, "message": "未授权：无效或缺失的API Key", "data": None},
                )

    start = time.time()
    request_id = uuid.uuid4().hex[:8]
    response = await call_next(request)
    duration = round((time.time() - start) * 1000, 2)
    logger.info(f"[{request_id}] {request.method} {request.url.path} -> {response.status_code} ({duration}ms)")
    return response


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    request_id = uuid.uuid4().hex[:8]
    logger.error(f"[{request_id}] 未处理异常: {exc}", exc_info=True)
    response = JSONResponse(
        status_code=500,
        content={"code": 500, "message": "服务器内部错误，请联系管理员", "request_id": request_id},
    )
    response.headers["Access-Control-Allow-Origin"] = request.headers.get("Origin", "*")
    response.headers["Access-Control-Allow-Credentials"] = "true"
    return response


@app.get("/health", summary="健康检查")
def health_check():
    return {"status": "ok", "version": settings.VERSION}


app.include_router(api_router, prefix=settings.API_V1_PREFIX)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
