import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reason: { type: String, required: true, maxlength: 300 },
  },
  { timestamps: true }
);

const propertySchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ["Residential", "Commercial", "Plot"],
    },
    // "rent" = for rent, "sell" = for sale
    action: { type: String, required: true, enum: ["rent", "sell"] },
    // Size as typed, e.g. "10 Marla". areaSqft is the same size in square feet,
    // worked out automatically so we can filter and sort by area.
    size: { type: String, required: true },
    areaSqft: { type: Number, min: 0 },
    title: { type: String, required: true },
    city: { type: String, required: true },
    address: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    bedroom: { type: Number, default: 0, min: 0 },
    bathroom: { type: Number, default: 0, min: 0 },
    publisher_name: { type: String, required: true },
    publisher_num: { type: String, required: true },
    publisher_email: { type: String, required: true },
    // Cloudinary image URLs; the first one is the cover image
    images: { type: [String], default: [] },
    // Map pin (optional)
    location: {
      lat: { type: Number },
      lng: { type: Number },
    },
    // The user who posted the listing
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    sold: { type: Boolean, default: false },
    // Hidden from the public until an admin approves it.
    // Old listings don't have this field and count as approved.
    approved: { type: Boolean, default: true },
    // Visitors can report a listing; admins see reported listings
    reports: { type: [reportSchema], default: [] },

    // Old image numbering, only used by scripts/migrate-to-cloudinary.js
    image_prefix: { type: String },
  },
  { timestamps: true }
);

const Property = mongoose.model("Property", propertySchema);

export default Property;
