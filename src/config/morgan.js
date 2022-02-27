module.exports.morgan = {
  format:
    ":method/:status ':url' [:remote-addr, ':user-agent', o=':origin', r=':referer']",
  excludes: ["/favicon.ico", "/robots.txt"],
};
