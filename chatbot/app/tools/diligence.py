"""Due diligence: a checklist that survives the conversation.

Buying property in Pakistan turns on paperwork, and the common way to lose money
is to pay before the title is verified. This is the one workflow here that is
genuinely stateful: the checklist lives in Mongo, so a buyer can come back
tomorrow, say "I got the fard", and pick up where they left off.

The valuable part is not the list - it is the cross-check. When the buyer reports
what a document says, the figures are compared against the listing, and a
mismatch becomes a recorded finding rather than something they notice after
paying. A deed saying 8 marla against a listing advertising 10 is exactly the
discrepancy this is for.

These tools write only the user's own checklist, so unlike request_viewing they
do not need a confirmation gate: nothing reaches a third party.
"""

import json
import re
from datetime import datetime, timezone

from langchain_core.tools import tool

from ..backend import BackendError, get
from ..collect import current
from ..format import SQFT_PER_UNIT
from ..mongo import diligence_collection

# Items every purchase needs, whatever the property is.
BASE_ITEMS = [
    ("title", "Title document - fard malkiat and mutation history, or the allotment "
              "and transfer letter in the current owner's name"),
    ("owner_cnic", "CNIC copies of every owner on the title, plus a registered power "
                   "of attorney if someone signs on their behalf"),
    ("noc", "NOC from the society or authority confirming the property is "
            "transferable with no outstanding dues"),
    ("encumbrance", "Non-encumbrance certificate - not mortgaged, not under a court order"),
    ("dues", "Paid utility bills and society dues, most recent, in the seller's name"),
    ("scheme_approval", "Confirmation that the society or scheme itself is approved by "
                        "the development authority"),
    ("possession", "Physical check: plot number, dimensions and location match the "
                   "documents on site"),
]

# Extra items that depend on what is being bought.
BUILT_ITEMS = [
    ("building_plan", "Approved building plan stamped by the development authority"),
    ("completion", "Completion or occupancy certificate, where the society issues one"),
]
PLOT_ITEMS = [
    ("demarcation", "Demarcation by the society, so the plot on the ground is the plot "
                    "on paper"),
    ("land_use", "Land-use conversion, if the land was agricultural"),
]

STATUSES = ("missing", "provided", "flagged", "not_applicable")


def _items_for(property_type: str | None) -> list[dict]:
    extra = PLOT_ITEMS if (property_type or "").lower() == "plot" else BUILT_ITEMS
    return [{"key": key, "label": label, "status": "missing", "note": ""}
            for key, label in (*BASE_ITEMS, *extra)]


def _owner_key(record_id: str) -> dict:
    context = current()
    return {"owner": context.user_id or context.session_id or "anonymous",
            "property": record_id}


def _load(property_id: str) -> dict | None:
    return diligence_collection().find_one(_owner_key(property_id))


def _save(record: dict) -> None:
    record["updatedAt"] = datetime.now(timezone.utc)
    diligence_collection().replace_one(_owner_key(record["property"]), record, upsert=True)


def _summary(record: dict) -> dict:
    items = record.get("items", [])
    live = [i for i in items if i["status"] != "not_applicable"]
    done = [i for i in live if i["status"] == "provided"]
    return {
        "property": record.get("propertyTitle"),
        "property_id": record.get("property"),
        "checked": len(done),
        "total": len(live),
        "percent_complete": round(100 * len(done) / len(live)) if live else 0,
        "still_missing": [i["label"] for i in live if i["status"] == "missing"],
        "flagged": [{"item": i["label"], "note": i["note"]}
                    for i in items if i["status"] == "flagged"],
        "findings": record.get("findings", []),
    }


@tool("start_due_diligence")
def start_due_diligence(property_id: str) -> str:
    """Begin (or reopen) the document checklist for a property. Builds the list
    appropriate to a house, flat or plot. Use when the user is serious about one
    property and asks what to check, what documents to ask for, or how to verify it."""
    try:
        row = get(f"/properties/{property_id}")
    except BackendError as error:
        return json.dumps({"error": str(error)})

    existing = _load(property_id)
    if existing:
        current().step("due diligence", "Reopened the existing checklist",
                       tool="start_due_diligence")
        return json.dumps({"resumed": True, **_summary(existing)}, default=str)

    record = {
        **_owner_key(property_id),
        "propertyTitle": row.get("title"),
        "propertyType": row.get("type"),
        "listing": {
            "areaSqft": row.get("areaSqft"),
            "address": row.get("address"),
            "city": row.get("city"),
            "seller": row.get("publisher_name"),
            "size": row.get("size"),
        },
        "items": _items_for(row.get("type")),
        "findings": [],
        "createdAt": datetime.now(timezone.utc),
    }
    _save(record)
    current().step("due diligence",
                   f"Opened a {len(record['items'])}-point checklist for {row.get('title')}",
                   tool="start_due_diligence")
    return json.dumps({"resumed": False, **_summary(record)}, default=str)


@tool("record_document")
def record_document(property_id: str, item_key: str, status: str, note: str = "") -> str:
    """Mark one checklist item. item_key is the key from the checklist (title,
    owner_cnic, noc, encumbrance, dues, scheme_approval, possession, building_plan,
    completion, demarcation, land_use). status is provided, missing, flagged or
    not_applicable. Use flagged when the document exists but something is wrong."""
    if status not in STATUSES:
        return json.dumps({"error": f"status must be one of {list(STATUSES)}"})

    record = _load(property_id)
    if not record:
        return json.dumps({"error": "No checklist yet - call start_due_diligence first"})

    for item in record["items"]:
        if item["key"] == item_key:
            item["status"] = status
            item["note"] = note[:300]
            break
    else:
        return json.dumps({"error": f"Unknown item_key {item_key!r}",
                           "valid": [i["key"] for i in record["items"]]})

    if status == "flagged" and note:
        record.setdefault("findings", []).append(
            {"kind": "document_concern", "detail": note[:300], "severity": "medium",
             "at": datetime.now(timezone.utc)})

    _save(record)
    current().step("due diligence", f"{item_key} marked {status}", tool="record_document")
    return json.dumps(_summary(record), default=str)


def _words(text: str) -> set[str]:
    return {w for w in re.split(r"[^a-z0-9]+", (text or "").lower()) if len(w) > 2}


@tool("check_document_against_listing")
def check_document_against_listing(property_id: str, size_marla: float | None = None,
                                   owner_name: str = "", address: str = "") -> str:
    """Compare what a document actually says against what the listing claims, and
    record any mismatch. Pass whatever the user read off the deed or transfer letter:
    the size in marla, the owner's name, the address. Use this whenever the user
    reports document contents - a deed showing a different size or a different owner
    is the discrepancy that matters most."""
    record = _load(property_id)
    if not record:
        return json.dumps({"error": "No checklist yet - call start_due_diligence first"})

    listing = record.get("listing", {})
    checks: list[dict] = []

    if size_marla and listing.get("areaSqft"):
        listed = listing["areaSqft"] / SQFT_PER_UNIT["marla"]
        gap = abs(listed - float(size_marla)) / listed * 100 if listed else 0
        ok = gap <= 5
        checks.append({
            "field": "size",
            "document_says": f"{size_marla} marla",
            "listing_says": f"{round(listed, 2)} marla",
            "difference_pct": round(gap),
            "match": ok,
        })
        if not ok:
            record.setdefault("findings", []).append({
                "kind": "size_mismatch",
                "detail": (f"Document says {size_marla} marla; the listing advertises "
                           f"{round(listed, 2)} marla ({round(gap)}% apart)"),
                "severity": "high", "at": datetime.now(timezone.utc)})

    if owner_name and listing.get("seller"):
        shared = _words(owner_name) & _words(listing["seller"])
        ok = bool(shared)
        checks.append({"field": "owner", "document_says": owner_name,
                       "listing_says": listing["seller"], "match": ok})
        if not ok:
            record.setdefault("findings", []).append({
                "kind": "owner_mismatch",
                "detail": (f"Title is in the name of {owner_name}, but the listing was "
                           f"posted by {listing['seller']}. Ask how they are related and "
                           "for a registered power of attorney if they are not the owner."),
                "severity": "high", "at": datetime.now(timezone.utc)})

    if address and listing.get("address"):
        shared = _words(address) & _words(listing["address"])
        ok = len(shared) >= 2
        checks.append({"field": "address", "document_says": address,
                       "listing_says": listing["address"], "match": ok})
        if not ok:
            record.setdefault("findings", []).append({
                "kind": "address_mismatch",
                "detail": f"Document address {address!r} does not clearly match the listing",
                "severity": "medium", "at": datetime.now(timezone.utc)})

    if not checks:
        return json.dumps({"error": "Nothing to compare - pass a size, owner name or address"})

    _save(record)
    mismatches = [c["field"] for c in checks if not c["match"]]
    current().step("cross-check",
                   "all match" if not mismatches else f"mismatch on {', '.join(mismatches)}",
                   tool="check_document_against_listing")
    return json.dumps({"checks": checks, "mismatches": mismatches,
                       "summary": _summary(record)}, default=str)


@tool("due_diligence_report")
def due_diligence_report(property_id: str) -> str:
    """Where the checklist stands: how much is done, what is still missing, and any
    mismatches recorded. Use when the user asks what is left or wants a summary."""
    record = _load(property_id)
    if not record:
        return json.dumps({"started": False,
                           "note": "No checklist for this property yet."})
    current().step("due diligence", "Read back the checklist", tool="due_diligence_report")
    return json.dumps({"started": True, **_summary(record)}, default=str)
