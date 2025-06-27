const mongoose = require("mongoose");

const Queue = new mongoose.Schema({
  id: String,
  title: String,
  description: String,
  thumbnail: String,
  channelTitle: String,
  artists: Array,
  duration: Number
  
}, { collection: "Queue" });

module.exports = mongoose.model('Queue', Queue);