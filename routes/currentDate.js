const express = require("express");
const {getCurrentDate, putCurrentDate} = require("../controllers/currentDate");

const router = express.Router();

const { protect, authorize } = require("../middleware/auth");

router.route("/")
    .get(protect,getCurrentDate)
    .put(protect,putCurrentDate);

module.exports = router;