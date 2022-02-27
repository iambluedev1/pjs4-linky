module.exports.getAll = async () => {
  const relayers = await eternals.redis.hGetAll("relayers");
  return relayers;
};
