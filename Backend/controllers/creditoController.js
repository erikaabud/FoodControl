const creditoService =
    require("../services/creditoService");

class CreditoController {
    async buscarAlunos(req, res) {
        try {
            const alunos =
                await creditoService.buscarAlunos(
                    req.query.pesquisa
                );

            return res.status(200).json(alunos);
        } catch (error) {
            return res.status(400).json({
                mensagem: error.message,
            });
        }
    }

    async buscarConta(req, res) {
        try {
            const conta =
                await creditoService.buscarContaPorAluno(
                    req.params.idAluno
                );

            return res.status(200).json(conta);
        } catch (error) {
            return res.status(404).json({
                mensagem: error.message,
            });
        }
    }

    async listarMovimentacoes(req, res) {
        try {
            const movimentacoes =
                await creditoService.listarMovimentacoes(
                    req.params.idAluno
                );

            return res.status(200).json(movimentacoes);
        } catch (error) {
            return res.status(400).json({
                mensagem: error.message,
            });
        }
    }

    async adicionarCredito(req, res) {
        try {
            const resultado =
                await creditoService.adicionarCredito(
                    req.params.idAluno,
                    req.body
                );

            return res.status(200).json({
                mensagem:
                    "Crédito adicionado com sucesso!",
                ...resultado,
            });
        } catch (error) {
            return res.status(400).json({
                mensagem: error.message,
            });
        }
    }

    async removerCredito(req, res) {
        try {
            const resultado =
                await creditoService.removerCredito(
                    req.params.idAluno,
                    req.body
                );

            return res.status(200).json({
                mensagem:
                    "Crédito removido com sucesso!",
                ...resultado,
            });
        } catch (error) {
            return res.status(400).json({
                mensagem: error.message,
            });
        }
    }
}

module.exports = new CreditoController();