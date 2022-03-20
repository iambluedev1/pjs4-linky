process.on("uncaughtException", (err) => {
  linky.log.error(err);
});

process.on("unhandledRejection", (err) => {
  linky.log.error(err);
});
