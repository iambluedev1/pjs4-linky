/* eslint-disable no-underscore-dangle */
const CaptainsLog = require("captains-log");
const { createLogger, format, transports } = require("winston");

const { combine, timestamp, metadata, colorize, printf } = format;
const readLastLines = require("read-last-lines");

module.exports = () => {
  const logger = createLogger({
    level: eternals.config.log.level,
    transports: [
      new transports.File({
        filename: eternals.config.log.file,
        handleExceptions: true,
        format: combine(
          timestamp(eternals.config.log.timestamp),
          metadata(eternals.config.log.metadata),
          colorize(),
          printf((info) => {
            let out = `[${info.timestamp}] ${info.message}`;
            if (info.metadata.error) {
              out = `${out} ${info.metadata.error}`;
              if (info.metadata.error.stack) {
                out = `${out} ${info.metadata.error.stack}`;
              }
            }
            return out.replace(
              // eslint-disable-next-line no-control-regex
              /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g,
              ""
            );
          })
        ),
      }),
      new transports.Console({
        format: format.combine(
          metadata(eternals.config.log.metadata),
          colorize(),
          printf((info) => {
            let out = `${info.message}`;
            if (info.metadata.error) {
              out = `${out} ${info.metadata.error}`;
              if (info.metadata.error.stack) {
                out = `${out} ${info.metadata.error.stack}`;
              }
            }
            return out;
          })
        ),
      }),
    ],
    exitOnError: false,
  });

  let timeout = null;
  const sendEmail = (message) => {
    readLastLines
      .read(eternals.config.log.file, eternals.config.log.email.logLinesCount)
      .then(async (lines) => {
        await eternals.helpers.sendEmail({
          to: eternals.config.smtp.lists.DEV,
          subject:
            (eternals.config.environment === "production"
              ? "(env: prod) "
              : "(env: dev) ") + message,
          content: lines,
        });
      });
  };

  eternals.log = CaptainsLog({ custom: logger });
  eternals.log._error = eternals.log.error;
  eternals.log.error = (message, options) => {
    if (options === undefined) eternals.log._error(message);
    else eternals.log._error(message, options);

    if (eternals.config.environment === "production") {
      if (timeout != null) clearTimeout(timeout);
      timeout = setTimeout(
        () => sendEmail(message),
        1000 * eternals.config.log.email.wait
      );
    }
  };
};
