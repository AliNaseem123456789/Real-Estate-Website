// Helpers for the price map (neighbourhood statistics from the market-data tool)
import { shortPrice } from "./format";

export const CATEGORIES = [
  { value: "house", label: "Houses" },
  { value: "flat", label: "Flats" },
  { value: "plot", label: "Plots" },
  { value: "commercial", label: "Commercial" },
];

// Must match SIZE_BANDS in market-data/stats.py
export const SIZE_BANDS = [
  { value: "", label: "All sizes" },
  { value: "Up to 5 Marla", label: "Up to 5 Marla" },
  { value: "5 to 10 Marla", label: "5 to 10 Marla" },
  { value: "10 Marla to 1 Kanal", label: "10 Marla to 1 Kanal" },
  { value: "Over 1 Kanal", label: "Over 1 Kanal" },
];

// One light→dark blue ramp (checked for colour-blind safety and contrast)
export const RAMP = ["#86b6ef", "#5598e7", "#2a78d6", "#1c5cab", "#104281"];
export const MUTED = "#c9c9c4"; // areas outside the budget

// "PKR 52.9 Lakh"
export const pkr = (value) => (value == null ? "–" : `PKR ${shortPrice(value)}`);

// The number shown for an area in the current view (or null if the area has no data for it)
export function areaValue(area, { mode, band }) {
  if (mode === "rentYears") return area.rentYears ?? null;
  if (band) return area.sizeBands?.find((b) => b.band === band)?.medianPrice ?? null;
  return mode === "budget" ? area.medianPrice : area.medianPricePerMarla;
}

// Splits values into 5 equal-sized groups (quintiles) → 4 break points
export function quintileBreaks(values) {
  const sorted = [...values].sort((a, b) => a - b);
  if (sorted.length === 0) return [];
  return [0.2, 0.4, 0.6, 0.8].map((q) => sorted[Math.floor(q * (sorted.length - 1))]);
}

export function colorFor(value, breaks) {
  const index = breaks.findIndex((limit) => value <= limit);
  return RAMP[index === -1 ? RAMP.length - 1 : index];
}

// Circle size grows with the number of listings (area of the circle ~ listings)
export const radiusFor = (count) => Math.min(22, 5 + Math.sqrt(count) * 1.3);

export function valueLabel(value, { mode, band, purpose }) {
  if (value == null) return "–";
  if (mode === "rentYears") return `${value} years`;
  if (band || mode === "budget") return pkr(value) + (purpose === "rent" ? " / month" : "");
  return `${pkr(value)} / Marla${purpose === "rent" ? " / month" : ""}`;
}

export function metricTitle({ mode, band, purpose }) {
  if (mode === "rentYears") return "Years of rent to equal the price";
  if (band) return `Typical ${purpose === "rent" ? "monthly rent" : "price"} · ${band}`;
  if (mode === "budget") return `Typical ${purpose === "rent" ? "monthly rent" : "price"}`;
  return purpose === "rent" ? "Monthly rent per Marla" : "Price per Marla";
}

export const formatMonthYear = (isoDate) =>
  isoDate
    ? new Date(isoDate).toLocaleDateString("en-GB", { month: "long", year: "numeric" })
    : "";
