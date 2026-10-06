const relatorioService = require('../services/relatorioService');

module.exports = {
  async vendasPorPeriodo(req, res) {
    try {
      const { inicio, fim } = req.query;
      const dados = await relatorioService.vendasPorPeriodo(inicio, fim);
      return res.json(dados);
    } catch (err) {
      return res.status(500).json({ erro: err.message });
    }
  },

  async produtosMaisVendidos(req, res) {
    try {
      const limite = Number(req.query.limite) || 10;
      const dados = await relatorioService.produtosMaisVendidos(limite);
      return res.json(dados);
    } catch (err) {
      return res.status(500).json({ erro: err.message });
    }
  },

  async formasPagamento(req, res) {
    try {
      const { inicio, fim } = req.query;
      const dados = await relatorioService.formasPagamento(inicio, fim);
      return res.json(dados);
    } catch (err) {
      return res.status(500).json({ erro: err.message });
    }
  },

  async estoqueBaixo(req, res) {
    try {
      const minimo = Number(req.query.minimo) || 10;
      const dados = await relatorioService.estoqueBaixo(minimo);
      return res.json(dados);
    } catch (err) {
      return res.status(500).json({ erro: err.message });
    }
  },

  async dashboard(req, res) {
    try {
      const dados = await relatorioService.dashboard();
      return res.json(dados);
    } catch (err) {
      return res.status(500).json({ erro: err.message });
    }
  },

  async kpis(req, res) {
    try {
      const { inicio, fim } = req.query;
      const dados = await relatorioService.kpis(inicio, fim);
      return res.json(dados);
    } catch (err) {
      return res.status(500).json({ erro: err.message });
    }
  },

  async categorias(req, res) {
    try {
      const { inicio, fim } = req.query;
      const dados = await relatorioService.categorias(inicio, fim);
      return res.json(dados);
    } catch (err) {
      return res.status(500).json({ erro: err.message });
    }
  }
};
