const mongoose = require("mongoose");

const bookmarkSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
  },
  { timestamps: true }
);

// Prevent duplicate bookmarks
bookmarkSchema.index({ user: 1, property: 1 }, { unique: true });

module.exports = mongoose.model("Bookmark", bookmarkSchema);