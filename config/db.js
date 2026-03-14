const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // These options are set by default in Mongoose 6+, but listed for clarity
      serverSelectionTimeoutMS: 5000, // Timeout after 5s
    });
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`❌ MongoDB connection failed: ${err.message}`);
    process.exit(1); // Exit process if DB fails
  }
};

module.exports = connectDB;