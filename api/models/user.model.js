import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    avatar: {
      type: String,
      default:
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQaen3n84D-Kh6KixexhShnMf0wI3rINRfyGhY_PN9jmA&s",
    },
    // "admin" can approve, hide and delete any listing (see scripts/make-admin.js)
    role: { type: String, enum: ["user", "admin"], default: "user" },

    // Agent profile (shown on /agents/:id)
    isAgent: { type: Boolean, default: false },
    verified: { type: Boolean, default: false }, // set by an admin
    phone: { type: String, default: "" },
    agency: { type: String, default: "" },
    bio: { type: String, default: "", maxlength: 500 },

    // Saved (hearted) properties
    favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: "Property" }],
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;
