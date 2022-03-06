const Sequelize = require("sequelize");

const User = eternals.db.define(
  "users",
  {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true,
    },
    publicAddress: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    code: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    lastConnectedAt: {
      type: Sequelize.DATE,
      allowNull: true,
    },
  },
  { tableName: "users", timestamps: true, underscored: true }
);
eternals.schemas.User = User;
module.exports = User;
