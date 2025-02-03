const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const { MongoClient } = require("mongodb");
const cors = require("cors");
require("dotenv").config();

const app = express();
const server = http.createServer(app);

// Configure CORS properly
const corsOptions = {
  origin: ["http://localhost:3000", "https://sarathi062.github.io/Streamusic","https://sarathi062.github.io"],
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"],
  credentials: true,
};

app.use(express.json());
app.use(cors(corsOptions));

// WebSocket setup with CORS
const io = socketIo(server, {
  cors: corsOptions
});

const mongoUrl = process.env.MONGO_URI || "mongodb+srv://yashrajdhamale:TwvNr435jG8uSX7b@streamusic.8e50o.mongodb.net/?retryWrites=true&w=majority&appName=Streamusic";
const client = new MongoClient(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });

let collection;

// Connect to MongoDB
(async () => {
  try {
    await client.connect();
    console.log("Connected to MongoDB");
    const db = client.db("Streamusic");
    collection = db.collection("Queue");
  } catch (error) {
    console.error("MongoDB connection error:", error);
  }
})();

// WebSocket Connection Handling
io.on("connection", (socket) => {
  console.log("New client connected");

  socket.on("disconnect", (reason) => {
    console.log("Client disconnected:", reason);
  });
});

// API Endpoints
app.get("/queue", async (req, res) => {
  try {
    const queue = await collection.find().toArray();
    res.json({ message: "Queue retrieved", queue });
  } catch (error) {
    console.error("Error fetching queue:", error);
    res.status(500).json({ message: "Failed to retrieve queue" });
  }
});

app.post("/queue/add", async (req, res) => {
  const { songs } = req.body;
  try {
    await collection.insertMany(songs);
    const updatedQueue = await collection.find().toArray();
    io.emit("queueUpdated", updatedQueue);
    res.status(201).json({ message: "Songs added successfully", queue: updatedQueue });
  } catch (error) {
    console.error("Error adding songs:", error);
    res.status(500).json({ message: "Failed to add songs" });
  }
});

app.post("/queue/remove", async (req, res) => {
  const { songId } = req.body;
  try {
    await collection.deleteOne({ id: songId });
    const updatedQueue = await collection.find().toArray();
    io.emit("queueUpdated", updatedQueue);
    res.json({ message: "Song removed from queue", queue: updatedQueue });
  } catch (error) {
    console.error("Error removing song:", error);
    res.status(500).json({ message: "Failed to remove song" });
  }
});

// Keep-alive to prevent Render shutdown
app.get("/", (req, res) => {
  res.send("Streamusic Backend is Running...");
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
