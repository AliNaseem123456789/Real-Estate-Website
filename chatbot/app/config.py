"""All configuration in one place, read from the environment."""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict

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
        if self.reasoner_provider == "groq":
            if self.has_groq:
                return None
            if self.google_api_key:
                return None  # fallback below will use Gemini instead
            return "Set GROQ_API_KEY (REASONER_PROVIDER=groq), or GOOGLE_API_KEY"
        if self.google_api_key or self.has_groq:
            return None
        return "Set GOOGLE_API_KEY (REASONER_PROVIDER=gemini), or GROQ_API_KEY"

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
    return Settings()


settings = get_settings()
