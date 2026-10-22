"""Retrieval over the knowledge base in Atlas Vector Search.

One collection holds every chunk, tagged with a "kind":

  area    - a neighbourhood's price statistics written out as prose, built from
            the area_stats collection the market-data tool produces
  listing - a property's own description
  guide   - static explainers about buying property in Pakistan (title transfer,
            taxes, the paperwork a buyer should ask for)

Keeping them in one collection means one vector index, which matters because an
Atlas free cluster allows only three in total.
"""

import logging
from dataclasses import dataclass, field
from typing import Any

from .config import settings
from .embeddings import get_query_embeddings
from .mongo import vector_collection
from .rerank import rerank

log = logging.getLogger(__name__)


@dataclass
class Chunk:
    text: str
    kind: str
    title: str
    score: float = 0.0
    metadata: dict[str, Any] = field(default_factory=dict)

    def citation(self) -> str:
        if self.kind == "listing" and self.metadata.get("property_id"):
            return f"Listing: {self.title} (/properties/{self.metadata['property_id']})"
        if self.kind == "area":
            return f"Area data: {self.title}"
        return f"Guide: {self.title}"


def search(
    query: str,
    kinds: list[str] | None = None,
    city: str | None = None,
    k: int | None = None,
    rerank_to: int | None = None,
) -> list[Chunk]:
    """Vector search, pre-filtered in the database, then reranked by Jina."""
    k = k or settings.retrieve_k
    rerank_to = rerank_to or settings.rerank_k

    try:
        vector = get_query_embeddings().embed_query(query)
    except Exception as error:  # noqa: BLE001
        log.error("Embedding the query failed: %s", error)
        return []

    # Pre-filtering inside $vectorSearch (rather than after it) is the reason the
    # knowledge base lives in Atlas: "similar to this, but only Lahore" is one query.
    conditions: list[dict] = []
    if kinds:
        conditions.append({"kind": {"$in": kinds}})
    if city:
        conditions.append({"city": city.strip().lower()})
    vector_filter = (
        conditions[0] if len(conditions) == 1 else {"$and": conditions} if conditions else None
    )

    stage: dict[str, Any] = {
        "index": settings.vector_index,
        "path": "embedding",
        "queryVector": vector,
        "numCandidates": max(k * 10, 100),
        "limit": k,
    }
    if vector_filter:
        stage["filter"] = vector_filter

    pipeline = [
        {"$vectorSearch": stage},
        {
            "$project": {
                "_id": 0,
                "text": 1,
                "kind": 1,
                "title": 1,
                "city": 1,
                "metadata": 1,
                "score": {"$meta": "vectorSearchScore"},
            }
        },
    ]

    try:
        rows = list(vector_collection().aggregate(pipeline))
    except Exception as error:  # noqa: BLE001
        log.error("Vector search failed (is the index built? run scripts/ingest.py): %s", error)
        return []

    if not rows:
        return []

    chunks = [
        Chunk(
            text=row.get("text", ""),
            kind=row.get("kind", "guide"),
            title=row.get("title", ""),
            score=row.get("score", 0.0),
            metadata=row.get("metadata", {}) | ({"city": row["city"]} if row.get("city") else {}),
        )
        for row in rows
    ]

    ordered = rerank(query, [c.text for c in chunks], top_n=rerank_to)
    return [chunks[index] for index, _ in ordered if index < len(chunks)]


def as_context(chunks: list[Chunk], max_chars: int = 6000) -> str:
    """Flatten chunks into a prompt block, newest budget first."""
    parts: list[str] = []
    used = 0
    for chunk in chunks:
        block = f"[{chunk.kind}: {chunk.title}]\n{chunk.text}"
        if used + len(block) > max_chars:
            break
        parts.append(block)
        used += len(block)
    return "\n\n".join(parts)
