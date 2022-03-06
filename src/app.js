const express = require("express");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const cors = require("cors");
const compression = require("compression");

const morgan = require("./middleware/morgan");

const app = express();
app.use(compression());

const limiter = rateLimit({
  max: 1000,
  windowMs: 60 * 60 * 1000,
  message: "Too many requests from this ip, please try again in an hour!",
});

app.use(helmet());
app.use(morgan);

app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

app.use(cors());
app.options("*", cors());
app.use(limiter);
app.get("/", require("./http/main").main);
app.get("/relayers", require("./http/relayer").list);
app.get("/players", require("./http/player").list);

app.get("/auth/token", require("./http/user").getToken);
app.get("/auth/verify", require("./http/user").verify);
module.exports = app;
