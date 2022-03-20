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
  schemas: {},
  db: null,
};

// On va charger toutes les fichiers de configs
fs.readdirSync("./src/config/").forEach((file) => {
  const config = require(`./src/config/${file}`);
  _.merge(linky.config, config);
});

(async () => {
  await require("./src/bin/datastore")();
  await require("./src/faker")(2);
})();
