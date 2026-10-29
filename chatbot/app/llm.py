"""The chat models.

Two jobs, and which model does the first one is configurable:

  reasoning and tool calling  Gemini or Groq, per REASONER_PROVIDER
  intent and slot extraction  always Groq, where a big model would be a waste

Quota is the reason this is a setting rather than a constant. Gemini's free tier
allows 20 generate_content requests per day PER MODEL, and a single turn here
spends several, so a few conversations exhaust it for 24 hours. Groq's free tier
is 1,000 requests and 200k tokens a day. With fallback on, a quota error on one
provider is retried on the other rather than failing the turn.

Gemini 3 models think before answering, and the default thinking level is the
main reason an agent like this feels slow: a turn makes several calls, and each
one pays the thinking cost. GEMINI_THINKING_LEVEL=low is the setting for tool
calling. Which values a model accepts changes with the model, so
scripts/bench_models.py exists to find out rather than guess.
"""

import logging
import warnings
from functools import lru_cache

from langchain_core.language_models import BaseChatModel

from .config import settings

log = logging.getLogger(__name__)

# Gemini 3 models use fixed sampling, so they ignore temperature and the wrapper
# warns about it on every single call. The behaviour is fine; the log spam is not.
warnings.filterwarnings(
    "ignore", message=".*fixed sampling defaults.*", category=UserWarning
)


def thinking_kwargs() -> dict:
    """Whichever thinking control is configured, or nothing at all.

    Note that not every model accepts every level: gemini-3.8-flash rejects
    "minimal" with a 400. scripts/bench_models.py shows what yours takes.
    """
    level = (settings.gemini_thinking_level or "").strip().lower()
    if level:
        return {"thinking_level": level}
    if settings.gemini_thinking_budget >= 0:
        return {"thinking_budget": settings.gemini_thinking_budget}
    return {}


@lru_cache
def get_gemini(temperature: float = 0.2) -> BaseChatModel:
    from langchain_google_genai import ChatGoogleGenerativeAI

    if not settings.google_api_key:
        raise RuntimeError("GOOGLE_API_KEY is not set")

    common = {
        "model": settings.gemini_chat_model,
        "google_api_key": settings.google_api_key,
        "temperature": temperature,
        "max_retries": settings.gemini_max_retries,
        "timeout": settings.gemini_timeout,
    }
    try:
        return ChatGoogleGenerativeAI(**common, **thinking_kwargs())
    except TypeError as error:
        # An older wrapper that does not know thinking_level: carry on without it
        # rather than refusing to start.
        log.warning("Thinking level not supported by this langchain-google-genai: %s", error)
        return ChatGoogleGenerativeAI(**common)


@lru_cache
def get_openai(temperature: float = 0.2) -> BaseChatModel:
    """OpenAI, or any API that speaks its protocol.

    openai_base_url points this at DeepSeek, Mistral, OpenRouter, Cerebras or
    Together without further code, so swapping provider is two env vars.
    """
    from langchain_openai import ChatOpenAI

    if not settings.openai_api_key:
        raise RuntimeError("OPENAI_API_KEY is not set")

    kwargs: dict = {
        "model": settings.openai_model,
        "api_key": settings.openai_api_key,
        "temperature": temperature,
        "max_retries": 1,
        "timeout": 60,
    }
    if settings.openai_base_url:
        kwargs["base_url"] = settings.openai_base_url
    return ChatOpenAI(**kwargs)


@lru_cache
def get_groq(temperature: float = 0.0) -> BaseChatModel:
    from langchain_groq import ChatGroq

    if not settings.has_groq:
        raise RuntimeError("GROQ_API_KEY is not set")

    return ChatGroq(
        model=settings.groq_model,
        api_key=settings.groq_api_key,
        temperature=temperature,
        max_retries=1,
        timeout=40,
    )


BUILDERS = {"openai": get_openai, "groq": get_groq, "gemini": get_gemini}


def _available() -> list[str]:
    """Providers with a key, primary first, then the rest as fallbacks."""
    have = [name for name, ok in (("openai", settings.has_openai),
                                  ("groq", settings.has_groq),
                                  ("gemini", bool(settings.google_api_key))) if ok]
    primary = settings.reasoner_provider
    if primary in have:
        have.remove(primary)
        have.insert(0, primary)
    return have


def get_reasoner(temperature: float = 0.2) -> BaseChatModel:
    """The model that answers and calls tools, per REASONER_PROVIDER.

    Falls through to whichever provider does have a key rather than refusing to
    start, which is deliberate but worth knowing: /health reports what actually
    loaded, because a silent fallback once had this project convinced it was
    running on Gemini for a week while every call went to Groq.
    """
    order = _available()
    if not order:
        raise RuntimeError("No model provider has an API key")
    if order[0] != settings.reasoner_provider:
        log.warning("REASONER_PROVIDER=%s has no key; using %s instead",
                    settings.reasoner_provider, order[0])
    return BUILDERS[order[0]](temperature)


def get_fast_model(temperature: float = 0.0) -> BaseChatModel:
    """Slot extraction and small talk: the cheapest thing available."""
    if settings.has_groq:
        return get_groq(temperature)
    return get_reasoner(temperature)


def _other_provider(temperature: float) -> BaseChatModel | None:
    """The next provider with a key after the primary, if any."""
    if not settings.enable_model_fallback:
        return None
    order = _available()
    if len(order) < 2:
        return None
    try:
        return BUILDERS[order[1]](temperature)
    except Exception as error:  # noqa: BLE001
        log.warning("No fallback model available: %s", error)
        return None


def get_agent_model(tools: list, temperature: float = 0.2):
    """Tool-bound reasoner, with the other provider as a standby.

    A 429 from one provider's free tier then continues on the other instead of
    ending the conversation, which is the difference between a demo that pauses
    and a demo that dies.
    """
    primary = get_reasoner(temperature).bind_tools(tools)
    standby = _other_provider(temperature)
    if standby is None:
        return primary
    return primary.with_fallbacks([standby.bind_tools(tools)])
