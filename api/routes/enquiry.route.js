import express from "express";
import {
  createEnquiry,
  deleteEnquiry,
  getMyEnquiries,
  markEnquiryRead,
} from "../controllers/enquiry.controller.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { rateLimit } from "../middleware/rateLimit.js";

const router = express.Router();

router.post("/", rateLimit(5, 10), createEnquiry); // max 5 messages per 10 minutes per visitor
router.get("/", verifyToken, getMyEnquiries);
router.patch("/:id/read", verifyToken, markEnquiryRead);
router.delete("/:id", verifyToken, deleteEnquiry);

export default router;
