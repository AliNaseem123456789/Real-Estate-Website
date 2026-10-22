"""Embeddings, from one of three providers.

The hard rule: whatever embeds the knowledge base must also embed the queries.
Two different models produce vectors in two different spaces, and retrieval
silently returns nonsense rather than failing. So the provider is a single
setting used by both the ingest script and the running service, and changing it
means re-ingesting and rebuilding the Atlas index with the new dimensions.

  gemini  hosted, 128-3072 dimensions, free tier. The default.
  jina    hosted, multilingual (better for Urdu questions) and multimodal, so
          it is also the path to photo search. 128/256/512/1024/2048.
  local   fastembed on CPU: no API calls and no quota, which makes a one-off
          ingest of thousands of chunks free. Fine on a laptop; see the README
          before trying to serve queries with it on a 512 MB Render instance.
"""

import logging
from functools import lru_cache

import httpx
from langchain_core.embeddings import Embeddings

from .config import settings

log = logging.getLogger(__name__)

JINA_EMBED_URL = "https://api.jina.ai/v1/embeddings"


class JinaEmbeddings(Embeddings):
    """Jina's embedding API, with the retrieval task prefixes it expects."""

    def __init__(self, model: str, dimensions: int, api_key: str):
        self.model = model
        self.dimensions = dimensions
        self.api_key = api_key

    def _call(self, texts: list[str], task: str) -> list[list[float]]:
        response = httpx.post(
            JINA_EMBED_URL,
            headers={"Authorization": f"Bearer {self.api_key}"},
            json={
                "model": self.model,
                "task": task,
                "dimensions": self.dimensions,
                "input": [{"text": text} for text in texts],
            },
            timeout=90,
        )
        response.raise_for_status()
        rows = sorted(response.json()["data"], key=lambda row: row.get("index", 0))
        return [row["embedding"] for row in rows]

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        return self._call(texts, "retrieval.passage")

    def embed_query(self, text: str) -> list[float]:
        return self._call([text], "retrieval.query")[0]


class LocalEmbeddings(Embeddings):
    """fastembed (ONNX, no torch). The model downloads once, then works offline."""

    def __init__(self, model: str):
        from fastembed import TextEmbedding  # imported here: not a Render dependency

        self.model = TextEmbedding(model)

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        return [vector.tolist() for vector in self.model.embed(texts)]

    def embed_query(self, text: str) -> list[float]:
        return next(iter(self.model.query_embed([text]))).tolist()


@lru_cache
def get_embeddings(task_type: str = "RETRIEVAL_DOCUMENT") -> Embeddings:
    problem = settings.check_embedding_setup()
    if problem:
        raise RuntimeError(problem)

    if settings.embed_provider == "jina":
        return JinaEmbeddings(settings.jina_embed_model, settings.embed_dimensions,
                              settings.jina_api_key)

    if settings.embed_provider == "local":
        return LocalEmbeddings(settings.local_embed_model)

    from langchain_google_genai import GoogleGenerativeAIEmbeddings

    kwargs: dict = {
        "model": f"models/{settings.gemini_embed_model}",
        "google_api_key": settings.google_api_key,
    }
    # gemini-embedding-2 takes a task prefix in the text instead of task_type.
    if settings.gemini_embed_model.endswith("001"):
        kwargs["task_type"] = task_type
    if settings.embed_dimensions:
        kwargs["output_dimensionality"] = settings.embed_dimensions

    return GoogleGenerativeAIEmbeddings(**kwargs)


def get_query_embeddings() -> Embeddings:
    return get_embeddings("RETRIEVAL_QUERY")


def describe() -> str:
    return (f"{settings.embed_provider}:{settings.embed_model_name} "
            f"at {settings.embed_dimensions} dimensions")
