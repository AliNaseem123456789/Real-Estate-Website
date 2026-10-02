import mongoose from "mongoose";
import Property from "../models/property.model.js";
import { createError } from "../utils/createError.js";
import { uploadImage } from "../utils/cloudinary.js";
import { sizeToSqft } from "../utils/area.js";
import { buildPropertyQuery, PUBLIC_FILTER, SORT_OPTIONS } from "../utils/propertyQuery.js";
import { alertNewListing, alertPriceDrop } from "../utils/alerts.js";
import { isAdminUser } from "../middleware/verifyToken.js";

const PAGE_SIZE = 9;
const MAX_IMAGES = 4;

const REQUIRED_FIELDS = [
  "type",
  "action",
  "size",
  "title",
  "city",
  "address",
  "description",
  "price",
  "publisher_name",
  "publisher_num",
  "publisher_email",
];

// Picks the allowed fields from the submitted form (so nobody can set "approved" etc.)
const readPropertyFields = (body) => {
  const fields = {
    type: body.type,
    action: body.action,
    size: body.size,
    areaSqft: sizeToSqft(body.size),
    title: body.title,
    city: body.city,
    address: body.address,
    description: body.description,
    price: body.price,
    bedroom: body.bedroom || 0,
    bathroom: body.bathroom || 0,
    publisher_name: body.publisher_name,
    publisher_num: body.publisher_num,
    publisher_email: body.publisher_email,
  };
  if (body.lat && body.lng) {
    fields.location = { lat: Number(body.lat), lng: Number(body.lng) };
  }
  return fields;
};

// Loads a property and checks the logged-in user may change it (owner or admin)
const findOwnProperty = async (req) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) throw createError(404, "Property not found");

  const property = await Property.findById(id);
  if (!property) throw createError(404, "Property not found");

  const isOwner = property.owner?.toString() === req.user.id;
  if (!isOwner && !(await isAdminUser(req.user.id))) {
    throw createError(403, "You can only change your own listings");
  }
  return property;
};

// GET /api/properties?action=rent&type=Residential&city=Lahore&minPrice=&maxPrice=
//     &bedrooms=2&bathrooms=1&minArea=1125&sort=price_asc&page=1
// (or ?ids=a,b,c for Compare / Recently viewed, or ?owner=userId for an agent's page)
export const getProperties = async (req, res, next) => {
  try {
    const query = buildPropertyQuery(req.query);
    const sort = SORT_OPTIONS[req.query.sort] || SORT_OPTIONS.newest;
    const currentPage = Math.max(1, Number(req.query.page) || 1);
    const pageSize = req.query.ids ? 10 : PAGE_SIZE;

    const [properties, total] = await Promise.all([
      Property.find(query, "-reports")
        .sort(sort)
        .skip((currentPage - 1) * pageSize)
        .limit(pageSize),
      Property.countDocuments(query),
    ]);

    res.json({
      properties,
      page: currentPage,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
      total,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/properties/cities → ["Islamabad", "Karachi", ...] (for the search box)
export const getCities = async (req, res, next) => {
  try {
    const cities = await Property.distinct("city", PUBLIC_FILTER);
    res.json(cities.filter(Boolean).sort());
  } catch (error) {
    next(error);
  }
};

// GET /api/properties/:id  (unapproved listings only for their owner or an admin)
export const getProperty = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return next(createError(404, "Property not found"));

    const property = await Property.findById(id, "-reports").populate(
      "owner",
      "username avatar isAgent verified agency"
    );
    if (!property) return next(createError(404, "Property not found"));

    if (property.approved === false) {
      const isOwner = req.user && property.owner?._id.toString() === req.user.id;
      if (!isOwner && !(await isAdminUser(req.user?.id))) {
        return next(createError(404, "Property not found"));
      }
    }

    res.json(property);
  } catch (error) {
    next(error);
  }
};

// GET /api/properties/mine  (logged in) → the user's own listings, including hidden ones
export const getMyProperties = async (req, res, next) => {
  try {
    const properties = await Property.find({ owner: req.user.id }, "-reports").sort({ _id: -1 });
    res.json(properties);
  } catch (error) {
    next(error);
  }
};

// POST /api/properties  (logged in, multipart form with up to 4 "images")
export const createProperty = async (req, res, next) => {
  try {
    const missing = REQUIRED_FIELDS.filter((field) => !req.body[field]);
    if (missing.length > 0) {
      return next(createError(400, `Please fill in: ${missing.join(", ")}`));
    }
    if (!req.files || req.files.length === 0) {
      return next(createError(400, "Please upload at least one image"));
    }

    const images = await Promise.all(
      req.files.map((file) => uploadImage(file.buffer, "properties"))
    );

    const property = await Property.create({
      ...readPropertyFields(req.body),
      images,
      owner: req.user.id,
      // Set REQUIRE_APPROVAL=true in .env to make new listings wait for an admin
      approved: process.env.REQUIRE_APPROVAL !== "true",
    });

    alertNewListing(property); // runs in the background
    res.status(201).json(property);
  } catch (error) {
    next(error);
  }
};

// PUT /api/properties/:id  (owner or admin, multipart form)
// "keepImages" = JSON list of existing image URLs to keep; new files go in "images"
export const updateProperty = async (req, res, next) => {
  try {
    const property = await findOwnProperty(req);

    const missing = REQUIRED_FIELDS.filter((field) => !req.body[field]);
    if (missing.length > 0) {
      return next(createError(400, `Please fill in: ${missing.join(", ")}`));
    }

    let keepImages = [];
    try {
      keepImages = JSON.parse(req.body.keepImages || "[]");
    } catch {
      return next(createError(400, "keepImages must be a JSON list"));
    }
    // Only keep URLs that really belong to this property
    keepImages = keepImages.filter((url) => property.images.includes(url));

    const newImages = await Promise.all(
      (req.files || []).map((file) => uploadImage(file.buffer, "properties"))
    );
    const images = [...keepImages, ...newImages];
    if (images.length === 0) return next(createError(400, "Please keep at least one image"));
    if (images.length > MAX_IMAGES) {
      return next(createError(400, `A listing can have up to ${MAX_IMAGES} images`));
    }

    const oldPrice = property.price;
    property.set({ ...readPropertyFields(req.body), images });
    if (!req.body.lat || !req.body.lng) property.location = undefined;
    await property.save();

    if (property.price < oldPrice) alertPriceDrop(property, oldPrice);
    res.json(property);
  } catch (error) {
    next(error);
  }
};

// PATCH /api/properties/:id/sold  { sold: true|false }
export const setSold = async (req, res, next) => {
  try {
    const property = await findOwnProperty(req);
    property.sold = Boolean(req.body.sold);
    await property.save();
    res.json(property);
  } catch (error) {
    next(error);
  }
};

// DELETE /api/properties/:id  (owner or admin)
export const deleteProperty = async (req, res, next) => {
  try {
    const property = await findOwnProperty(req);
    await property.deleteOne();
    res.json("Property has been deleted");
  } catch (error) {
    next(error);
  }
};

// POST /api/properties/:id/report  { reason }  (logged in)
export const reportProperty = async (req, res, next) => {
  try {
    const reason = String(req.body.reason || "").trim();
    if (!reason) return next(createError(400, "Please tell us what is wrong"));
    if (!mongoose.isValidObjectId(req.params.id)) {
      return next(createError(404, "Property not found"));
    }

    const property = await Property.findById(req.params.id);
    if (!property) return next(createError(404, "Property not found"));

    const alreadyReported = property.reports.some((r) => r.user?.toString() === req.user.id);
    if (!alreadyReported) {
      property.reports.push({ user: req.user.id, reason: reason.slice(0, 300) });
      await property.save();
    }
    res.json("Thanks, an admin will review this listing");
  } catch (error) {
    next(error);
  }
};

// Reads a chat message like "3 bed house for rent in Lahore under 80k"
// and turns it into search filters.
const filtersFromText = (text, cities) => {
  const message = text.toLowerCase();
  const filters = {};

  if (/\b(rent|rental|kiraya|lease)\b/.test(message)) filters.action = "rent";
  else if (/\b(buy|sale|sell|purchase|kharid)/.test(message)) filters.action = "sell";

  if (/\b(plot|land)\b/.test(message)) filters.type = "Plot";
  else if (/\b(shop|office|commercial|warehouse)\b/.test(message)) filters.type = "Commercial";
  else if (/\b(house|home|flat|apartment|villa|residential)\b/.test(message)) {
    filters.type = "Residential";
  }

  const beds = message.match(/(\d+)\s*(bed|bd|bedroom|room)/);
  if (beds) filters.bedrooms = beds[1];

  const price = message.match(
    /(under|below|less than|max|upto|up to|within)\s*(?:rs\.?|pkr)?\s*([\d.,]+)\s*(lakh|lac|crore|cr|k|thousand|million|m)?/
  );
  if (price) {
    const multipliers = { lakh: 1e5, lac: 1e5, crore: 1e7, cr: 1e7, k: 1e3, thousand: 1e3, million: 1e6, m: 1e6 };
    filters.maxPrice = Number(price[2].replace(/,/g, "")) * (multipliers[price[3]] || 1);
  }

  const city = cities.find((name) => message.includes(name.toLowerCase()));
  if (city) filters.city = city;

  return filters;
};

// GET /api/properties/chat-search?q=... → up to 3 matching listings for the chatbot
export const chatSearch = async (req, res, next) => {
  try {
    const text = String(req.query.q || "").slice(0, 300);
    const cities = await Property.distinct("city", PUBLIC_FILTER);
    const filters = filtersFromText(text, cities);

    // Only answer when the message actually looks like a property search
    if (Object.keys(filters).length === 0) return res.json({ filters, properties: [] });

    const properties = await Property.find(
      { ...buildPropertyQuery(filters), sold: { $ne: true } },
      "title city price images action"
    )
      .sort({ _id: -1 })
      .limit(3);

    res.json({ filters, properties });
  } catch (error) {
    next(error);
  }
};
