"""Tools that change something.

Nothing here acts on the first call. Each one describes what it is about to do,
registers it as a pending action, and the API asks the user to confirm. Only when
the next message arrives with confirm=true does the write actually happen. That
gate is deliberate: an agent with write access to a marketplace should not be able
to message a seller because it misread a sentence.
"""

import json
from datetime import datetime, timezone

from bson import ObjectId
from langchain_core.tools import tool

from ..backend import BackendError, post
from ..collect import current
from ..config import settings
from ..mongo import saved_searches_collection, viewings_collection
from ..schemas import PendingAction

ALLOWED_FILTERS = ("action", "type", "city", "minPrice", "maxPrice", "bedrooms", "bathrooms",
                   "minArea")


@tool("request_viewing")
def request_viewing(property_id: str, preferred_time: str, message: str = "",
                    visitor_name: str = "") -> str:
    """Ask to view a property. Collect the preferred day and time first. Sends
    nothing immediately: the user confirms, and it goes on the next turn."""
    context = current()

    if not context.confirmed:
        listing = context.seen_properties.get(property_id, {})
        label = listing.get("title", f"listing {property_id}")
        summary = f"Send a viewing request for {label}, preferred time: {preferred_time}"
        context.pending_action = PendingAction(
            kind="request_viewing",
            summary=summary,
            payload={
                "property_id": property_id,
                "preferred_time": preferred_time,
                "message": message,
                "visitor_name": visitor_name or "Website visitor",
            },
        )
        context.step("awaiting confirmation", summary, tool="request_viewing")
        return json.dumps(
            {
                "status": "needs_confirmation",
                "summary": summary,
                "instruction": "Tell the user exactly what will be sent and ask them to confirm. "
                               "Do not claim it has been sent.",
            }
        )

    return json.dumps(_send_viewing(
        property_id=property_id,
        preferred_time=preferred_time,
        message=message,
        visitor_name=visitor_name or "Website visitor",
    ))


def _send_viewing(property_id: str, preferred_time: str, message: str, visitor_name: str) -> dict:
    """Send through the website's enquiry endpoint, falling back to a stored request.

    Listings imported from the scraped dataset have no owner account, and the
    enquiry endpoint rejects those. Rather than failing, the request is recorded
    for the admin to pick up.
    """
    body = f"Viewing request for {preferred_time}."
    if message:
        body += f"\n\n{message}"
    body += "\n\n(Sent by the website assistant on behalf of a visitor.)"

    try:
        post(
            "/enquiries",
            {
                "propertyId": property_id,
                "name": visitor_name,
                "email": settings.safe_contact_email,
                "phone": settings.safe_contact_phone,
                "message": body,
            },
        )
        current().step("sent", "Viewing request delivered to the seller's dashboard",
                       tool="request_viewing")
        return {"status": "sent", "channel": "seller dashboard and notification"}
    except BackendError as error:
        # 400 here means the listing has no linked seller account
        if error.status != 400:
            return {"status": "failed", "error": str(error)}

    try:
        viewings_collection().insert_one(
            {
                "property": ObjectId(property_id) if ObjectId.is_valid(property_id) else property_id,
                "preferredTime": preferred_time,
                "name": visitor_name,
                "phone": settings.safe_contact_phone,
                "email": settings.safe_contact_email,
                "message": body,
                "source": "chatbot",
                "handled": False,
                "createdAt": datetime.now(timezone.utc),
            }
        )
    except Exception as error:  # noqa: BLE001
        return {"status": "failed", "error": f"Could not record the request: {error}"}

    current().step("recorded", "Listing has no seller account; request saved for the admin",
                   tool="request_viewing")
    return {
        "status": "recorded",
        "note": "This listing has no seller account linked, so the request was saved for the "
                "site admin instead of being sent to a seller. Tell the user that, and give "
                "them the contact number on the listing as well.",
    }


@tool("create_price_alert")
def create_price_alert(city: str | None = None, purpose: str | None = None,
                       max_price: float | None = None, bedrooms: int | None = None,
                       property_type: str | None = None) -> str:
    """Alert the user when a matching listing appears or a saved one drops in
    price. Needs sign-in. Waits for confirmation."""
    context = current()

    if not context.user_id:
        return json.dumps(
            {
                "status": "not_signed_in",
                "instruction": "Tell the user alerts need an account, and that they can sign in "
                               "on the website and ask again.",
            }
        )

    filters = {
        "city": city,
        "action": purpose,
        "maxPrice": max_price,
        "bedrooms": bedrooms,
        "type": property_type,
    }
    filters = {k: str(v) for k, v in filters.items() if v not in (None, "")}
    if not filters:
        return json.dumps({"status": "no_filters",
                           "instruction": "Ask what the alert should watch for first."})

    readable = ", ".join(f"{k}={v}" for k, v in filters.items())
    if not context.confirmed:
        summary = f"Create an alert for {readable}"
        context.pending_action = PendingAction(
            kind="create_saved_search", summary=summary, payload={"filters": filters}
        )
        context.step("awaiting confirmation", summary, tool="create_price_alert")
        return json.dumps({"status": "needs_confirmation", "summary": summary,
                           "instruction": "Ask the user to confirm. Do not say it is saved yet."})

    return json.dumps(_save_search(context.user_id, filters))


def _save_search(user_id: str, filters: dict) -> dict:
    """Write straight into the savedsearches collection the Express API reads.

    The website's own route needs the login cookie, which this service does not
    have, so it writes the same document shape instead. The ten-alert cap from
    notification.controller.js is enforced here too.
    """
    if not ObjectId.is_valid(user_id):
        return {"status": "failed", "error": "Not a valid user id"}

    collection = saved_searches_collection()
    owner = ObjectId(user_id)
    if collection.count_documents({"user": owner}) >= 10:
        return {"status": "limit_reached",
                "instruction": "Tell the user they already have 10 alerts and need to delete one "
                               "in their dashboard."}

    now = datetime.now(timezone.utc)
    collection.insert_one({"user": owner, "filters": filters, "createdAt": now, "updatedAt": now,
                           "__v": 0})
    current().step("saved", f"Alert created for {filters}", tool="create_price_alert")
    return {"status": "created", "filters": filters,
            "note": "The bell icon on the website will show new matches."}
