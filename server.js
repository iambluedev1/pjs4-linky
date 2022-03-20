/* eslint-disable import/no-dynamic-require */
/* eslint-disable global-require */
require("dotenv").config();
const fs = require("fs");
const _ = require("lodash");

global._ = _;
global.linky = {
  config: {
    environment: process.env.NODE_ENV,
    port: process.env.PORT,
  },
  log: {},
  schemas: {},
  db: null,
};

// On va charger toutes les fichiers de configs
fs.readdirSync("./src/config/").forEach((file) => {
  const config = require(`./src/config/${file}`);
  _.merge(linky.config, config);
});

(async () => {
  require("./src/bin/logger")();
  linky.log.debug(
    `Running app in ${linky.config.environment} mode ${
      linky.config.cron === true ? "(cron activated)" : ""
    }`
  );
  require("./src/bin/handler");
  await require("./src/bin/datastore")();

  const app = require("./src/app");
  const port = linky.config.port || 3000;

  // Et on lance le serveur
  app.listen(port, () => {
    linky.log.info(`App running on port ${port}...`);
  });
})();
