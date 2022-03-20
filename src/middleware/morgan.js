const morgan = require("morgan");

const getIp = (req) => {
  // Si l'application se trouve derrière cloudflare, l'ip du visiteur n'est pas directement accessible, dans le sens ou on recupèrerait l'ip de cloudlare.
  // Cloudflare, lorsqu'il proxy la requete ajoute un header contenant l'ip du visiteur
  if (req.headers["cf-connecting-ip"]) {
    return req.headers["cf-connecting-ip"];
  }
  return (
    req.ip || (req.connection && req.connection.remoteAddress) || undefined
  );
};

morgan.token("remote-addr", (req) => {
  return getIp(req);
});

morgan.token("origin", (req) => {
  // L'origin peut être contenu dans ces deux headers
  const origin = req.get("origin") || req.get("host");
  try {
    return origin.replace("https://", "").replace("http://", "");
  } catch (e) {
    return "Unknown";
  }
});

morgan.token("referer", (req) => {
  return req.header("Referer") || "";
});

module.exports = async (req, res, next) => {
  morgan(linky.config.morgan.format, {
    stream: {
      write: (message) => {
        // On ne souhaite pas logger les appels a ces fichiers (pour eviter le spam)
        if (linky.config.morgan.excludes.includes(req.originalUrl)) return;

        // De la même façon, les requete OPTION ne sont pas logué (souvent les requetes POST sont précédés d'une requete OPTION ce qui spam pour rien la console)
        if (req.method === "OPTION") return;
        let fn = "info";

        // Suivant le status, on customiser le niveau de log
        if (res.statusCode >= 400 && res.statusCode < 500) fn = "warn";
        else if (res.statusCode >= 500) fn = "error";

        linky.log[fn](message.trim());
      },
    },
  })(req, res, next);
};
