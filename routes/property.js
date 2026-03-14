const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const Property = require("../models/Property");
const authMiddleware = require("../middleware/auth");

// ─── Multer Setup ─────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp/;
  const ext = allowed.test(path.extname(file.originalname).toLowerCase());
  const mime = allowed.test(file.mimetype);
  if (ext && mime) cb(null, true);
  else cb(new Error("Only image files are allowed (jpeg, jpg, png, webp)"));
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB

// ─── GET /api/property ────────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const { type, category, city, minPrice, maxPrice, page = 1, limit = 10 } = req.query;

    const filter = { isAvailable: true };
    if (type) filter.type = type;
    if (category) filter.category = category;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    const skip = (Number(page) - 1) * Number(limit);

    const properties = await Property.find(filter)
      .populate("location")
      .populate("owner", "name email phone avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Property.countDocuments(filter);

    res.json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      properties,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET /api/property/:id ────────────────────────────────────
router.get("/:id", async (req, res) => {
  try {
    const property = await Property.findById(req.params.id)
      .populate("location")
      .populate("owner", "name email phone avatar");

    if (!property) return res.status(404).json({ success: false, message: "Property not found" });

    res.json({ success: true, property });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST /api/property (protected) ──────────────────────────
router.post("/", authMiddleware, upload.array("images", 10), async (req, res) => {
  try {
    const { title, description, price, type, category, bedrooms, bathrooms, area, location } = req.body;

    if (!title || !price || !type) {
      return res.status(400).json({ success: false, message: "Title, price and type are required" });
    }

    const images = req.files ? req.files.map((f) => `/uploads/${f.filename}`) : [];

    const property = await Property.create({
      title,
      description,
      price,
      type,
      category,
      bedrooms,
      bathrooms,
      area,
      images,
      location,
      owner: req.user.id,
    });

    res.status(201).json({ success: true, message: "Property created", property });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── PUT /api/property/:id (protected) ───────────────────────
router.put("/:id", authMiddleware, upload.array("images", 10), async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) return res.status(404).json({ success: false, message: "Property not found" });

    if (property.owner.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    const updates = req.body;
    if (req.files && req.files.length > 0) {
      updates.images = req.files.map((f) => `/uploads/${f.filename}`);
    }

    const updated = await Property.findByIdAndUpdate(req.params.id, updates, { new: true });
    res.json({ success: true, message: "Property updated", property: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── DELETE /api/property/:id (protected) ────────────────────
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) return res.status(404).json({ success: false, message: "Property not found" });

    if (property.owner.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    await property.deleteOne();
    res.json({ success: true, message: "Property deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;