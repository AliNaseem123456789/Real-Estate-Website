"""Jina reranking.

Vector search gets the shortlist; the reranker decides the order. The
multilingual model matters here because the website has an Urdu mode and
questions arrive in both languages.
"""

import logging

import httpx

from .config import settings

log = logging.getLogger(__name__)

JINA_URL = "https://api.jina.ai/v1/rerank"


def rerank(query: str, documents: list[str], top_n: int | None = None) -> list[tuple[int, float]]:
    """Return (original index, relevance score) best first.

    Falls back to the incoming order if Jina is unavailable, so a missing key or
    a rate limit degrades the answer instead of breaking the request.
    """
    top_n = top_n or settings.rerank_k
    if not documents:
        return []
    if not settings.has_jina:
        return [(i, 0.0) for i in range(min(top_n, len(documents)))]

    try:
        response = httpx.post(
            JINA_URL,
            headers={"Authorization": f"Bearer {settings.jina_api_key}"},
            json={
                "model": settings.jina_rerank_model,
                "query": query,
                "documents": documents,
                "top_n": min(top_n, len(documents)),
            },
            timeout=20,
        )
        response.raise_for_status()
        results = response.json().get("results", [])
        return [(item["index"], item.get("relevance_score", 0.0)) for item in results]
    except Exception as error:  # noqa: BLE001 - never fail the chat over reranking
        log.warning("Jina rerank failed, keeping vector order: %s", error)
        return [(i, 0.0) for i in range(min(top_n, len(documents)))]
