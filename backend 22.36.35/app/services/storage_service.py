from minio import Minio
from app.core.config import get_settings
import uuid
import os
from io import BytesIO

settings = get_settings()


class StorageService:
    def __init__(self):
        self.client = Minio(
            settings.minio_endpoint,
            access_key=settings.minio_access_key,
            secret_key=settings.minio_secret_key,
            secure=settings.minio_secure,
        )
        self.bucket = settings.minio_bucket
        self._ensure_bucket()

    def _ensure_bucket(self):
        if not self.client.bucket_exists(self.bucket):
            self.client.make_bucket(self.bucket)

    async def upload_file(self, file_content: bytes, filename: str, content_type: str) -> str:
        ext = os.path.splitext(filename)[1]
        object_name = f"documents/{uuid.uuid4()}{ext}"
        self.client.put_object(
            self.bucket, object_name, BytesIO(file_content), len(file_content), content_type=content_type
        )
        return object_name

    async def download_file(self, object_name: str) -> bytes:
        response = self.client.get_object(self.bucket, object_name)
        return response.read()

    async def delete_file(self, object_name: str):
        self.client.remove_object(self.bucket, object_name)


storage_service = StorageService()
