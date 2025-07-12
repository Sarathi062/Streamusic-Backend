const mongoose = require("mongoose");

// Define the song schema (like your current Queue schema)
const SongSchema = new mongoose.Schema({
  id: String,
  title: String,
  description: String,
  thumbnail: String,
  channelTitle: String,
  artists: [String],
  duration: Number,
});

// Define the Room schema
const RoomSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin", // adjust according to your admin model name
      required: true,
      unique: true, // one room per admin
    },
    roomCode: {
      type: String,
      required: true,
      unique: true,
    },
    songs: [SongSchema], // array of songs
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { collection: "Rooms" }
);

module.exports = mongoose.model("Room", RoomSchema);
