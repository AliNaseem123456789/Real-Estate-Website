import mongoose from "mongoose";
import Notification from "../models/notification.model.js";
import SavedSearch from "../models/savedSearch.model.js";
import { createError } from "../utils/createError.js";

// ---------- Notifications (bell icon) ----------

// GET /api/notifications → { notifications, unreadCount }
export const getNotifications = async (req, res, next) => {
  try {
    const [notifications, unreadCount] = await Promise.all([
      Notification.find({ user: req.user.id }).sort({ _id: -1 }).limit(30),
      Notification.countDocuments({ user: req.user.id, read: false }),
    ]);
    res.json({ notifications, unreadCount });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/notifications/read-all
export const markAllRead = async (req, res, next) => {
  try {
    await Notification.updateMany({ user: req.user.id, read: false }, { read: true });
    res.json("All notifications marked as read");
  } catch (error) {
    next(error);
  }
};

// ---------- Saved searches ("Alert me") ----------

const ALLOWED_FILTERS = ["action", "type", "city", "minPrice", "maxPrice", "bedrooms", "bathrooms", "minArea"];

// GET /api/saved-searches
export const getSavedSearches = async (req, res, next) => {
  try {
    const searches = await SavedSearch.find({ user: req.user.id }).sort({ _id: -1 });
    res.json(searches);
  } catch (error) {
    next(error);
  }
};

// POST /api/saved-searches  { action, city, maxPrice, ... }
export const createSavedSearch = async (req, res, next) => {
  try {
    const filters = {};
    ALLOWED_FILTERS.forEach((key) => {
      if (req.body[key]) filters[key] = String(req.body[key]);
    });

    const count = await SavedSearch.countDocuments({ user: req.user.id });
    if (count >= 10) return next(createError(400, "You can have up to 10 alerts"));

    const search = await SavedSearch.create({ user: req.user.id, filters });
    res.status(201).json(search);
  } catch (error) {
    next(error);
  }
};

// DELETE /api/saved-searches/:id
export const deleteSavedSearch = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return next(createError(404, "Alert not found"));
    await SavedSearch.deleteOne({ _id: req.params.id, user: req.user.id });
    res.json("Alert deleted");
  } catch (error) {
    next(error);
  }
};
