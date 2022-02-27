module.exports = {
  interval: "*/5 * * * *",
  active: true,
  onTick: async () => {
    const players = await eternals.helpers.player.getAll();
    eternals.schemas.GPlayersCount.create({
      count: Object.keys(players).length,
    });
    return true;
  },
};
