import mongoose from "mongoose";

// Neighbourhood price statistics, built outside the website by the market-data
// Python tool (collection "area_stats"). The website only reads it.
const areaStatSchema = new mongoose.Schema(
  {
    city: String,
    location: String,
    subAreas: [String], // blocks merged into this area, e.g. "Johar Town Phase 1 - Block D"
    purpose: String, // "sell" | "rent"
    category: String, // "house" | "flat" | "plot" | "commercial"
    lat: Number,
    lng: Number,
    count: Number,
    lowConfidence: Boolean,
    medianPrice: Number,
    medianPricePerMarla: Number, // for rent: per month
    p25PricePerMarla: Number,
    p75PricePerMarla: Number,
    medianAreaMarla: Number,
    medianBedrooms: Number,
    sizeBands: [
      {
        _id: false,
        band: String,
        fromMarla: Number,
        toMarla: Number,
        count: Number,
        medianPrice: Number,
      },
    ],
    rentYears: Number, // sale rows: years of rent that equal the price
    dataCollectedOn: String,
  },
  { collection: "area_stats" }
);

const AreaStat = mongoose.model("AreaStat", areaStatSchema);

export default AreaStat;
