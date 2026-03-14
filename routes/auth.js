const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const User = require("../models/User");
const authMiddleware = require("../middleware/auth");

// ─── Helper: generate JWT ─────────────────────────────────────
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

// ─── Helper: send email ───────────────────────────────────────
const sendEmail = async (to, subject, html) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: `"RoomFinder" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });
};

// ─── POST /api/auth/send-otp ──────────────────────────────────
router.post("/send-otp", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser && existingUser.isEmailVerified) {
      return res.status(409).json({ success: false, message: "Email already registered" });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save OTP temporarily (upsert)
    await User.findOneAndUpdate(
      { email },
      { otp, otpExpiry, isEmailVerified: false },
      { upsert: true, new: true }
    );

    // Send email
    await sendEmail(
      email,
      "Your OTP - RoomFinder",
      `<div style="font-family:sans-serif;max-width:400px;margin:auto;padding:24px;border:1px solid #eee;border-radius:8px">
        <h2 style="color:#e67e22">RoomFinder</h2>
        <p>Your email verification OTP is:</p>
        <h1 style="letter-spacing:8px;color:#333">${otp}</h1>
        <p style="color:#888;font-size:13px">This OTP expires in 10 minutes. Do not share it.</p>
      </div>`
    );

    res.json({ success: true, message: "OTP sent to email" });
  } catch (err) {
    console.error("OTP send error:", err.message);
    res.status(500).json({ success: false, message: "Failed to send OTP. Check EMAIL_USER and EMAIL_PASS in .env" });
  }
});

// ─── POST /api/auth/verify-otp ────────────────────────────────
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: "Email and OTP required" });
    }

    const user = await User.findOne({ email });

    if (!user || !user.otp) {
      return res.status(400).json({ success: false, message: "OTP not found. Request a new one." });
    }

    if (user.otp !== otp) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    if (new Date() > user.otpExpiry) {
      return res.status(400).json({ success: false, message: "OTP expired. Request a new one." });
    }

    // Mark email verified
    await User.findOneAndUpdate({ email }, { isEmailVerified: true, otp: null, otpExpiry: null });

    res.json({ success: true, message: "Email verified successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST /api/auth/register ──────────────────────────────────
router.post("/register", async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password, role } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ success: false, message: "First name, last name, email and password are required" });
    }

    // Check email verified
    const tempUser = await User.findOne({ email });
    if (!tempUser || !tempUser.isEmailVerified) {
      return res.status(400).json({ success: false, message: "Please verify your email first" });
    }

    // Check already fully registered
    if (tempUser.firstName && tempUser.password) {
      return res.status(409).json({ success: false, message: "Email already registered" });
    }

    // Update the temp user record with full details
    tempUser.firstName = firstName;
    tempUser.lastName = lastName;
    tempUser.phone = phone || "";
    tempUser.password = password; // will be hashed by pre-save hook
    tempUser.role = role || "user";
    await tempUser.save();

    res.status(201).json({
      success: true,
      message: "Registration successful",
      token: generateToken(tempUser),
      user: {
        id: tempUser._id,
        firstName: tempUser.firstName,
        lastName: tempUser.lastName,
        email: tempUser.email,
        phone: tempUser.phone,
        role: tempUser.role,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST /api/auth/login ─────────────────────────────────────
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    res.json({
      success: true,
      message: "Login successful",
      token: generateToken(user),
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET /api/auth/profile (protected) ───────────────────────
router.get("/profile", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password -otp -otpExpiry");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── PUT /api/auth/profile (protected) ───────────────────────
router.put("/profile", authMiddleware, async (req, res) => {
  try {
    const { firstName, lastName, phone, avatar } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { firstName, lastName, phone, avatar },
      { new: true, runValidators: true }
    ).select("-password -otp -otpExpiry");

    res.json({ success: true, message: "Profile updated", user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;