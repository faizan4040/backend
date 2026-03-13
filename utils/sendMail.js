const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendMail = async (email, subject, html) => {
  await transporter.sendMail({
    from: `"RoomRent App" <${process.env.EMAIL_USER}>`,
    to: email,
    subject,
    html,
  });
};

module.exports = sendMail;