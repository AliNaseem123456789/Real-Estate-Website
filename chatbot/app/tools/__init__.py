"""The agent's tool belt.

Most of it wraps endpoints the Express API already exposes, so the filtering,
approval and pagination rules stay in one place and the agent cannot drift from
what the website itself shows.
"""

from langchain_core.tools import BaseTool

from .actions import create_price_alert, request_viewing
from .diligence import (
    check_document_against_listing,
    due_diligence_report,
    record_document,
    start_due_diligence,
)
from .offer import offer_brief
from .finance import affordability, convert_area, monthly_payment
from .knowledge import listing_similar_to, neighbourhood_knowledge
from .market import area_overview, price_check
from .properties import compare_properties, get_property, list_cities, search_properties

READ_TOOLS: list[BaseTool] = [
    search_properties,
    get_property,
    compare_properties,
    list_cities,
    price_check,
    area_overview,
    neighbourhood_knowledge,
    listing_similar_to,
    monthly_payment,
    affordability,
    convert_area,
    offer_brief,
    start_due_diligence,
    record_document,
    check_document_against_listing,
    due_diligence_report,
]

# Tools with a side effect. They never act straight away: they return a summary
# and wait for the user to confirm on the next turn.
WRITE_TOOLS: list[BaseTool] = [
    request_viewing,
    create_price_alert,
]

ALL_TOOLS: list[BaseTool] = READ_TOOLS + WRITE_TOOLS

# Every tool schema is resent on every call, and 13 of them is about 2,800
# tokens before the conversation even starts - most of a free-tier per-minute
# token budget spent describing tools the question does not need. So each intent
# gets only the tools it plausibly uses.
_CORE: list[BaseTool] = [search_properties, get_property]

_DILIGENCE = [start_due_diligence, record_document, check_document_against_listing,
              due_diligence_report]

BY_INTENT: dict[str, list[BaseTool]] = {
    "search": [*_CORE, list_cities, listing_similar_to, price_check],
    "compare": [*_CORE, compare_properties, price_check],
    "price_opinion": [*_CORE, price_check, area_overview],
    "area_info": [*_CORE, area_overview, neighbourhood_knowledge],
    "paperwork": [neighbourhood_knowledge, *_DILIGENCE],
    "due_diligence": [*_CORE, *_DILIGENCE, neighbourhood_knowledge],
    "offer": [*_CORE, offer_brief, price_check, area_overview],
    "finance": [*_CORE, monthly_payment, affordability, convert_area],
    "book_viewing": [*_CORE, request_viewing],
    "alert": [*_CORE, create_price_alert],
}


def tools_for_intent(intent: str | None) -> list[BaseTool]:
    """The tools to bind for this turn. Unknown intent gets everything."""
    from ..config import settings

    if not settings.scope_tools_by_intent:
        return ALL_TOOLS
    return BY_INTENT.get((intent or "").strip().lower(), ALL_TOOLS)


__all__ = ["ALL_TOOLS", "READ_TOOLS", "WRITE_TOOLS", "BY_INTENT", "tools_for_intent"]
