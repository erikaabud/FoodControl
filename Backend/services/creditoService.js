const creditoInfrastructure =
    require("../infrastructure/creditoInfrastructure");

class CreditoService {
    async buscarAlunos(texto) {
        if (!texto || !texto.trim()) {
            throw new Error(
                "Digite o nome, RA ou turma do aluno."
            );
        }

        return await creditoInfrastructure.buscarAlunos(
            texto.trim()
        );
    }

    async buscarContaPorAluno(id_aluno) {
        const conta =
            await creditoInfrastructure.buscarContaPorAluno(
                id_aluno
            );

        if (!conta) {
            throw new Error(
                "Conta de crédito do aluno não encontrada."
            );
        }

        return conta;
    }

    async listarMovimentacoes(id_aluno) {
        const conta =
            await creditoInfrastructure.buscarContaPorAluno(
                id_aluno
            );

        if (!conta) {
            throw new Error(
                "Conta de crédito do aluno não encontrada."
            );
        }

        return await creditoInfrastructure.listarMovimentacoes(
            conta.id_conta_credito
        );
    }

    async adicionarCredito(id_aluno, dados) {
        const valor = Number(dados.valor);

        if (!valor || valor <= 0) {
            throw new Error(
                "Informe um valor maior que zero."
            );
        }

        const conta =
            await creditoInfrastructure.buscarContaPorAluno(
                id_aluno
            );

        if (!conta) {
            throw new Error(
                "Conta de crédito do aluno não encontrada."
            );
        }

        if (!conta.ativo) {
            throw new Error(
                "Não é possível adicionar crédito a um aluno inativo."
            );
        }

        return await creditoInfrastructure.adicionarCredito(
            id_aluno,
            valor,
            dados.observacao,
            dados.id_usuario || null,
            dados.id_responsavel || null
        );
    }

    async removerCredito(id_aluno, dados) {
        const valor = Number(dados.valor);

        if (!valor || valor <= 0) {
            throw new Error(
                "Informe um valor maior que zero."
            );
        }

        const conta =
            await creditoInfrastructure.buscarContaPorAluno(
                id_aluno
            );

        if (!conta) {
            throw new Error(
                "Conta de crédito do aluno não encontrada."
            );
        }

        if (!conta.ativo) {
            throw new Error(
                "Não é possível alterar o crédito de um aluno inativo."
            );
        }

        return await creditoInfrastructure.removerCredito(
            id_aluno,
            valor,
            dados.observacao,
            dados.id_usuario || null,
            dados.id_responsavel || null
        );
    }
}

module.exports = new CreditoService();