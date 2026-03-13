const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

/* ================= PROPERTY MODEL ================= */
const propertySchema = new mongoose.Schema({
  title: String,
  price: Number,
  address: String,
  bookmark: { type: Boolean, default: false },
  status: { type: Number, default: 1 },
});

const Property =
  mongoose.models.Property || mongoose.model("Property", propertySchema);

/* ================= GET Bookmarked Properties ================= */
router.get("/bookmarked-properties", async (req, res) => {
  try {
    const properties = await Property.find(
      { bookmark: true, status: 1 },
      "title price address"
    ).sort({ _id: -1 });

    res.json(properties);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Database error" });
  }
});

/* ================= Remove Bookmark ================= */
router.patch("/remove-bookmark/:id", async (req, res) => {
  try {
    await Property.findByIdAndUpdate(req.params.id, { bookmark: false });
    res.json({ message: "Bookmark removed" });
  } catch (err) {
    res.status(500).json({ message: "DB error" });
  }
});

/* ================= Toggle Bookmark ================= */
router.post("/update-bookmark/:id", async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    property.bookmark = !property.bookmark;
    await property.save();

    res.json({ success: true, message: "Bookmark updated" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Database error" });
  }
});

module.exports = router;