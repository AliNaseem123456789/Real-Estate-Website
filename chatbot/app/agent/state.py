"""What the graph carries between nodes."""

from typing import Annotated, Any, TypedDict

from langchain_core.messages import BaseMessage
from langgraph.graph.message import add_messages


class AgentState(TypedDict, total=False):
    messages: Annotated[list[BaseMessage], add_messages]

    # Search filters understood so far. They survive between turns, which is what
    # makes "what about 4 beds?" edit the last search instead of starting over.
    filters: dict[str, Any]
    intent: str
    language: str

    # [{"id": ..., "title": ...}] from the previous reply, so "this property"
    # and "the second one" resolve to a real listing instead of a guess.
    recent_listings: list[dict]

    # How many times the agent has been sent back to try again this turn.
    refines: int
    # Calls to the expensive model this turn. This is the budget that matters:
    # counting tool results instead let the critique node add calls outside it.
    agent_calls: int
    # Set when the groundedness check has already rewritten the answer once.
    regrounded: bool
