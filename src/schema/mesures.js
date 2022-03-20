const Sequelize = require("sequelize");

const Mesure = linky.db.define(
  "mesures",
  {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true,
    },
    idLinky: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    label: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    value: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    at: {
      type: Sequelize.DATE,
      allowNull: false,
    },
  },
  { tableName: "mesures", underscored: true }
);
linky.schemas.Mesure = Mesure;
module.exports = Mesure;
