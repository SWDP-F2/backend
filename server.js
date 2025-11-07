const express = require('express');
const dotenv = require('dotenv');
const connectDB = require("./config/db");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const mongoSanitize = require("express-mongo-sanitize");
const helmet = require("helmet");
const { xss } = require("express-xss-sanitizer");
const rateLimit = require("express-rate-limit");

dotenv.config({ path: "./config/config.env" });
connectDB();

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use((req, res, next) => {
  mongoSanitize.sanitize(req.body);
  mongoSanitize.sanitize(req.params);
  mongoSanitize.sanitize(req.query);
  next();
});
app.use(helmet());
app.use(xss());
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, //10 mins
  max: 100,
});
app.use(limiter);
app.use(cors());


app.set("query parser", "extended");

const rooms = require("./routes/rooms");
const reservations = require("./routes/reservations");
const auth = require("./routes/auth");

app.use("/api/v1/rooms", rooms);
app.use("/api/v1/reservations", reservations);
app.use("/api/v1/auth", auth);

const PORT = process.env.PORT || 5000;
const server = app.listen(
  PORT,
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`)
);

process.on("unhandledRejection", (err, promise) => {
  console.log(`Error: ${err.message}`);
  server.close(() => process.exit(1));
});
 
 
