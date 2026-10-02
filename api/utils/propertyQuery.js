import mongoose from "mongoose";

// Listings the public can see: approved (old listings have no "approved" field)
export const PUBLIC_FILTER = { approved: { $ne: false } };

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Turns search filters (from the URL or a saved search) into a MongoDB query.
// String()/Number() make sure nobody can send a Mongo operator instead of a value.
export const buildPropertyQuery = (filters = {}) => {
  const { action, type, city, minPrice, maxPrice, bedrooms, bathrooms, minArea, ids, owner } =
    filters;

  const query = { ...PUBLIC_FILTER };
  if (action) query.action = String(action);
  if (type) query.type = String(type);
  if (city) query.city = { $regex: escapeRegex(String(city).trim()), $options: "i" };

  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);
  }
  if (bedrooms) query.bedroom = { $gte: Number(bedrooms) };
  if (bathrooms) query.bathroom = { $gte: Number(bathrooms) };
  if (minArea) query.areaSqft = { $gte: Number(minArea) };

  // A list of ids, used by Compare and Recently viewed
  if (ids) {
    query._id = {
      $in: String(ids)
        .split(",")
        .filter((id) => mongoose.isValidObjectId(id)),
    };
  }
  if (owner && mongoose.isValidObjectId(owner)) query.owner = owner;

  return query;
};

export const SORT_OPTIONS = {
  newest: { _id: -1 },
  price_asc: { price: 1 },
  price_desc: { price: -1 },
  area_desc: { areaSqft: -1 },
};
