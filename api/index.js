import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import userRouter from "./routes/user.route.js";
import authRouter from "./routes/auth.route.js";
import listingRouter from "./routes/listing.route.js";
import cookieParser from "cookie-parser";
import cors from "cors";
dotenv.config();
import PropertyModel from "./models/property.js";
import upload from "./middelware/upload.js";
// mongoose.connect(process.env.MONGO).then(() =>{
//     console.log('connected to MongoDB');})
//     .catch((err) =>{
//         console.log(err);
//    mongodb+srv://alinaseem20021021_db_user:<db_password>@cluster0.j16gmhw.mongodb.net/ });
mongoose
  .connect(
    "mongodb+srv://alinaseem20021021_db_user:ali123456789@cluster0.j16gmhw.mongodb.net/mydatabase?retryWrites=true&w=majority",
    { useNewUrlParser: true, useUnifiedTopology: true }
  )
  .then(() => console.log("Connected to MongoDB Atlas"))
  .catch((err) => console.error("MongoDB connection error:", err));

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
// allow json as input of this server

app.use(cookieParser());

app.listen(3001, () => {
  console.log("server is running on port 3000");
});

app.post("/submitForm", upload.array("images", 4), async (req, res) => {
  try {
    let {
      type,
      action,
      size,
      title,
      city,
      address,
      description,
      price,
      bedroom,
      bathroom,
      publisher_name,
      publisher_num,
      publisher_email,
    } = req.body;

    // Handle case where type or action comes as an array
    if (Array.isArray(type)) {
      type = type.filter((v) => v)[type.filter((v) => v).length - 1] || "";
    }
    if (Array.isArray(action)) {
      action =
        action.filter((v) => v)[action.filter((v) => v).length - 1] || "";
    }

    // Optional: basic validation
    if (!type || !action) {
      return res.status(400).json({ message: "Type and Action are required" });
    }

    const newProperty = new PropertyModel({
      type,
      action,
      size,
      title,
      city,
      address,
      description,
      price,
      bedroom,
      bathroom,
      publisher_name,
      publisher_num,
      publisher_email,
      image_prefix: req.image_prefix,
    });

    await newProperty.save();

    res.status(201).json({
      message: "Property saved successfully",
      image_prefix: req.image_prefix,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Upload failed" });
  }
});

app.get("/properties/:id", async (req, res, next) => {
  const { id } = req.params;
  try {
    const property = await PropertyModel.findById(id);
    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }
    res.json(property);
  } catch (err) {
    next(err);
  }
});

app.get("/getProperties", async (req, res) => {
  try {
    const filters = {
      type: req.query.type || "",
      action: req.query.action || "",
      bedroom: req.query.bedroom || "",
      bathroom: req.query.bathroom || "",
    };
    console.log("Received filters:", filters);
    const query = {};
    if (filters.type) {
      query.type = filters.type;
    }
    if (filters.action) {
      query.action = filters.action;
    }
    if (filters.bedroom) {
      query.bedroom = filters.bedroom;
    }
    if (filters.bathroom) {
      query.bathroom = filters.bathroom;
    }
    const properties = await PropertyModel.find(query).exec();

    res.json(properties);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
app.use("/api/user", userRouter);
app.use("/api/auth", authRouter);
app.use("/api/listing", listingRouter);

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  return res.status(statusCode).json({
    success: false,
    statusCode,
    // statuscode=statuscode
    message,
  });
});
// adding middle ware to handle error
