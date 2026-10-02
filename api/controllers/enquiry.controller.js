import mongoose from "mongoose";
import Enquiry from "../models/enquiry.model.js";
import Property from "../models/property.model.js";
import { createError } from "../utils/createError.js";
import { notify } from "../utils/alerts.js";

// POST /api/enquiries  { propertyId, name, email, phone, message }  (anyone)
export const createEnquiry = async (req, res, next) => {
  try {
    const { propertyId, name, email, phone, message } = req.body;
    if (!name || !email || !message) {
      return next(createError(400, "Name, email and message are required"));
    }
    if (!mongoose.isValidObjectId(propertyId)) {
      return next(createError(404, "Property not found"));
    }

    const property = await Property.findById(propertyId, "title owner");
    if (!property) return next(createError(404, "Property not found"));
    if (!property.owner) {
      // Very old listings have no account linked to them
      return next(createError(400, "Please contact this seller by phone or WhatsApp"));
    }

    await Enquiry.create({
      property: property._id,
      owner: property.owner,
      name: String(name).slice(0, 100),
      email: String(email).slice(0, 200),
      phone: String(phone || "").slice(0, 30),
      message: String(message).slice(0, 2000),
    });
    await notify(property.owner, `New enquiry from ${name} about "${property.title}"`, "/dashboard?tab=enquiries");

    res.status(201).json("Your message has been sent to the seller");
  } catch (error) {
    next(error);
  }
};

// GET /api/enquiries  (logged in) → enquiries for the user's listings
export const getMyEnquiries = async (req, res, next) => {
  try {
    const enquiries = await Enquiry.find({ owner: req.user.id })
      .populate("property", "title")
      .sort({ _id: -1 })
      .limit(100);
    res.json(enquiries);
  } catch (error) {
    next(error);
  }
};

// Loads an enquiry that belongs to the logged-in user
const findOwnEnquiry = async (req) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw createError(404, "Enquiry not found");
  const enquiry = await Enquiry.findOne({ _id: req.params.id, owner: req.user.id });
  if (!enquiry) throw createError(404, "Enquiry not found");
  return enquiry;
};

// PATCH /api/enquiries/:id/read
export const markEnquiryRead = async (req, res, next) => {
  try {
    const enquiry = await findOwnEnquiry(req);
    enquiry.read = true;
    await enquiry.save();
    res.json(enquiry);
  } catch (error) {
    next(error);
  }
};

// DELETE /api/enquiries/:id
export const deleteEnquiry = async (req, res, next) => {
  try {
    const enquiry = await findOwnEnquiry(req);
    await enquiry.deleteOne();
    res.json("Enquiry deleted");
  } catch (error) {
    next(error);
  }
};
