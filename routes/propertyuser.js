const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

/* ================= PROPERTY MODEL ================= */
const propertySchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  offerType: String,
  propertyType: String,
  pgType: String,
  price: Number,
  rooms: Number,
  bathrooms: Number,
  parking: String,
  address: String,
  locality: String,
  nearbyRoad: String,
  singlePrice: Number,
  doublePrice: Number,
  triplePrice: Number,
  meals: String,
  title: String,
  slug: String,
  description: String,
  features: mongoose.Schema.Types.Mixed,
  images: [String],
  bookmark: { type: Boolean, default: false },
  status: { type: Number, default: 1 },
});

const Property =
  mongoose.models.Property || mongoose.model("Property", propertySchema);

/* ================= GET USER PROPERTIES (with pagination) ================= */
router.post("/user", async (req, res) => {
  try {
    const { user_id, page = 1, limit = 5 } = req.body;
    const skip = (page - 1) * limit;

    const [results, total] = await Promise.all([
      Property.find({ user_id })
        .sort({ _id: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Property.countDocuments({ user_id }),
    ]);

    const formatted = results.map((p) => {
      const obj = p.toObject();
      obj.images = Array.isArray(obj.images) ? obj.images : [];
      obj.features = Array.isArray(obj.features) ? obj.features : [];
      return obj;
    });

    res.json({
      data: formatted,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    res.status(500).json({ message: "DB error", details: err.message });
  }
});

/* ================= UPDATE PROPERTY STATUS ================= */
router.patch("/:id/status", async (req, res) => {
  try {
    await Property.findByIdAndUpdate(req.params.id, { status: req.body.status });
    res.json({ message: "Status updated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Database error", details: err.message });
  }
});

module.exports = router;