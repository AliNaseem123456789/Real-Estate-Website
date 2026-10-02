import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import { createError } from "../utils/createError.js";

// Only lets the request through if the user is logged in.
// Sets req.user = { id } for the next handler.
export const verifyToken = (req, res, next) => {
  const token = req.cookies.access_token;
  if (!token) return next(createError(401, "Please sign in first"));

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return next(createError(403, "Your session has expired, please sign in again"));
    req.user = user;
    next();
  });
};

// Like verifyToken, but lets visitors through too (req.user is only set if logged in)
export const optionalAuth = (req, res, next) => {
  const token = req.cookies.access_token;
  if (!token) return next();

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (!err) req.user = user;
    next();
  });
};

// Use after verifyToken: only admins get through. Sets req.isAdmin = true.
export const verifyAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id, "role");
    if (user?.role !== "admin") return next(createError(403, "Admins only"));
    req.isAdmin = true;
    next();
  } catch (error) {
    next(error);
  }
};

// Checks if the logged-in user is an admin (without blocking the request)
export const isAdminUser = async (userId) => {
  if (!userId) return false;
  const user = await User.findById(userId, "role");
  return user?.role === "admin";
};
