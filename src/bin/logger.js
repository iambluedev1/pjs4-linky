/* eslint-disable no-underscore-dangle */
const CaptainsLog = require("captains-log");
const { createLogger, format, transports } = require("winston");

const { combine, timestamp, metadata, colorize, printf } = format;

module.exports = () => {
  const logger = createLogger({
    level: linky.config.log.level,
    transports: [
      new transports.File({
        filename: linky.config.log.file,
        handleExceptions: true,
        format: combine(
          timestamp(linky.config.log.timestamp),
          metadata(linky.config.log.metadata),
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
          metadata(linky.config.log.metadata),
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

  linky.log = CaptainsLog({ custom: logger });
};
