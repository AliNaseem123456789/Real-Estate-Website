"""Offer preparation: what to pay, and the evidence for it.

Everything here is composed from figures the site already holds - the listing's
price per marla against its own neighbourhood's median and p25-p75 band. Nothing
is estimated: if the market data has no match, the tool says so rather than
guessing, because a confident wrong number here costs the user real money.
"""

import json

from langchain_core.tools import tool

from ..backend import BackendError, get
from ..collect import current
from ..format import price_full, price_words


@tool("offer_brief")
def offer_brief(property_id: str) -> str:
    """Prepare a negotiation brief for one listing: where its price sits against
    its neighbourhood, a suggested opening offer, and the facts that support it.
    Use when the user asks what to offer, whether there is room to negotiate, or
    how to argue the price down."""
    try:
        listing = get(f"/properties/{property_id}")
    except BackendError as error:
        return json.dumps({"error": str(error)})

    try:
        market = get(f"/market/price-check/{property_id}")
    except BackendError as error:
        return json.dumps({"error": str(error)})

    price = float(listing.get("price") or 0)
    if not market.get("found") or market.get("pricePerMarla") is None:
        current().step("offer brief", "No neighbourhood data - cannot anchor an offer",
                       tool="offer_brief")
        return json.dumps({
            "have_market_data": False,
            "listing": {"title": listing.get("title"), "price": price_full(price)},
            "instruction": "Tell the user there is no price data for this area, so you "
                           "cannot say whether the price is fair. Do not estimate.",
        })

    area = market.get("area", {})
    per_marla = market["pricePerMarla"]
    median = area.get("medianPricePerMarla")
    p25, p75 = area.get("p25PricePerMarla"), area.get("p75PricePerMarla")
    verdict = market.get("verdict")
    diff = market.get("differencePct")

    # Anchor at the area median for this property's size: the one defensible
    # number, since it is what comparable properties here actually sell for.
    marla = price / per_marla if per_marla else 0
    at_median = round(median * marla) if median and marla else None
    at_p25 = round(p25 * marla) if p25 and marla else None

    if verdict == "above":
        stance = ("Priced above the usual range for this area. Open at the area median "
                  "and let the gap do the arguing.")
        suggested = at_median
    elif verdict == "below":
        stance = ("Already below the usual range. Little room to push, and worth moving "
                  "quickly - but check why it is cheap before assuming it is a bargain.")
        suggested = round(price * 0.97)
    else:
        stance = ("Within the usual range. A modest offer is reasonable; there is no "
                  "evidence here for a large discount.")
        suggested = at_p25 or round(price * 0.95)

    current().add_source(f"Area data: {area.get('location')}, {area.get('city')}")
    current().step("offer brief",
                   f"{verdict} the usual range for {area.get('location')}"
                   + (f" ({diff:+d}%)" if diff is not None else ""),
                   tool="offer_brief")

    return json.dumps({
        "have_market_data": True,
        "listing": {"title": listing.get("title"), "asking": price_full(price),
                    "size": listing.get("size"),
                    "price_per_marla": price_words(per_marla)},
        "area": {
            "name": area.get("location"), "city": area.get("city"),
            "median_per_marla": price_words(median),
            "usual_range_per_marla": [price_words(p25), price_words(p75)],
            "based_on_listings": area.get("count"),
            "low_confidence": bool(area.get("lowConfidence")),
            "matched_by": market.get("matchedBy"),
        },
        "verdict": verdict,
        "difference_from_median_pct": diff,
        "suggested_opening_offer": price_full(suggested) if suggested else None,
        "price_at_area_median": price_full(at_median) if at_median else None,
        "stance": stance,
        "supporting_facts": [
            f"Asking {price_words(per_marla)} per marla",
            f"Area median is {price_words(median)} per marla"
            + (f", based on {area.get('count')} listings" if area.get("count") else ""),
            f"Usual range here is {price_words(p25)} to {price_words(p75)} per marla",
        ],
        "caveats": [
            "These are asking-price medians from listing data, not recorded sale prices.",
            "A corner, park-facing or wider-road plot carries a real premium the median "
            "does not capture - inspect before anchoring hard.",
        ] + (["The area sample is small, so treat the median as a hint."]
             if area.get("lowConfidence") else []),
        "instruction": "Give the suggested offer with the supporting facts and the "
                       "caveats. Say it is based on area medians, not a valuation, and "
                       "that you are not a financial adviser.",
    }, default=str)
