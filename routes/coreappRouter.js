const express = require("express");
const {
  AccessToken,
  RefreshToken,
  TrendingSongsPoster
} = require("../controllers/coreappController");

const router = express.Router();

router.post("/fetchAccessToken", AccessToken);
router.post("/getuserRefreshtoken", RefreshToken);
router.get("/getTrendingSongsPoster",TrendingSongsPoster )

module.exports = router;
