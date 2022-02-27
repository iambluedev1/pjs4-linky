process.on("uncaughtException", (err) => {
  eternals.log.error(err);
});

process.on("unhandledRejection", (err) => {
  eternals.log.error(err);
});
