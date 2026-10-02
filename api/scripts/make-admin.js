// Gives a user the admin role so they can open /admin on the website.
//   cd api
//   npm run make-admin -- your@email.com

import "dotenv/config";
import mongoose from "mongoose";
import User from "../models/user.model.js";

const email = process.argv[2];
if (!email) {
  console.log("Usage: npm run make-admin -- your@email.com");
  process.exit(1);
}

await mongoose.connect(process.env.MONGO_URI);
const user = await User.findOneAndUpdate({ email }, { role: "admin" }, { new: true });

if (user) {
  console.log(`✔ ${user.username} (${user.email}) is now an admin. Sign out and in again on the website.`);
} else {
  console.log(`No user found with email ${email}. Sign up on the website first.`);
}
await mongoose.disconnect();
