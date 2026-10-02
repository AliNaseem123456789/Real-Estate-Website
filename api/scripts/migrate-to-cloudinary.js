// ONE-TIME SCRIPT — run it once after setting up api/.env:
//   cd api
//   npm run migrate:images
//
// For every existing property it:
//   1. uploads its old photos (client/src/assets/properties/<prefix>-1.jpeg ...) to Cloudinary
//      and saves the URLs in the new "images" field
//   2. turns price / bedroom / bathroom from text into numbers
//   3. fixes the capitalisation of "type" (e.g. "residential" -> "Residential")
//   4. works out the area in square feet from "size" (e.g. "10 Marla" -> 2250)
// It is safe to run again: properties that already have images are skipped.

import "dotenv/config";
import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import cloudinary from "../utils/cloudinary.js";
import { sizeToSqft } from "../utils/area.js";
import Property from "../models/property.model.js";

const IMAGES_DIR = path.resolve("../client/src/assets/properties");

const toNumber = (value) => {
  if (typeof value !== "string") return value;
  const number = Number(value.replace(/,/g, "").trim() || 0);
  return Number.isNaN(number) ? undefined : number;
};

const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();

// Old photos are named "<prefix>-<n>.<ext>" (one is just "<prefix>.<ext>")
const findOldImages = (files, prefix) =>
  files
    .filter((file) => new RegExp(`^${prefix}(-\\d+)?\\.(jpe?g|png|webp)$`, "i").test(file))
    .sort((a, b) => {
      const numberOf = (file) => Number(file.match(/-(\d+)\./)?.[1] || 0);
      return numberOf(a) - numberOf(b);
    });

await mongoose.connect(process.env.MONGO_URI);
console.log("Connected to MongoDB");

const files = fs.existsSync(IMAGES_DIR) ? fs.readdirSync(IMAGES_DIR) : [];
// Read the raw documents so text values are not converted automatically
const properties = await Property.collection.find({}).toArray();
console.log(`Found ${properties.length} properties\n`);

for (const property of properties) {
  const updates = {};

  for (const field of ["price", "bedroom", "bathroom"]) {
    if (typeof property[field] === "string") {
      const number = toNumber(property[field]);
      if (number === undefined) {
        console.warn(`  ! ${property._id}: could not convert ${field} "${property[field]}"`);
      } else {
        updates[field] = number;
      }
    }
  }

  if (property.areaSqft === undefined && sizeToSqft(property.size) !== undefined) {
    updates.areaSqft = sizeToSqft(property.size);
  }

  if (typeof property.type === "string" && capitalize(property.type) !== property.type) {
    updates.type = capitalize(property.type);
  }
  if (typeof property.action === "string" && property.action.toLowerCase() !== property.action) {
    updates.action = property.action.toLowerCase();
  }

  if (!property.images?.length && property.image_prefix) {
    const oldImages = findOldImages(files, property.image_prefix);
    const urls = [];
    for (const file of oldImages) {
      const result = await cloudinary.uploader.upload(path.join(IMAGES_DIR, file), {
        folder: "real-estate/properties",
      });
      urls.push(result.secure_url);
    }
    if (urls.length > 0) updates.images = urls;
    else console.warn(`  ! ${property._id}: no photos found for prefix ${property.image_prefix}`);
  }

  if (Object.keys(updates).length > 0) {
    await Property.collection.updateOne({ _id: property._id }, { $set: updates });
    const imageCount = updates.images ? `${updates.images.length} images, ` : "";
    console.log(`✔ ${property.title}: ${imageCount}updated ${Object.keys(updates).join(", ")}`);
  } else {
    console.log(`- ${property.title}: nothing to change`);
  }
}

console.log("\nDone! After checking the site, you can delete client/src/assets/properties.");
await mongoose.disconnect();
