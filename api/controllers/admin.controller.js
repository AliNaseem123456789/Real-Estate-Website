import mongoose from "mongoose";
import Property from "../models/property.model.js";
import User from "../models/user.model.js";
import { createError } from "../utils/createError.js";
import { alertNewListing, notify } from "../utils/alerts.js";

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// GET /api/admin/stats
export const getStats = async (req, res, next) => {
  try {
    const [properties, pending, reported, users, agents] = await Promise.all([
      Property.countDocuments(),
      Property.countDocuments({ approved: false }),
      Property.countDocuments({ "reports.0": { $exists: true } }),
      User.countDocuments(),
      User.countDocuments({ isAgent: true }),
    ]);
    res.json({ properties, pending, reported, users, agents });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/properties?status=pending|reported|all&q=search
export const getAdminProperties = async (req, res, next) => {
  try {
    const { status = "pending", q } = req.query;
    const query = {};
    if (status === "pending") query.approved = false;
    if (status === "reported") query["reports.0"] = { $exists: true };
    if (q) query.title = { $regex: escapeRegex(String(q)), $options: "i" };

    const properties = await Property.find(query)
      .populate("owner", "username email")
      .populate("reports.user", "username")
      .sort({ _id: -1 })
      .limit(100);
    res.json(properties);
  } catch (error) {
    next(error);
  }
};

const findProperty = async (id) => {
  if (!mongoose.isValidObjectId(id)) throw createError(404, "Property not found");
  const property = await Property.findById(id);
  if (!property) throw createError(404, "Property not found");
  return property;
};

// PATCH /api/admin/properties/:id  { approved: true|false }
export const setApproved = async (req, res, next) => {
  try {
    const property = await findProperty(req.params.id);
    const wasApproved = property.approved !== false;
    property.approved = Boolean(req.body.approved);
    await property.save();

    if (property.owner && property.approved !== wasApproved) {
      await notify(
        property.owner,
        property.approved
          ? `Your listing "${property.title}" is now live`
          : `Your listing "${property.title}" was hidden by an admin`,
        `/properties/${property._id}`
      );
    }
    if (property.approved && !wasApproved) alertNewListing(property);

    res.json(property);
  } catch (error) {
    next(error);
  }
};

// POST /api/admin/properties/:id/clear-reports
export const clearReports = async (req, res, next) => {
  try {
    const property = await findProperty(req.params.id);
    property.reports = [];
    await property.save();
    res.json(property);
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/users?q=search
export const getUsers = async (req, res, next) => {
  try {
    const query = {};
    if (req.query.q) {
      const search = { $regex: escapeRegex(String(req.query.q)), $options: "i" };
      query.$or = [{ username: search }, { email: search }];
    }
    const users = await User.find(query, "-password -favorites").sort({ _id: -1 }).limit(100);
    res.json(users);
  } catch (error) {
    next(error);
  }
};

// PATCH /api/admin/users/:id  { verified, isAgent, role }
export const updateUserByAdmin = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return next(createError(404, "User not found"));

    const updates = {};
    if (req.body.verified !== undefined) updates.verified = Boolean(req.body.verified);
    if (req.body.isAgent !== undefined) updates.isAgent = Boolean(req.body.isAgent);
    if (["user", "admin"].includes(req.body.role)) {
      if (req.params.id === req.user.id && req.body.role !== "admin") {
        return next(createError(400, "You can't remove your own admin role"));
      }
      updates.role = req.body.role;
    }

    await User.updateOne({ _id: req.params.id }, { $set: updates });
    const user = await User.findById(req.params.id, "-password -favorites");
    if (!user) return next(createError(404, "User not found"));
    if (updates.verified) await notify(user._id, "Your agent profile is now verified ✔", `/agents/${user._id}`);
    res.json(user);
  } catch (error) {
    next(error);
  }
};
