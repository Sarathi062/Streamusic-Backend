const express = require("express");
const {
  adminRegistration,
  Login,
  sendOTP,VerifyOTP
} = require("../controllers/adminController");

const router = express.Router();

router.post("/registration", adminRegistration);
router.post("/registration/send-otp", sendOTP);
router.post("/registration/verify-otp", VerifyOTP);
router.post("/login", Login);

module.exports = router;
