const express = require("express");
const clientesController = require("../controllers/clientesController");

const router = express.Router();

router.get(
    "/",
    clientesController.listarClientes.bind(clientesController)
);

router.get(
    "/:id",
    clientesController.buscarClientePorID.bind(clientesController)
);

router.post(
    "/",
    clientesController.cadastrarCliente.bind(clientesController)
);

router.put(
    "/:id",
    clientesController.atualizarCliente.bind(clientesController)
);

router.patch(
    "/:id/status",
    clientesController.alterarStatusCliente.bind(clientesController)
);

router.delete(
    "/:id",
    clientesController.excluirCliente.bind(clientesController)
);

module.exports = router;