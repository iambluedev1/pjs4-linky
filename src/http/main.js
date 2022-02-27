const packageCfg = require("../../package.json");

module.exports = {
  main: async (req, res) => {
    return res.json({
      name: "Eternals",
      namespace: packageCfg.name,
      version: packageCfg.version,
    });
  },
};
