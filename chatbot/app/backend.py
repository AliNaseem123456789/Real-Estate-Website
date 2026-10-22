"""HTTP client for the existing Express API."""

import logging
from typing import Any

import httpx

from .config import settings

log = logging.getLogger(__name__)


class BackendError(RuntimeError):
    def __init__(self, message: str, status: int | None = None):
        super().__init__(message)
        self.status = status


def _client() -> httpx.Client:
    return httpx.Client(base_url=settings.backend_url.rstrip("/"), timeout=25)


def get(path: str, params: dict[str, Any] | None = None) -> Any:
    clean = {k: v for k, v in (params or {}).items() if v not in (None, "", [])}
    try:
        with _client() as client:
            response = client.get(path, params=clean)
            response.raise_for_status()
            return response.json()
    except httpx.HTTPStatusError as error:
        message = error.response.text[:200]
        raise BackendError(f"{path} returned {error.response.status_code}: {message}",
                           error.response.status_code) from error
    except httpx.HTTPError as error:
        raise BackendError(f"Could not reach the website API at {path}: {error}") from error


def post(path: str, payload: dict[str, Any]) -> Any:
    try:
        with _client() as client:
            response = client.post(path, json=payload)
            response.raise_for_status()
            return response.json()
    except httpx.HTTPStatusError as error:
        detail = ""
        try:
            detail = error.response.json().get("message", "")
        except Exception:  # noqa: BLE001
            detail = error.response.text[:200]
        raise BackendError(detail or f"{path} returned {error.response.status_code}",
                           error.response.status_code) from error
    except httpx.HTTPError as error:
        raise BackendError(f"Could not reach the website API at {path}: {error}") from error
