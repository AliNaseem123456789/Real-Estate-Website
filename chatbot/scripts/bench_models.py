"""Find a Gemini model and thinking level that is both accepted and fast.

Model names and thinking parameters change often, and a wrong combination fails
with a 400 rather than falling back. This sends one small tool-calling request
per combination and reports what happened, so the choice comes from measurement
instead of guesswork.

    cd chatbot
    python scripts/bench_models.py                       # the usual candidates
    python scripts/bench_models.py --models gemini-3.8-flash,gemini-3-flash-preview
    python scripts/bench_models.py --full                # also time a real agent turn

Put the winner in .env as GEMINI_CHAT_MODEL and GEMINI_THINKING_LEVEL.
"""

import argparse
import pathlib
import sys
import time

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))

from langchain_core.messages import HumanMessage  # noqa: E402
from langchain_core.tools import tool  # noqa: E402

from app.config import settings  # noqa: E402

CANDIDATE_MODELS = [
    "gemini-3.6-flash",
    "gemini-3-flash-preview",
    "gemini-3.8-flash",
    "gemini-3.1-flash-lite",
]

# "" means send no thinking parameter at all and take the model's default.
CANDIDATE_THINKING = ["low", "medium", "", "minimal"]

PROMPT = ("A user asks: 3 bed house for rent in Lahore under 1 lakh. "
          "Call the search tool with the right arguments.")


@tool("search_properties")
def fake_search(city: str, bedrooms: int = 0, max_price: float = 0) -> str:
    """Search property listings by city, bedrooms and maximum price."""
    return '{"total_matches": 2}'


def try_once(model_name: str, thinking: str) -> tuple[bool, float, str]:
    from langchain_google_genai import ChatGoogleGenerativeAI

    kwargs: dict = {}
    if thinking:
        kwargs["thinking_level"] = thinking

    started = time.time()
    try:
        model = ChatGoogleGenerativeAI(
            model=model_name,
            google_api_key=settings.google_api_key,
            temperature=0.2,
            max_retries=0,
            timeout=90,
            **kwargs,
        ).bind_tools([fake_search])
        reply = model.invoke([HumanMessage(content=PROMPT)])
    except Exception as error:  # noqa: BLE001
        return False, time.time() - started, f"{type(error).__name__}: {str(error)[:140]}"

    elapsed = time.time() - started
    called = bool(getattr(reply, "tool_calls", None))
    return True, elapsed, "called the tool" if called else "answered without calling the tool"


def full_turn() -> None:
    """Time one real turn through the graph, with the settings from .env."""
    from app.agent import run_agent
    from app.collect import RunContext, run_context

    print("\nOne full agent turn with the current .env settings")
    print(f"  model {settings.gemini_chat_model}, thinking "
          f"{settings.gemini_thinking_level or 'default'}, "
          f"max {settings.max_tool_loops} tool loops")
    started = time.time()
    with run_context(RunContext()) as context:
        try:
            reply, _ = run_agent("3 bed house for rent in Lahore under 1 lakh", [], {})
        except Exception as error:  # noqa: BLE001
            print(f"  failed after {time.time() - started:.1f}s: {error}")
            return
    print(f"  {time.time() - started:.1f}s, {len(context.trace)} steps")
    for step in context.trace:
        print(f"    - {step.step}: {step.detail}")
    print(f"  reply: {reply[:200]}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Benchmark Gemini models for this agent")
    parser.add_argument("--models", default=",".join(CANDIDATE_MODELS))
    parser.add_argument("--thinking", default=",".join(CANDIDATE_THINKING),
                        help="comma-separated levels; an empty entry means the default")
    parser.add_argument("--full", action="store_true",
                        help="also time one real turn through the graph")
    args = parser.parse_args()

    if not settings.google_api_key:
        sys.exit("GOOGLE_API_KEY is not set. Fill in .env first.")

    models = [m.strip() for m in args.models.split(",") if m.strip()]
    levels = [level.strip() for level in args.thinking.split(",")]

    # Gemini's free tier is 20 requests per day PER MODEL, so a full grid can eat
    # a meaningful share of what you have left. Say so before spending it.
    print(f"This will send {len(models) * len(levels)} requests "
          f"({len(levels)} per model). Gemini's free tier allows 20 per day per "
          "model, so narrow it with --models / --thinking if you are low.\n")

    print(f"{'model':<28} {'thinking':<10} {'time':>7}  result")
    print("-" * 78)
    print("(one sample each, so treat differences of a second or two as noise)")
    best: tuple[float, str, str] | None = None

    for model_name in models:
        for level in levels:
            ok, elapsed, note = try_once(model_name, level)
            label = level or "(default)"
            mark = " " if ok else "x"
            print(f"{mark}{model_name:<27} {label:<10} {elapsed:>6.1f}s  {note}")
            if ok and "called the tool" in note and (best is None or elapsed < best[0]):
                best = (elapsed, model_name, label)

    print("-" * 78)
    if best:
        elapsed, model_name, level = best
        print(f"Fastest that called the tool correctly: {model_name} at thinking={level} "
              f"({elapsed:.1f}s)")
        print("\nPut this in .env:")
        print(f"  GEMINI_CHAT_MODEL={model_name}")
        print(f"  GEMINI_THINKING_LEVEL={'' if level == '(default)' else level}")
    else:
        print("Nothing worked. Check the key, and check the current model names at "
              "https://ai.google.dev/gemini-api/docs/models")

    if args.full:
        full_turn()


if __name__ == "__main__":
    main()
