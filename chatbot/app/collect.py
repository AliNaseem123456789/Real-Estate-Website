"""Per-request side channel.

Tools need to hand the UI more than the model sees: listing cards, citations, a
pending action awaiting confirmation. Threading that through LangChain's tool
signatures would be ugly, so each request puts a RunContext in a contextvar and
the tools append to it.
"""

from contextlib import contextmanager
from contextvars import ContextVar
from dataclasses import dataclass, field
from typing import Any

from .schemas import PendingAction, PropertyCard, TraceStep


@dataclass
class RunContext:
    user_id: str | None = None
    language: str = "en"
    confirmed: bool = False
    cards: list[PropertyCard] = field(default_factory=list)
    sources: list[str] = field(default_factory=list)
    trace: list[TraceStep] = field(default_factory=list)
    pending_action: PendingAction | None = None
    # Listings the agent has actually seen this turn, so the groundedness check
    # can tell a real price from an invented one.
    seen_properties: dict[str, dict[str, Any]] = field(default_factory=dict)

    def add_card(self, card: PropertyCard) -> None:
        if all(existing.id != card.id for existing in self.cards):
            self.cards.append(card)

    def add_source(self, source: str) -> None:
        if source and source not in self.sources:
            self.sources.append(source)

    def step(self, step: str, detail: str, tool: str | None = None) -> None:
        self.trace.append(TraceStep(step=step, detail=detail, tool=tool))


_current: ContextVar[RunContext | None] = ContextVar("run_context", default=None)


def current() -> RunContext:
    context = _current.get()
    if context is None:  # tools called outside a request (tests, scripts)
        context = RunContext()
        _current.set(context)
    return context


@contextmanager
def run_context(context: RunContext):
    token = _current.set(context)
    try:
        yield context
    finally:
        _current.reset(token)
