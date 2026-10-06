const express = require('express');

const router = express.Router();

const estoqueController = require('../controllers/estoqueController');

// BUSCAR ESTOQUE PELO ID DO PRODUTO
router.get('/:id_produto', estoqueController.buscarEstoquePorProduto);

// CADASTRAR ESTOQUE
router.post('/', estoqueController.cadastrarEstoque);

// ATUALIZAR ESTOQUE
router.put('/:id_produto', estoqueController.atualizarEstoque);

module.exports = router;