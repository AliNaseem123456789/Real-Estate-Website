import "dotenv/config"; // must be first, so every file can read process.env
import express from "express";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import cors from "cors";
import authRouter from "./routes/auth.route.js";
import userRouter from "./routes/user.route.js";
import propertyRouter from "./routes/property.route.js";
import enquiryRouter from "./routes/enquiry.route.js";
import notificationRouter from "./routes/notification.route.js";
import adminRouter from "./routes/admin.route.js";
import agentRouter from "./routes/agent.route.js";
import shareRouter from "./routes/share.route.js";
import marketRouter from "./routes/market.route.js";

const PORT = process.env.PORT || 3001;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

const app = express();

// Render / Railway sit behind a proxy; needed for secure cookies
app.set("trust proxy", 1);

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/properties", propertyRouter);
app.use("/api/enquiries", enquiryRouter);
app.use("/api/agents", agentRouter);
app.use("/api/admin", adminRouter);
app.use("/api/market", marketRouter); // neighbourhood price statistics
app.use("/api", notificationRouter); // /api/notifications and /api/saved-searches
app.use("/share", shareRouter); // link previews for WhatsApp / Facebook

// Error handler: every route sends errors here with next(error)
app.use((err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  if (err.name === "ValidationError" || err.name === "MulterError") {
    statusCode = 400;
  }
  const message = err.message || "Internal Server Error";
  if (statusCode === 500) console.error(err);

  res.status(statusCode).json({ success: false, statusCode, message });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
