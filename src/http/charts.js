const moment = require("moment");
const { Op } = require("sequelize");

module.exports = {
  display: async (req, res) => {
    const { Mesure } = linky.schemas;

    const id = req.query.id || null;
    let label = req.query.label || "PAPP";
    const precision = req.query.precision || "DAILY";
    let from = req.query.from || null;
    const to = req.query.to || moment();

    if (from == null) {
      switch (precision) {
        case "LAST_1_HOURS":
          from = moment().subtract(1, "hour"); // On retire 1 heures
          break;
        case "LAST_6_HOURS":
          from = moment().subtract(6, "hour"); // On retire 6 heures
          break;
        case "WEEKLY":
          from = moment().subtract(6, "month"); // On retire 6 mois
          break;
        case "DAILY":
          from = moment().subtract(1, "month"); // On retire 1 mois
          break;
        case "MONTHLY":
          from = moment().subtract(1, "year"); // On retire 1 ans
          break;
        default:
          throw new Error(`Unknown precision ${precision}`); // Ce cas c'est pour ce prémunir d'une mauvaise valeur du champ precision
      }
    }

    // On supporte que ces deux variables, mais en l'occurence comme toutes les variables possibles sont structurés de la même façon sauf exception, tous pourraient avoir des charts
    if (label !== "PAPP" && label !== "BASE") {
      label = "PAPP";
    }

    if (id == null) {
      return res.status(400).json({ error: "Missing linky id" });
    }

    const mesures = await Mesure.findAll({
      order: [["at", "ASC"]],
      where: {
        at: {
          [Op.lt]: to,
          [Op.gt]: from,
        },
        label,
        id_linky: id,
      },
    });

    const formattedMesures = _.map(
      _.groupBy(mesures, (b) => {
        // On groupe par date suivant la précision que l'on souhaite
        switch (precision) {
          case "LAST_1_HOURS":
            return moment(b.at).format("HH:mm DD-MM"); // Format : heure:minutes-mois-année
          case "LAST_6_HOURS":
            return moment(b.at).format("HH:mm DD-MM"); // Format : heure:minutes-mois-année
          case "WEEKLY":
            return moment(b.at).format("W-MM-YYYY"); // Format : numérodelasemaine-mois-année
          case "DAILY":
            return moment(b.at).format("DD-MM-YYYY"); // Format : jours-mois-année
          case "MONTHLY":
            return moment(b.at).format("MM-YYYY"); // Format : mois-année
          default:
            throw new Error(`Unknown precision ${precision}`);
        }
      }),
      (values, key) => {
        return {
          date: key,
          value: _.reduce(
            values,
            (result, currentObject) => {
              // Si on filtre par puissance, on a qu'a sommer les valeurs entre elles
              if (label === "PAPP") {
                return {
                  value: result.value + parseInt(currentObject.value, 10),
                };
              }

              // Par contre, si on veut filtrer par la consommation on doit faire la différence entre la valeur du début et de la fin de la range courrante
              const sortedValiues = _.orderBy(values, ["at"], ["asc"]);

              return {
                value: {
                  first: sortedValiues[0].value,
                  last: sortedValiues.slice(-1)[0].value,
                  difference:
                    parseInt(sortedValiues.slice(-1)[0].value, 10) -
                    parseInt(sortedValiues[0].value, 10),
                },
              };
            },
            {
              value:
                label === "PAPP" ? 0 : { first: 0, last: 0, difference: 0 },
            }
          ).value,
        };
      }
    );

    let pattern = [];
    const toCpy = moment(to);

    // On va définir des pattern permettant d'avoir toutes les plages de définis
    // On est pas a l'abris que l'agragateur linky ne marche pas pendant quelques jours, alors via ce systeme les manques dans les données sont automatiques corrigés (remplacé par 0)
    if (precision === "WEEKLY") {
      pattern = _.range(toCpy.diff(from, "week")).map(() => ({
        date: toCpy.subtract(1, "week").format("W-MM-YYYY"), // Format : numérodelasemaine-mois-année
        format: "W-MM-YYYY",
        value: 0,
      }));
    } else if (precision === "DAILY") {
      pattern = _.range(toCpy.diff(from, "day")).map(() => ({
        date: toCpy.subtract(1, "day").format("DD-MM-YYYY"), // Format : jours-mois-année
        format: "DD-MM-YYYY",
        value: 0,
      }));
    } else if (precision === "MONTHLY") {
      pattern = _.range(toCpy.diff(from, "month")).map(() => ({
        date: toCpy.subtract(1, "month").format("MM-YYYY"), // Format : mois-année
        format: "DD-YYYY",
        value: 0,
      }));
    } else if (precision === "LAST_6_HOURS" || precision === "LAST_1_HOURS") {
      pattern = _.range(toCpy.diff(from, "minutes") / 5).map(() => ({
        date: toCpy.subtract(5, "minutes").format("HH:mm DD-MM"), // Format : mois-année
        format: "HH:mm DD-MM",
        value: 0,
      }));
    }

    return res.json({
      id,
      label,
      precision,
      from,
      to,
      mesures: _.orderBy(
        // On ordonne le tout par la date du pattern
        pattern.map((item, i) => ({ ...item, ...formattedMesures[i] })), // On fussione les patterns avec les données qu'on a récupéré de la base de donnée
        [
          (item) => {
            return moment(item.date, item.format);
          },
        ],
        ["desc"]
      ).reverse(),
      pattern: _.orderBy(
        // On ordonne le tout par la date du pattern
        pattern,
        [
          (item) => {
            return moment(item.date, item.format);
          },
        ],
        ["desc"]
      ).reverse(),
    });
  },
};
