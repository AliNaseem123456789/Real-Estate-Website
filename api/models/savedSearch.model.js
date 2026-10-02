import mongoose from "mongoose";

// "Alert me": the user is notified when a new listing matches these filters
const savedSearchSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    // Same names as the search filters, e.g. { action: "rent", city: "Lahore", maxPrice: 80000 }
    filters: { type: Object, default: {} },
  },
  { timestamps: true }
);

const SavedSearch = mongoose.model("SavedSearch", savedSearchSchema);

export default SavedSearch;
