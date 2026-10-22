"""Listing search, straight over the Express API."""

import json
from typing import Literal

from langchain_core.tools import tool
from pydantic import BaseModel, Field

from ..backend import BackendError, get
from ..collect import current
from ..format import SQFT_PER_UNIT, area_words, price_full
from ..schemas import PropertyCard

SITE_PATH = "/properties"

# The page holds nine listings, but the model does not need all of them: the
# cards in the UI show every result, while only this many go into the prompt.
MODEL_RESULTS = 4


def _card(row: dict) -> PropertyCard:
    images = row.get("images") or []
    return PropertyCard(
        id=str(row.get("_id")),
        title=row.get("title") or "Untitled listing",
        city=row.get("city") or "",
        price=float(row.get("price") or 0),
        action=row.get("action") or "",
        type=row.get("type"),
        size=row.get("size"),
        bedroom=row.get("bedroom"),
        bathroom=row.get("bathroom"),
        image=images[0] if images else None,
        url=f"/properties/{row.get('_id')}",
    )


def _for_model(row: dict) -> dict:
    """What the model sees: words, not raw numbers it might mangle."""
    return {
        "id": str(row.get("_id")),
        "title": row.get("title"),
        "city": row.get("city"),
        "purpose": "for rent" if row.get("action") == "rent" else "for sale",
        "type": row.get("type"),
        "price": price_full(row.get("price")),
        "area": area_words(row.get("areaSqft")),
        "bedrooms": row.get("bedroom"),
        "bathrooms": row.get("bathroom"),
        "url": f"/properties/{row.get('_id')}",
    }


def _remember(rows: list[dict]) -> None:
    context = current()
    for row in rows:
        card = _card(row)
        context.add_card(card)
        context.seen_properties[card.id] = _for_model(row)


class SearchInput(BaseModel):
    purpose: Literal["rent", "sell"] | None = None
    property_type: Literal["Residential", "Commercial", "Plot"] | None = None
    city: str | None = None
    min_price: float | None = Field(None, description="PKR")
    max_price: float | None = Field(None, description="PKR")
    bedrooms: int | None = Field(None, description="minimum")
    bathrooms: int | None = Field(None, description="minimum")
    min_area_marla: float | None = Field(None, description="minimum size in marla")
    sort: Literal["newest", "price_asc", "price_desc", "area_desc"] = "newest"
    page: int = 1


@tool("search_properties", args_schema=SearchInput)
def search_properties(
    purpose: str | None = None,
    property_type: str | None = None,
    city: str | None = None,
    min_price: float | None = None,
    max_price: float | None = None,
    bedrooms: int | None = None,
    bathrooms: int | None = None,
    min_area_marla: float | None = None,
    sort: str = "newest",
    page: int = 1,
) -> str:
    """Search the live listings. Use for anything about what is available.
    Returns listings with ids that other tools need. Prices in PKR."""
    params = {
        "action": purpose,
        "type": property_type,
        "city": city,
        "minPrice": min_price,
        "maxPrice": max_price,
        "bedrooms": bedrooms,
        "bathrooms": bathrooms,
        "minArea": round(min_area_marla * SQFT_PER_UNIT["marla"]) if min_area_marla else None,
        "sort": sort,
        "page": page,
    }
    try:
        data = get(SITE_PATH, params)
    except BackendError as error:
        return json.dumps({"error": str(error)})

    rows = data.get("properties", [])
    _remember(rows)
    current().step(
        "search",
        f"{data.get('total', 0)} listings matched"
        + (f" in {city}" if city else "")
        + (f" under {int(max_price):,}" if max_price else ""),
        tool="search_properties",
    )

    return json.dumps(
        {
            "total_matches": data.get("total", 0),
            "page": data.get("page", 1),
            "total_pages": data.get("totalPages", 1),
            "showing": min(len(rows), MODEL_RESULTS),
            "results": [_for_model(row) for row in rows[:MODEL_RESULTS]],
        },
        default=str,
    )


@tool("get_property")
def get_property(property_id: str) -> str:
    """Full detail for one listing. Call before advising on a specific property."""
    try:
        row = get(f"{SITE_PATH}/{property_id}")
    except BackendError as error:
        return json.dumps({"error": str(error)})

    _remember([row])
    current().step("detail", f"Read the full listing for {row.get('title')}", tool="get_property")
    detail = _for_model(row)
    detail["address"] = row.get("address")
    detail["size"] = row.get("size")
    detail["has_map_pin"] = bool((row.get("location") or {}).get("lat"))
    detail["description"] = (row.get("description") or "")[:800]
    detail["seller"] = row.get("publisher_name")
    return json.dumps(detail, default=str)


@tool("compare_properties")
def compare_properties(property_ids: list[str]) -> str:
    """Fetch 2-3 listings side by side to compare. Pass ids from search_properties."""
    ids = [i.strip() for i in property_ids if i and i.strip()][:3]
    if len(ids) < 2:
        return json.dumps({"error": "Give at least two property ids to compare"})

    try:
        data = get(SITE_PATH, {"ids": ",".join(ids)})
    except BackendError as error:
        return json.dumps({"error": str(error)})

    rows = data.get("properties", [])
    _remember(rows)
    current().step("compare", f"Pulled {len(rows)} listings side by side", tool="compare_properties")

    table = [_for_model(row) for row in rows]
    prices = [row.get("price") or 0 for row in rows]
    areas = [row.get("areaSqft") or 0 for row in rows]
    return json.dumps(
        {
            "listings": table,
            "cheapest_id": str(rows[prices.index(min(prices))]["_id"]) if rows else None,
            "largest_id": str(rows[areas.index(max(areas))]["_id"]) if rows and any(areas) else None,
        },
        default=str,
    )


@tool("list_cities")
def list_cities() -> str:
    """Cities that have listings. Check before saying a place has nothing."""
    try:
        cities = get(f"{SITE_PATH}/cities")
    except BackendError as error:
        return json.dumps({"error": str(error)})
    return json.dumps({"cities": cities})
