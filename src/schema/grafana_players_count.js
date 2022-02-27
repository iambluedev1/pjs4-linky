const Sequelize = require("sequelize");

const GPlayersCount = eternals.db.define(
  "grafana__players_count",
  {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true,
    },
    count: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  },
  { tableName: "grafana__players_count", timestamps: true, underscored: true }
);
eternals.schemas.GPlayersCount = GPlayersCount;
module.exports = GPlayersCount;
