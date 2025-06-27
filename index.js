const express = require("express");
const http = require("http");
const cookieParser = require('cookie-parser');
const cors = require("cors");
const socketIo = require("socket.io");
require("dotenv").config();

const PORT = process.env.PORT;

const socketHandler = require("./socket/socketHandler");
const connectDb = require("./src/config/db");
const Routes = require("./Routes.js");
// use export const + import {} → named export
// or use export default + import default → default export

// Configure CORS properly
const corsOptions = {
  origin: process.env.ORIGIN.split(","),
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"],
  credentials: true,
};

const app = express();
const server = http.createServer(app);
app.use(cookieParser());
app.use(express.json());
app.use(cors(corsOptions));

// WebSocket setup with CORS
const io = socketIo(server, {
  cors: corsOptions,
});


Routes(app);

connectDb()
  .then(() => {
    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    
    //sets up a listener for when a client connects to the WebSocket server
    io.on("connection", (socket) => {
      socketHandler(io, socket);
    });
  })
  .catch((error) => {
    console.log("Error Connecting to DB", error);
  });

// Keep-alive to prevent Render shutdown
app.get("/", (req, res) => {
  res.send("Streamusic Backend is Running...");
});
