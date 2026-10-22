"""Money and unit maths, done in Python rather than by the model.

Mirrors the website's own EmiCalculator and AreaConverter so the chat and the
pages cannot disagree.
"""

import json

from langchain_core.tools import tool

from ..collect import current
from ..format import SQFT_PER_UNIT, price_full


def _emi(principal: float, annual_rate_pct: float, years: int) -> float:
    months = max(1, int(years * 12))
    monthly_rate = annual_rate_pct / 100 / 12
    if monthly_rate <= 0:
        return principal / months
    growth = (1 + monthly_rate) ** months
    return principal * monthly_rate * growth / (growth - 1)


@tool("monthly_payment")
def monthly_payment(price: float, down_payment: float = 0, annual_rate_pct: float = 22.0,
                    years: int = 20) -> str:
    """Monthly instalment. Default rate 22% (typical in Pakistan) - state the
    rate you assumed."""
    principal = max(0.0, float(price) - float(down_payment))
    payment = _emi(principal, annual_rate_pct, years)
    total = payment * years * 12
    current().step("calculation", f"EMI on {price_full(price)} over {years} years",
                   tool="monthly_payment")
    return json.dumps(
        {
            "price": price_full(price),
            "down_payment": price_full(down_payment) if down_payment else "none",
            "amount_financed": price_full(principal),
            "assumed_annual_rate_pct": annual_rate_pct,
            "term_years": years,
            "monthly_payment": price_full(round(payment)),
            "total_paid": price_full(round(total)),
            "total_markup": price_full(round(total - principal)),
        }
    )


@tool("affordability")
def affordability(monthly_budget: float, down_payment: float = 0, annual_rate_pct: float = 22.0,
                  years: int = 20) -> str:
    """Most expensive property affordable on a monthly budget. Feed the result
    to search_properties as max_price."""
    months = max(1, int(years * 12))
    monthly_rate = annual_rate_pct / 100 / 12
    if monthly_rate <= 0:
        borrowable = monthly_budget * months
    else:
        growth = (1 + monthly_rate) ** months
        borrowable = monthly_budget * (growth - 1) / (monthly_rate * growth)
    budget = borrowable + float(down_payment)
    current().step("calculation",
                   f"A budget of {price_full(monthly_budget)}/month reaches {price_full(budget)}",
                   tool="affordability")
    return json.dumps(
        {
            "monthly_budget": price_full(monthly_budget),
            "down_payment": price_full(down_payment) if down_payment else "none",
            "assumed_annual_rate_pct": annual_rate_pct,
            "term_years": years,
            "can_borrow": price_full(round(borrowable)),
            "max_property_price": price_full(round(budget)),
            "max_property_price_value": round(budget),
        }
    )


@tool("convert_area")
def convert_area(value: float, from_unit: str, to_unit: str = "sqft") -> str:
    """Convert marla, kanal, sqft, sqyd."""
    source = from_unit.strip().lower()
    target = to_unit.strip().lower()
    if source not in SQFT_PER_UNIT or target not in SQFT_PER_UNIT:
        return json.dumps({"error": f"Units must be one of {list(SQFT_PER_UNIT)}"})
    result = float(value) * SQFT_PER_UNIT[source] / SQFT_PER_UNIT[target]
    return json.dumps({"value": value, "from": source, "to": target, "result": round(result, 2)})
