const { Op } = require("sequelize");
const moment = require("moment");

module.exports = {
  stats: async (req, res) => {
    const { Mesure } = linky.schemas;
    const id = req.query.id || undefined;
    const label = req.query.label || undefined;
    const after = req.query.after || undefined;
    const before = req.query.before || undefined;
    const limit = req.query.limit || 100;

    const whereAt = {};
    const where = {};
    let hasCondWhereAt = false;

    if (id) where.id_linky = id;
    if (label) where.label = label;

    if (after) {
      whereAt[Op.gt] = after;
      hasCondWhereAt = true;
    }

    if (before) {
      whereAt[Op.lt] = before;
      hasCondWhereAt = true;
    }
    if (hasCondWhereAt) where.at = whereAt;

    res.json(
      await Mesure.findAll({
        limit,
        order: [["at", "DESC"]],
        where,
      })
    );
  },
  currentMonthEstimation: async (req, res) => {
    const { Mesure } = linky.schemas;

    // On determine la date du début et de fin du mois courant
    const start = moment().startOf("month");
    const end = moment().endOf("month");

    // Comme on supporte plusieurs compteurs linky, nous devons d'avoir récupérer la liste des compteurs
    const compteurs = await Mesure.findAll({
      attributes: ["id_linky"],
      group: ["id_linky"],
    });

    // Promise.all va nous permettre de traiter chaque compteur en parallele : gain de temps !
    const datas = await Promise.all(
      compteurs.map(async (compteur) => {
        // Pour récupérer la consommation actuelle du mois, on récupère la première valeur de BASE du mois et la dernière que nous avons en base de
        const firstOfMonth = await Mesure.findOne({
          limit: 1,
          order: [["at", "ASC"]],
          where: {
            at: {
              [Op.lt]: end,
              [Op.gt]: start,
            },
            label: "BASE",
            id_linky: compteur.get("id_linky"),
          },
        });

        const lastOfMonth = await Mesure.findOne({
          limit: 1,
          order: [["at", "DESC"]],
          where: {
            at: {
              [Op.lt]: end,
              [Op.gt]: start,
            },
            label: "BASE",
            id_linky: compteur.get("id_linky"),
          },
        });

        return {
          id: compteur.get("id_linky"),
          entries: {
            firstOfMonth,
            lastOfMonth,
          },
          difference:
            parseInt(lastOfMonth.value, 10) - parseInt(firstOfMonth.value, 10),
        };
      })
    );

    res.json({
      label: "BASE",
      compteurs: datas.reduce((obj, cur) => ({ ...obj, [cur.id]: cur }), {}), // Permet de transformer l'array en un object identifier par l'id du compteur
      difference: datas.reduce((sum, cur) => sum + cur.difference, 0), // Permet de sommer toutes les différentes et donc d'avoir l'évolution globale de la consomation sur le mois courant
    });
  },
  compteurs: async (req, res) => {
    const { Mesure } = linky.schemas;
    res.json(
      (
        await Mesure.findAll({
          attributes: ["id_linky"],
          group: ["id_linky"],
        })
      ).map((x) => x.get("id_linky"))
    );
  },
};
