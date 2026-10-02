import express from "express";
import mongoose from "mongoose";
import Property from "../models/property.model.js";

// Share links: /share/properties/:id
// WhatsApp / Facebook read the preview (title, photo, price) from this small page,
// and real visitors are sent straight on to the normal property page.
const router = express.Router();

const escapeHtml = (text = "") =>
  String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

router.get("/properties/:id", async (req, res, next) => {
  const pagePath = `/properties/${req.params.id}`;
  try {
    const property = mongoose.isValidObjectId(req.params.id)
      ? await Property.findOne({ _id: req.params.id, approved: { $ne: false } })
      : null;
    if (!property) return res.redirect(pagePath);

    const siteUrl = (process.env.CLIENT_URL || "").replace(/\/$/, "");
    const title = `${property.title} — PKR ${property.price.toLocaleString("en-PK")}`;
    const description = `${property.action === "sell" ? "For sale" : "For rent"} in ${
      property.city
    } · ${property.size}. ${property.description.slice(0, 150)}`;

    res.send(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Profit Builders" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:image" content="${escapeHtml(property.images[0] || "")}" />
  <meta property="og:url" content="${escapeHtml(siteUrl + pagePath)}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta http-equiv="refresh" content="0; url=${escapeHtml(pagePath)}" />
</head>
<body>
  <p><a href="${escapeHtml(pagePath)}">View this property</a></p>
</body>
</html>`);
  } catch (error) {
    next(error);
  }
});

export default router;
