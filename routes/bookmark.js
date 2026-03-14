const express = require("express");
const router = express.Router();
const Bookmark = require("../models/Bookmark");
const authMiddleware = require("../middleware/auth");

// ─── GET /api/bookmark (my bookmarks, protected) ──────────────
router.get("/", authMiddleware, async (req, res) => {
  try {
    const bookmarks = await Bookmark.find({ user: req.user.id })
      .populate({
        path: "property",
        populate: [{ path: "location" }, { path: "owner", select: "name email phone" }],
      })
      .sort({ createdAt: -1 });

    res.json({ success: true, bookmarks });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST /api/bookmark (add, protected) ─────────────────────
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { propertyId } = req.body;

    if (!propertyId) {
      return res.status(400).json({ success: false, message: "propertyId is required" });
    }

    const existing = await Bookmark.findOne({ user: req.user.id, property: propertyId });
    if (existing) {
      return res.status(409).json({ success: false, message: "Already bookmarked" });
    }

    const bookmark = await Bookmark.create({ user: req.user.id, property: propertyId });
    res.status(201).json({ success: true, message: "Bookmarked successfully", bookmark });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── DELETE /api/bookmark/:propertyId (remove, protected) ────
router.delete("/:propertyId", authMiddleware, async (req, res) => {
  try {
    const bookmark = await Bookmark.findOneAndDelete({
      user: req.user.id,
      property: req.params.propertyId,
    });

    if (!bookmark) return res.status(404).json({ success: false, message: "Bookmark not found" });

    res.json({ success: true, message: "Bookmark removed" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;