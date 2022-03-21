const { faker } = require("@faker-js/faker");
const moment = require("moment");

module.exports = () => {
  const start = moment().subtract(2, "weeks");
  const now = moment();

  const numRecords = Math.floor(now.diff(start, "minutes") / 5);

  const ranges = [
    [70, 110],
    [70, 110],
    [70, 110],
    [70, 110],
    [70, 110],
    [70, 110],
    [160, 300],
    [160, 300],
    [70, 110],
    [70, 110],
    [70, 110],
    [70, 110],
    [70, 110],
    [70, 110],
    [70, 110],
    [70, 110],
    [160, 300],
    [160, 300],
    [3000, 4000],
    [2800, 3650],
    [300, 650],
    [160, 300],
    [160, 300],
    [70, 110],
  ];

  function getRandomFloat(seed, min, max, decimals) {
    const x = Math.sin(seed) * 10000;
    const random = x - Math.floor(x);
    const str = (random * (max - min) + min).toFixed(decimals);

    return parseFloat(str);
  }

  let base = 3389497.0;

  const measures = _.flatten(
    _.range(numRecords).map((i) => {
      base +=
        getRandomFloat(
          faker.datatype.number({ min: 10000, max: 1000000000000 }),
          0.123,
          13.4567,
          4
        ) * 5;
      const at = moment(start).add(i * 5, "minutes");

      const [min, max] = ranges[moment(at).hour()];
      const papp = faker.datatype.number({
        min: Math.ceil(min / 12),
        max: Math.ceil(max / 12),
      });

      return [
        {
          idLinky: "23516919529",
          value: papp,
          label: "PAPP",
          at: at.format(),
        },
        {
          idLinky: "23516919529",
          value: base,
          label: "BASE",
          at: at.format(),
        },
      ];
    })
  );

  const { Mesure } = linky.schemas;

  Mesure.bulkCreate(measures);
};
