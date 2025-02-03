const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const { MongoClient } = require("mongodb");
const CORS = require("cors");
require("dotenv").config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.ORIGIN, // React client URL
    methods: ["GET", "POST"]
  }
});

const url = "mongodb+srv://yashrajdhamale:TwvNr435jG8uSX7b@streamusic.8e50o.mongodb.net/?retryWrites=true&w=majority&appName=Streamusic";
const client = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true });

let collection;

client.connect().then(() => {
  console.log("Connected to MongoDB");
  const db = client.db("Streamusic");
  collection = db.collection("Queue");
});

app.use(express.json());
app.use(CORS());

io.on("connection", (socket) => {
  console.log("New client connected");

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

// Get Queue
app.get("/queue", async (req, res) => {
  try {
    const queue = await collection.find().toArray();
    res.json({ message: "Queue retrieved", queue });
  } catch (error) {
    console.error("Error fetching queue:", error);
    res.status(500).json({ message: "Failed to retrieve queue" });
  }
});

// Add to Queue
app.post("/queue/add", async (req, res) => {
  const { songs } = req.body;
  try {
    await collection.insertMany(songs);
    const updatedQueue = await collection.find().toArray();
    io.emit("queueUpdated", updatedQueue); // Emit event to all clients
    res.status(201).json({ message: "Songs added successfully", queue: updatedQueue });
  } catch (error) {
    console.error("Error adding songs:", error);
    res.status(500).json({ message: "Failed to add songs" });
  }
});

// Remove from Queue
app.post("/queue/remove", async (req, res) => {
  const { songId } = req.body;
  try {
    await collection.deleteOne({ id: songId });
    const updatedQueue = await collection.find().toArray();
    io.emit("queueUpdated", updatedQueue); // Emit event to all clients
    res.json({ message: "Song removed from queue", queue: updatedQueue });
  } catch (error) {
    console.error("Error removing song:", error);
    res.status(500).json({ message: "Failed to remove song" });
  }
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
