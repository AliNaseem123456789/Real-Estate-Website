# HomeMate — the property assistant

A FastAPI agent that answers questions about the listings on Profit Builders. It is
not a wrapper around a chat model: it searches the live site, reads the
neighbourhood price data, checks its own figures before answering, and asks before
it sends anything on a visitor's behalf.

It replaces the old external chatbot gateway the React client used to call.

## What it can do

| Ability | How it works |
| --- | --- |
| Conversational search with follow-ups | Groq extracts the filters, which live in the session, so "what about 4 beds?" edits the last search instead of starting a new one |
| Multi-step discovery | Gemini loops over the tools: search, then enrich each candidate with a price check or area statistics, then compare |
| Self-correction | A critique node notices an empty or wrong-looking result set and goes round again with looser criteria |
| Neighbourhood intelligence | RAG over `area_stats`, written out as prose at ingest time, reranked by Jina |
| Is this a fair price? | Calls the site's own `/market/price-check`, which compares price per marla against the area's p25–p75 band |
| Paperwork questions | RAG over the markdown in `knowledge/` — title documents, transfer process, costs |
| Affordability and instalments | Calculated in Python, mirroring the site's own EmiCalculator, never by the model |
| Viewing requests and price alerts | Write actions, behind a confirmation gate (see below) |
| Groundedness | Every figure in the draft reply is checked against what the tools returned; an unsupported number gets the reply rewritten |
| **Offer preparation** | `offer_brief` builds a negotiation case: where the asking price sits against the area's median and p25–p75 band, a suggested opening offer anchored on comparable sizes, the supporting facts and the caveats. Refuses to anchor at all when the area has no data |
| **Due diligence** | A document checklist that persists between conversations, built for the property type (a plot gets demarcation and land-use; a house gets the building plan and completion certificate). The valuable part is `check_document_against_listing`: report what the deed says and a size or owner that disagrees with the listing becomes a recorded high-severity finding |

Answers come from tools, never from the model's own memory of the market. When a
tool returns nothing, the agent says so instead of inventing a listing.

## The graph

```
                    ┌─ smalltalk ─→ chat ───────────────────────────────→ reply
understand ─ route ─┤                        ┌─ budget left ─→ agent ─┐
                    └─ property ──→ agent ──→ tools ─┤               │
                                      ↑              └─ spent ──→ finalize
                                      └── critique ←─────────────────┘
                                                              ↓
                                                            ground → reply
```

`MAX_TOOL_LOOPS` counts calls to the expensive model, so a turn's cost is
bounded no matter what the agent decides to do. When the budget runs out mid-work
the turn goes to **finalize**: a cheap, tool-free call that answers from the tool
results already gathered. Without it the agent could end a turn on an abandoned
tool call and the user would get nothing.

A greeting takes the top branch: one model call, no tools bound, no retrieval,
and the previous turn's search filters are not injected. Without that split,
"hi" inherited the last query's criteria and ran a property search.

- **understand** — Groq (`gpt-oss-20b`) pulls filters and intent out of the message
  and merges them with the session. Cheap model, called on every turn.
- **agent** — Gemini Flash with 13 tools bound. The loop between `agent` and
  `tools` is the multi-step part.
- **critique** — the agent's look at its own results before committing.
- **ground** — the last gate. Nothing with an invented price reaches the user.

Follow-up references work because the listings shown in the last reply are kept
in the session and named to the agent on the next turn, so "tell me more about
this one" resolves to an id instead of the model guessing from its own prose.

Model replies are read with `app/messages.text_of`, never `str(message.content)`:
Gemini 3 returns a list of content blocks with a thought signature attached, and
stringifying that puts the raw structure in front of the user.

## The confirmation gate

`request_viewing` and `create_price_alert` never act on the first call. They return
a summary, the API puts it in `pending_action`, and the client shows Confirm /
Cancel. Only when the next request arrives with `confirm: true` does the write
happen. An agent with write access to a marketplace should not be able to message a
seller because it misread a sentence.

Listings imported from the scraped dataset have no linked seller account, and the
site's enquiry endpoint rejects those. The tool falls back to recording the request
in a `viewing_requests` collection for the admin, and tells the user that is what
happened.

## Provider profiles

`REASONER_PROVIDER` picks the model **and** the limits that suit it, because the
binding constraint differs by provider and tuning five numbers by hand is how
this project spent a week fighting the wrong limit:

| Provider | Tool loops | Prompt budget | Tokens/min | Tools bound |
| --- | --- | --- | --- | --- |
| `openai` | 6 | 12,000 | 400,000 | all 18 |
| `gemini` | 3 | 8,000 | 200,000 | all 18 |
| `groq` | 2 | 2,000 | 8,000 | scoped by intent |

Anything set explicitly in `.env` overrides the profile. A test asserts that each
profile's worst-case turn fits its own per-minute budget, so changing one number
without the others fails the suite.

`openai` covers anything speaking the OpenAI API: set `OPENAI_BASE_URL` to
DeepSeek, Mistral, OpenRouter, Cerebras or Together and the rest is unchanged.
Doing so also forces `/v1/chat/completions`, because only OpenAI serves
`/v1/responses`.

Check the model id against your own account rather than a pricing table - they
change, and a wrong id fails with a 400 that the fallback used to hide:

```bash
python -c "from openai import OpenAI; print([m.id for m in OpenAI().models.list()])"
```

The provider fallback now logs the real error before switching, so a primary
provider failing every call is visible in the log instead of looking like
success while the standby quietly does all the work.

Six tool loops is the point of moving off a free tier. At two, the discovery
agent cannot search, enrich two candidates and compare them in one turn - which
was the feature the whole graph exists for.

## Quota, and why Groq is the default

Gemini's free tier allows **20 `generate_content` requests per day, per model**.
One turn here spends several (slot extraction, a call per tool round trip, the
groundedness check), so about five conversations exhaust a model for 24 hours.
That limit is per *model*, so changing `GEMINI_CHAT_MODEL` hands you a fresh 20 -
useful in a pinch, not a plan.

Groq's free tier is **1,000 requests and 200k tokens a day**, which is why
`REASONER_PROVIDER=groq` is the default. Switch to `gemini` for a demo if you
prefer its answers, and switch back to build.

With both keys set and `ENABLE_MODEL_FALLBACK=true`, a quota error on the primary
is retried on the other provider, so a conversation pauses rather than dies. And
when both are out, `/chat` returns a readable sentence explaining the limit and
when it resets - not a 502 with a stack trace.

Small talk and slot extraction always use Groq regardless of the setting: a
greeting is not worth a request from a 20-a-day budget.

### Prompt size, and Groq's real limit

Groq's binding constraint is not the request count, it is **8,000 tokens per
minute** - and a single request over that is rejected outright with a 413, not
queued. Three things keep requests under it:

- **Intent-scoped tools.** All 13 tool schemas come to about 2,000 tokens on
  every call, so each intent binds only the tools it plausibly uses: a search
  gets 5, a paperwork question gets 1. An unrecognised intent still gets all 13,
  so capability is never silently lost.
- **A hard budget.** `MAX_PROMPT_TOKENS` (default 4,500) caps what one request
  may carry. The oldest exchanges are dropped before the call rather than after
  a rejection, and a tool call and its response always leave together so the
  exchange still pairs up.
- **Trimmed history.** Six messages, one full tool result, the rest shortened to
  300 characters, four listings per search instead of nine.

Floor per call for a search is about 1,150 tokens. Each agent call logs its own
size, so if a rejection appears the log says what was in it.

### Pacing

Trimming requests is not enough on its own, because the limit is **cumulative
over a rolling 60 seconds**, counting input and output. Several calls in a turn
can exhaust the minute between them, and the API rejects rather than queues.

`app/pacing.py` keeps a rolling log of tokens spent and waits for room before
each call. Nothing is sent that would be refused. If the wait would exceed
`MAX_PACING_WAIT_SECONDS` (20s) it gives up and the user gets a sentence saying
to try again in a minute, rather than a stack trace.

The settings are sized so one whole turn fits one minute:

    understand (~700) + MAX_TOOL_LOOPS x (MAX_PROMPT_TOKENS + 500 output)
      + ground (~900)  <=  TOKENS_PER_MINUTE

At two loops, 2,600-token prompts and 8,000 tokens a minute that comes to about
7,800. A test asserts this, so changing one of those numbers without checking the
others fails the suite rather than failing in production. `/health` reports
`tokens_used_this_minute` against the limit.

The practical consequence on a free tier: roughly **one turn per minute**. Ask a
second question immediately and it waits a few seconds. That is the cost of the
free tier, not a defect - `TOKENS_PER_MINUTE` goes up with the plan.

## Response time

An agent turn is several model calls: slot extraction (Groq, fast), then one
Gemini call per tool round trip, then the groundedness check. Two settings
dominate how long that takes.

**Thinking level.** Gemini 3 models think before answering and most default to
`medium`; `high` can be several times slower. For tool calling, set
`GEMINI_THINKING_LEVEL=low`. Which values a model accepts varies - some reject
`minimal` with a 400 - so measure instead of guessing:

```bash
python scripts/bench_models.py          # tries models x thinking levels, prints timings
python scripts/bench_models.py --full   # also times one real turn through the graph
```

It prints the fastest combination that still called the tool correctly, and the
two lines to paste into `.env`.

**Tool loops.** `MAX_TOOL_LOOPS` caps the round trips per turn (default 4), and
the system prompt asks the agent to keep to about three tool calls. Lower is
faster; too low and multi-step comparisons get cut off mid-way.

If it is still slow after both, the remaining win is streaming the reply so the
first words appear immediately. That is not built yet - `/chat` returns the whole
answer in one response.

## Setup

```bash
cd chatbot
python -m venv .venv
.venv\Scripts\activate          # Windows; use source .venv/bin/activate elsewhere
pip install -r requirements.txt

copy .env.example .env           # then fill in the keys
python scripts/ingest.py         # build the knowledge base (needs MONGO_URI + GOOGLE_API_KEY)
uvicorn app.main:app --reload --port 8000
```

Then point the website at it — in `client/.env`:

```
VITE_AGENT_URL=http://localhost:8000
```

Start the Express API too (`cd api && npm run dev`): the agent reads listings
through it, so the approval and filter rules stay in one place.

### Keys you need

| Key | What for | Free tier |
| --- | --- | --- |
| `GOOGLE_API_KEY` | Gemini (reasoning, tool calling) and Gemini embeddings | AI Studio, free tier |
| `GROQ_API_KEY` | `gpt-oss-20b` for intent and slot extraction | free, optional — falls back to Gemini |
| `JINA_API_KEY` | reranking retrieved chunks | free tier, optional — falls back to vector order |

Both optional keys degrade rather than break: no Groq means Gemini does the slot
extraction, no Jina means the vector order stands.

## Ingestion

```bash
python scripts/ingest.py                         # areas and guides (the default)
python scripts/ingest.py --kinds areas           # just the market data
python scripts/ingest.py --limit 200             # a slice, for a first run
python scripts/ingest.py --kinds listings \
       --min-description 150                     # listings worth embedding only
```

Everything lands in one collection (`kb_chunks`) tagged by `kind`, behind one
vector index — an Atlas free cluster allows only three in total. The script creates
the index itself, and prints the JSON definition if Atlas refuses so you can paste
it into the UI. Chunks upsert on a stable id, so re-running is safe.

Embeddings default to `gemini-embedding-001` truncated to 768 dimensions with
Matryoshka: the retrieval loss is small and the index is a quarter of the size.

### Embedding providers

`EMBED_PROVIDER` picks one of three, and **the same one must be used for
ingestion and for queries**. Two different models put vectors in two different
spaces, and retrieval then returns nonsense rather than failing, which is a
miserable bug to find. Changing provider or dimensions means re-ingesting and
dropping the Atlas index so it rebuilds at the new size.

| Provider | Dimensions | Good for | Cost |
| --- | --- | --- | --- |
| `gemini` (default) | 128-3072 | the normal case; 768 is a good trade | free tier quota |
| `jina` | 128/256/512/1024/2048 | multilingual retrieval (Urdu questions) and, later, photo search - the model takes images too | your Jina token balance |
| `local` | 384 | a large one-off ingest with no quota at all | nothing, runs on CPU |

For `local`, install the extra dependency where you run the ingest:

```bash
pip install -r requirements-local.txt
```

fastembed runs ONNX on CPU, so it needs no torch and no GPU, and the model
downloads once. It is the right answer for embedding thousands of chunks on your
own machine without touching a quota.

The catch is the rule above: if ingestion is local, queries must be local too,
which means the model has to load inside the Render instance. On the free plan
that is 512 MB shared with FastAPI and LangChain, and the model plus onnxruntime
is a few hundred megabytes on its own, so expect it not to fit. Use `local` when
you are serving the API from your own machine, or on a paid instance. For a free
Render deployment, prefer `gemini` or `jina` for both.

`gemini-embedding-2` is the multimodal Gemini option, needed for photo search -
it uses task prefixes instead of `task_type`, so switching means a re-ingest.

### Keeping the corpus small

Listings are **off by default** in the ingest script, and that is deliberate. An
imported listing's description comes from the scrape's `shortDescription`, which
is usually the title again, so embedding thousands of them costs quota and buys
nothing the structured filters do not already do better. `--min-description`
(default 120 characters) skips those, and anything identical to the title is
skipped too.

The areas and guides are the corpus that actually earns its keep: the market
statistics and the paperwork explainers are things no filter can answer.

## API

| Method | Path | Body | Returns |
| --- | --- | --- | --- |
| GET | `/health` | | which models are wired up; also the endpoint to ping to keep Render awake |
| POST | `/chat` | `{message, session_id?, user_id?, language?, confirm?}` | `{reply, properties, pending_action, trace, sources, filters, session_id}` |
| DELETE | `/chat/{session_id}` | | clears the thread |

`trace` is the agent's own steps, which the client shows under "How I worked this
out" — the reasoning loop is visible rather than magic.

Sessions live in Mongo (`chat_sessions`) and expire after a week, because Render's
free instance restarts whenever it likes and in-process memory would lose the
thread mid-conversation.

## Deploying

`render.yaml` is a blueprint: root directory `chatbot`, start command
`uvicorn app.main:app --host 0.0.0.0 --port $PORT`. Add the keys from
`.env.example` in the dashboard, set `BACKEND_URL` to the live Express API and
`ALLOWED_ORIGINS` to the Netlify address. Then set `VITE_AGENT_URL` on Netlify.

The free instance sleeps after 15 minutes, so the first question after a quiet spell
takes about 50 seconds. Ping `/health` from an external cron before showing it to
anyone.

## The due-diligence workflow

```
start_due_diligence(property_id)       opens a 9-point checklist for the type
record_document(key, status, note)     provided | missing | flagged | n/a
check_document_against_listing(...)    size / owner / address vs the listing
due_diligence_report(property_id)      progress, what is missing, findings
```

State lives in the `due_diligence` collection, keyed on the signed-in user or the
session, so a buyer can come back tomorrow and pick up mid-checklist. Unlike
`request_viewing` these writes need no confirmation gate: they only touch the
user's own checklist, and nothing reaches a third party.

The cross-check is the part worth demonstrating. A deed reading 8 marla against a
listing advertising 10 produces a high-severity finding; a title in a different
name from the poster produces another, with the advice to ask for a registered
power of attorney. Name word-order is tolerated and a size within 5% passes, so
it flags real discrepancies rather than noise.

## What is not built yet

- **Document upload and extraction.** The checklist is driven by what the user
  reports, not by reading a PDF. OCR plus field extraction is an input channel on
  top of a workflow that already works.
- Photo search. Needs `gemini-embedding-2` and a re-ingest of listing images.
- The background watchdog that re-runs saved searches and writes a digest.
- Commute-time filtering.
- Fraud and listing-quality scoring for the admin queue.
- Streaming replies.
