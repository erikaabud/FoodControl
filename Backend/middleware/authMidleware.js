const authService = require("../services/authService");

async function autenticar(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";

    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        erro: "Token não informado",
      });
    }

    const token = authHeader.replace("Bearer ", "").trim();
    const payload = authService.verifyToken(token);

    req.usuario = {
      id: payload.sub,
      nome: payload.nome,
      usuario: payload.usuario,
      tipo: payload.tipo,
    };

    return next();
  } catch (error) {
    return res.status(401).json({
      erro: error.message,
    });
  }
}

module.exports = {
  autenticar,
};
