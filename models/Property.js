const mongoose = require("mongoose");

const propertySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
    },
    type: {
      type: String,
      enum: ["rent", "sale"],
      required: true,
    },
    category: {
      type: String,
      enum: ["apartment", "house", "villa", "office", "shop", "plot"],
      default: "apartment",
    },
    bedrooms: { type: Number, default: 0 },
    bathrooms: { type: Number, default: 0 },
    area: { type: Number, default: 0 }, // in sq ft
    images: [{ type: String }],
    location: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Location",
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Property", propertySchema);