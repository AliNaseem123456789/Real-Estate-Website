import mongoose from "mongoose";

const uri = "mongodb+srv://alinaseem20021021_db_user:ali123456789@cluster0.j16gmhw.mongodb.net/mydatabase?retryWrites=true&w=majority";

mongoose.connect(uri)
  .then(() => {
    console.log("✅ Successfully connected to MongoDB Atlas!");
    return mongoose.connection.db.listCollections().toArray();
  })
  .then(collections => {
    console.log("Collections in mydatabase:", collections.map(c => c.name));
    mongoose.disconnect();
  })
  .catch(err => {
    console.error("❌ MongoDB connection error:", err);
  });
