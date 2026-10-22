"""Reading text out of a model message.

Gemini 3 does not return a plain string. It returns a list of content blocks,
each carrying a thought signature:

    [{"type": "text", "text": "...", "extras": {"signature": "EmkKZwFp..."}}]

So str(message.content) yields the whole structure, signature included, and that
is what ends up in front of the user. Everything that reads a reply goes through
here instead.
"""

from langchain_core.messages import BaseMessage


def text_of(message: BaseMessage | None) -> str:
    """The human-readable text of a message, whatever shape its content is in."""
    if message is None:
        return ""
    try:
        return (message.text or "").strip()
    except Exception:  # noqa: BLE001 - older cores, or an unexpected block shape
        content = message.content
        if isinstance(content, list):
            parts = [
                block.get("text", "")
                for block in content
                if isinstance(block, dict) and block.get("type") == "text"
            ]
            return " ".join(part for part in parts if part).strip()
        return str(content or "").strip()
