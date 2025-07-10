const express = require("express");
const {
  adminRegistration,
  Login,
  sendOTP,
  VerifyOTP,
  GetAdminCookies,logout
} = require("../controllers/adminController");

const router = express.Router();

router.post("/registration", adminRegistration);
router.post("/registration/send-otp", sendOTP);
router.post("/registration/verify-otp", VerifyOTP);
router.post("/login", Login);
router.get("/cookies", GetAdminCookies);
router.post("/logout",logout)
module.exports = router;
