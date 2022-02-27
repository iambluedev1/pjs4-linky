const morgan = require("morgan");

const getIp = (req) => {
  if (req.headers["cf-connecting-ip"]) {
    return req.headers["cf-connecting-ip"];
  }
  return (
    req.ip || (req.connection && req.connection.remoteAddress) || undefined
  );
};

morgan.token("remote-addr", (req) => {
  return getIp(req);
});

morgan.token("origin", (req) => {
  const origin = req.get("origin") || req.get("host");
  try {
    return origin.replace("https://", "").replace("http://", "");
  } catch (e) {
    return "Unknown";
  }
});

morgan.token("referer", (req) => {
  return req.header("Referer") || "";
});

module.exports = async (req, res, next) => {
  morgan(eternals.config.morgan.format, {
    stream: {
      write: (message) => {
        if (eternals.config.morgan.excludes.includes(req.originalUrl)) return;

        if (req.method === "OPTION") return;
        let fn = "info";

        if (res.statusCode >= 400 && res.statusCode < 500) fn = "warn";
        else if (res.statusCode >= 500) fn = "error";

        eternals.log[fn](message.trim());
      },
    },
  })(req, res, next);
};
