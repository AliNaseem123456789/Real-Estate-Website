"""Neighbourhood price statistics, from the market-data dataset the site already has."""

import json

from langchain_core.tools import tool

from ..backend import BackendError, get
from ..collect import current
from ..format import price_full, price_words


@tool("price_check")
def price_check(property_id: str) -> str:
    """Is this listing priced fairly? Compares price per marla against its
    neighbourhood median; returns below, typical or above."""
    try:
        data = get(f"/market/price-check/{property_id}")
    except BackendError as error:
        return json.dumps({"error": str(error)})

    if not data.get("found"):
        current().step("price check", "No neighbourhood data for this listing", tool="price_check")
        return json.dumps(
            {
                "found": False,
                "note": "No price statistics for this area. Say so plainly instead of guessing.",
            }
        )

    area = data.get("area", {})
    current().add_source(f"Area data: {area.get('location')}, {area.get('city')}")
    verdict = data.get("verdict")
    current().step(
        "price check",
        f"{area.get('location')}: {verdict or 'no verdict'}"
        + (f" ({data.get('differencePct'):+d}% vs median)" if data.get("differencePct") is not None else ""),
        tool="price_check",
    )

    return json.dumps(
        {
            "found": True,
            "matched_by": data.get("matchedBy"),
            "area": area.get("location"),
            "city": area.get("city"),
            "listing_price_per_marla": data.get("pricePerMarla"),
            "area_median_price_per_marla": area.get("medianPricePerMarla"),
            "usual_range_per_marla": [area.get("p25PricePerMarla"), area.get("p75PricePerMarla")],
            "difference_from_median_pct": data.get("differencePct"),
            "verdict": verdict,
            "sample_size": area.get("count"),
            "low_confidence": bool(area.get("lowConfidence")),
            "data_collected_on": area.get("dataCollectedOn"),
        },
        default=str,
    )


@tool("area_overview")
def area_overview(city: str, purpose: str = "sell", category: str = "house", limit: int = 8) -> str:
    """Typical prices by neighbourhood. purpose: sell|rent. category:
    house|flat|plot|commercial. For "where can I afford" and rent-vs-buy."""
    try:
        areas = get("/market/areas", {"city": city, "purpose": purpose, "category": category})
    except BackendError as error:
        return json.dumps({"error": str(error)})

    if not areas:
        return json.dumps({"areas": [], "note": f"No price data for {category} in {city}."})

    current().add_source(f"Area data: {city} ({purpose}, {category})")
    current().step("market", f"Compared {len(areas)} neighbourhoods in {city}", tool="area_overview")

    rows = []
    for area in areas[:limit]:
        rows.append(
            {
                "area": area.get("location"),
                "median_price": price_full(area.get("medianPrice")),
                "median_per_marla": price_words(area.get("medianPricePerMarla")),
                "median_size_marla": area.get("medianAreaMarla"),
                "listings_in_sample": area.get("count"),
                "low_confidence": bool(area.get("lowConfidence")),
                # On sale rows this is how many years of rent equal the purchase
                # price: a rough rent-versus-buy signal.
                "years_of_rent_equal_price": area.get("rentYears"),
            }
        )
    return json.dumps({"city": city, "purpose": purpose, "category": category, "areas": rows},
                      default=str)
