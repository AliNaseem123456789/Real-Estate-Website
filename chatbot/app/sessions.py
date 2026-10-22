"""Conversation state, kept in Mongo.

Render's free instance restarts whenever it feels like it, so in-process memory
would lose the thread mid-conversation. Sessions live in the same cluster as
everything else and expire after a week.
"""

import logging
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any

from langchain_core.messages import AIMessage, BaseMessage, HumanMessage
from pymongo import ASCENDING

from .config import settings
from .messages import text_of
from .mongo import sessions_collection

log = logging.getLogger(__name__)

TTL_DAYS = 7
_indexes_ready = False


def _ensure_indexes() -> None:
    global _indexes_ready
    if _indexes_ready:
        return
    try:
        sessions_collection().create_index([("expiresAt", ASCENDING)], expireAfterSeconds=0)
        _indexes_ready = True
    except Exception as error:  # noqa: BLE001
        log.warning("Could not create the session TTL index: %s", error)


def new_id() -> str:
    return uuid.uuid4().hex


def load(session_id: str | None) -> dict[str, Any]:
    """Returns {session_id, history, filters, pending_action}."""
    blank = {"session_id": session_id or new_id(), "history": [], "filters": {},
             "pending_action": None, "recent_listings": []}
    if not session_id:
        return blank

    _ensure_indexes()
    try:
        row = sessions_collection().find_one({"_id": session_id})
    except Exception as error:  # noqa: BLE001 - a lost session is not worth a 500
        log.warning("Could not load session %s: %s", session_id, error)
        return blank
    if not row:
        return blank

    history: list[BaseMessage] = []
    for turn in row.get("messages", [])[-settings.max_history_messages:]:
        content = turn.get("content", "")
        if not content:
            continue
        history.append(
            HumanMessage(content=content) if turn.get("role") == "user"
            else AIMessage(content=content)
        )

    return {
        "session_id": session_id,
        "history": history,
        "filters": row.get("filters", {}) or {},
        "pending_action": row.get("pendingAction"),
        # What the last reply put on screen, so a follow-up like "tell me more
        # about this one" resolves to a listing instead of a guess.
        "recent_listings": row.get("recentListings", []) or [],
    }


def save(session_id: str, user_message: str, reply: str, filters: dict,
         pending_action: dict | None, user_id: str | None = None,
         recent_listings: list[dict] | None = None) -> None:
    _ensure_indexes()
    now = datetime.now(timezone.utc)
    turns = [
        {"role": "user", "content": user_message, "at": now},
        {"role": "assistant", "content": reply, "at": now},
    ]
    try:
        sessions_collection().update_one(
            {"_id": session_id},
            {
                "$push": {"messages": {"$each": turns, "$slice": -settings.max_history_messages * 2}},
                "$set": {
                    "filters": filters,
                    "pendingAction": pending_action,
                    "recentListings": recent_listings or [],
                    "userId": user_id,
                    "updatedAt": now,
                    "expiresAt": now + timedelta(days=TTL_DAYS),
                },
            },
            upsert=True,
        )
    except Exception as error:  # noqa: BLE001
        log.warning("Could not save session %s: %s", session_id, error)


def clear(session_id: str) -> None:
    try:
        sessions_collection().delete_one({"_id": session_id})
    except Exception as error:  # noqa: BLE001
        log.warning("Could not clear session %s: %s", session_id, error)
