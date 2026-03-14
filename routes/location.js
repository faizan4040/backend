const express = require("express");
const router = express.Router();
const Location = require("../models/Location");
const authMiddleware = require("../middleware/auth");

// ─── GET /api/location ────────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const locations = await Location.find().sort({ city: 1 });
    res.json({ success: true, locations });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET /api/location/:id ────────────────────────────────────
router.get("/:id", async (req, res) => {
  try {
    const location = await Location.findById(req.params.id);
    if (!location) return res.status(404).json({ success: false, message: "Location not found" });
    res.json({ success: true, location });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST /api/location (protected) ──────────────────────────
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { city, state, country, pincode, address, latitude, longitude } = req.body;

    if (!city) return res.status(400).json({ success: false, message: "City is required" });

    const location = await Location.create({ city, state, country, pincode, address, latitude, longitude });
    res.status(201).json({ success: true, message: "Location created", location });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── DELETE /api/location/:id (protected) ────────────────────
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    await Location.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Location deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;