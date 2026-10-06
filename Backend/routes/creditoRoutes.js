const express = require("express");
const creditoController =
    require("../controllers/creditoController");

const router = express.Router();

router.get(
    "/alunos",
    creditoController.buscarAlunos.bind(
        creditoController
    )
);

router.get(
    "/aluno/:idAluno",
    creditoController.buscarConta.bind(
        creditoController
    )
);

router.get(
    "/aluno/:idAluno/movimentacoes",
    creditoController.listarMovimentacoes.bind(
        creditoController
    )
);

router.post(
    "/aluno/:idAluno/adicionar",
    creditoController.adicionarCredito.bind(
        creditoController
    )
);

router.post(
    "/aluno/:idAluno/remover",
    creditoController.removerCredito.bind(
        creditoController
    )
);

module.exports = router;