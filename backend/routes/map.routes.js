const express = require("express");
const router = express.Router();
const { authUser } = require("../middleware/auth.middleware");
const { getCoordinates } = require("../controllers/map.controller");
const { query } = require("express-validator");

router.get(
  "/get-coordinates",
  query("address").isString().isLength({ min: 3 }),
  authUser,
  getCoordinates
);

module.exports = router;