"""Wiring.

    understand -> agent -> tools -> agent ... -> critique -> agent? -> ground -> end

The loop between agent and tools is the multi-step part: search, then enrich each
candidate with a price check or area statistics, then compare. The critique node is
what lets it notice its own bad result and go round again, and the ground node is
the last gate before the user sees anything.
"""

from functools import lru_cache

from langchain_core.messages import AIMessage, BaseMessage, HumanMessage
from langgraph.graph import END, StateGraph
from langgraph.prebuilt import ToolNode

from ..config import settings
from ..messages import text_of
from ..tools import ALL_TOOLS
from . import nodes
from .state import AgentState


@lru_cache
def build_graph():
    graph = StateGraph(AgentState)

    graph.add_node("understand", nodes.understand)
    graph.add_node("agent", nodes.agent)
    graph.add_node("chat", nodes.chat)
    graph.add_node("finalize", nodes.finalize)
    graph.add_node("tools", ToolNode(ALL_TOOLS))
    graph.add_node("critique", nodes.critique)
    graph.add_node("ground", nodes.ground)

    graph.set_entry_point("understand")
    # A greeting skips the tools entirely: one model call instead of a search.
    graph.add_conditional_edges("understand", nodes.route_after_understand,
                                {"chat": "chat", "agent": "agent"})
    graph.add_edge("chat", END)
    graph.add_conditional_edges("agent", nodes.route_after_agent,
                                {"tools": "tools", "critique": "critique"})
    # After tools, either another agent call or - if the budget is spent - a cheap
    # tool-free finish, so a turn can never cost more than MAX_TOOL_LOOPS calls
    # to the expensive model.
    graph.add_conditional_edges("tools", nodes.route_after_tools,
                                {"agent": "agent", "finalize": "finalize"})
    graph.add_edge("finalize", "ground")
    graph.add_conditional_edges("critique", nodes.route_after_critique,
                                {"agent": "agent", "ground": "ground"})
    graph.add_edge("ground", END)

    return graph.compile()


def run_agent(message: str, history: list[BaseMessage], filters: dict,
              language: str = "en",
              recent_listings: list[dict] | None = None) -> tuple[str, dict]:
    """Run one turn. Returns the reply and the filters to carry into the next one."""
    state: AgentState = {
        "messages": [*history[-settings.max_history_messages:], HumanMessage(content=message)],
        "filters": filters or {},
        "language": language,
        "refines": 0,
        "agent_calls": 0,
        "recent_listings": recent_listings or [],
    }

    result = build_graph().invoke(state, {"recursion_limit": 25})

    reply = ""
    for item in reversed(result["messages"]):
        if isinstance(item, AIMessage) and not item.tool_calls and text_of(item):
            reply = text_of(item)
            break

    return reply or "Sorry, I could not work that out. Could you rephrase?", result.get("filters", {})
