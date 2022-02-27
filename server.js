/* eslint-disable import/no-dynamic-require */
/* eslint-disable global-require */
require("dotenv").config();
const fs = require("fs");
const _ = require("lodash");
const yargs = require("yargs");

const args = yargs
  .option("cron", {
    alias: "c",
    description: "Start Cron Process",
    type: "boolean",
  })
  .help()
  .alias("help", "h")
  .demandOption(["cron"], "Please provide cron argument")
  .showHelpOnFail(true).argv;

global._ = _;
global.eternals = {
  config: {
    environment: process.env.NODE_ENV,
    port: process.env.PORT,
    cron: args.cron,
  },
  log: {},
  helpers: {},
  schemas: {},
  db: null,
  redis: null,
};

fs.readdirSync("./src/config/").forEach((file) => {
  const config = require(`./src/config/${file}`);
  _.merge(eternals.config, config);
});

(async () => {
  require("./src/bin/logger")();
  eternals.log.debug(
    `Running app in ${eternals.config.environment} mode ${
      eternals.config.cron === true ? "(cron activated)" : ""
    }`
  );
  await require("./src/bin/helpers")();
  require("./src/bin/handler");
  await require("./src/bin/datastore")();
  require("./src/bin/bootstrap")();
  if (!(eternals.config.cron === true)) {
    const app = require("./src/app");
    const port = eternals.config.port || 3000;

    app.listen(port, () => {
      eternals.log.info(`App running on port ${port}...`);
    });
  } else {
    require("./src/bin/cron")();
  }
})();
