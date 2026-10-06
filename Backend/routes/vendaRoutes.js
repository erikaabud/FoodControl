const express = require('express');
const router = express.Router();
const vendaController = require('../controllers/vendaController');

router.get('/formas-pagamento', vendaController.formasPagamento);
router.get('/', vendaController.listar);
router.get('/:id', vendaController.buscarPorID);
router.post('/', vendaController.criar);
router.patch('/:id/cancelar', vendaController.cancelar);

module.exports = router;
