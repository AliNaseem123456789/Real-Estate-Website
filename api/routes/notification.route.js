import express from "express";
import {
  createSavedSearch,
  deleteSavedSearch,
  getNotifications,
  getSavedSearches,
  markAllRead,
} from "../controllers/notification.controller.js";
import { verifyToken } from "../middleware/verifyToken.js";

// Mounted at /api, so the paths below are /api/notifications and /api/saved-searches
const router = express.Router();

router.get("/notifications", verifyToken, getNotifications);
router.patch("/notifications/read-all", verifyToken, markAllRead);

router.get("/saved-searches", verifyToken, getSavedSearches);
router.post("/saved-searches", verifyToken, createSavedSearch);
router.delete("/saved-searches/:id", verifyToken, deleteSavedSearch);

export default router;
