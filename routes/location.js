const express = require("express");
const router = express.Router();
const multer = require("multer");
const mongoose = require("mongoose");

/* ================= LOCATION MODEL ================= */
const locationSchema = new mongoose.Schema({
  title: String,
  image: String,
  available: Number,
  status: { type: Number, default: 1 },
});

const Location =
  mongoose.models.Location || mongoose.model("Location", locationSchema);

/* ================= MULTER ================= */
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

/* ================= GET Locations ================= */
router.get("/locations", async (req, res) => {
  try {
    const locations = await Location.find(
      { status: 1 },
      "title image available"
    ).sort({ _id: -1 });

    res.json(locations);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Database error" });
  }
});

/* ================= ADD Location ================= */
router.post("/add-location", upload.single("image"), async (req, res) => {
  try {
    const { title, available } = req.body;
    const image = req.file ? req.file.filename : null;

    const newLocation = await Location.create({ title, image, available });

    res.json({
      message: "Location added successfully",
      id: newLocation._id,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Error inserting location" });
  }
});

/* ================= UPDATE Location ================= */
router.put("/update-location/:id", upload.single("image"), async (req, res) => {
  try {
    const { title, available } = req.body;
    const image = req.file ? req.file.filename : null;

    const updateData = { title, available };
    if (image) updateData.image = image;

    await Location.findByIdAndUpdate(req.params.id, updateData);

    res.json({ message: "Location updated" });
  } catch (err) {
    res.status(500).json({ message: "Database error", details: err.message });
  }
});

/* ================= DELETE Location ================= */
router.delete("/delete-location/:id", async (req, res) => {
  try {
    await Location.findByIdAndDelete(req.params.id);
    res.json({ message: "Location deleted" });
  } catch (err) {
    res.status(500).json({ message: "Database error", details: err.message });
  }
});

module.exports = router;