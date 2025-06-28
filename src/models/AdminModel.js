const mongoose = require("mongoose");

const AdminDetails = new mongoose.Schema(
  {
    name: { type: String, required: true },
    mail: { type: String, required: true },
    password: { type: String, required: true },
    Code: { type: String },
  },
  { collection: "Admin Database" }
);

module.exports = mongoose.model("AdminDetails", AdminDetails);
