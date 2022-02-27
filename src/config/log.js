module.exports.log = {
  level: "debug",
  file: "app.log",
  timestamp: {
    format: "DD-MM-YY HH:mm:ss",
  },
  metadata: {
    fillExcept: ["message", "level", "timestamp", "label"],
  },
  email: {
    to: process.env.LIST_DEV_EMAIL,
    logLinesCount: 100,
    wait: 10,
  },
};
