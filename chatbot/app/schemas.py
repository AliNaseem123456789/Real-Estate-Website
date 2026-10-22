"""Request and response bodies for the HTTP API."""

from typing import Any, Literal

from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    session_id: str | None = None
    # The signed-in user from the website, when there is one. Saved searches and
    # enquiries are attributed to them.
    user_id: str | None = None
    language: Literal["en", "ur"] = "en"
    # True when the user is answering a confirmation question ("yes, book it").
    confirm: bool = False


class PropertyCard(BaseModel):
    """Trimmed listing, shaped for the chat bubble cards in the React client."""

    id: str
    title: str
    city: str
    price: float
    action: str
    type: str | None = None
    size: str | None = None
    bedroom: int | None = None
    bathroom: int | None = None
    image: str | None = None
    url: str


class PendingAction(BaseModel):
    """An action the agent wants to take that needs the user to say yes first."""

    kind: Literal["submit_enquiry", "request_viewing", "create_saved_search"]
    summary: str
    payload: dict[str, Any]


class TraceStep(BaseModel):
    """One step of the agent's work, shown in the UI so the loop is visible."""

    step: str
    detail: str
    tool: str | None = None


class ChatResponse(BaseModel):
    session_id: str
    reply: str
    properties: list[PropertyCard] = []
    pending_action: PendingAction | None = None
    trace: list[TraceStep] = []
    sources: list[str] = []
    filters: dict[str, Any] = {}
