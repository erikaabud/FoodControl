const express = require('express');
const router = express.Router();
const relatorioController = require('../controllers/relatorioController');

router.get('/vendas', relatorioController.vendasPorPeriodo);
router.get('/produtos-mais-vendidos', relatorioController.produtosMaisVendidos);
router.get('/formas-pagamento', relatorioController.formasPagamento);
router.get('/estoque-baixo', relatorioController.estoqueBaixo);
router.get('/dashboard', relatorioController.dashboard);
router.get('/kpis', relatorioController.kpis);
router.get('/categorias', relatorioController.categorias);

module.exports = router;
