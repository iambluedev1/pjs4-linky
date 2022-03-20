module.exports.log = {
  level: "debug",
  file: "app.log",
  timestamp: {
    format: "DD-MM-YY HH:mm:ss",
  },
  metadata: {
    fillExcept: ["message", "level", "timestamp", "label"],
  },
};
