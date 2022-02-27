/* eslint-disable consistent-return */
const fs = require("fs");
const path = require("path");

const walk = (dir, done) => {
  let results = [];
  fs.readdir(dir, (err, list) => {
    if (err) return done(err);
    let i = 0;
    (function next() {
      // eslint-disable-next-line no-plusplus
      let file = list[i++];
      if (!file) return done(null, results);
      file = path.resolve(dir, file);
      fs.stat(file, (_err, stat) => {
        if (stat && stat.isDirectory()) {
          walk(file, (__err, res) => {
            results = results.concat(res);
            next();
          });
        } else {
          results.push(file);
          next();
        }
      });
    })();
  });
};

module.exports = walk;
