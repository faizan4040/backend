const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const sendMail = require("../utils/sendMail");

/* ================= MODELS ================= */
const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
  phone: String,
  password: String,
  role: String,
  photo: String,
});

const propertySchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  title: String,
  price: Number,
  address: String,
  bookmark: { type: Boolean, default: false },
  status: { type: Number, default: 1 },
});

const User = mongoose.models.User || mongoose.model("User", userSchema);
const Property = mongoose.models.Property || mongoose.model("Property", propertySchema);

/* ================= SEND MESSAGE ================= */
router.post("/send-message", async (req, res) => {
  const { property_id, message } = req.body;

  try {
    // Find property and populate owner details
    const property = await Property.findById(property_id).populate(
      "user_id",
      "email firstName"
    );

    if (!property) {
      return res.status(404).json({ message: "Owner not found" });
    }

    const owner = property.user_id;

    await sendMail(
      owner.email,
      "New Property Inquiry",
      `<h3>Hello ${owner.firstName}</h3><p>You have a new message:</p><p>${message}</p>`
    );

    res.json({ message: "Message sent successfully" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Mail error" });
  }
});

module.exports = router;