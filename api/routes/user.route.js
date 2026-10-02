import express from "express";
import {
  deleteUser,
  getFavorites,
  getMe,
  toggleFavorite,
  updateUser,
  uploadAvatar,
} from "../controllers/user.controller.js";
import { verifyToken } from "../middleware/verifyToken.js";
import upload from "../middleware/upload.js";

const router = express.Router();

router.get("/me", verifyToken, getMe);
router.post("/avatar", verifyToken, upload.single("avatar"), uploadAvatar);
router.post("/update/:id", verifyToken, updateUser);
router.delete("/delete/:id", verifyToken, deleteUser);

router.get("/favorites", verifyToken, getFavorites);
router.post("/favorites/:propertyId", verifyToken, toggleFavorite);

export default router;
