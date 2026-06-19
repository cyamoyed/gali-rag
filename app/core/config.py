"""应用配置模块。

使用 pydantic-settings 从环境变量和 .env 文件加载配置。
启动时自动创建必要的数据目录。
"""
from pydantic_settings import BaseSettings
from pathlib import Path
import os


class Settings(BaseSettings):
    PROJECT_NAME: str = "Gali-RAG 私有化知识库问答服务"
    VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api/v1"

    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent

    # 数据库SQLite文件路径
    DATABASE_URL: str = f"sqlite:///{BASE_DIR / 'data' / 'gali_rag.db'}"

    # ChromaDB向量存储目录
    CHROMA_PERSIST_DIR: str = str(BASE_DIR / "data" / "chroma")
    # 用户上传文件存储目录
    UPLOAD_DIR: str = str(BASE_DIR / "data" / "uploads")
    # 导出文件目录
    EXPORT_DIR: str = str(BASE_DIR / "data" / "exports")

    # 系统级API Key，为空则跳过鉴权
    API_KEY: str = ""
    # 单文件上传大小上限(MB)
    MAX_UPLOAD_SIZE_MB: int = 50

    # 默认文本切片参数
    CHUNK_SIZE: int = 500
    CHUNK_OVERLAP: int = 100
    SEMANTIC_CHUNK_ENABLED: bool = False
    LLM_CHUNK_ENABLED: bool = False

    # 检索参数
    DEFAULT_TOP_K: int = 5
    BM25_TOP_N: int = 5
    VECTOR_TOP_N: int = 5
    SIMILARITY_THRESHOLD: float = 0.6

    # CORS允许的来源，逗号分隔，为空则允许所有来源
    CORS_ORIGINS: str = ""

    # HNSW向量索引参数
    HNSW_M: int = 16
    HNSW_EF_CONSTRUCTION: int = 200
    HNSW_EF_SEARCH: int = 100

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()

os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.CHROMA_PERSIST_DIR, exist_ok=True)
os.makedirs(settings.EXPORT_DIR, exist_ok=True)
