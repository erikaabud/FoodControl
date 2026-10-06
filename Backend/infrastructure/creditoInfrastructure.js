const { pool } = require("../config/db");

class CreditoInfrastructure {
    async buscarAlunos(texto) {
        const termo = `%${texto}%`;

        const [alunos] = await pool.query(
            `
            SELECT
                c.id_cliente,
                c.nome,
                c.telefone,
                c.ativo,
                a.id_aluno,
                a.matricula,
                a.turma,
                cc.id_conta_credito,
                cc.saldo
            FROM Cliente c
            INNER JOIN Aluno a
                ON a.id_cliente = c.id_cliente
            INNER JOIN Conta_credito cc
                ON cc.id_aluno = a.id_aluno
            WHERE
                c.tipo_cliente = 'Aluno'
                AND (
                    c.nome LIKE ?
                    OR a.matricula LIKE ?
                    OR a.turma LIKE ?
                )
            ORDER BY c.nome
            `,
            [termo, termo, termo]
        );

        return alunos;
    }

    async buscarContaPorAluno(id_aluno) {
        const [contas] = await pool.query(
            `
            SELECT
                cc.id_conta_credito,
                cc.id_aluno,
                cc.saldo,
                c.id_cliente,
                c.nome,
                c.ativo,
                a.matricula,
                a.turma
            FROM Conta_credito cc
            INNER JOIN Aluno a
                ON a.id_aluno = cc.id_aluno
            INNER JOIN Cliente c
                ON c.id_cliente = a.id_cliente
            WHERE cc.id_aluno = ?
            `,
            [id_aluno]
        );

        return contas.length ? contas[0] : null;
    }

    async listarMovimentacoes(id_conta_credito) {
        const [movimentacoes] = await pool.query(
            `
            SELECT
                id_movimentacao,
                id_conta_credito,
                id_responsavel,
                id_venda,
                id_usuario,
                tipo,
                valor,
                data_movimentacao,
                observacao
            FROM Movimentacao_credito
            WHERE id_conta_credito = ?
            ORDER BY data_movimentacao DESC, id_movimentacao DESC
            `,
            [id_conta_credito]
        );

        return movimentacoes;
    }

    async adicionarCredito(
        id_aluno,
        valor,
        observacao,
        id_usuario = null,
        id_responsavel = null
    ) {
        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();

            const [contas] = await connection.query(
                `
                SELECT
                    id_conta_credito,
                    saldo
                FROM Conta_credito
                WHERE id_aluno = ?
                FOR UPDATE
                `,
                [id_aluno]
            );

            if (!contas.length) {
                throw new Error(
                    "Conta de crédito do aluno não encontrada."
                );
            }

            const conta = contas[0];

            const novoSaldo =
                Number(conta.saldo) + Number(valor);

            await connection.query(
                `
                UPDATE Conta_credito
                SET saldo = ?
                WHERE id_conta_credito = ?
                `,
                [novoSaldo, conta.id_conta_credito]
            );

            await connection.query(
                `
                INSERT INTO Movimentacao_credito
                (
                    id_conta_credito,
                    id_responsavel,
                    id_venda,
                    id_usuario,
                    tipo,
                    valor,
                    observacao
                )
                VALUES (?, ?, NULL, ?, 'Depósito', ?, ?)
                `,
                [
                    conta.id_conta_credito,
                    id_responsavel,
                    id_usuario,
                    valor,
                    observacao || "Recarga via Cantina",
                ]
            );

            await connection.commit();

            return {
                id_conta_credito: conta.id_conta_credito,
                saldo: novoSaldo,
            };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    async removerCredito(
        id_aluno,
        valor,
        observacao,
        id_usuario = null,
        id_responsavel = null
    ) {
        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();

            const [contas] = await connection.query(
                `
                SELECT
                    id_conta_credito,
                    saldo
                FROM Conta_credito
                WHERE id_aluno = ?
                FOR UPDATE
                `,
                [id_aluno]
            );

            if (!contas.length) {
                throw new Error(
                    "Conta de crédito do aluno não encontrada."
                );
            }

            const conta = contas[0];

            const saldoAtual = Number(conta.saldo);
            const valorRemocao = Number(valor);

            if (saldoAtual < valorRemocao) {
                throw new Error(
                    "O aluno não possui saldo suficiente."
                );
            }

            const novoSaldo =
                saldoAtual - valorRemocao;

            await connection.query(
                `
                UPDATE Conta_credito
                SET saldo = ?
                WHERE id_conta_credito = ?
                `,
                [novoSaldo, conta.id_conta_credito]
            );

            await connection.query(
                `
                INSERT INTO Movimentacao_credito
                (
                    id_conta_credito,
                    id_responsavel,
                    id_venda,
                    id_usuario,
                    tipo,
                    valor,
                    observacao
                )
                VALUES (?, ?, NULL, ?, 'Ajuste', ?, ?)
                `,
                [
                    conta.id_conta_credito,
                    id_responsavel,
                    id_usuario,
                    valorRemocao,
                    observacao || "Remoção de crédito",
                ]
            );

            await connection.commit();

            return {
                id_conta_credito: conta.id_conta_credito,
                saldo: novoSaldo,
            };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
}

module.exports = new CreditoInfrastructure();