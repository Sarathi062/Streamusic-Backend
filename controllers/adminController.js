const AdminModel = require("../src/models/AdminModel");
const { hashPassword, GenerateOtp } = require("../middleware/authMiddleware");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const OTPModel = require("../src/models/OTPModel");
const RoomModel = require("../src/models/RoomModel");
const mongoose = require("mongoose");
require("dotenv").config();

const gmail = process.env.GMAIL;

const adminRegistration = async (req, res) => {
  const { name, mail, password } = req.body;
  try {
    const existingAdmin = await AdminModel.findOne({ mail: mail });
    if (existingAdmin) {
      return res.status(400).send({ error: "Admin already registered" });
    }

    const hashedPass = await hashPassword(password);
    await AdminModel.create({
      name: name,
      mail: mail,
      password: hashedPass,
    });

    res.send({ success: "Admin Registered" });
  } catch (error) {
    console.log("Error Registering Admin", error);
    res.status(500).send({ error: "Error Registering Admin" });
  }
};

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: `${gmail}`,
    pass: process.env.GMAILPASS,
  },
});
const sendOTP = async (req, res) => {
  const { mail } = req.body;
  if (!mail) return res.status(400).json({ message: "Email required" });

  const otp = GenerateOtp();
  const mailOptions = {
    from: `${gmail}`,
    to: mail,
    subject: "Action Required: One-Time Verification Code",
    html: `
           <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>OTP Verification - Streamusic</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f3f4f6;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      padding: 20px;
      background-color: #ffffff;
      border-radius: 8px;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.05);
      border: 1px solid #ddd;
    }
    .header {
      text-align: center;
      padding-bottom: 10px;
    }
    .header h1 {
      color: #333;
      font-size: 20px;
    }
    .content {
      color: #444;
      font-size: 16px;
      line-height: 1.6;
    }
    .otp {
      background-color: #f0f0f0;
      padding: 10px 20px;
      font-size: 28px;
      font-weight: bold;
      text-align: center;
      border-radius: 6px;
      letter-spacing: 4px;
      margin: 20px auto;
      max-width: 200px;
    }
    .footer {
      font-size: 12px;
      text-align: center;
      color: #888;
      margin-top: 30px;
    }
    .validity-note {
      font-style: italic;
      font-size: 14px;
      color: #666;
      margin-top: 10px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Action Required: One-Time Verification Code</h1>
    </div>
    <div class="content">
      <p>You're receiving this email because a request was made to authenticate your Streamusic account.</p>
      <p>Please use the following One-Time Password (OTP) to complete your verification:</p>
      <div class="otp">${otp}</div>
      <p class="validity-note">Note: This OTP is valid for <strong>10 minutes</strong>. Please do not share it with anyone.</p>
      <p>If you did not request this, please ignore this email or contact our support team immediately.</p>
    </div>
    <div class="footer">
      This message was sent from the Streamusic Team.
    </div>
  </div>
</body>
</html>
`, // (Same HTML code for the email content)
  };
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
    }
  });

  await OTPModel.create({
    mail: mail,
    otp: otp,
  });

  return res.status(200).json({ message: "OTP sent" });
};
const VerifyOTP = async (req, res) => {
  const { email, otp } = req.body;
  try {
    const userOtpEntry = await OTPModel.findOne({ mail: email });

    if (!userOtpEntry) {
      return res.status(400).json({ message: "No OTP found for this email." });
    }

    const isExpired =
      userOtpEntry.createdAt.getTime() + 10 * 60 * 1000 < Date.now();

    if (isExpired) {
      await OTPModel.deleteOne({ email });
      return res
        .status(400)
        .json({ message: "OTP has expired. Please request a new one." });
    }

    if (userOtpEntry.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP." });
    }

    // OTP is valid and not expired
    await OTPModel.deleteMany({ email });

    return res.status(200).json({ message: "OTP verified successfully." });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    return res
      .status(500)
      .json({ message: "Server error during OTP verification." });
  }
};

const Login = async (req, res) => {
  const { mail, password } = req.body;

  try {
    const user = await AdminModel.findOne({ mail });
    if (!user) {
      return res.status(400).send({ Error: "Admin not found" });
    }

    const userID = user._id.toString();
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).send({ Error: "Invalid Password" });
    }

    // Set cookies
    res.cookie("loggedIn", "true", {
      path: "/",
      maxAge: 24 * 60 * 60 * 1000,
      httpOnly: true,
      secure: true,
      sameSite: "None",
    });

    res.cookie("adminLogin", "true", {
      path: "/",
      maxAge: 24 * 60 * 60 * 1000,
      httpOnly: true,
      secure: true,
      sameSite: "None",
    });

    res.cookie("adminID", userID, {
      path: "/",
      maxAge: 24 * 60 * 60 * 1000,
      httpOnly: true,
      secure: true,
      sameSite: "None",
    });

    const generateRoomCode = () =>
      Math.random().toString(36).substring(2, 8).toUpperCase();

    let room = await RoomModel.findOne({ adminId: userID });

    if (!room) {
      room = await new RoomModel({
        adminId: userID,
        roomCode: generateRoomCode(),
        songs: [],
      }).save();
    }

    res.cookie("roomCode", room.roomCode, {
      path: "/",
      httpOnly: true,
      secure: true,
      sameSite: "None",
    });

    return res.send({ success: "Login Successful", roomCode: room.roomCode });
  } catch (error) {
    console.error("Error during login:", error);
    return res.status(500).send({ Error: "Error Logging In" });
  }
};

const GetAdminCookies = (req, res) => {
  try {
    const loggedIn = req.cookies.loggedIn === "true";
    const adminLogin = req.cookies.adminLogin === "true";
    if (loggedIn && adminLogin) {
      return res.status(200).json({
        success: true,
        message: "Admin is logged in",
        loggedIn: true,
        adminLogin: true,
      });
    } else {
      return res.status(401).json({
        success: false,
        message: "Unauthorized or cookies missing",
        loggedIn: false,
        adminLogin: false,
      });
    }
  } catch (error) {
    console.error("Error checking admin cookies:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const logout = (req, res) => {
  try {
    // Clear the cookies by setting them with empty values and 0 maxAge
    res.clearCookie("loggedIn", {
      path: "/",
      httpOnly: true,
      sameSite: "None",
      secure: true, // Use true in production with HTTPS
    });

    res.clearCookie("adminLogin", {
      path: "/",
      httpOnly: true,
      sameSite: "None",
      secure: true,
    });
    res.clearCookie("adminID", {
      path: "/",
      httpOnly: true,
      sameSite: "None",
      secure: true,
    });
    res.clearCookie("roomCode", {
      path: "/",
      httpOnly: true,
      secure: true,
      sameSite: "None",
    });

    return res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    console.error("Error during logout:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const createRoom = async (req, res) => {
  try {
    const { adminID } = req.cookies;
    if (!adminID || !mongoose.Types.ObjectId.isValid(adminID)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid admin ID" });
    }

    // Generate a new 6-character alphanumeric room code
    const generateRoomCode = () =>
      Math.random().toString(36).substring(2, 8).toUpperCase();

    let room = await RoomModel.findOne({ adminId: adminID });

    const newRoomCode = generateRoomCode();

    if (!room) {
      // Create new room if it doesn't exist
      const newRoom = new RoomModel({
        adminId: adminID,
        roomCode: newRoomCode,
        songs: [],
      });

      room = await newRoom.save();
    } else {
      room.roomCode = newRoomCode;
      room.songs = [];
      await room.save();
    }

    // ✅ Set or reset cookie in both cases
    res.cookie("roomCode", room.roomCode, {
      path: "/",
      httpOnly: true,
      secure: true,
      sameSite: "None",
    });

    return res.status(200).json({
      success: true,
      roomId: room._id,
      roomCode: room.roomCode,
    });
  } catch (error) {
    console.error("Error creating/updating room:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const getRoomCode = async (req, res) => {
  try {
    const { roomCode } = req.cookies;

    if (!roomCode) {
      return res.status(400).json({
        success: false,
        message: "Room code is missing in cookies",
      });
    }

    return res.status(200).json({
      success: true,
      roomCode: roomCode, // already from cookie
    });
  } catch (error) {
    console.error("Error fetching room code from cookies:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const addSong = async (req, res) => {
  try {
    const { songs } = req.body; // now expecting songs array

    const rawRoomCode =
      req.body.roomCode || req.query.roomCode || req.cookies.roomCode;
    const roomCode = rawRoomCode?.trim().toUpperCase();

    if (!roomCode) {
      return res
        .status(400)
        .json({ success: false, message: "Missing room code in cookies" });
    }

    const room = await RoomModel.findOne({ roomCode: roomCode });

    if (!room) {
      return res
        .status(404)
        .json({ success: false, message: "Room not found" });
    }

    // Validate that songs is an array
    if (!Array.isArray(songs) || songs.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No songs provided" });
    }

    // Add all new songs
    room.songs.push(...songs); // spread to add multiple

    await room.save();

    res
      .status(200)
      .json({ success: true, message: "Songs added", songs: room.songs });
  } catch (err) {
    console.error("Error in addSong:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const removeSong = async (req, res) => {};

module.exports = {
  adminRegistration,
  Login,
  VerifyOTP,
  sendOTP,
  GetAdminCookies,
  logout,
  createRoom,
  getRoomCode,
  addSong,
  removeSong,
};

//const Queue = require("./src/models/Queue");
// // // API Endpoints
// app.get("/queue", async (req, res) => {
//   try {
//     const queue = await Queue.find();
//     res.json({ message: "Queue retrieved", queue });
//   } catch (error) {
//     console.error("Error fetching queue:", error);
//     res.status(500).json({ message: "Failed to retrieve queue" });
//   }
// });

// app.post("/queue/add", async (req, res) => {
//   const { songs } = req.body;
//   try {
//     await Queue.insertMany(songs);
//     const updatedQueue = await Queue.find();
//     io.emit("queueUpdated", updatedQueue);
//     res.status(201).json({ message: "Songs added successfully", queue: updatedQueue });
//   } catch (error) {
//     console.error("Error adding songs:", error);
//     res.status(500).json({ message: "Failed to add songs" });
//   }
// });

// app.post("/queue/remove", async (req, res) => {
//   const { songId } = req.body;
//   try {
//     await Queue.deleteOne({ id: songId });
//     const updatedQueue = await Queue.find();
//     io.emit("queueUpdated", updatedQueue);
//     res.json({ message: "Song removed from queue", queue: updatedQueue });
//   } catch (error) {
//     console.error("Error removing song:", error);
//     res.status(500).json({ message: "Failed to remove song" });
//   }
// });
