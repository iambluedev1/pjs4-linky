/* global document */
/* global fetch */
/* global window */
/* global io */
/* global Chart */

// On définit en dure le prix du wh
const EDF_PRICE_WH = 0.0174;

const chartsCtx = {};

Chart.defaults.global.defaultFontFamily = "Nunito";
Chart.defaults.global.defaultFontColor = "#858796";

// from https://stackoverflow.com/a/67517152
// Cette fonction est utile pour transformer un objet en une url (pour les appels api)
function serialize(params, prefix) {
  return Object.entries(params).reduce((acc, [key, value]) => {
    // remove whitespace from both sides of the key before encoding
    // eslint-disable-next-line no-param-reassign
    key = encodeURIComponent(key.trim());

    if (params.constructor === Array) {
      // eslint-disable-next-line no-param-reassign
      key = `${prefix}[]`;
    } else if (params.constructor === Object) {
      // eslint-disable-next-line no-param-reassign
      key = prefix ? `${prefix}[${key}]` : key;
    }

    /**
     *  - undefined and NaN values will be skipped automatically
     *  - value will be empty string for functions and null
     *  - nested arrays will be flattened
     */
    if (value === null || typeof value === "function") {
      acc.push(`${key}=`);
    } else if (typeof value === "object") {
      // eslint-disable-next-line no-param-reassign
      acc = acc.concat(serialize(value, key));
    } else if (
      ["number", "boolean", "string"].includes(typeof value) &&
      // eslint-disable-next-line no-self-compare
      value === value
    ) {
      // self-check to avoid NaN
      acc.push(`${key}=${encodeURIComponent(value)}`);
    }

    return acc;
  }, []);
}

// On attend que la page soit bien chargée
document.addEventListener("DOMContentLoaded", () => {
  const compteurs = document.getElementById("compteurs");
  const selectedCompteurSpan = document.getElementById("selected_compteurs");
  const socketPappSpan = document.getElementById("socket_papp");
  const estimationCurrentMonthSpan = document.getElementById(
    "estimation_current_month"
  );

  // On récupère les paramètres dans l'url
  const urlParams = new URLSearchParams(window.location.search);

  let linkyId = null; // Variable permettant de savoir si on regarde un compteur précisément ou non
  let linkyIds = [];

  // Si l'url contient un identifiant de compteur
  if (urlParams.get("id")) {
    selectedCompteurSpan.innerText = ` >> ${urlParams.get("id")}`;
    linkyId = urlParams.get("id");
  }

  // Fonction utilisé pour générer des couleurs aléatoirement (pour les graphiques)
  const dynamicColors = () => {
    const r = Math.floor(Math.random() * 255);
    const g = Math.floor(Math.random() * 255);
    const b = Math.floor(Math.random() * 255);
    return `rgb(${r},${g},${b}, 1)`;
  };

  // On va récupérer tous les compteurs de la base de donnée
  const fetchCompteurs = () =>
    fetch("/api/compteurs")
      .then((response) => response.json())
      .then((json) => {
        const template = (
          id
        ) => `<a href="/?id=${id}" class="d-none d-sm-inline-block btn btn-sm btn-primary shadow-sm"><i
                                    class="fa-sm text-white-50"></i> ${id}</a>&nbsp;`;
        compteurs.innerHTML = "";

        json.forEach((id) => {
          compteurs.innerHTML += template(id);
        });

        linkyIds = json;
      });

  // On va récupérer l'estimation de la facture
  const fetchFacture = () =>
    fetch("/api/estimation/current")
      .then((response) => response.json())
      .then((json) => {
        if (linkyId == null)
          estimationCurrentMonthSpan.innerText = `${(
            json.difference * EDF_PRICE_WH
          ).toFixed(2)}€`;
        else
          estimationCurrentMonthSpan.innerText = `${(
            json.compteurs[linkyId].difference * EDF_PRICE_WH
          ).toFixed(2)}€`;
      });

  // On execute une première fois les deux fonctions
  fetchCompteurs();
  fetchFacture();

  setInterval(() => {
    // Puis, toutes les 30 secondes on raffraichit les données
    fetchCompteurs();
    fetchFacture();
  }, 30000);

  // On initialise la communication avec les sockets
  const socket = io.connect("/sockets/datas");

  socket.on("data", (data) => {
    // On verifie que la donnée qu'on a reçu c'est bien celle de la puissance apparente
    // Puis on regarde si on est entrain de regarder un compteur précis au quel cas, on verifie que la donnée reçu correspond bien à ce compteur
    if (
      data.label === "PAPP" &&
      ((linkyId && data.idLinky === linkyId) || !linkyId)
    ) {
      socketPappSpan.innerText = `${data.value} VA`;
    }
  });

  // Ici on va récupérer les données du graphique
  const populateChart = (params, loader) => {
    fetch(`/api/chart?${serialize(params).join("&")}`)
      .then((response) => response.json())
      .then((json) => {
        // eslint-disable-next-line no-param-reassign
        loader.style.display = "none";

        // On définit les labels
        chartsCtx[json.label].data.labels = json.pattern.map(
          (pattern) => pattern.date
        );

        // On génère une couleur aléatoirement
        const color = dynamicColors();

        // Et on indique nos datas
        chartsCtx[json.label].data.datasets.push({
          label: json.id,
          lineTension: 0.3,
          borderColor: color,
          pointRadius: 3,
          pointBackgroundColor: color,
          pointBorderColor: color,
          pointHoverRadius: 3,
          pointHoverBackgroundColor: color,
          pointHoverBorderColor: color,
          pointHitRadius: 10,
          pointBorderWidth: 2,
          data: json.mesures.map(
            (m) => (json.label === "PAPP" ? m.value : m.value.difference) // La structure des mesures différes suivant le type de mesure
          ),
        });

        // Puis on met à jour le graphique
        chartsCtx[json.label].update();
      });
  };

  // Ici on va interpreter le graphique et ses paramètres
  const fetchChart = (e) => {
    const label = e.dataset.chart;
    const precision = e.dataset.chartPrecision;
    const loader = e.querySelector("[data-chart-loader]");

    const from = e.querySelector("[data-chart-range='from']").value;
    const to = e.querySelector("[data-chart-range='to']").value;

    // On retire toutes les classe active (en l'occurence ici dans le dropdown)
    e.querySelectorAll(`.active`).forEach((el) =>
      el.classList.remove("active")
    );

    // On met la classe active sur le bouton qui est reliée a la precision courante (en l'occurence ici dans le dropdown)
    e.querySelector(
      `[data-chart-precision-selector='${precision}']`
    ).classList.add("active");

    if (linkyId) {
      const params = {
        label,
        precision,
        from: from !== "" ? from : undefined,
        to: to !== "" ? to : undefined,
        id: linkyId || undefined,
      };

      // Comme on veut raffraichir le graphique, on supprime toutes nos données
      chartsCtx[label].data.datasets = [];

      populateChart(params, loader);
    } else {
      // Comme on veut raffraichir le graphique, on supprime toutes nos données
      chartsCtx[label].data.datasets = [];

      // On se trouve dans le cas ou, pon ne regarde pas un compteur en particulier alors on va aller récupérer les données pour tous les compteurs
      linkyIds.forEach((id) => {
        const params = {
          label,
          precision,
          from: from !== "" ? from : undefined,
          to: to !== "" ? to : undefined,
          id,
        };

        // Et les ajouter un à un au graphique
        populateChart(params, loader);
      });
    }
  };

  // Ici on va construire le graphique sans données ni labels
  const drawChart = (e, ctx, label) => {
    const unit = e.dataset.chartUnit;

    chartsCtx[label] = new Chart(ctx, {
      type: "line",
      data: {
        labels: [],
        datasets: [],
      },
      options: {
        maintainAspectRatio: false,
        layout: {
          padding: {
            left: 10,
            right: 25,
            top: 25,
            bottom: 0,
          },
        },
        scales: {
          xAxes: [
            {
              time: {
                unit: "date",
              },
              gridLines: {
                display: false,
                drawBorder: false,
              },
              ticks: {
                maxTicksLimit: 7,
              },
            },
          ],
          yAxes: [
            {
              ticks: {
                maxTicksLimit: 5,
                padding: 10,
                callback: (value) => `${value} ${unit}`,
              },
              gridLines: {
                color: "rgb(234, 236, 244)",
                zeroLineColor: "rgb(234, 236, 244)",
                drawBorder: false,
                borderDash: [2],
                zeroLineBorderDash: [2],
              },
            },
          ],
        },
        tooltips: {
          backgroundColor: "rgb(255,255,255)",
          bodyFontColor: "#858796",
          titleMarginBottom: 10,
          titleFontColor: "#6e707e",
          titleFontSize: 14,
          borderColor: "#dddfeb",
          borderWidth: 1,
          xPadding: 15,
          yPadding: 15,
          displayColors: false,
          intersect: false,
          mode: "index",
          caretPadding: 10,
          callbacks: {
            label: (tooltipItem, chart2) => {
              const datasetLabel =
                chart2.datasets[tooltipItem.datasetIndex].label || "";
              return `${datasetLabel}: ${tooltipItem.yLabel} ${unit}`;
            },
          },
        },
      },
    });

    // On execute le chargement des graphiques
    fetchChart(e);

    // Lorsqu'on clic sur un bouton dans le dropdown, on change la precision courante par celle qui a été cliquée et on rafraichit le graphique
    e.querySelectorAll("[data-chart-precision-selector]").forEach((el) =>
      el.addEventListener("click", (e1) => {
        e.dataset.chartPrecision = e1.target.dataset.chartPrecisionSelector;
        fetchChart(e);
      })
    );

    // Même logique mais cette fois si avec les deux inputs de date de début et date de fin
    e.querySelectorAll("input").forEach((el) =>
      el.addEventListener("change", () => {
        fetchChart(e);
      })
    );
  };

  // Ici on fait un petit hack, par defaut aucun compteur n'est selectionné alors les graphiques vont afficher les données pour tous les compteurs
  // Or, problème ici les compteurs sont chargés dynamiquement ce qui fait que temps qu'on a pas récupéré la liste des compteurs on ne peut pas afficher les graphiques
  // Du coup, toutes les 500ms on va regarder s'il y a des compteurs dans linkyIds et lancer le charger des graohiques

  let interval = null;
  interval = setInterval(() => {
    if (linkyIds.length > 0) {
      document.querySelectorAll("[data-chart]").forEach((e) => {
        const label = e.dataset.chart;
        drawChart(e, e.querySelector("canvas"), label);
      });
      clearInterval(interval);
    }
  }, 500);
});
