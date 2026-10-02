import express from "express";
import { getMarketAreas, getMarketCities, priceCheck } from "../controllers/market.controller.js";

// Neighbourhood price statistics for the price map (read-only)
const router = express.Router();

router.get("/cities", getMarketCities);
router.get("/areas", getMarketAreas);
router.get("/price-check/:propertyId", priceCheck);

export default router;
