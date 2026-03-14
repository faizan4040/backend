const mongoose = require("mongoose");

const locationSchema = new mongoose.Schema(
  {
    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
    },
    state: {
      type: String,
      default: "",
    },
    country: {
      type: String,
      default: "India",
    },
    pincode: {
      type: String,
      default: "",
    },
    address: {
      type: String,
      default: "",
    },
    latitude: { type: Number },
    longitude: { type: Number },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Location", locationSchema);