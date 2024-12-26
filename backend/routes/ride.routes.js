const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const {
  createRide,
  getAllRides,
  getUserRides,
  getCaptainRides,
  getFare,
  getETA,
  acceptRide,
} = require("../controllers/ride.controller");
const { authUser, authCaptain } = require("../middleware/auth.middleware");

router.post(
  "/create-ride",
  [
    body("userId")
      .isString()
      .isLength({ min: 24, max: 24 })
      .withMessage("Invalid userId"),
    body("pickup")
      .isString()
      .isLength({ min: 3 })
      .withMessage("Pickup is required"),
    body("destination")
      .isString()
      .isLength({ min: 3 })
      .withMessage("Destination is required"),
    body("vehicleType")
      .isIn(["auto", "car", "motorcycle"])
      .withMessage("Invalid vehicle type"),
  ],
  authUser,
  createRide
);

router.get("/rides", getAllRides);

router.get("/user/rides", authUser, getUserRides);

router.get("/captain/rides", authCaptain, getCaptainRides);

router.get("/fare", authUser, getFare);

router.get("/eta", authUser, getETA);

router.post("/accept-ride", authCaptain, acceptRide);

module.exports = router;
