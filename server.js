const SerialPort = require("serialport");
const socket = require("socket.io-client")(
  "https://linkiyy.herokuapp.com/sockets/aggregator"
);

let linky_id = null;

var serialPort = new SerialPort("/dev/ttyUSB0", {
  baudRate: 1200,
  dataBits: 7,
  stopBits: 1,
  parity: "even",
  parser: SerialPort.parsers.readline("\n"),
});

serialPort.on("data", function (data) {
  var content = data.split(" ");
  if (content[0] == "ADCO") linky_id = content[1].trim();

  if (linky_id) {
    socket.emit("data.array", {
      label: content[0],
      value: content[1],
      linky_id,
    });
  }
});
