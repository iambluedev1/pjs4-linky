/* eslint-disable import/no-dynamic-require */
/* eslint-disable global-require */
const fs = require("fs");
const cron = require("node-cron");

module.exports = () => {
  fs.readdirSync("./src/cron/").forEach((file) => {
    const job = require(`../cron/${file}`);
    cron.schedule(job.interval, async () => {
      if (job.taskRunning || !job.active) {
        return;
      }

      if (job.retry === undefined) job.retry = 0;
      job.taskRunning = true;

      const start = Date.now();
      eternals.log.debug(`Executing job ${file}`);
      let status = false;

      while (job.retry < eternals.config.crons.max_retries) {
        try {
          // eslint-disable-next-line no-await-in-loop
          status = await job.onTick();
          if (status) break;
          // eslint-disable-next-line no-plusplus
          else job.retry++;
        } catch (e) {
          eternals.log.error(e);
          // eslint-disable-next-line no-plusplus
          job.retry++;
        }
      }

      const end = Date.now();

      if (status) {
        eternals.log.debug(`Job ${file}  executed in ${end - start}ms`);
      } else {
        eternals.log.error(`job ${file} failed, retried${job.retry} times`);
      }

      job.taskRunning = false;
      job.retry = 0;
    });

    eternals.log.debug(`Loaded Job ${file}`);
  });
};
