const path = require("path");

module.exports = {
  main: (req, res) => {
    // On envoit le fichier html
    res.sendFile(path.join(__dirname, "../view/index.html"));
  },
};
