const { pool } = require("../config/db");

class ClientesInfrastructure {
    async listarClientes() {
        const [clientes] = await pool.query(`
            SELECT
                c.id_cliente,
                c.nome,
                c.tipo_cliente,
                c.telefone,
                c.observacoes,
                c.ativo,
                c.data_cadastro,
                a.id_aluno,
                a.matricula,
                a.turma,
                r.id_responsavel,
                r.nome AS responsavel,
                r.telefone AS telefone_responsavel,
                r.email AS email_responsavel,
                cc.id_conta_credito,
                cc.saldo AS credito
            FROM Cliente c
            LEFT JOIN Aluno a
                ON a.id_cliente = c.id_cliente
            LEFT JOIN Aluno_responsavel ar
                ON ar.id_aluno = a.id_aluno
                AND ar.responsavel_principal = TRUE
                AND ar.status = 'Ativo'
            LEFT JOIN Responsavel r
                ON r.id_responsavel = ar.id_responsavel
            LEFT JOIN Conta_credito cc
                ON cc.id_aluno = a.id_aluno
            ORDER BY c.nome
        `);

        return clientes;
    }

    async buscarClientePorID(id_cliente) {
        const [clientes] = await pool.query(
            `
                SELECT
                    c.id_cliente,
                    c.nome,
                    c.tipo_cliente,
                    c.telefone,
                    c.observacoes,
                    c.ativo,
                    c.data_cadastro,
                    a.id_aluno,
                    a.matricula,
                    a.turma,
                    r.id_responsavel,
                    r.nome AS responsavel,
                    r.telefone AS telefone_responsavel,
                    r.email AS email_responsavel,
                    cc.id_conta_credito,
                    cc.saldo AS credito
                FROM Cliente c
                LEFT JOIN Aluno a
                    ON a.id_cliente = c.id_cliente
                LEFT JOIN Aluno_responsavel ar
                    ON ar.id_aluno = a.id_aluno
                    AND ar.responsavel_principal = TRUE
                    AND ar.status = 'Ativo'
                LEFT JOIN Responsavel r
                    ON r.id_responsavel = ar.id_responsavel
                LEFT JOIN Conta_credito cc
                    ON cc.id_aluno = a.id_aluno
                WHERE c.id_cliente = ?
            `,
            [id_cliente]
        );

        return clientes.length
            ? clientes[0]
            : null;
    }

    async buscarAlunoPorMatricula(matricula) {
        const [alunos] = await pool.query(
            `
                SELECT id_aluno
                FROM Aluno
                WHERE matricula = ?
            `,
            [matricula]
        );

        return alunos.length
            ? alunos[0]
            : null;
    }

    async cadastrarCliente(dados) {
        const connection =
            await pool.getConnection();

        try {
            await connection.beginTransaction();

            const [resultadoCliente] =
                await connection.query(
                    `
                        INSERT INTO Cliente
                        (
                            nome,
                            tipo_cliente,
                            telefone,
                            observacoes,
                            ativo
                        )
                        VALUES (?, ?, ?, ?, TRUE)
                    `,
                    [
                        dados.nome,
                        dados.tipo_cliente,
                        dados.telefone || null,
                        dados.observacoes || null,
                    ]
                );

            const id_cliente =
                resultadoCliente.insertId;

            let id_aluno = null;
            let id_responsavel = null;

            if (dados.tipo_cliente === "Aluno") {
                const [resultadoAluno] =
                    await connection.query(
                        `
                            INSERT INTO Aluno
                            (
                                id_cliente,
                                matricula,
                                turma
                            )
                            VALUES (?, ?, ?)
                        `,
                        [
                            id_cliente,
                            dados.matricula,
                            dados.turma || null,
                        ]
                    );

                id_aluno =
                    resultadoAluno.insertId;

                const [resultadoResponsavel] =
                    await connection.query(
                        `
                            INSERT INTO Responsavel
                            (
                                nome,
                                telefone,
                                email,
                                ativo
                            )
                            VALUES (?, ?, ?, TRUE)
                        `,
                        [
                            dados.responsavel,
                            dados.telefone_responsavel ||
                                dados.telefone,
                            dados.email_responsavel ||
                                null,
                        ]
                    );

                id_responsavel =
                    resultadoResponsavel.insertId;

                await connection.query(
                    `
                        INSERT INTO Aluno_responsavel
                        (
                            id_aluno,
                            id_responsavel,
                            parentesco,
                            responsavel_principal,
                            status
                        )
                        VALUES (?, ?, ?, TRUE, 'Ativo')
                    `,
                    [
                        id_aluno,
                        id_responsavel,
                        dados.parentesco || null,
                    ]
                );

                await connection.query(
                    `
                        INSERT INTO Conta_credito
                        (
                            id_aluno,
                            saldo
                        )
                        VALUES (?, 0.00)
                    `,
                    [id_aluno]
                );
            }

            await connection.commit();

            return {
                id_cliente,
                id_aluno,
                id_responsavel,
            };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    async atualizarCliente(id_cliente, dados) {
        const connection =
            await pool.getConnection();

        try {
            await connection.beginTransaction();

            const [clienteExistente] =
                await connection.query(
                    `
                        SELECT *
                        FROM Cliente
                        WHERE id_cliente = ?
                    `,
                    [id_cliente]
                );

            if (!clienteExistente.length) {
                await connection.rollback();
                return 0;
            }

            await connection.query(
                `
                    UPDATE Cliente
                    SET
                        nome = ?,
                        tipo_cliente = ?,
                        telefone = ?,
                        observacoes = ?,
                        ativo = ?
                    WHERE id_cliente = ?
                `,
                [
                    dados.nome,
                    dados.tipo_cliente,
                    dados.telefone || null,
                    dados.observacoes || null,
                    dados.ativo,
                    id_cliente,
                ]
            );

            if (dados.tipo_cliente === "Aluno") {
                const [alunos] =
                    await connection.query(
                        `
                            SELECT *
                            FROM Aluno
                            WHERE id_cliente = ?
                        `,
                        [id_cliente]
                    );

                let id_aluno;

                if (alunos.length) {
                    id_aluno =
                        alunos[0].id_aluno;

                    await connection.query(
                        `
                            UPDATE Aluno
                            SET
                                matricula = ?,
                                turma = ?
                            WHERE id_aluno = ?
                        `,
                        [
                            dados.matricula,
                            dados.turma || null,
                            id_aluno,
                        ]
                    );
                } else {
                    const [resultadoAluno] =
                        await connection.query(
                            `
                                INSERT INTO Aluno
                                (
                                    id_cliente,
                                    matricula,
                                    turma
                                )
                                VALUES (?, ?, ?)
                            `,
                            [
                                id_cliente,
                                dados.matricula,
                                dados.turma || null,
                            ]
                        );

                    id_aluno =
                        resultadoAluno.insertId;

                    await connection.query(
                        `
                            INSERT INTO Conta_credito
                            (
                                id_aluno,
                                saldo
                            )
                            VALUES (?, 0.00)
                        `,
                        [id_aluno]
                    );
                }

                const [relacoesResponsavel] =
                    await connection.query(
                        `
                            SELECT
                                ar.id_responsavel
                            FROM Aluno_responsavel ar
                            WHERE ar.id_aluno = ?
                            AND ar.responsavel_principal = TRUE
                            AND ar.status = 'Ativo'
                            LIMIT 1
                        `,
                        [id_aluno]
                    );

                if (relacoesResponsavel.length) {
                    const id_responsavel =
                        relacoesResponsavel[0]
                            .id_responsavel;

                    await connection.query(
                        `
                            UPDATE Responsavel
                            SET
                                nome = ?,
                                telefone = ?,
                                email = ?,
                                ativo = TRUE
                            WHERE id_responsavel = ?
                        `,
                        [
                            dados.responsavel,
                            dados.telefone_responsavel ||
                                dados.telefone ||
                                null,
                            dados.email_responsavel ||
                                null,
                            id_responsavel,
                        ]
                    );
                } else {
                    const [resultadoResponsavel] =
                        await connection.query(
                            `
                                INSERT INTO Responsavel
                                (
                                    nome,
                                    telefone,
                                    email,
                                    ativo
                                )
                                VALUES (?, ?, ?, TRUE)
                            `,
                            [
                                dados.responsavel,
                                dados.telefone_responsavel ||
                                    dados.telefone ||
                                    null,
                                dados.email_responsavel ||
                                    null,
                            ]
                        );

                    const id_responsavel =
                        resultadoResponsavel.insertId;

                    await connection.query(
                        `
                            INSERT INTO Aluno_responsavel
                            (
                                id_aluno,
                                id_responsavel,
                                parentesco,
                                responsavel_principal,
                                status
                            )
                            VALUES (?, ?, ?, TRUE, 'Ativo')
                        `,
                        [
                            id_aluno,
                            id_responsavel,
                            dados.parentesco || null,
                        ]
                    );
                }
            }

            await connection.commit();

            return 1;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    async desativarCliente(id_cliente) {
        const [resultado] =
            await pool.query(
                `
                    UPDATE Cliente
                    SET ativo = FALSE
                    WHERE id_cliente = ?
                `,
                [id_cliente]
            );

        return resultado.affectedRows;
    }

    async alterarStatusCliente(id_cliente, ativo) {
        const [resultado] =
            await pool.query(
                `
                    UPDATE Cliente
                    SET ativo = ?
                    WHERE id_cliente = ?
                `,
                [ativo, id_cliente]
            );

        return resultado.affectedRows;
    }

    async excluirCliente(id_cliente) {
        const connection =
            await pool.getConnection();

        try {
            await connection.beginTransaction();

            const [clientes] =
                await connection.query(
                    `
                        SELECT id_cliente
                        FROM Cliente
                        WHERE id_cliente = ?
                    `,
                    [id_cliente]
                );

            if (!clientes.length) {
                await connection.rollback();

                return {
                    excluido: false,
                    motivo: "nao_encontrado",
                };
            }

            const [vendas] =
                await connection.query(
                    `
                        SELECT id_venda
                        FROM Venda
                        WHERE id_cliente = ?
                        LIMIT 1
                    `,
                    [id_cliente]
                );

            if (vendas.length) {
                await connection.rollback();

                return {
                    excluido: false,
                    motivo: "possui_vendas",
                };
            }

            const [alunos] =
                await connection.query(
                    `
                        SELECT id_aluno
                        FROM Aluno
                        WHERE id_cliente = ?
                    `,
                    [id_cliente]
                );

            if (alunos.length) {
                const id_aluno =
                    alunos[0].id_aluno;

                const [responsaveis] =
                    await connection.query(
                        `
                            SELECT id_responsavel
                            FROM Aluno_responsavel
                            WHERE id_aluno = ?
                        `,
                        [id_aluno]
                    );

                const [contas] =
                    await connection.query(
                        `
                            SELECT id_conta_credito
                            FROM Conta_credito
                            WHERE id_aluno = ?
                        `,
                        [id_aluno]
                    );

                for (const conta of contas) {
                    const [movimentacoes] =
                        await connection.query(
                            `
                                SELECT id_movimentacao
                                FROM Movimentacao_credito
                                WHERE id_conta_credito = ?
                                LIMIT 1
                            `,
                            [
                                conta.id_conta_credito,
                            ]
                        );

                    if (movimentacoes.length) {
                        await connection.rollback();

                        return {
                            excluido: false,
                            motivo:
                                "possui_movimentacao_credito",
                        };
                    }
                }

                await connection.query(
                    `
                        DELETE FROM Aluno_responsavel
                        WHERE id_aluno = ?
                    `,
                    [id_aluno]
                );

                await connection.query(
                    `
                        DELETE FROM Conta_credito
                        WHERE id_aluno = ?
                    `,
                    [id_aluno]
                );

                await connection.query(
                    `
                        DELETE FROM Aluno
                        WHERE id_aluno = ?
                    `,
                    [id_aluno]
                );

                for (const responsavel of responsaveis) {
                    const [outrasRelacoes] =
                        await connection.query(
                            `
                                SELECT id_aluno
                                FROM Aluno_responsavel
                                WHERE id_responsavel = ?
                                LIMIT 1
                            `,
                            [
                                responsavel.id_responsavel,
                            ]
                        );

                    if (!outrasRelacoes.length) {
                        await connection.query(
                            `
                                DELETE FROM Responsavel
                                WHERE id_responsavel = ?
                            `,
                            [
                                responsavel.id_responsavel,
                            ]
                        );
                    }
                }
            }

            const [resultado] =
                await connection.query(
                    `
                        DELETE FROM Cliente
                        WHERE id_cliente = ?
                    `,
                    [id_cliente]
                );

            await connection.commit();

            return {
                excluido:
                    resultado.affectedRows > 0,
                motivo: null,
            };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
}

module.exports =
    new ClientesInfrastructure();