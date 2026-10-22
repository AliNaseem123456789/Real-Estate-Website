"""Token pacing for a per-minute budget.

Groq's free tier allows 8,000 tokens per minute on a rolling window, counting
input and output together. One agent turn makes several calls, so a turn can
exhaust the minute on its own - and the API does not queue when that happens, it
rejects the request outright.

This keeps a rolling log of what has been spent and waits for room before the
next call instead of letting it fail. If the wait would be longer than
max_wait_seconds it gives up, so a request never hangs indefinitely: the caller
turns that into a readable message.
"""

import logging
import threading
import time

log = logging.getLogger(__name__)


class TokenPacer:
    def __init__(self, tokens_per_minute: int, max_wait_seconds: float = 20.0):
        self.limit = tokens_per_minute
        self.max_wait = max_wait_seconds
        self._spent: list[tuple[float, int]] = []  # (timestamp, tokens)
        self._lock = threading.Lock()

    def _used(self, now: float) -> int:
        cutoff = now - 60.0
        self._spent = [entry for entry in self._spent if entry[0] > cutoff]
        return sum(tokens for _, tokens in self._spent)

    def reserve(self, tokens: int) -> None:
        """Wait until there is room for this call, then record it.

        Raises TokenPacerTimeout when the wait would exceed max_wait_seconds.
        """
        if tokens >= self.limit:
            raise TokenPacerTimeout(
                f"A single request of about {tokens} tokens cannot fit the "
                f"{self.limit}-token per-minute limit."
            )

        deadline = time.monotonic() + self.max_wait
        while True:
            with self._lock:
                now = time.monotonic()
                used = self._used(now)
                if used + tokens <= self.limit:
                    self._spent.append((now, tokens))
                    return
                # When the oldest entry ages out, that much budget comes back.
                oldest = self._spent[0][0] if self._spent else now
                wait = max(0.2, 60.0 - (now - oldest) + 0.2)

            if time.monotonic() + wait > deadline:
                raise TokenPacerTimeout(
                    f"Waiting for the per-minute token budget would take about "
                    f"{wait:.0f}s ({used} of {self.limit} tokens used)."
                )
            log.info("Pacing: %d/%d tokens used this minute, waiting %.1fs for room",
                     used, self.limit, wait)
            time.sleep(wait)

    def record_extra(self, tokens: int) -> None:
        """Add output tokens once they are known, so the window stays honest."""
        if tokens <= 0:
            return
        with self._lock:
            self._spent.append((time.monotonic(), tokens))

    def used(self) -> int:
        with self._lock:
            return self._used(time.monotonic())


class TokenPacerTimeout(RuntimeError):
    pass


_pacer: TokenPacer | None = None


def get_pacer() -> TokenPacer | None:
    """The shared pacer, or None when pacing is off."""
    global _pacer
    from .config import settings

    if not settings.enable_pacing:
        return None
    if _pacer is None or _pacer.limit != settings.tokens_per_minute:
        _pacer = TokenPacer(settings.tokens_per_minute, settings.max_pacing_wait_seconds)
    return _pacer
