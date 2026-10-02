// Area units used in Pakistan. 1 Marla = 225 sq ft (the size most housing
// societies use), 1 Kanal = 20 Marla.
export const SQFT_PER_UNIT = {
  sqft: 1,
  sqyd: 9,
  marla: 225,
  kanal: 4500,
};

// Turns a size like "10 Marla", "1 kanal" or "1,200 sqft" into square feet.
// Returns undefined if it can't understand the text.
export const sizeToSqft = (sizeText) => {
  if (!sizeText) return undefined;
  const match = String(sizeText)
    .toLowerCase()
    .replace(/,/g, "")
    .match(/([\d.]+)\s*(marla|kanal|sq\.?\s*ft|sqft|square feet|sq\.?\s*yd|sqyd|square yards?|yards?)?/);
  if (!match) return undefined;

  const value = Number(match[1]);
  const unitText = match[2] || "sqft";
  let unit = "sqft";
  if (unitText.startsWith("marla")) unit = "marla";
  else if (unitText.startsWith("kanal")) unit = "kanal";
  else if (unitText.includes("yd") || unitText.includes("yard")) unit = "sqyd";

  return Number.isNaN(value) ? undefined : Math.round(value * SQFT_PER_UNIT[unit]);
};
