module.exports = {
  list: async (req, res) => {
    const relayers = await eternals.helpers.relayer.getAll();

    return res.json({
      relayers: Object.keys(relayers)
        .filter(
          (key) =>
            Date.now() - relayers[key] <= eternals.config.relayers.timeout
        )
        .map((key) => `${key}.${eternals.config.relayers.suffix}`),
    });
  },
};
