const authService = require("../services/authService");

module.exports = {
  async setupStatus(req, res) {
    try {
      const dados = await authService.setupStatus();
      return res.json(dados);
    } catch (error) {
      return res.status(500).json({
        erro: error.message,
      });
    }
  },

  async primeiroAcesso(req, res) {
    try {
      const dados = await authService.primeiroAcesso(req.body);
      return res.status(201).json(dados);
    } catch (error) {
      return res.status(400).json({
        erro: error.message,
      });
    }
  },

  async cadastrarUsuario(req, res) {
    try {
      const dados = await authService.cadastrarUsuario(
        req.body,
        req.usuario
      );

      return res.status(201).json(dados);
    } catch (error) {
      return res.status(400).json({
        erro: error.message,
      });
    }
  },

  async login(req, res) {
    try {
      const dados = await authService.login(req.body);
      return res.json(dados);
    } catch (error) {
      return res.status(401).json({
        erro: error.message,
      });
    }
  },

  async me(req, res) {
    try {
      const usuario = await authService.me(req.usuario.id);
      return res.json(usuario);
    } catch (error) {
      return res.status(404).json({
        erro: error.message,
      });
    }
  },
};
