module.exports.getAll = async () => {
  const players = await eternals.redis.hGetAll("players");
  return players;
};
