export const PLACEHOLDER_IMAGE = "https://placehold.co/600x400?text=No+Image";

export const formatPrice = (price) => `PKR ${Number(price || 0).toLocaleString("en-PK")}`;

// Short price for small spaces: 1.5 Crore, 45 Lakh, 80 Thousand
export const shortPrice = (price) => {
  const value = Number(price || 0);
  if (value >= 1e7) return `${+(value / 1e7).toFixed(2)} Crore`;
  if (value >= 1e5) return `${+(value / 1e5).toFixed(2)} Lakh`;
  if (value >= 1e3) return `${+(value / 1e3).toFixed(1)} Thousand`;
  return String(value);
};

// Pakistani numbers like 0300-1234567 → 923001234567 (the format WhatsApp needs)
export const toWhatsAppNumber = (phone = "") => {
  let digits = String(phone).replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("0")) digits = `92${digits.slice(1)}`;
  return digits;
};

export const whatsappLink = (phone, message = "") =>
  `https://wa.me/${toWhatsAppNumber(phone)}?text=${encodeURIComponent(message)}`;

// ---------- Area units ----------
// 1 Marla = 225 sq ft (used by most housing societies), 1 Kanal = 20 Marla.
// Must match api/utils/area.js
export const AREA_UNITS = {
  marla: { label: "Marla", sqft: 225 },
  kanal: { label: "Kanal", sqft: 4500 },
  sqft: { label: "Sq. Ft.", sqft: 1 },
  sqyd: { label: "Sq. Yd.", sqft: 9 },
};

export const convertArea = (value, fromUnit, toUnit) =>
  (Number(value) * AREA_UNITS[fromUnit].sqft) / AREA_UNITS[toUnit].sqft;

// "10 Marla" → { value: "10", unit: "marla" } (used when editing a listing)
export const splitSize = (size = "") => {
  const match = String(size).toLowerCase().match(/([\d.,]+)\s*(marla|kanal|sq\.?\s*ft|sqft|sq\.?\s*yd|sqyd)?/);
  if (!match) return { value: "", unit: "marla" };
  const text = match[2] || "marla";
  let unit = "marla";
  if (text.startsWith("kanal")) unit = "kanal";
  else if (text.includes("ft")) unit = "sqft";
  else if (text.includes("yd")) unit = "sqyd";
  return { value: match[1].replace(/,/g, ""), unit };
};
