"""HTTP surface.

One real endpoint: POST /chat. It loads the session, runs the agent, and returns
the reply along with the listing cards, the reasoning trace and any action that is
waiting for the user to confirm.
"""

import json
import logging
import re

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from . import sessions
from .agent import run_agent
from .collect import RunContext, run_context
from .config import settings
from .pacing import get_pacer
from .embeddings import describe as describe_embeddings
from .schemas import ChatRequest, ChatResponse

logging.basicConfig(level=settings.log_level.upper(),
                    format="%(asctime)s %(levelname)s %(name)s %(message)s")
log = logging.getLogger("homemate")


def _pacing_message(error: Exception) -> str | None:
    """The per-minute budget could not free up in time."""
    from .pacing import TokenPacerTimeout

    if not isinstance(error, TokenPacerTimeout):
        return None
    return (
        "I am out of per-minute capacity on the free tier and waiting would take too long. "
        "Give it a minute and ask again - the limit is a rolling 60 seconds."
    )


def _quota_message(error: Exception) -> str | None:
    """A readable sentence when a provider's free quota is exhausted.

    Gemini's free tier is 20 requests per day per model, so this is a normal
    condition during development, not a crash. The user gets an explanation and
    the operator gets the retry window, instead of a 502 and a stack trace.
    """
    text = str(error)
    lowered = text.lower()

    # Groq rejects an oversized single request with a 413 on tokens per minute.
    # That is a different problem from a daily quota and needs a different answer.
    if "tokens per minute" in lowered or "rate_limit_exceeded" in lowered or "413" in text:
        return (
            "That request was too large for the free tier's per-minute token limit, so I "
            "could not finish it. Try a shorter question, or start a new chat to clear the "
            "history. (Lower MAX_PROMPT_TOKENS in .env, or upgrade the Groq tier.)"
        )

    if "RESOURCE_EXHAUSTED" not in text and "429" not in text and "rate limit" not in lowered:
        return None

    wait = ""
    match = re.search(r"Please retry in ([\dhms.]+)", text)
    if match:
        hours = re.match(r"(\d+)h", match.group(1))
        wait = f" It resets in about {hours.group(1)} hours." if hours else f" Retry in {match.group(1)}."

    which = settings.gemini_chat_model if settings.reasoner_provider == "gemini" else settings.groq_model
    return (
        f"I have hit today's free usage limit for {which}, so I cannot answer right now."
        + wait
        + " (Set REASONER_PROVIDER to the other provider in .env to keep working, or add "
        "billing to the API key.)"
    )

app = FastAPI(title="HomeMate", description="Property assistant for Profit Builders",
              version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict:
    """Also the endpoint to ping to keep Render's free instance awake."""
    return {
        "status": "ok",
        "reasoner": (settings.groq_model if settings.reasoner_provider == "groq"
                     else settings.gemini_chat_model),
        "reasoner_provider": settings.reasoner_provider,
        "chat_setup_problem": settings.check_chat_setup(),
        "tokens_used_this_minute": (get_pacer().used() if get_pacer() else None),
        "tokens_per_minute": settings.tokens_per_minute,
        "fallback": settings.enable_model_fallback,
        "chat_model": settings.gemini_chat_model,
        "thinking": settings.gemini_thinking_level or f"budget={settings.gemini_thinking_budget}",
        "embeddings": describe_embeddings(),
        "embedding_setup_problem": settings.check_embedding_setup(),
        "fast_model": settings.groq_model if settings.has_groq else "gemini (no Groq key)",
        "reranker": settings.jina_rerank_model if settings.has_jina else "disabled (no Jina key)",
        "backend": settings.backend_url,
    }


@app.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest) -> ChatResponse:
    problem = settings.check_chat_setup()
    if problem:
        raise HTTPException(503, f"The assistant is not configured: {problem}")

    session = sessions.load(request.session_id)
    message = request.message.strip()

    # Confirming an action: hand the agent the exact payload it proposed last turn,
    # so it calls the same tool with the same arguments instead of guessing again.
    pending = session.get("pending_action")
    confirmed = bool(request.confirm and pending)
    if confirmed:
        message += (
            f"\n\n[The user confirms this action: {pending.get('summary')}. "
            f"Arguments: {json.dumps(pending.get('payload', {}))}]"
        )

    context = RunContext(session_id=session["session_id"], user_id=request.user_id,
                         language=request.language, confirmed=confirmed)

    with run_context(context):
        try:
            reply, filters = run_agent(
                message=message,
                history=session["history"],
                filters=session["filters"],
                language=request.language,
                recent_listings=session.get("recent_listings", []),
            )
        except Exception as error:  # noqa: BLE001
            quota = _pacing_message(error) or _quota_message(error)
            if quota:
                log.warning("Free quota exhausted: %s", str(error)[:200])
                return ChatResponse(
                    session_id=session["session_id"],
                    reply=quota,
                    trace=context.trace,
                    filters=session["filters"],
                )
            log.exception("Agent run failed")
            raise HTTPException(502, f"The assistant could not complete that: {error}") from error

    pending_out = context.pending_action.model_dump() if context.pending_action else None
    # Keep only what a follow-up needs to name a listing again.
    shown = [{"id": card.id, "title": card.title} for card in context.cards[:6]]
    sessions.save(
        session_id=session["session_id"],
        user_message=request.message.strip(),
        reply=reply,
        filters=filters,
        pending_action=pending_out,
        user_id=request.user_id,
        recent_listings=shown or session.get("recent_listings", []),
    )

    return ChatResponse(
        session_id=session["session_id"],
        reply=reply,
        properties=context.cards[:6],
        pending_action=context.pending_action,
        trace=context.trace,
        sources=context.sources,
        filters=filters,
    )


@app.delete("/chat/{session_id}")
def reset(session_id: str) -> dict:
    sessions.clear(session_id)
    return {"status": "cleared"}
