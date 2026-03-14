const mongoose = require("mongoose");
require("dotenv").config();

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);

    // ─── Drop old/stale indexes that conflict ─────────────────
    try {
      const usersCollection = conn.connection.collection("users");
      const indexes = await usersCollection.indexes();
      const badIndexes = ["mobile_1", "username_1", "name_1"];

      for (const idx of indexes) {
        if (badIndexes.includes(idx.name)) {
          await usersCollection.dropIndex(idx.name);
          console.log(`🗑 Dropped old index: ${idx.name}`);
        }
      }
    } catch (indexErr) {
      console.log("Index cleanup skipped:", indexErr.message);
    }
    // ─────────────────────────────────────────────────────────

  } catch (err) {
    console.error(`❌ MongoDB connection failed: ${err.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;