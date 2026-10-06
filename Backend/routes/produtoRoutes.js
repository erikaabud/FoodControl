const express = require('express');

const router = express.Router();

const produtoController = require('../controllers/produtoController');


// LISTAR TODOS OS PRODUTOS
router.get('/', produtoController.listarProdutos);


// BUSCAR PRODUTO POR ID
router.get('/:id', produtoController.buscarPorID);


// CADASTRAR PRODUTO
router.post('/', produtoController.cadastrarProduto);


// ATUALIZAR PRODUTO
router.put('/:id', produtoController.atualizarProduto);


// DELETAR PRODUTO
router.delete('/:id', produtoController.deletarProduto);


module.exports = router;