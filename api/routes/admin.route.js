import express from "express";
import {
  clearReports,
  getAdminProperties,
  getStats,
  getUsers,
  setApproved,
  updateUserByAdmin,
} from "../controllers/admin.controller.js";
import { deleteProperty } from "../controllers/property.controller.js";
import { verifyAdmin, verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

// Every admin route needs a logged-in admin
router.use(verifyToken, verifyAdmin);

router.get("/stats", getStats);
router.get("/properties", getAdminProperties);
router.patch("/properties/:id", setApproved);
router.post("/properties/:id/clear-reports", clearReports);
router.delete("/properties/:id", deleteProperty);
router.get("/users", getUsers);
router.patch("/users/:id", updateUserByAdmin);

export default router;
