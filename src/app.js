const express = require("express");

const app = express();
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const cors = require("cors");
const compression = require("compression");
const path = require("path");
const server = require("http").createServer(app);
const io = require("socket.io")(server);

const morgan = require("./middleware/morgan");

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

app.use(
  express.static(path.join(__dirname, "../public"), {
    dotfiles: "ignore",
    etag: true,
    extensions: ["css", "js", "png", "jpg"],
    index: false,
    maxAge: "7d",
    redirect: false,
  })
);

// Cross-origin resource sharing, permet de limiter l'accès a l'api a certains domains autorisés.
// C'est relou parce que les navigateurs sont hyper stricte la dessus, du coup on accepte tout le monde.
app.use(cors());
app.options("*", cors());
app.use(limiter);

// On définit nos routes
app.get("/", require("./http/main").main);
app.get("/api/stats", require("./http/stats").stats);
app.get(
  "/api/estimation/current",
  require("./http/stats").currentMonthEstimation
);
app.get("/api/compteurs", require("./http/stats").compteurs);
app.get("/api/chart", require("./http/charts").display);

// On définit la route /sockets/datas comment étant endpoint socket.io
io.of("/sockets/datas").on("connection", () => {
  // Lorsqu'un client se connecte
  linky.log.debug("New client connected to sockets");
});

module.exports = server;
