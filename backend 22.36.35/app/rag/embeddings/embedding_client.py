from openai import AsyncOpenAI
from app.core.config import get_settings

settings = get_settings()


class EmbeddingClient:
    def __init__(self):
        self.client = AsyncOpenAI(
            api_key=settings.embedding_api_key or settings.openai_api_key,
            base_url=settings.embedding_api_base or settings.openai_api_base,
        )
        self.model = settings.embedding_model
        self.dimension = settings.embedding_dimension

    async def embed(self, texts: list[str]) -> list[list[float]]:
        response = await self.client.embeddings.create(model=self.model, input=texts)
        return [item.embedding for item in response.data]


embedding_client = EmbeddingClient()
