"""The RAG side: neighbourhood statistics and buying guides."""

import json

from langchain_core.tools import tool

from ..collect import current
from ..vectorstore import as_context, search


@tool("neighbourhood_knowledge")
def neighbourhood_knowledge(question: str, city: str | None = None) -> str:
    """Area background and Pakistani property paperwork: title documents,
    transfer, taxes, fees. Quote only what comes back."""
    chunks = search(question, kinds=["area", "guide"], city=city)
    if not chunks:
        current().step("knowledge", "Nothing in the knowledge base covered that",
                       tool="neighbourhood_knowledge")
        return json.dumps(
            {
                "found": False,
                "note": "No knowledge base match. Tell the user you do not have that "
                        "information rather than filling the gap.",
            }
        )

    for chunk in chunks:
        current().add_source(chunk.citation())
    current().step("knowledge", f"Read {len(chunks)} knowledge chunks on {question[:60]}",
                   tool="neighbourhood_knowledge")
    return json.dumps({"found": True, "context": as_context(chunks)})


@tool("listing_similar_to")
def listing_similar_to(description: str, city: str | None = None) -> str:
    """Find listings by character rather than filters ("old house with a
    garden"). Combine with search_properties for price and size."""
    chunks = search(description, kinds=["listing"], city=city, rerank_to=6)
    if not chunks:
        return json.dumps({"found": False, "matches": []})

    matches = [
        {
            "property_id": chunk.metadata.get("property_id"),
            "title": chunk.title,
            "why": chunk.text[:300],
        }
        for chunk in chunks
        if chunk.metadata.get("property_id")
    ]
    current().step("semantic search", f"{len(matches)} listings read like that description",
                   tool="listing_similar_to")
    return json.dumps({"found": bool(matches), "matches": matches})
