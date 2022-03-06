const Sequelize = require("sequelize");

const Character = eternals.db.define(
  "characters",
  {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true,
    },
    ownerId: {
      type: Sequelize.UUID,
      allowNull: false,
    },
    name: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    lastPlayedWithAt: {
      type: Sequelize.DATE,
      allowNull: true,
    },
  },
  { tableName: "characters", timestamps: true, underscored: true }
);
eternals.schemas.Character = Character;
module.exports = Character;
