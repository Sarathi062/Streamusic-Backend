const express = require("express");
const {
  AccessToken,
  RefreshToken,
  TrendingSongsPoster,TrendingSongs
} = require("../controllers/coreappController");

const router = express.Router();

router.post("/fetchAccessToken", AccessToken);
router.post("/getuserRefreshtoken", RefreshToken);
router.get("/getTrendingSongsPoster",TrendingSongsPoster );
router.get("/getTrendingSongs",TrendingSongs);
module.exports = router;
