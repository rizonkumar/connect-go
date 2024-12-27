const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./utils/db");
const userRoutes = require("./routes/user.routes");
const captainRoutes = require("./routes/captain.routes");
const mapRoutes = require("./routes/map.routes");
const rideRoutes = require("./routes/ride.routes");

const {
  handleJSONError,
  handle404,
  globalErrorHandler,
} = require("./middleware/errorHandler");

const app = express();
const cookieParser = require("cookie-parser");

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "x-refresh-token",
      "Access-Control-Allow-Headers",
      "Origin",
      "Accept",
    ],
    exposedHeaders: ["x-new-token", "Set-Cookie"],
  })
);


app.use(cookieParser());
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));
app.use(handleJSONError);

connectDB();

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.use("/api/users", userRoutes);
app.use("/api/captains", captainRoutes);
app.use("/api/maps", mapRoutes);
app.use("/api/rides", rideRoutes);

app.use(handle404);
app.use(globalErrorHandler);

module.exports = app;
