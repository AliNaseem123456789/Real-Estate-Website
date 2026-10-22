"""The graph's nodes."""

import json
import logging
import re

from langchain_core.messages import AIMessage, HumanMessage, SystemMessage, ToolMessage

from ..collect import current
from ..messages import text_of
from ..pacing import get_pacer
from ..config import settings
from ..llm import get_agent_model, get_fast_model, get_reasoner
from ..tools import tools_for_intent
from . import prompts
from .state import AgentState

log = logging.getLogger(__name__)

SEARCH_INTENTS = {"search", "compare", "price_opinion", "area_info"}

# Intents that need no tools at all: one model call and done.
CHAT_INTENTS = {"smalltalk"}

# Used only when the fast model gives no intent back. A short message with none
# of these words is treated as conversation rather than a property search, which
# is what stops "hi" from running a search with the last turn's filters.
PROPERTY_WORDS = (
    "rent", "buy", "sale", "sell", "house", "home", "plot", "flat", "apartment",
    "shop", "office", "commercial", "marla", "kanal", "price", "lakh", "crore",
    "bed", "bath", "property", "budget", "cheap", "afford", "area", "society",
    "installment", "instalment", "emi", "loan", "viewing", "visit", "alert",
    "گھر", "کرایہ", "قیمت", "مرلہ", "کنال", "پلاٹ", "فلیٹ",
)

# Older tool results are trimmed before being resent. Without this, every search
# in a turn keeps its full JSON in the history and goes back to Gemini on each
# following call, so the context - and the latency - grows with every loop.
KEEP_FULL_TOOL_RESULTS = 1
TRIMMED_TOOL_CHARS = 200
TRUNCATION_NOTE = " ...(truncated to fit the token budget)"


# --------------------------------------------------------------------- helpers
def _json_from(text: str) -> dict:
    """Pull the first JSON object out of a model reply."""
    match = re.search(r"\{.*\}", text, re.S)
    if not match:
        return {}
    try:
        return json.loads(match.group(0))
    except json.JSONDecodeError:
        return {}


def _tool_outputs(messages: list) -> list[str]:
    return [str(m.content) for m in messages if isinstance(m, ToolMessage)]


def _looks_like_property_talk(message: str) -> bool:
    lowered = message.lower()
    return any(word in lowered for word in PROPERTY_WORDS)


def _estimate_tokens(text: str) -> int:
    """Rough token count. Four characters per token is close enough to budget by."""
    return len(text) // 4


# Output tokens count towards the per-minute budget too, and are not known until
# the reply arrives, so each call reserves a little extra for them.
OUTPUT_ALLOWANCE = 500


def _reserve(messages: list, overhead: int = 0) -> None:
    """Wait for per-minute token room before calling a model."""
    pacer = get_pacer()
    if pacer is None:
        return
    estimate = overhead + OUTPUT_ALLOWANCE + sum(
        _estimate_tokens(str(message.content)) for message in messages
    )
    pacer.reserve(estimate)


def _fit_budget(messages: list, overhead: int) -> list:
    """Drop the oldest exchanges until the request fits the token budget.

    Groq rejects a single request over the per-minute token limit outright, so
    trimming has to happen before the call, not after a 413.
    """
    budget = max(500, settings.max_prompt_tokens - overhead)
    kept = list(messages)

    def size(items: list) -> int:
        return sum(_estimate_tokens(str(m.content)) for m in items)

    while size(kept) > budget and len(kept) > 2:
        dropped = kept.pop(0)
        # An AIMessage's tool calls and their responses must leave together, or
        # the exchange no longer pairs up and the API rejects it.
        if isinstance(dropped, AIMessage) and dropped.tool_calls:
            while kept and isinstance(kept[0], ToolMessage):
                kept.pop(0)

    if len(kept) < len(messages):
        log.info("Trimmed %d old messages to fit the %d token budget",
                 len(messages) - len(kept), budget)

    # Dropping messages stops at the last exchange, so a single enormous tool
    # result can still be over budget. Truncate its content rather than send a
    # request the API will refuse.
    if size(kept) > budget:
        over = size(kept) - budget
        for index in range(len(kept) - 1, -1, -1):
            if over <= 0:
                break
            message = kept[index]
            if not isinstance(message, ToolMessage):
                continue
            content = str(message.content)
            # The note itself costs tokens, so subtract it or the result lands
            # just over the budget.
            allowed = max(200, len(content) - (over * 4) - len(TRUNCATION_NOTE))
            if allowed >= len(content):
                continue
            kept[index] = ToolMessage(
                content=content[:allowed] + TRUNCATION_NOTE,
                tool_call_id=message.tool_call_id,
                name=getattr(message, "name", None),
            )
            over = size(kept) - budget
            log.info("Truncated a tool result to fit the budget")

    return kept


def _compress(messages: list) -> list:
    """Keep the last few tool results in full and trim the rest.

    The ToolMessages stay in place rather than being dropped: Gemini requires
    every tool call to have a matching response, so removing one breaks the
    exchange. Only the content shrinks.
    """
    positions = [i for i, m in enumerate(messages) if isinstance(m, ToolMessage)]
    if len(positions) <= KEEP_FULL_TOOL_RESULTS:
        return messages

    keep = set(positions[-KEEP_FULL_TOOL_RESULTS:])
    out = []
    for index, message in enumerate(messages):
        content = str(message.content)
        if isinstance(message, ToolMessage) and index not in keep and len(content) > TRIMMED_TOOL_CHARS:
            out.append(
                ToolMessage(
                    content=content[:TRIMMED_TOOL_CHARS] + " ...(earlier result trimmed)",
                    tool_call_id=message.tool_call_id,
                    name=getattr(message, "name", None),
                )
            )
        else:
            out.append(message)
    return out


def _last_human(messages: list) -> str:
    for message in reversed(messages):
        if isinstance(message, HumanMessage):
            return text_of(message)
    return ""


# ------------------------------------------------------------------- understand
def understand(state: AgentState) -> dict:
    """Cheap model turns the message into filters, merged with what we already knew.

    This is the bit that makes follow-ups work: the filters live in the session, so
    "what about 4 beds?" edits the previous search rather than starting a new one.
    """
    message = _last_human(state["messages"])
    known = state.get("filters", {}) or {}

    try:
        instruction = HumanMessage(content=prompts.UNDERSTAND.format(
            filters=json.dumps(known), message=message))
        _reserve([instruction])
        reply = get_fast_model().invoke([instruction])
        parsed = _json_from(str(reply.content))
    except Exception as error:  # noqa: BLE001 - never fail the turn on slot extraction
        log.warning("Slot extraction failed, carrying filters forward: %s", error)
        parsed = {}

    intent = str(parsed.pop("intent", "") or "").strip().lower()
    reset = bool(parsed.pop("reset", False))

    filters = {} if reset else dict(known)
    for key, value in parsed.items():
        if value not in (None, "", []):
            filters[key] = value

    # No intent came back: decide from the message itself rather than defaulting
    # to a search, which is what made "hi" re-run the previous query.
    if not intent:
        new_criteria = any(value not in (None, "", []) for value in parsed.values())
        intent = "search" if (new_criteria or _looks_like_property_talk(message)) else "smalltalk"

    context = current()
    if filters:
        readable = ", ".join(f"{k}: {v}" for k, v in filters.items())
        context.step("understood", f"{intent} - {readable}")
    else:
        context.step("understood", intent)

    return {"filters": filters, "intent": intent}


# ------------------------------------------------------------------------ agent
def agent(state: AgentState) -> dict:
    """Gemini with the tools bound. Decides what to call, or writes the answer."""
    # Only the tools this intent needs: 13 schemas is ~2,800 tokens on every
    # call, which on a free tier is most of a minute's budget spent describing
    # tools the question will not use.
    tools = tools_for_intent(state.get("intent"))
    model = get_agent_model(tools)

    filters = state.get("filters", {})
    preamble = prompts.SYSTEM
    if filters and state.get("intent") not in CHAT_INTENTS:
        preamble += (
            "\n\nCRITERIA UNDERSTOOD SO FAR (pass these to search_properties unless the "
            f"user changed them): {json.dumps(filters)}"
        )

    # So that "this property", "the second one" or "the DHA house" resolve to a
    # real id instead of the model guessing from its own previous prose.
    recent = state.get("recent_listings") or []
    if recent:
        listed = "; ".join(f"{item.get('id')} = {item.get('title')}" for item in recent[:6])
        preamble += (
            "\n\nLISTINGS YOU SHOWED IN YOUR LAST REPLY, in the order shown. When the user "
            "refers to one of them without naming it, this is what they mean - call "
            f"get_property with the id: {listed}"
        )
    if state.get("language") == "ur":
        preamble += "\n\nThe user is reading the Urdu version of the site. Reply in Urdu."
    if current().confirmed:
        preamble += (
            "\n\nThe user has just confirmed the action you proposed. Call the same tool "
            "again to carry it out, then report what happened."
        )

    # The schemas and the system prompt are fixed overhead; history gets the rest.
    overhead = _estimate_tokens(preamble) + sum(
        _estimate_tokens(str(tool.args_schema.model_json_schema())) + _estimate_tokens(tool.description)
        for tool in tools
    )
    history = _fit_budget(_compress(state["messages"]), overhead)

    log.info("agent call: %d tools, ~%d tokens (%d overhead + %d history)",
             len(tools), overhead + sum(_estimate_tokens(str(m.content)) for m in history),
             overhead, sum(_estimate_tokens(str(m.content)) for m in history))

    _reserve(history, overhead)
    response = model.invoke([SystemMessage(content=preamble), *history])
    return {"messages": [response], "agent_calls": state.get("agent_calls", 0) + 1}


def chat(state: AgentState) -> dict:
    """Greetings and small talk: one call, no tools, no retrieval, no filters."""
    preamble = prompts.CHAT
    if state.get("language") == "ur":
        preamble += "\n\nThe user is reading the Urdu version of the site. Reply in Urdu."

    current().step("answered", "Conversational message - no search needed")
    # The cheap model: a greeting is not worth a request from the small daily quota.
    recent = state["messages"][-4:]
    _reserve([SystemMessage(content=preamble), *recent])
    response = get_fast_model(temperature=0.4).invoke(
        [SystemMessage(content=preamble), *recent]
    )
    return {"messages": [response]}


def finalize(state: AgentState) -> dict:
    """Write the answer from what the tools already returned.

    Reached when the agent has used its call budget but still wants more tools.
    No tools are bound, so there are no schemas in the prompt and nothing more
    can be requested: the model has to answer with what is in hand. It is the
    cheapest call of the turn and it guarantees the user gets prose rather than
    an abandoned tool call.
    """
    outputs = _tool_outputs(state["messages"])
    facts = "\n\n".join(outputs)[:4000]
    question = _last_human(state["messages"])

    instruction = HumanMessage(content=prompts.FINALIZE.format(question=question, facts=facts))
    current().step("wrapping up", "Answering with what the searches already returned")
    _reserve([instruction])
    response = get_fast_model(temperature=0.2).invoke(
        [SystemMessage(content=prompts.SYSTEM), instruction]
    )
    return {"messages": [response]}


# --------------------------------------------------------------------- critique
def critique(state: AgentState) -> dict:
    """The agent's look at its own results before it commits to an answer."""
    if state.get("refines", 0) >= 1:
        return {}
    # A refine is another expensive call, so it comes out of the same budget
    # rather than being free on top of it.
    if state.get("agent_calls", 0) >= settings.max_tool_loops:
        return {}
    if state.get("intent") not in SEARCH_INTENTS:
        return {}

    outputs = _tool_outputs(state["messages"])
    if not outputs:
        # It answered a listings question without searching at all.
        if state.get("intent") == "search":
            current().step("self-check", "Answered without searching; going back to the tools")
            return {
                "messages": [HumanMessage(content=prompts.CRITIQUE.format(
                    question=_last_human(state["messages"]),
                    filters=json.dumps(state.get("filters", {})),
                    summary="No tools were called.",
                ))],
                "refines": 1,
            }
        return {}

    joined = " ".join(outputs)
    empty = ('"total_matches": 0' in joined or '"results": []' in joined
             or '"found": false' in joined.lower())
    if not empty:
        return {}

    current().step("self-check", "Nothing matched; retrying with looser criteria")
    return {
        "messages": [HumanMessage(content=prompts.CRITIQUE.format(
            question=_last_human(state["messages"]),
            filters=json.dumps(state.get("filters", {})),
            summary="The search came back empty.",
        ))],
        "refines": state.get("refines", 0) + 1,
    }


# ------------------------------------------------------------------ groundedness
NUMBER = re.compile(r"\b\d[\d,]{3,}\b|\b\d+(?:\.\d+)?\s*(?:crore|lakh|marla|kanal)\b",
                    re.IGNORECASE)


def _unsupported_figures(draft: str, facts: str, question: str) -> list[str]:
    """Figures in the draft that no tool returned and the user did not supply."""
    haystack = (facts + " " + question).lower().replace(",", "")
    missing = []
    for raw in NUMBER.findall(draft):
        needle = raw.lower().replace(",", "").strip()
        # "1.25 crore" also counts as supported if the digits alone appear
        digits = re.sub(r"[^\d.]", "", needle)
        if needle in haystack:
            continue
        if digits and digits in haystack:
            continue
        # A figure the model derived by rounding, e.g. 12500000 -> "1.25 crore"
        if digits and digits.rstrip("0") and digits.rstrip("0") in haystack.replace(".", ""):
            continue
        missing.append(raw)
    return missing


def ground(state: AgentState) -> dict:
    """Refuse to let an invented number reach the user.

    The failure that kills property chatbots is a confident wrong price, so the
    draft is checked against what the tools actually returned, and rewritten once
    if it contains a figure that came from nowhere.
    """
    messages = state["messages"]
    draft = ""
    for message in reversed(messages):
        if isinstance(message, AIMessage) and not message.tool_calls:
            draft = text_of(message)
            break
    if not draft or state.get("regrounded"):
        return {}

    facts = " ".join(_tool_outputs(messages))
    question = _last_human(messages)
    missing = _unsupported_figures(draft, facts, question)
    if not missing:
        current().step("checked", "Every figure in the reply came from a tool")
        return {}

    current().step("checked", f"Rewriting: {', '.join(missing[:3])} came from nowhere")
    try:
        instruction = HumanMessage(content=prompts.REGROUND.format(
            facts=facts[:4000], draft=draft))
        _reserve([instruction])
        fixed = get_reasoner(temperature=0.0).invoke([instruction])
        return {"messages": [AIMessage(content=str(fixed.content))], "regrounded": True}
    except Exception as error:  # noqa: BLE001
        log.warning("Regrounding failed: %s", error)
        return {"regrounded": True}


# ---------------------------------------------------------------------- routing
def route_after_understand(state: AgentState) -> str:
    return "chat" if state.get("intent") in CHAT_INTENTS else "agent"


def route_after_agent(state: AgentState) -> str:
    last = state["messages"][-1]
    if isinstance(last, AIMessage) and last.tool_calls:
        return "tools"
    return "critique"


def route_after_tools(state: AgentState) -> str:
    """Back to the agent, or finish cheaply if the call budget is spent."""
    if state.get("agent_calls", 0) >= settings.max_tool_loops:
        log.info("Agent call budget spent (%d); finishing without more tools",
                 state.get("agent_calls", 0))
        return "finalize"
    return "agent"


def route_after_critique(state: AgentState) -> str:
    last = state["messages"][-1]
    return "agent" if isinstance(last, HumanMessage) else "ground"
