const express = require("express");
const router = express.Router();
const Message = require("../models/Message");
const authMiddleware = require("../middleware/auth");

// ─── GET /api/message/inbox (protected) ──────────────────────
router.get("/inbox", authMiddleware, async (req, res) => {
  try {
    const messages = await Message.find({ receiver: req.user.id })
      .populate("sender", "name email avatar")
      .populate("property", "title images")
      .sort({ createdAt: -1 });

    res.json({ success: true, messages });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET /api/message/sent (protected) ───────────────────────
router.get("/sent", authMiddleware, async (req, res) => {
  try {
    const messages = await Message.find({ sender: req.user.id })
      .populate("receiver", "name email avatar")
      .populate("property", "title images")
      .sort({ createdAt: -1 });

    res.json({ success: true, messages });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST /api/message (send, protected) ─────────────────────
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { receiverId, propertyId, content } = req.body;

    if (!receiverId || !content) {
      return res.status(400).json({ success: false, message: "receiverId and content are required" });
    }

    if (receiverId === req.user.id) {
      return res.status(400).json({ success: false, message: "Cannot send message to yourself" });
    }

    const message = await Message.create({
      sender: req.user.id,
      receiver: receiverId,
      property: propertyId || null,
      content,
    });

    res.status(201).json({ success: true, message: "Message sent", data: message });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── PUT /api/message/:id/read (mark as read, protected) ─────
router.put("/:id/read", authMiddleware, async (req, res) => {
  try {
    const msg = await Message.findOneAndUpdate(
      { _id: req.params.id, receiver: req.user.id },
      { isRead: true },
      { new: true }
    );

    if (!msg) return res.status(404).json({ success: false, message: "Message not found" });

    res.json({ success: true, message: "Marked as read", data: msg });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── DELETE /api/message/:id (protected) ─────────────────────
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const msg = await Message.findOneAndDelete({
      _id: req.params.id,
      $or: [{ sender: req.user.id }, { receiver: req.user.id }],
    });

    if (!msg) return res.status(404).json({ success: false, message: "Message not found" });

    res.json({ success: true, message: "Message deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;