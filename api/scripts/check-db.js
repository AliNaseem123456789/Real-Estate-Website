// Shows which databases and collections your MONGO_URI can see.
//   cd api
//   node scripts/check-db.js

import "dotenv/config";
import mongoose from "mongoose";

try {
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 15000 });
  console.log(`Connected. App database: "${mongoose.connection.name}"\n`);

  const { databases } = await mongoose.connection.db.admin().listDatabases();
  for (const { name } of databases) {
    if (["admin", "local", "config"].includes(name)) continue;
    const db = mongoose.connection.client.db(name);
    const collections = await db.listCollections().toArray();
    const counts = await Promise.all(
      collections.map(async (c) => `${c.name}: ${await db.collection(c.name).countDocuments()}`)
    );
    console.log(`${name} → ${counts.join(", ") || "(empty)"}`);
  }
  if (databases.length <= 2) console.log("(no app databases yet — the cluster is empty)");
} catch (error) {
  console.error("Could not connect:", error.message);
} finally {
  await mongoose.disconnect();
}
