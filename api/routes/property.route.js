import express from "express";
import {
  chatSearch,
  createProperty,
  deleteProperty,
  getCities,
  getMyProperties,
  getProperties,
  getProperty,
  reportProperty,
  setSold,
  updateProperty,
} from "../controllers/property.controller.js";
import { optionalAuth, verifyToken } from "../middleware/verifyToken.js";
import upload from "../middleware/upload.js";

const router = express.Router();

// Fixed paths first, so they are not mistaken for an :id
router.get("/", getProperties);
router.get("/cities", getCities);
router.get("/chat-search", chatSearch);
router.get("/mine", verifyToken, getMyProperties);
router.get("/:id", optionalAuth, getProperty);

router.post("/", verifyToken, upload.array("images", 4), createProperty);
router.put("/:id", verifyToken, upload.array("images", 4), updateProperty);
router.patch("/:id/sold", verifyToken, setSold);
router.delete("/:id", verifyToken, deleteProperty);
router.post("/:id/report", verifyToken, reportProperty);

export default router;
