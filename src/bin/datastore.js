/* eslint-disable import/no-dynamic-require */
/* eslint-disable global-require */
const fs = require("fs");
const Sequelize = require("sequelize");

const sequelize = new Sequelize(
  `postgres://${linky.config.sequelize.auth.user}:${linky.config.sequelize.auth.password}@${linky.config.sequelize.auth.host}:${linky.config.sequelize.auth.port}/${linky.config.sequelize.auth.database}`,
  {
    logging: false,
    dialectOptions: {
      // avec heroku, il faut obligatoirement specifier ces paramètres pour pouvoir se connecter au serveur (cetificat auto-géré)
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
    console.log(
      "Connection to the datastore has been established successfully."
    );
    linky.db = sequelize;
    fs.readdirSync("./src/schema/").forEach((file) => {
      require(`../schema/${file}`);
    });

    // sequelize.sync({ logging: console.log });
  } catch (error) {
    console.log("Unable to connect to the database", error);
    process.exit(-1);
  }
};
