import mongoose from "mongoose";
import AreaStat from "../models/areaStat.model.js";
import Property from "../models/property.model.js";
import { createError } from "../utils/createError.js";
import { SQFT_PER_UNIT } from "../utils/area.js";
import { PUBLIC_FILTER } from "../utils/propertyQuery.js";

const PURPOSES = ["sell", "rent"];
const CATEGORIES = ["house", "flat", "plot", "commercial"];

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const exactCity = (city) => ({ $regex: `^${escapeRegex(String(city).trim())}$`, $options: "i" });

// GET /api/market/cities → [{ city, listings, areas, lat, lng }] biggest first
export const getMarketCities = async (req, res, next) => {
  try {
    const rows = await AreaStat.find(
      { lat: { $ne: null } },
      "city count lat lng dataCollectedOn"
    ).lean();

    // Add up per city; the map centre is weighted by where most listings are
    const byCity = {};
    for (const row of rows) {
      const city = (byCity[row.city] ??= {
        city: row.city,
        listings: 0,
        areas: 0,
        lat: 0,
        lng: 0,
        dataCollectedOn: row.dataCollectedOn,
      });
      city.listings += row.count;
      city.areas += 1;
      city.lat += row.lat * row.count;
      city.lng += row.lng * row.count;
    }
    const cities = Object.values(byCity)
      .map((city) => ({ ...city, lat: city.lat / city.listings, lng: city.lng / city.listings }))
      .sort((a, b) => b.listings - a.listings);
    res.json(cities);
  } catch (error) {
    next(error);
  }
};

// GET /api/market/areas?city=Lahore&purpose=sell&category=house
export const getMarketAreas = async (req, res, next) => {
  try {
    const { city, purpose = "sell", category = "house" } = req.query;
    if (!PURPOSES.includes(purpose) || !CATEGORIES.includes(category)) {
      return next(createError(400, "Unknown purpose or property type"));
    }
    const query = { purpose, category, lat: { $ne: null } };
    if (city) query.city = exactCity(city);

    const areas = await AreaStat.find(query, "-__v").sort({ count: -1 }).lean();
    res.json(areas);
  } catch (error) {
    next(error);
  }
};

// ---------- "Is this a good price?" ----------

// "Bahria Town Phase-8" → " bahria phase 8 ": lower-case words, without punctuation or
// common filler words, so names written slightly differently still match.
// Padded with spaces so we only ever match whole words ("g 14" must not match "g 14 4").
const FILLER_WORDS = /\b(defence|town|society|housing|scheme|the)\b/g;
const nameKey = (text = "") =>
  ` ${String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(FILLER_WORDS, " ")
    .replace(/\s+/g, " ")
    .trim()} `;

const distanceKm = (a, b) => {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
};

// The website's property → the market data's group
const categoryOf = (property) => {
  if (property.type === "Plot") return "plot";
  if (property.type === "Commercial") return "commercial";
  return /flat|apartment|penthouse/i.test(property.title) ? "flat" : "house";
};

// Finds the neighbourhood stats for a property: by name in its address/title,
// otherwise the nearest neighbourhood within 3 km of its map pin.
const findArea = (property, candidates) => {
  // Look in the address and the title separately, so words from one can't run into the other
  const texts = [nameKey(property.address), nameKey(property.title)];
  // An area can include several blocks ("Johar Town" includes "Johar Town Phase 1 - Block D"),
  // so try every name; the longest (most specific) name that matches wins.
  let best = null;
  let bestLength = 0;
  for (const area of candidates) {
    for (const name of [area.location, ...(area.subAreas || [])]) {
      const key = nameKey(name);
      if (key.trim().length >= 2 && key.length > bestLength && texts.some((text) => text.includes(key))) {
        best = area;
        bestLength = key.length;
      }
    }
  }
  if (best) return { area: best, matchedBy: "name" };

  if (property.location?.lat) {
    let nearest = null;
    let nearestKm = 3;
    for (const area of candidates) {
      const km = distanceKm(property.location, area);
      if (km < nearestKm) {
        nearest = area;
        nearestKm = km;
      }
    }
    if (nearest) return { area: nearest, matchedBy: "map" };
  }
  return null;
};

// GET /api/market/price-check/:propertyId
// → { found, area, pricePerMarla, differencePct, verdict: "below" | "typical" | "above" }
export const priceCheck = async (req, res, next) => {
  try {
    const { propertyId } = req.params;
    if (!mongoose.isValidObjectId(propertyId)) return next(createError(404, "Property not found"));

    const property = await Property.findOne({ _id: propertyId, ...PUBLIC_FILTER });
    if (!property) return next(createError(404, "Property not found"));

    const candidates = await AreaStat.find({
      city: exactCity(property.city),
      purpose: property.action,
      category: categoryOf(property),
    }).lean();

    const match = findArea(property, candidates);
    if (!match) return res.json({ found: false });

    const { area, matchedBy } = match;
    const result = { found: true, matchedBy, area };

    if (property.areaSqft > 0 && area.medianPricePerMarla) {
      const pricePerMarla = property.price / (property.areaSqft / SQFT_PER_UNIT.marla);
      result.pricePerMarla = Math.round(pricePerMarla);
      result.differencePct = Math.round((pricePerMarla / area.medianPricePerMarla - 1) * 100);
      if (pricePerMarla < area.p25PricePerMarla) result.verdict = "below";
      else if (pricePerMarla > area.p75PricePerMarla) result.verdict = "above";
      else result.verdict = "typical";
    }
    res.json(result);
  } catch (error) {
    next(error);
  }
};
