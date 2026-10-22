"""Shared formatting, mirroring client/src/utils/format.js and api/utils/area.js."""

# 1 Marla = 225 sq ft, 1 Kanal = 20 Marla, matching api/utils/area.js
SQFT_PER_UNIT = {"sqft": 1.0, "sqyd": 9.0, "marla": 225.0, "kanal": 4500.0}

CRORE = 10_000_000
LAKH = 100_000


def price_words(amount: float | None) -> str:
    """12500000 -> "1.25 crore". How prices are actually spoken in Pakistan."""
    if not amount:
        return "price not given"
    amount = float(amount)
    if amount >= CRORE:
        return f"{amount / CRORE:.2f}".rstrip("0").rstrip(".") + " crore"
    if amount >= LAKH:
        return f"{amount / LAKH:.2f}".rstrip("0").rstrip(".") + " lakh"
    return f"PKR {amount:,.0f}"


def price_full(amount: float | None) -> str:
    if not amount:
        return "price not given"
    return f"PKR {float(amount):,.0f} ({price_words(amount)})"


def sqft_to_marla(sqft: float | None) -> float | None:
    if not sqft:
        return None
    return round(float(sqft) / SQFT_PER_UNIT["marla"], 2)


def _trim(number: float) -> str:
    """2.0 -> "2", 1.25 -> "1.25"."""
    return f"{number:.2f}".rstrip("0").rstrip(".")


def area_words(sqft: float | None) -> str:
    marla = sqft_to_marla(sqft)
    if marla is None:
        return "size not given"
    if marla >= 20:
        return f"{_trim(marla / 20)} kanal ({_trim(marla)} marla)"
    return f"{_trim(marla)} marla ({int(sqft):,} sq ft)"
