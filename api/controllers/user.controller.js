import bcryptjs from "bcryptjs";
import mongoose from "mongoose";
import User from "../models/user.model.js";
import Property from "../models/property.model.js";
import { createError } from "../utils/createError.js";
import { uploadImage } from "../utils/cloudinary.js";
import { PUBLIC_FILTER } from "../utils/propertyQuery.js";

// Never send the password to the browser
const withoutPassword = (user) => {
  const { password, ...rest } = user._doc;
  return rest;
};

export const updateUser = async (req, res, next) => {
  if (req.user.id !== req.params.id) {
    return next(createError(401, "You can only update your own account"));
  }

  // Only change the fields that were sent
  const updates = {};
  const { username, email, password, avatar, phone, agency, bio, isAgent } = req.body;
  if (username) updates.username = username;
  if (email) updates.email = email;
  if (avatar) updates.avatar = avatar;
  if (phone !== undefined) updates.phone = String(phone).slice(0, 30);
  if (agency !== undefined) updates.agency = String(agency).slice(0, 100);
  if (bio !== undefined) updates.bio = String(bio).slice(0, 500);
  if (isAgent !== undefined) updates.isAgent = Boolean(isAgent);
  if (password) {
    if (password.length < 6) {
      return next(createError(400, "Password must be at least 6 characters"));
    }
    updates.password = bcryptjs.hashSync(password, 10);
  }

  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );
    if (!updatedUser) return next(createError(404, "User not found"));
    res.status(200).json(withoutPassword(updatedUser));
  } catch (error) {
    if (error.code === 11000) {
      return next(createError(409, "That username or email is already taken"));
    }
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  if (req.user.id !== req.params.id) {
    return next(createError(401, "You can only delete your own account"));
  }
  try {
    await User.findByIdAndDelete(req.params.id);
    res.clearCookie("access_token");
    res.status(200).json("User has been deleted");
  } catch (error) {
    next(error);
  }
};

// POST /api/user/avatar  (form field "avatar") → { url }
export const uploadAvatar = async (req, res, next) => {
  if (!req.file) return next(createError(400, "Please choose an image"));
  try {
    const url = await uploadImage(req.file.buffer, "avatars");
    res.json({ url });
  } catch (error) {
    next(error);
  }
};

// GET /api/user/me → the logged-in user (used to refresh favourites etc.)
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return next(createError(404, "User not found"));
    res.json(withoutPassword(user));
  } catch (error) {
    next(error);
  }
};

// GET /api/user/favorites → the saved properties
export const getFavorites = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id, "favorites");
    const properties = await Property.find(
      { _id: { $in: user?.favorites || [] }, ...PUBLIC_FILTER },
      "-reports"
    );
    res.json(properties);
  } catch (error) {
    next(error);
  }
};

// POST /api/user/favorites/:propertyId → adds or removes it, returns the new list of ids
export const toggleFavorite = async (req, res, next) => {
  const { propertyId } = req.params;
  if (!mongoose.isValidObjectId(propertyId)) {
    return next(createError(404, "Property not found"));
  }
  try {
    const user = await User.findById(req.user.id, "favorites");
    if (!user) return next(createError(404, "User not found"));

    const isSaved = user.favorites.some((id) => id.toString() === propertyId);
    const update = isSaved
      ? { $pull: { favorites: propertyId } }
      : { $addToSet: { favorites: propertyId } };

    const updated = await User.findByIdAndUpdate(req.user.id, update, { new: true });
    res.json(updated.favorites);
  } catch (error) {
    next(error);
  }
};

// GET /api/agents/:id → public profile of a user/agent
export const getAgentProfile = async (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) return next(createError(404, "Profile not found"));
  try {
    const user = await User.findById(
      id,
      "username avatar isAgent verified agency bio phone email createdAt"
    );
    if (!user) return next(createError(404, "Profile not found"));

    const listings = await Property.find({ owner: id, ...PUBLIC_FILTER }, "-reports").sort({
      _id: -1,
    });

    // Only agents show their phone and email publicly
    const profile = user.toObject();
    if (!user.isAgent) {
      delete profile.phone;
      delete profile.email;
    }
    res.json({ profile, listings });
  } catch (error) {
    next(error);
  }
};
