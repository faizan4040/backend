const express = require("express");
const router = express.Router();
const multer = require("multer");
const mongoose = require("mongoose");

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
  offerType: String,
  propertyType: String,
  pgType: String,
  price: Number,
  rooms: Number,
  bathrooms: Number,
  parking: String,
  address: String,
  locality: String,
  nearbyRoad: String,
  singlePrice: Number,
  doublePrice: Number,
  triplePrice: Number,
  meals: String,
  title: String,
  slug: String,
  description: String,
  features: mongoose.Schema.Types.Mixed,
  images: [String],
  bookmark: { type: Boolean, default: false },
  status: { type: Number, default: 1 },
});

const locationSchema = new mongoose.Schema({
  title: String,
  image: String,
  available: { type: Number, default: 0 },
  status: { type: Number, default: 1 },
});

const User = mongoose.models.User || mongoose.model("User", userSchema);
const Property = mongoose.models.Property || mongoose.model("Property", propertySchema);
const Location = mongoose.models.Location || mongoose.model("Location", locationSchema);

/* ================= HELPERS ================= */
const slugify = (text) =>
  text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const parseJSON = (data, fallback = []) => {
  if (!data) return fallback;
  if (Array.isArray(data)) return data;
  if (typeof data === "string") {
    try {
      return JSON.parse(data);
    } catch {
      return data.includes(",") ? data.split(",") : [data];
    }
  }
  return fallback;
};

const COMPANY_PHONE = "9876543210";

/* ================= MULTER ================= */
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

/* ================= GET BY SLUG ================= */
router.get("/slug/:slug", async (req, res) => {
  try {
    const property = await Property.findOne({ slug: req.params.slug }).populate(
      "user_id",
      "firstName lastName phone role"
    );

    if (!property) return res.status(404).json({ message: "Property not found" });

    const result = property.toObject();
    const owner = result.user_id;

    result.owner_name = `${owner.firstName} ${owner.lastName}`;
    result.user_phone = owner.phone;
    result.user_role = owner.role;
    result.phone = owner.role === "Broker" ? owner.phone : COMPANY_PHONE;
    result.images = parseJSON(result.images);
    result.features = parseJSON(result.features);

    res.json(result);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Database error" });
  }
});

/* ================= GET MENU ================= */
router.get("/menu", async (req, res) => {
  try {
    const properties = await Property.find(
      { status: 1 },
      "propertyType rooms title pgType"
    );

    const menu = { Houses: [], Flats: [], "PG/Hostel": [] };
    const seenHouses = new Set();
    const seenFlats = new Set();
    const seenPg = new Set();

    menu.Houses.push({ title: "All Houses", path: "/property/all-houses" });
    menu.Flats.push({ title: "All Flats", path: "/property/all-flats" });
    menu["PG/Hostel"].push({ title: "All PG/Hostel", path: "/property/all-pg" });

    properties.forEach((item) => {
      if (!item.propertyType) return;
      const type = item.propertyType.toLowerCase().trim();

      if (type === "house" || type === "houses") {
        const rooms = item.rooms || 0;
        const slug = rooms ? `${rooms}-room` : item.title.toLowerCase().replace(/\s+/g, "-");
        const displayTitle = rooms ? `${rooms} Room Set` : item.title;
        if (!seenHouses.has(slug)) {
          menu.Houses.push({ title: displayTitle, path: `/property/${slug}` });
          seenHouses.add(slug);
        }
      } else if (type === "flat" || type === "flats") {
        const rooms = item.rooms || 0;
        const slug = rooms ? `${rooms}-bhk` : item.title.toLowerCase().replace(/\s+/g, "-");
        const displayTitle = rooms ? `${rooms} BHK Flats` : item.title;
        if (!seenFlats.has(slug)) {
          menu.Flats.push({ title: displayTitle, path: `/property/${slug}` });
          seenFlats.add(slug);
        }
      } else if (type === "pg" || type === "hostel") {
        if (!item.pgType) return;
        const slug = item.pgType.toLowerCase().replace(/\s+/g, "-");
        if (!seenPg.has(slug)) {
          menu["PG/Hostel"].push({ title: item.pgType, path: `/property/${slug}` });
          seenPg.add(slug);
        }
      }
    });

    res.json(menu);
  } catch (err) {
    res.status(500).json({ message: "DB error", error: err.message });
  }
});

/* ================= GET ALL PROPERTIES (with filters + pagination) ================= */
router.get("/all-properties", async (req, res) => {
  try {
    let { location, type, rooms, baths, page = 1, limit = 6 } = req.query;
    page = Number(page);
    limit = Number(limit);
    const skip = (page - 1) * limit;

    const query = { status: 1 };

    if (location) {
      const cleaned = location.replace(/-/g, " ");
      query.locality = { $regex: cleaned, $options: "i" };
    }
    if (type) query.propertyType = type;
    if (rooms) query.rooms = Number(rooms);
    if (baths) query.bathrooms = Number(baths);

    const total = await Property.countDocuments(query);

    const properties = await Property.find(query)
      .populate("user_id", "firstName lastName phone role")
      .sort({ _id: -1 })
      .skip(skip)
      .limit(limit);

    const data = properties.map((p) => {
      const result = p.toObject();
      const owner = result.user_id;
      result.owner_name = `${owner.firstName} ${owner.lastName}`;
      result.user_phone = owner.phone;
      result.user_role = owner.role;
      result.phone = owner.role === "Broker" ? owner.phone : COMPANY_PHONE;
      result.images = parseJSON(result.images);
      result.features = parseJSON(result.features);
      return result;
    });

    res.json({ data, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: "DB error", error: err.message });
  }
});

/* ================= ADD PROPERTY ================= */
router.post("/", upload.array("images"), async (req, res) => {
  try {
    const {
      user_id, offerType, propertyType, pgType, price, rooms, bathrooms,
      parking, address, locality, title, description, nearbyRoad, features,
      singlePrice, doublePrice, triplePrice, meals,
    } = req.body;

    const images = req.files.map((file) => file.filename);
    const slug = slugify(title);

    const newProperty = await Property.create({
      user_id, offerType, propertyType, pgType, price, rooms, bathrooms,
      parking, address, locality, nearbyRoad, singlePrice, doublePrice,
      triplePrice, meals, title, slug, description,
      features: parseJSON(features),
      images,
    });

    // Update location available count
    await Location.updateOne(
      { title: { $regex: locality, $options: "i" } },
      { $inc: { available: 1 } }
    );

    res.json({ message: "Property submitted successfully", id: newProperty._id });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Database error" });
  }
});

/* ================= GET SINGLE PROPERTY BY ID ================= */
router.get("/property/:id", async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) return res.status(404).json({ message: "Property not found" });

    const result = property.toObject();
    result.images = parseJSON(result.images);
    result.features = parseJSON(result.features);

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Database error" });
  }
});

/* ================= UPDATE PROPERTY ================= */
router.put("/:id", upload.array("images"), async (req, res) => {
  try {
    const {
      offerType, propertyType, price, rooms, bathrooms, parking,
      address, locality, title, description, nearbyRoad, features,
      singlePrice, doublePrice, triplePrice, meals, existingImages,
    } = req.body;

    let remainingImages = [];
    if (existingImages) {
      try { remainingImages = JSON.parse(existingImages); } catch { remainingImages = []; }
    }

    const newImages = req.files ? req.files.map((f) => f.filename) : [];
    const finalImages = [...remainingImages, ...newImages];
    const slug = slugify(title);

    await Property.findByIdAndUpdate(req.params.id, {
      offerType, propertyType, price, rooms, bathrooms, parking,
      address, locality, nearbyRoad, singlePrice, doublePrice,
      triplePrice, meals, title, slug, description,
      features: parseJSON(features),
      images: finalImages,
    });

    res.json({ message: "Property updated successfully" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Update failed" });
  }
});

/* ================= TOP PROPERTIES ================= */
router.get("/top-properties", async (req, res) => {
  try {
    const properties = await Property.find().sort({ price: -1 }).limit(3);
    if (!properties.length) return res.json({ message: "Property not found" });
    res.json(properties);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ================= GET BY ID ================= */
router.get("/:id", async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) return res.status(404).json({ message: "Property not found" });
    res.json(property);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;