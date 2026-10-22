// scripts/import-zameen.js
//
// Reads clean/{city}/properties.json and upserts into the existing
// Property collection WITHOUT any schema changes.
//
// - images[i] = media.zameen.com thumbnail URL (Option A, no Cloudinary)
// - publisher_num / publisher_email = your own safe contact details, never the
//   real scraped seller (override with SAFE_CONTACT_PHONE / SAFE_CONTACT_EMAIL)
// - owner = null
// - dedupe: skip if a Property already exists with same title+price+publisher_num
//
// Usage:
//   node scripts/import-zameen.js Lahore-1
//   node scripts/import-zameen.js Karachi-2
//   node scripts/import-zameen.js Lahore-1 --dry-run

import "dotenv/config";
import fs from "fs";
import mongoose from "mongoose";
import Property from "../models/property.model.js";

// --- config ---------------------------------------------------------------

const SENTINEL_EMAIL = "imported@zameen.invalid";

// Contact details every imported listing shows, instead of the real seller's.
const SAFE_PHONE = process.env.SAFE_CONTACT_PHONE || "03099412527";
const SAFE_EMAIL = process.env.SAFE_CONTACT_EMAIL || "alinaseem21102002@gmail.com";

// Zameen's internal Marla definition, derived from real data:
//   20 Marla -> 418.06368 sqft  =>  20.9032 sqft per Marla.
// Same factor for 3/5/10/20 Marla, so this is consistent.
const MARLA_TO_SQFT = 20.9032;
const KANAL_MARLA = 20;             // 1 Kanal = 20 Marla

const PURPOSE_MAP = { "for-sale": "sell", "for-rent": "rent" };

// Your schema allows only Residential | Commercial | Plot.
const CATEGORY_MAP = {
  Homes: "Residential",
  Commercial: "Commercial",
  Plots: "Plot",
};

// --- helpers --------------------------------------------------------------

function deriveType(row) {
  return CATEGORY_MAP[row.category_top_slug] || "Residential";
}

function deriveAction(row) {
  return PURPOSE_MAP[row.purpose] || "sell";
}

function deriveSize(row) {
  const sqft = Number(row.area_sqft);
  if (!sqft || sqft <= 0) return "N/A";
const marlas = sqft / MARLA_TO_SQFT;
if (marlas >= KANAL_MARLA && Math.abs(marlas % KANAL_MARLA) < 0.05) {
  return `${Math.round((marlas / KANAL_MARLA) * 100) / 100} Kanal`;
}
  return `${Math.round(marlas * 10) / 10} Marla`;
}


function thumbnailUrl(photoId, w = 800, h = 600) {
  if (!photoId) return null;
  return `https://media.zameen.com/thumbnails/${photoId}-${w}x${h}.jpeg`;
}

function buildAddress(row) {
  const parts = [row.address_string, row.city_name].filter(Boolean);
  return parts.length ? parts.join(", ") : row.city_name || "Unknown";
}

// Map one flat row -> a Property-shaped doc (only fields the schema accepts).
function toPropertyDoc(row) {
  const thumb = thumbnailUrl(row.cover_photo_id);
  return {
    // required fields
    type: deriveType(row),
    action: deriveAction(row),
    size: deriveSize(row),
    title: row.title || `Property ${row.externalID}`,
    city: row.city_name || "Unknown",
    address: buildAddress(row),
    description:
      row.shortDescription && row.shortDescription.trim()
        ? row.shortDescription
        : row.title || "",
    price: Number(row.price) || 0,
    publisher_name: row.contactName || row.agency_name || "Zameen listing",
    // Never store the real scraped seller contact: the site and the chatbot agent
    // must not be able to reach them. See scripts/anonymize-contacts.js
    publisher_num: SAFE_PHONE,
    publisher_email: SAFE_EMAIL,

    // optional fields (safe to omit if undefined)
    areaSqft: Number(row.area_sqft) || undefined,
    bedroom: Number(row.rooms) || 0,
    bathroom: Number(row.baths) || 0,
    images: thumb ? [thumb] : [],
    location:
      row.latitude != null && row.longitude != null
        ? { lat: row.latitude, lng: row.longitude }
        : undefined,
    owner: null,
    sold: false,
    approved: true,
  };
}

// Dedupe key derived from fields that are effectively unique per Zameen listing.
// The seller phone is deliberately NOT part of the key: every imported listing
// stores the same safe number, so including it would break repeat runs.
function dedupeKey(row) {
  return `${row.title || ""}|${row.price || ""}`;
}

// --- main -----------------------------------------------------------------

async function main() {
  const args = process.argv.slice(2);
  const city = args.find((a) => !a.startsWith("--"));
  const dryRun = args.includes("--dry-run");

  if (!city) {
    console.error("usage: node scripts/import-zameen.js <city> [--dry-run]");
    console.error("example: node scripts/import-zameen.js Lahore-1");
    process.exit(1);
  }

  const file = `scripts/properties.json`;
  if (!fs.existsSync(file)) {
    console.error(`[!] ${file} not found. Run zameen_normalize.py first.`);
    process.exit(1);
  }

  const rows = JSON.parse(fs.readFileSync(file, "utf-8"));
  console.log(`[*] reading ${file}: ${rows.length} rows`);

  if (dryRun) {
    console.log("[dry-run] first row would import as:\n");
    console.log(JSON.stringify(toPropertyDoc(rows[0] || {}), null, 2));
    return;
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log("[*] connected to MongoDB");

  // Build the set of dedupe keys already in the DB for this city, so
  // repeated runs don't insert duplicates. Also add existing Zameen thumb
  // URLs as a secondary guard (in case the title/price changed).
  const existing = await Property.find(
    { approved: true, "images.0": { $regex: "media\\.zameen\\.com" } },
    { title: 1, price: 1, images: 1 }
  ).lean();

  const seenKeys = new Set(
    existing.map((p) => `${p.title || ""}|${p.price || ""}`)
  );
  const seenImageUrls = new Set();
  for (const p of existing) {
    for (const url of p.images || []) {
      if (url && url.includes("media.zameen.com")) seenImageUrls.add(url);
    }
  }
  console.log(
    `[*] ${existing.length} existing Zameen-imported properties already in DB`
  );

  let inserted = 0;
  let skipped = 0;
  let invalid = 0;

  for (const row of rows) {
    if (!row.externalID) { invalid++; continue; }

    const key = dedupeKey(row);
    const thumb = thumbnailUrl(row.cover_photo_id);

    if (seenKeys.has(key) || (thumb && seenImageUrls.has(thumb))) {
      skipped++;
      continue;
    }

    const doc = toPropertyDoc(row);
    try {
      await Property.create(doc);
      seenKeys.add(key);
      if (thumb) seenImageUrls.add(thumb);
      inserted++;
      if (inserted % 25 === 0) {
        console.log(
          `[+] inserted=${inserted} skipped=${skipped} invalid=${invalid}`
        );
      }
    } catch (e) {
      // Log and continue; do not stop the whole run over one bad row.
      console.error(`[!] externalID ${row.externalID}: ${e.message}`);
      invalid++;
    }
  }

  console.log(
    `[*] done: inserted=${inserted} skipped(dup)=${skipped} invalid/failed=${invalid}`
  );
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});