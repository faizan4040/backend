const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const propertyRoutes = require("./routes/property");
const locationRoutes = require("./routes/location");
const bookmarkRoutes = require("./routes/bookmark");
const messageRoutes = require("./routes/message");
const propertyUserRoutes = require("./routes/propertyuser");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// static images
app.use("/uploads", express.static("uploads"));

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected!"))
  .catch((err) => console.error("MongoDB connection error:", err));

// routes
app.use("/api/auth", authRoutes);
app.use("/api/property", propertyRoutes);
app.use("/api/location", locationRoutes);
app.use("/api/bookmark", bookmarkRoutes);
app.use("/api/message", messageRoutes);
app.use("/api/property-user", propertyUserRoutes);

app.get("/", (req, res) => {
  res.send("Backend running!");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});