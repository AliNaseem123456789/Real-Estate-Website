import mongoose from "mongoose";
import PropertyModel from "./models/property.js";
// ⭐ Define the MongoDB URL
const MONGO_URL =
  "mongodb+srv://alinaseem20021021_db_user:ali123456789@cluster0.j16gmhw.mongodb.net/mydatabase?retryWrites=true&w=majority&appName=Cluster0";

async function run() {
  try {
    // ⭐ Connect ONCE
    await mongoose.connect(MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("Connected to MongoDB");

    // Get all properties sorted by creation order
    const properties = await PropertyModel.find({}).sort({ _id: 1 });

    console.log(`Found ${properties.length} properties`);

    // Assign image_prefix 1, 2, 3, ...
    for (let i = 0; i < properties.length; i++) {
      const prefix = String(i + 1);

      await PropertyModel.updateOne(
        { _id: properties[i]._id },
        { $set: { image_prefix: prefix } }
      );

      console.log(`Updated ${properties[i]._id} → prefix ${prefix}`);
    }

    console.log("All prefixes assigned!");
    process.exit(0);

  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
