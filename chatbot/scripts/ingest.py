"""Build the knowledge base in Atlas Vector Search.

    cd chatbot
    python scripts/ingest.py                   # everything
    python scripts/ingest.py --kinds areas     # just the neighbourhood statistics
    python scripts/ingest.py --limit 200       # a small slice, for a first run

Three kinds of chunk end up in one collection:

  area    - a neighbourhood's statistics from area_stats, written out as prose so a
            language model can actually use them
  listing - a property's own description, for "something old with a garden" searches
  guide   - the markdown files in knowledge/, for paperwork questions

Run it again whenever listings or the market data change; chunks are upserted on a
stable id, so re-running is safe and only re-embeds what it is asked to.
"""

import argparse
import hashlib
import json
import pathlib
import sys
import time

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))

from pymongo import ReplaceOne  # noqa: E402
from pymongo.operations import SearchIndexModel  # noqa: E402

from app.config import settings  # noqa: E402
from app.embeddings import describe as describe_embeddings  # noqa: E402
from app.embeddings import get_embeddings  # noqa: E402
from app.format import area_words, price_full, price_words  # noqa: E402
from app.mongo import collection, vector_collection  # noqa: E402

KNOWLEDGE_DIR = pathlib.Path(__file__).resolve().parents[1] / "knowledge"
# Hosted providers get small batches and a pause to stay inside the free quota.
# The local provider has no quota, so it runs flat out.
BATCH = 32
PAUSE = 1.0
LOCAL_BATCH = 128
RETRIES = 3
RETRY_WAIT = 30  # seconds, multiplied by the attempt number


def chunk_id(kind: str, key: str) -> str:
    return f"{kind}:{hashlib.sha1(key.encode()).hexdigest()[:16]}"


# ------------------------------------------------------------------ area chunks
def area_chunks(limit: int | None) -> list[dict]:
    """Turn each area_stats row into a paragraph worth retrieving."""
    rows = list(collection("area_stats").find({}).limit(limit or 0))
    chunks = []
    for row in rows:
        city = row.get("city") or ""
        name = row.get("location") or ""
        if not name:
            continue
        purpose = "for sale" if row.get("purpose") == "sell" else "for rent"
        category = row.get("category") or "property"

        lines = [
            f"{name}, {city} - {category} {purpose}.",
            f"Median price: {price_full(row.get('medianPrice'))}.",
        ]
        if row.get("medianPricePerMarla"):
            per = price_words(row["medianPricePerMarla"])
            suffix = " per month" if row.get("purpose") == "rent" else ""
            lines.append(f"Median price per marla: {per}{suffix}.")
        if row.get("p25PricePerMarla") and row.get("p75PricePerMarla"):
            lines.append(
                "Usual range per marla: "
                f"{price_words(row['p25PricePerMarla'])} to {price_words(row['p75PricePerMarla'])}."
            )
        if row.get("medianAreaMarla"):
            lines.append(f"Typical size: {row['medianAreaMarla']} marla.")
        if row.get("medianBedrooms"):
            lines.append(f"Typical bedrooms: {row['medianBedrooms']}.")
        if row.get("rentYears"):
            lines.append(
                f"About {row['rentYears']} years of rent equal the purchase price here, "
                "which is the rent-versus-buy signal for this area."
            )
        for band in row.get("sizeBands") or []:
            if band.get("medianPrice"):
                lines.append(
                    f"Size band {band.get('band')}: median {price_full(band['medianPrice'])} "
                    f"across {band.get('count')} listings."
                )
        if row.get("subAreas"):
            lines.append("Blocks included: " + ", ".join(row["subAreas"][:12]) + ".")
        lines.append(
            f"Based on {row.get('count')} listings"
            + (" - a small sample, treat it as a hint only" if row.get("lowConfidence") else "")
            + (f", collected {row.get('dataCollectedOn')}" if row.get("dataCollectedOn") else "")
            + "."
        )

        chunks.append(
            {
                "_id": chunk_id("area", f"{city}|{name}|{row.get('purpose')}|{category}"),
                "kind": "area",
                "title": f"{name}, {city} ({category} {purpose})",
                "city": city.strip().lower(),
                "text": "\n".join(lines),
                "metadata": {
                    "purpose": row.get("purpose"),
                    "category": category,
                    "median_price": row.get("medianPrice"),
                    "low_confidence": bool(row.get("lowConfidence")),
                },
            }
        )
    return chunks


# --------------------------------------------------------------- listing chunks
def listing_chunks(limit: int | None, min_description: int = 120) -> list[dict]:
    """Only listings whose description says something the filters do not.

    Imported listings get their description from the scrape's shortDescription,
    which is often just the title again. Embedding thousands of those costs
    quota and buys nothing, so anything shorter than min_description characters,
    or identical to the title, is skipped.
    """
    query = {"approved": {"$ne": False}, "sold": {"$ne": True}}
    fields = {"title": 1, "description": 1, "city": 1, "address": 1, "price": 1, "action": 1,
              "type": 1, "size": 1, "areaSqft": 1, "bedroom": 1, "bathroom": 1}
    rows = list(collection("properties").find(query, fields).limit(limit or 0))

    chunks = []
    for row in rows:
        description = (row.get("description") or "").strip()
        title = (row.get("title") or "").strip()
        if len(description) < min_description or description == title:
            continue  # nothing here that the structured filters do not already cover
        city = row.get("city") or ""
        purpose = "for rent" if row.get("action") == "rent" else "for sale"
        text = (
            f"{row.get('title')} - {row.get('type')} {purpose} in {row.get('address') or city}.\n"
            f"{price_full(row.get('price'))}, {area_words(row.get('areaSqft'))}, "
            f"{row.get('bedroom') or 0} bed, {row.get('bathroom') or 0} bath.\n\n"
            f"{description[:1800]}"
        )
        chunks.append(
            {
                "_id": chunk_id("listing", str(row["_id"])),
                "kind": "listing",
                "title": row.get("title") or "Listing",
                "city": city.strip().lower(),
                "text": text,
                "metadata": {"property_id": str(row["_id"]), "price": row.get("price"),
                             "action": row.get("action")},
            }
        )
    return chunks


# ----------------------------------------------------------------- guide chunks
def guide_chunks(_limit: int | None = None) -> list[dict]:
    """Split each markdown file on its "## " headings."""
    chunks = []
    for path in sorted(KNOWLEDGE_DIR.glob("*.md")):
        raw = path.read_text(encoding="utf8")
        doc_title = raw.splitlines()[0].lstrip("# ").strip() if raw.strip() else path.stem
        sections = raw.split("\n## ")
        for index, section in enumerate(sections):
            body = section if index == 0 else "## " + section
            body = body.strip()
            if len(body) < 80:
                continue
            heading = body.splitlines()[0].lstrip("# ").strip()
            chunks.append(
                {
                    "_id": chunk_id("guide", f"{path.name}|{index}"),
                    "kind": "guide",
                    "title": f"{doc_title} - {heading}" if index else doc_title,
                    "city": None,
                    "text": body,
                    "metadata": {"file": path.name},
                }
            )
    return chunks


# ---------------------------------------------------------------------- indexing
def ensure_vector_index() -> None:
    """Create the Atlas vector index if it is not there yet.

    Atlas free clusters allow three search indexes in total, which is why every
    chunk kind shares one collection and one index.
    """
    target = vector_collection()
    try:
        existing = {index["name"] for index in target.list_search_indexes()}
    except Exception as error:  # noqa: BLE001
        print(f"  ! Could not list search indexes ({error}).")
        print("    Create it by hand in Atlas with this definition:")
        print(json.dumps(_definition(), indent=2))
        return

    if settings.vector_index in existing:
        print(f"  Vector index '{settings.vector_index}' already exists.")
        print(f"  It must be built for {settings.embed_dimensions} dimensions. If you "
              "changed EMBED_PROVIDER or EMBED_DIMENSIONS, drop it in Atlas and re-run, "
              "or searches will fail.")
        return

    try:
        target.create_search_index(
            SearchIndexModel(definition=_definition(), name=settings.vector_index,
                             type="vectorSearch")
        )
        print(f"  Created vector index '{settings.vector_index}'. Atlas takes a minute "
              "to build it before searches return anything.")
    except Exception as error:  # noqa: BLE001
        print(f"  ! Could not create the index automatically ({error}).")
        print("    Create it in the Atlas UI (Atlas Search -> Create Index -> JSON editor):")
        print(json.dumps(_definition(), indent=2))


def _definition() -> dict:
    return {
        "fields": [
            {"type": "vector", "path": "embedding",
             "numDimensions": settings.embed_dimensions, "similarity": "cosine"},
            {"type": "filter", "path": "kind"},
            {"type": "filter", "path": "city"},
        ]
    }


def already_embedded(chunks: list[dict]) -> set[str]:
    """Ids already stored with an embedding of the configured size.

    Without this, a re-run after a rate limit re-embeds everything from the
    start and stops at the same place, so the ingest could never finish. The
    size is checked rather than trusted, so switching provider or dimensions
    correctly forces a re-embed.
    """
    ids = [chunk["_id"] for chunk in chunks]
    try:
        rows = vector_collection().find(
            {
                "_id": {"$in": ids},
                "$expr": {"$eq": [{"$size": {"$ifNull": ["$embedding", []]}},
                                  settings.embed_dimensions]},
            },
            {"_id": 1},
        )
        return {row["_id"] for row in rows}
    except Exception as error:  # noqa: BLE001 - worst case we re-embed
        print(f"  ! Could not check what is already stored ({error}); embedding all")
        return set()


def embed_and_store(chunks: list[dict], force: bool = False) -> int:
    if not chunks:
        return 0

    if not force:
        done = already_embedded(chunks)
        if done:
            print(f"  {len(done)} already embedded at {settings.embed_dimensions} dimensions, "
                  "skipping those")
            chunks = [chunk for chunk in chunks if chunk["_id"] not in done]
        if not chunks:
            print("  nothing left to do")
            return 0
        print(f"  {len(chunks)} to embed now")

    embedder = get_embeddings("RETRIEVAL_DOCUMENT")
    target = vector_collection()
    stored = 0
    local = settings.embed_provider == "local"
    size = LOCAL_BATCH if local else BATCH

    for start in range(0, len(chunks), size):
        batch = chunks[start:start + size]
        vectors = None
        for attempt in range(1, RETRIES + 1):
            try:
                vectors = embedder.embed_documents([c["text"] for c in batch])
                break
            except Exception as error:  # noqa: BLE001
                rate_limited = "429" in str(error) or "rate" in str(error).lower()
                if attempt < RETRIES and rate_limited:
                    wait = RETRY_WAIT * attempt
                    print(f"  rate limited; waiting {wait}s then retrying "
                          f"(attempt {attempt + 1} of {RETRIES})")
                    time.sleep(wait)
                    continue
                print(f"  ! Embedding batch {start // size + 1} failed: {error}")
                print("    Stopping here. Re-run when the limit resets - it now picks up "
                      "where it left off instead of starting over.")
                break
        if vectors is None:
            break

        target.bulk_write(
            [
                ReplaceOne(
                    {"_id": chunk["_id"]},
                    {**chunk, "embedding": vector,
                     "provider": settings.embed_provider,
                     "dims": settings.embed_dimensions},
                    upsert=True,
                )
                for chunk, vector in zip(batch, vectors)
            ],
            ordered=False,
        )
        stored += len(batch)
        print(f"  stored {stored}/{len(chunks)}")
        if not local and start + size < len(chunks):
            time.sleep(PAUSE)

    return stored


BUILDERS = {"areas": area_chunks, "listings": listing_chunks, "guides": guide_chunks}


def show_status() -> None:
    """What is in the knowledge base right now, by kind and city."""
    target = vector_collection()
    total = target.count_documents({})
    right_size = target.count_documents(
        {"$expr": {"$eq": [{"$size": {"$ifNull": ["$embedding", []]}},
                           settings.embed_dimensions]}}
    )
    print(f"{settings.vector_collection}: {total} chunks, {right_size} embedded at "
          f"{settings.embed_dimensions} dimensions")
    if total != right_size:
        print(f"  ! {total - right_size} are missing an embedding or are a different size - "
              "they will be (re)done on the next run")

    by_kind = target.aggregate([{"$group": {"_id": "$kind", "n": {"$sum": 1}}},
                                {"$sort": {"n": -1}}])
    print("\nby kind:")
    for row in by_kind:
        print(f"  {row['_id'] or '(none)':<10} {row['n']}")

    print("\nareas by city (embedded / total rows in area_stats):")
    stored = {r["_id"]: r["n"] for r in target.aggregate([
        {"$match": {"kind": "area"}},
        {"$group": {"_id": "$city", "n": {"$sum": 1}}},
    ])}
    source = {r["_id"]: r["n"] for r in collection("area_stats").aggregate([
        {"$group": {"_id": {"$toLower": "$city"}, "n": {"$sum": 1}}},
    ])}
    for city in sorted(source, key=lambda c: -source[c]):
        have = stored.get(city, 0)
        flag = "" if have >= source[city] else "   <- incomplete"
        print(f"  {city or '(blank)':<16} {have:>5} / {source[city]:<5}{flag}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Build the chatbot knowledge base")
    parser.add_argument("--kinds", default="areas,guides",
                        help="comma-separated: areas, listings, guides. Listings are off "
                             "by default: most imported descriptions repeat the title, so "
                             "embedding them costs quota and adds nothing.")
    parser.add_argument("--min-description", type=int, default=120,
                        help="skip listings whose description is shorter than this (chars)")
    parser.add_argument("--limit", type=int, default=None,
                        help="cap the rows read per kind (useful for a first run)")
    parser.add_argument("--skip-index", action="store_true",
                        help="do not touch the Atlas vector index")
    parser.add_argument("--force", action="store_true",
                        help="re-embed chunks that are already stored at this size")
    parser.add_argument("--status", action="store_true",
                        help="report what is already in the knowledge base, then exit")
    args = parser.parse_args()

    if not settings.mongo_uri:
        sys.exit("MONGO_URI is not set. Copy .env.example to .env first.")
    if settings.embed_provider == "gemini" and not settings.google_api_key:
        sys.exit("GOOGLE_API_KEY is not set, so nothing can be embedded.")

    if args.status:
        show_status()
        return

    kinds = [k.strip() for k in args.kinds.split(",") if k.strip() in BUILDERS]
    if not kinds:
        sys.exit(f"--kinds must name some of {list(BUILDERS)}")

    problem = settings.check_embedding_setup()
    if problem:
        sys.exit(f"Embedding settings look wrong: {problem}")

    print(f"Database  : {settings.mongo_db}")
    print(f"Collection: {settings.vector_collection}")
    print(f"Embeddings: {describe_embeddings()}")
    print("            Queries must use these exact settings, or retrieval returns "
          "nonsense.\n")

    if not args.skip_index:
        ensure_vector_index()
        print()

    total = 0
    for kind in kinds:
        print(f"{kind}:")
        chunks = (BUILDERS[kind](args.limit, args.min_description) if kind == "listings"
                  else BUILDERS[kind](args.limit))
        print(f"  {len(chunks)} chunks to embed")
        total += embed_and_store(chunks, force=args.force)
        print()

    print(f"Done. {total} chunks in {settings.vector_collection}.")


if __name__ == "__main__":
    main()
