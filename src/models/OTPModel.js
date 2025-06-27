// models/OtpModel.js
const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema({
  mail: { type: String, required: true },
  otp: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: 600 }, // auto-delete after 10 min
});

module.exports = mongoose.model("Otp", otpSchema);
