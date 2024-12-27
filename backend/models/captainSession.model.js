const mongoose = require("mongoose");

const captainSessionSchema = new mongoose.Schema(
  {
    captain: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Captain",
      required: true,
    },
    loginTime: {
      type: Date,
      required: true,
    },
    logoutTime: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    duration: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

const CaptainSession = mongoose.model("CaptainSession", captainSessionSchema);
module.exports = CaptainSession;
