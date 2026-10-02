import express from "express";
import { getAgentProfile } from "../controllers/user.controller.js";

const router = express.Router();

router.get("/:id", getAgentProfile);

export default router;
