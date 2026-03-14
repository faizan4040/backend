const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");

const authRoutes = require("./routes/auth");
const propertyRoutes = require("./routes/property");
const locationRoutes = require("./routes/location");
const bookmarkRoutes = require("./routes/bookmark");
const messageRoutes = require("./routes/message");
const propertyUserRoutes = require("./routes/propertyuser");

const app = express();

// ─── Middleware ───────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files (uploaded images)
app.use("/uploads", express.static("uploads"));

// ─── Database Connection ──────────────────────────────────────
connectDB();

// ─── Routes ──────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/property", propertyRoutes);
app.use("/api/location", locationRoutes);
app.use("/api/bookmark", bookmarkRoutes);
app.use("/api/message", messageRoutes);
app.use("/api/property-user", propertyUserRoutes);

// Health check
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Backend is running!" });
});

// ─── 404 Handler ─────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// ─── Global Error Handler ─────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.message);
  res.status(500).json({ success: false, message: "Internal server error" });
});

// ─── Start Server ─────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});