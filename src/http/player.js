module.exports = {
  list: async (req, res) => {
    return res.json(await eternals.helpers.player.getAll());
  },
};
