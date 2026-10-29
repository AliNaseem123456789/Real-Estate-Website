"""All configuration in one place, read from the environment."""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict

# Settings that depend on how generous the provider is. Applied only to fields
# you have not set yourself, so a provider switch no longer means remembering to
# retune five numbers by hand - which is exactly how this project spent a week
# fighting limits that were not the ones actually binding.
PROVIDER_PROFILES: dict[str, dict] = {
    # 8,000 tokens a minute, rolling. Everything has to be small.
    "groq": {
        "tokens_per_minute": 8_000,
        "max_tool_loops": 2,
        "max_prompt_tokens": 2_000,
        "max_history_messages": 6,
        "scope_tools_by_intent": True,
    },
    # Generous per minute, but 20 requests a DAY per model on the free tier, so
    # few calls and big prompts.
    "gemini": {
        "tokens_per_minute": 200_000,
        "max_tool_loops": 3,
        "max_prompt_tokens": 8_000,
        "max_history_messages": 12,
        "scope_tools_by_intent": False,
    },
    # Tier 1 is ~500 RPM and 500k TPM: enough headroom for the agent to actually
    # work multi-step, which is what the whole design was for.
    "openai": {
        "tokens_per_minute": 400_000,
        "max_tool_loops": 6,
        "max_prompt_tokens": 12_000,
        "max_history_messages": 16,
        "scope_tools_by_intent": False,
    },
}

# Which output dimensions each embedding provider actually allows.
# None means "anything in range" (Gemini's Matryoshka goes 128-3072).
PROVIDER_DIMENSIONS: dict[str, set[int] | None] = {
    "gemini": None,
    "jina": {128, 256, 512, 1024, 2048},
    "local": {384},  # fixed by the local model; bge-small-en-v1.5 is 384
}


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # --- Generation ---------------------------------------------------------
    # Which model does the reasoning and tool calling: "gemini" or "groq".
    #
    # Gemini's free tier allows 20 requests per DAY per model, and one turn here
    # costs several, so it runs out after a handful of conversations. Groq's free
    # tier is 1,000 requests and 200k tokens a day, which is what you want while
    # building. Switch to gemini for the demo if its answers are better.
    reasoner_provider: str = "groq"

    # OpenAI, or anything that speaks its API: DeepSeek, Mistral, OpenRouter,
    # Cerebras, Together. Point openai_base_url at theirs and set the model.
    openai_api_key: str = ""
    openai_model: str = "gpt-6-luna"
    openai_base_url: str = ""  # empty = api.openai.com
    # On a quota error or outage, retry the call on the other provider instead of
    # failing the turn. Needs both keys to be set.
    enable_model_fallback: bool = True

    google_api_key: str = ""
    gemini_chat_model: str = "gemini-3-flash-preview"
    # Gemini 3 models think before answering, and the default level is the main
    # cause of slow replies in an agent that makes several calls per turn.
    # "low" is the right setting for tool calling; "" leaves the model's default.
    # Run scripts/bench_models.py to see which your model accepts and how fast.
    gemini_thinking_level: str = "low"
    # Legacy knob, used only when gemini_thinking_level is empty. -1 = don't send.
    gemini_thinking_budget: int = -1
    # Fail fast. A turn makes several calls, so a long timeout with retries turns
    # one struggling model into minutes of silence: 45s x 3 retries x 4 loops is
    # how a slow model becomes a request that never answers.
    gemini_timeout: int = 30
    gemini_max_retries: int = 1

    groq_api_key: str = ""
    groq_model: str = "openai/gpt-oss-20b"

    # --- Embeddings --------------------------------------------------------
    # "gemini" (hosted, default), "jina" (hosted, multilingual, handles images
    # later) or "local" (fastembed on CPU, no API calls).
    # Ingestion and queries MUST use the same provider and dimensions, or the
    # vectors sit in different spaces and retrieval returns nonsense. Changing
    # either one means re-ingesting and rebuilding the Atlas index.
    embed_provider: str = "gemini"
    gemini_embed_model: str = "gemini-embedding-001"
    jina_embed_model: str = "jina-embeddings-v4"
    local_embed_model: str = "BAAI/bge-small-en-v1.5"
    embed_dimensions: int = 768

    # --- Reranking ---------------------------------------------------------
    jina_api_key: str = ""
    jina_rerank_model: str = "jina-reranker-v2-base-multilingual"

    # --- Data --------------------------------------------------------------
    mongo_uri: str = ""
    mongo_db: str = "realestate"
    vector_collection: str = "kb_chunks"
    vector_index: str = "kb_vector_index"
    backend_url: str = "http://localhost:3001/api"

    # --- Service -----------------------------------------------------------
    port: int = 8000
    allowed_origins: str = "http://localhost:5173"
    safe_contact_phone: str = "03099412527"
    safe_contact_email: str = "alinaseem21102002@gmail.com"
    log_level: str = "INFO"

    # Agent limits. Each loop is another round trip to Gemini, so this is the
    # second biggest lever on response time after the thinking level.
    # Two agent calls per turn, not four. On an 8,000 token minute, each extra
    # loop is roughly a quarter of the budget.
    max_tool_loops: int = 2
    max_history_messages: int = 6

    # Per-minute token budget, matching the provider's limit. Groq's free tier
    # is 8,000 on a rolling minute, counting input and output together.
    tokens_per_minute: int = 8000

    # Bind only the tools an intent needs. Worth it when tokens per minute are
    # the binding constraint (Groq free tier); worth turning off when requests
    # are the constraint instead (Gemini free tier: 20 a day), because a full
    # tool belt can answer in one round trip what a narrow one needs two for.
    scope_tools_by_intent: bool = True
    enable_pacing: bool = True
    # Wait this long for budget to free up before giving up on the turn.
    max_pacing_wait_seconds: float = 20.0

    # Hard ceiling on what one request may carry, in estimated tokens. Groq's
    # free tier allows 8,000 tokens PER MINUTE, and a single request over that
    # is rejected outright with a 413 - so this must stay well under it to leave
    # room for several calls in a turn. Raise it on a paid tier.
    # Sized so a whole turn fits one minute's budget on the most constrained
    # provider (Groq free, 8,000/min):
    #   max_tool_loops x (this + 500 output) + 3 cheap calls (~900 each)
    # Raise this to 8000 on Gemini, where requests per day bind instead of
    # tokens per minute - bigger prompts then cost nothing extra.
    max_prompt_tokens: int = 2000
    retrieve_k: int = 20
    rerank_k: int = 5

    @property
    def origins(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]

    @property
    def has_groq(self) -> bool:
        return bool(self.groq_api_key)

    @property
    def has_openai(self) -> bool:
        return bool(self.openai_api_key)

    @property
    def reasoner_name(self) -> str:
        return {
            "groq": self.groq_model,
            "openai": self.openai_model,
            "gemini": self.gemini_chat_model,
        }.get(self.reasoner_provider, self.gemini_chat_model)

    @property
    def has_jina(self) -> bool:
        return bool(self.jina_api_key)

    @property
    def embed_model_name(self) -> str:
        return {
            "gemini": self.gemini_embed_model,
            "jina": self.jina_embed_model,
            "local": self.local_embed_model,
        }.get(self.embed_provider, self.gemini_embed_model)

    def check_chat_setup(self) -> str | None:
        """Whether the configured reasoner has the key it needs.

        Provider-aware on purpose: with REASONER_PROVIDER=groq a missing Google
        key is irrelevant to chatting, and demanding one was an early bug that
        made every request fail with a 503.
        """
        keys = {"groq": self.has_groq, "openai": self.has_openai,
                "gemini": bool(self.google_api_key)}
        if self.reasoner_provider not in keys:
            return f"REASONER_PROVIDER must be one of {sorted(keys)}"
        if keys[self.reasoner_provider]:
            return None
        if any(keys.values()):
            return None  # a fallback provider can carry the turn
        return (f"REASONER_PROVIDER={self.reasoner_provider} needs its API key; "
                "no other provider key is set either")

    def check_embedding_setup(self) -> str | None:
        """Returns a problem description, or None when the settings make sense."""
        if self.embed_provider not in PROVIDER_DIMENSIONS:
            return (f"EMBED_PROVIDER must be one of {sorted(PROVIDER_DIMENSIONS)}, "
                    f"not {self.embed_provider!r}")
        allowed = PROVIDER_DIMENSIONS[self.embed_provider]
        if allowed and self.embed_dimensions not in allowed:
            return (f"{self.embed_provider} supports {sorted(allowed)} dimensions, "
                    f"but EMBED_DIMENSIONS is {self.embed_dimensions}")
        if self.embed_provider == "jina" and not self.jina_api_key:
            return "EMBED_PROVIDER=jina needs JINA_API_KEY"
        if self.embed_provider == "gemini" and not self.google_api_key:
            return "EMBED_PROVIDER=gemini needs GOOGLE_API_KEY"
        return None


@lru_cache
def get_settings() -> Settings:
    """Settings, with the provider profile filling in whatever you left alone."""
    settings = Settings()
    profile = PROVIDER_PROFILES.get(settings.reasoner_provider, {})
    for field, value in profile.items():
        # Anything set explicitly in .env wins over the profile.
        if field not in settings.model_fields_set:
            setattr(settings, field, value)
    return settings


settings = get_settings()
