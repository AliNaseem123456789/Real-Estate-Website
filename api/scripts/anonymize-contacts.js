// Replaces every seller contact detail in the database with your own, so the
// chatbot agent (or anyone testing the site) can never reach a real seller.
// The scraped listings in scripts/properties.json carry real phone numbers.
//
//   cd api
//   node scripts/anonymize-contacts.js                 # dry run, changes nothing
//   node scripts/anonymize-contacts.js --yes           # apply to the database
//   node scripts/anonymize-contacts.js --yes --scrub-source   # also clean the scraped JSON
//   node scripts/anonymize-contacts.js --restore       # put the old values back
//
// Override the safe details with SAFE_CONTACT_PHONE / SAFE_CONTACT_EMAIL in .env.

import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";
import Property from "../models/property.model.js";
import Enquiry from "../models/enquiry.model.js";
import User from "../models/user.model.js";

const PHONE = process.env.SAFE_CONTACT_PHONE || "03099412527";
const EMAIL = process.env.SAFE_CONTACT_EMAIL || "alinaseem21102002@gmail.com";

const apply = process.argv.includes("--yes");
const scrubSource = process.argv.includes("--scrub-source");
const restore = process.argv.includes("--restore");

const here = path.dirname(fileURLToPath(import.meta.url));
// api/data is in .gitignore, so the real numbers in the backup are never committed
const BACKUP = path.join(here, "..", "data", "contacts-backup.json");
const SOURCE = path.join(here, "properties.json");

const line = () => console.log("-".repeat(60));

await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 15000 });

// ---------------------------------------------------------------- restore
if (restore) {
  if (!fs.existsSync(BACKUP)) {
    console.log(`No backup at ${BACKUP} — nothing to restore.`);
    await mongoose.disconnect();
    process.exit(1);
  }
  const rows = JSON.parse(fs.readFileSync(BACKUP, "utf8"));
  let restored = 0;
  for (const row of rows) {
    const result = await Property.updateOne(
      { _id: row._id },
      { publisher_num: row.publisher_num, publisher_email: row.publisher_email }
    );
    restored += result.modifiedCount;
  }
  console.log(`Restored original contacts on ${restored} of ${rows.length} listings.`);
  await mongoose.disconnect();
  process.exit(0);
}

// ---------------------------------------------------------------- report
const needsChange = {
  $or: [{ publisher_num: { $ne: PHONE } }, { publisher_email: { $ne: EMAIL } }],
};

const total = await Property.countDocuments();
const stale = await Property.countDocuments(needsChange);
const distinctNums = await Property.distinct("publisher_num", needsChange);

line();
console.log(`Safe phone : ${PHONE}`);
console.log(`Safe email : ${EMAIL}`);
line();
console.log(`Listings in database     : ${total}`);
console.log(`Still showing other data : ${stale}`);
console.log(`Distinct phone numbers   : ${distinctNums.length}`);
if (distinctNums.length) {
  const sample = distinctNums.slice(0, 8).map((n) => n || "(empty)");
  console.log(`  e.g. ${sample.join(", ")}${distinctNums.length > 8 ? " …" : ""}`);
}

// Agent profiles (users) keep their own phone field; emails are login identities
// and are never touched, because changing them would lock people out.
const agentPhones = await User.countDocuments({ phone: { $nin: ["", PHONE] } });
const enquiries = await Enquiry.countDocuments({
  $or: [{ phone: { $nin: ["", PHONE] } }, { email: { $ne: EMAIL } }],
});
console.log(`User profiles with a phone set : ${agentPhones}`);
console.log(`Enquiries with visitor contacts: ${enquiries}`);
line();

if (!apply) {
  console.log("Dry run — nothing was changed.");
  console.log("Re-run with --yes to apply (add --scrub-source to clean the scraped JSON too).");
  await mongoose.disconnect();
  process.exit(0);
}

// ---------------------------------------------------------------- back up
const originals = await Property.find(needsChange, "publisher_num publisher_email").lean();
fs.mkdirSync(path.dirname(BACKUP), { recursive: true });
fs.writeFileSync(BACKUP, JSON.stringify(originals, null, 2));
console.log(`Backed up ${originals.length} original contacts to data/contacts-backup.json`);

// ---------------------------------------------------------------- apply
const properties = await Property.updateMany(needsChange, {
  publisher_num: PHONE,
  publisher_email: EMAIL,
});
console.log(`Listings updated        : ${properties.modifiedCount}`);

const users = await User.updateMany({ phone: { $nin: ["", PHONE] } }, { phone: PHONE });
console.log(`User phone numbers      : ${users.modifiedCount}`);

const visitors = await Enquiry.updateMany(
  { $or: [{ phone: { $nin: ["", PHONE] } }, { email: { $ne: EMAIL } }] },
  { phone: PHONE, email: EMAIL }
);
console.log(`Enquiry contacts        : ${visitors.modifiedCount}`);

// ------------------------------------------------------- scrub the source
if (scrubSource) {
  if (!fs.existsSync(SOURCE)) {
    console.log(`\nNo scripts/properties.json found — nothing to scrub.`);
  } else {
    const rows = JSON.parse(fs.readFileSync(SOURCE, "utf8"));
    let touched = 0;
    for (const row of rows) {
      let changed = false;
      for (const field of ["phone", "mobile", "whatsapp"]) {
        if (row[field] && row[field] !== PHONE) {
          row[field] = PHONE;
          changed = true;
        }
      }
      if (changed) touched += 1;
    }
    fs.copyFileSync(SOURCE, `${SOURCE}.bak`);
    fs.writeFileSync(SOURCE, JSON.stringify(rows, null, 2));
    console.log(`\nScrubbed ${touched} of ${rows.length} rows in scripts/properties.json`);
    console.log("Original kept as scripts/properties.json.bak (delete it once you are happy).");
  }
}

line();
console.log("Done. Every listing now shows your phone and email.");
await mongoose.disconnect();
