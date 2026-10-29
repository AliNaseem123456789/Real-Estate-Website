"""One shared MongoDB client.

The chatbot talks to the same Atlas cluster as the Express API. Reads about
listings go through the Express API (so approval rules and filters stay in one
place); Mongo is used directly only for things the API has no public route for:
the vector index, chat sessions, saved searches and viewing requests.
"""

from functools import lru_cache

from pymongo import MongoClient
from pymongo.collection import Collection
from pymongo.database import Database

from .config import settings


@lru_cache
def get_client() -> MongoClient:
    if not settings.mongo_uri:
        raise RuntimeError("MONGO_URI is not set")
    return MongoClient(settings.mongo_uri, serverSelectionTimeoutMS=15000, tz_aware=True)


def get_db() -> Database:
    return get_client()[settings.mongo_db]


def collection(name: str) -> Collection:
    return get_db()[name]


def vector_collection() -> Collection:
    return collection(settings.vector_collection)


# Collections owned by the Express API, written here only where noted.
def sessions_collection() -> Collection:
    return collection("chat_sessions")


def saved_searches_collection() -> Collection:
    return collection("savedsearches")  # Mongoose pluralises SavedSearch like this


def notifications_collection() -> Collection:
    return collection("notifications")


def viewings_collection() -> Collection:
    return collection("viewing_requests")


def diligence_collection() -> Collection:
    return collection("due_diligence")
