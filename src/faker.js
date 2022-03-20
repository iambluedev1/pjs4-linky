const { faker } = require("@faker-js/faker");
const moment = require("moment");

module.exports = () => {
  const ids = _.range(2).map(() => {
    return faker.datatype.number({ min: 10000000000 });
  });

  const start = moment().subtract(5, "weeks");
  const now = moment();

  const numRecords = Math.floor(now.diff(start, "minutes") / 5);

  const measures = _.flatten(
    ids.map((id) => {
      let base = faker.datatype.number({ min: 3000000, max: 6000000 });
      const papp = faker.datatype.number({ min: 10, max: 100 });
      return _.flatten(
        _.range(numRecords).map((i) => {
          base += i + faker.datatype.number({ min: 0, max: 300 });

          return [
            {
              idLinky: id,
              value: faker.datatype.number({ min: 10, max: 430 }) + papp,
              label: "PAPP",
              at: moment(start)
                .add(i * 5, "minutes")
                .format(),
            },
            {
              idLinky: id,
              value: faker.datatype.number({ min: 0, max: 3 }),
              label: "IINST",
              at: moment(start)
                .add(i * 5, "minutes")
                .format(),
            },
            {
              idLinky: id,
              value: base,
              label: "BASE",
              at: moment(start)
                .add(i * 5, "minutes")
                .format(),
            },
          ];
        })
      );
    })
  );

  const { Mesure } = linky.schemas;

  Mesure.bulkCreate(measures)
    .then(() => {
      return Mesure.findAll();
    })
    .then((mesures) => {
      console.log(mesures);
    });
};
