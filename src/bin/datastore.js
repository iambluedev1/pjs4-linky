/* eslint-disable import/no-dynamic-require */
/* eslint-disable global-require */
const fs = require("fs");
const Sequelize = require("sequelize");
const { createClient } = require("redis");

const sequelize = new Sequelize(
  `postgres://${eternals.config.sequelize.auth.user}:${eternals.config.sequelize.auth.password}@${eternals.config.sequelize.auth.host}:${eternals.config.sequelize.auth.port}/${eternals.config.sequelize.auth.database}`,
  {
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
  }
);

module.exports = async () => {
  try {
    await sequelize.authenticate();
    eternals.log.info(
      "Connection to the datastore has been established successfully."
    );
    eternals.db = sequelize;
    fs.readdirSync("./src/schema/").forEach((file) => {
      require(`../schema/${file}`);
    });

    // sequelize.sync({ logging: console.log });
  } catch (error) {
    eternals.log.error("Unable to connect to the database", error);
    process.exit(-1);
  }

  const client = createClient({
    url: `redis://:${eternals.config.redis.auth.password}@${eternals.config.redis.auth.host}:${eternals.config.redis.auth.port}`,
    socket: {
      tls: true,
      rejectUnauthorized: false,
    },
  });

  try {
    await client.connect();
    eternals.log.info(
      "Connection to the redis instance has been established successfully."
    );
    eternals.redis = client;
  } catch (error) {
    eternals.log.error("Unable to connect to the redis instance", error);
    process.exit(-1);
  }

  eternals.redis.on("error", (error) =>
    eternals.log.error("Redis ERROR", error)
  );
};
