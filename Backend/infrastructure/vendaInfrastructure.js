const { pool } = require('../config/db');

class VendaInfrastructure {

    async listarVendas() {
        const [rows] = await pool.query(`
            SELECT v.id_venda, v.id_cliente, c.nome AS cliente,
                   v.id_usuario, v.data_venda, v.status,
                   COALESCE(SUM(iv.quantidade * iv.valor_unitario), 0) AS total
            FROM Venda v
            LEFT JOIN Cliente c ON c.id_cliente = v.id_cliente
            LEFT JOIN Item_venda iv ON iv.id_venda = v.id_venda
            GROUP BY v.id_venda, v.id_cliente, c.nome, v.id_usuario, v.data_venda, v.status
            ORDER BY v.data_venda DESC
        `);

        return rows;
    }


    async buscarVendaPorID(id_venda) {
        const [vendas] = await pool.query(`
            SELECT v.id_venda, v.id_cliente, c.nome AS cliente,
                   v.id_usuario, v.data_venda, v.status
            FROM Venda v
            LEFT JOIN Cliente c ON c.id_cliente = v.id_cliente
            WHERE v.id_venda = ?
        `, [id_venda]);

        if (!vendas.length) return null;


        const [itens] = await pool.query(`
            SELECT iv.id_produto, p.nome_produto, iv.quantidade,
                   iv.valor_unitario,
                   (iv.quantidade * iv.valor_unitario) AS subtotal
            FROM Item_venda iv
            INNER JOIN Produto p ON p.id_produto = iv.id_produto
            WHERE iv.id_venda = ?
        `, [id_venda]);


        const [pagamentos] = await pool.query(`
            SELECT pg.id_pagamento, pg.id_forma_pagamento, fp.nome_forma,
                   pg.valor, pg.quantidade_parcelas, pg.data_pagamento, pg.status
            FROM Pagamento pg
            INNER JOIN Forma_pagamento fp 
                ON fp.id_forma_pagamento = pg.id_forma_pagamento
            WHERE pg.id_venda = ?
        `, [id_venda]);


        const total = itens.reduce(
            (s, i) => s + Number(i.subtotal),
            0
        );

        return {
            ...vendas[0],
            itens,
            pagamentos,
            total
        };
    }


    async listarFormasPagamento() {
        const [rows] = await pool.query(`
            SELECT id_forma_pagamento, nome_forma
            FROM Forma_pagamento
            WHERE ativo = TRUE
            ORDER BY nome_forma
        `);

        return rows;
    }


    async criarVenda(dados) {

        const {
            id_cliente,
            id_usuario,
            itens,
            id_forma_pagamento,
            quantidade_parcelas = 1
        } = dados;

        const connection = await pool.getConnection();

        try {

            await connection.beginTransaction();


            // ============================================
            // VERIFICAR CLIENTE
            // ============================================

            if (id_cliente) {

                const [cliente] = await connection.query(
                    `
                    SELECT id_cliente
                    FROM Cliente
                    WHERE id_cliente = ?
                    AND ativo = TRUE
                    `,
                    [id_cliente]
                );

                if (!cliente.length) {
                    throw new Error(
                        'Cliente não encontrado ou inativo.'
                    );
                }
            }


            // ============================================
            // VERIFICAR FORMA DE PAGAMENTO
            // ============================================

            const [forma] = await connection.query(
                `
                SELECT id_forma_pagamento, nome_forma
                FROM Forma_pagamento
                WHERE id_forma_pagamento = ?
                AND ativo = TRUE
                `,
                [id_forma_pagamento]
            );

            if (!forma.length) {
                throw new Error(
                    'Forma de pagamento inválida ou inativa.'
                );
            }


            // ============================================
            // VERIFICAR PRODUTOS E CALCULAR TOTAL
            // ============================================

            const itensPreparados = [];

            let total = 0;


            // FOR UPDATE evita duas vendas consumirem
            // o mesmo estoque ao mesmo tempo.

            for (const item of itens) {

                const [produtos] = await connection.query(`
                    SELECT
                        p.id_produto,
                        p.nome_produto,
                        p.valor_unitario,
                        p.ativo,
                        e.quantidade AS estoque
                    FROM Produto p
                    INNER JOIN Estoque e
                        ON e.id_produto = p.id_produto
                    WHERE p.id_produto = ?
                    FOR UPDATE
                `, [item.id_produto]);


                if (!produtos.length) {
                    throw new Error(
                        `Produto ${item.id_produto} não encontrado.`
                    );
                }


                const produto = produtos[0];


                if (!produto.ativo) {
                    throw new Error(
                        `O produto ${produto.nome_produto} está inativo.`
                    );
                }


                if (
                    Number(produto.estoque) <
                    item.quantidade
                ) {

                    throw new Error(
                        `Estoque insuficiente para ${produto.nome_produto}. Disponível: ${produto.estoque}.`
                    );
                }


                const valor =
                    Number(produto.valor_unitario);


                total +=
                    valor * item.quantidade;


                itensPreparados.push({
                    ...item,
                    valor_unitario: valor,
                    nome_produto:
                        produto.nome_produto
                });
            }


            // ============================================
            // CRÉDITO DO ALUNO
            // ============================================
            //
            // IMPORTANTE:
            //
            // Somente a forma "Crédito do Aluno"
            // utiliza a Conta_credito.
            //
            // Cartão de Crédito NÃO utiliza
            // o saldo do aluno.
            //
            // ============================================

            const nomeForma =
                String(forma[0].nome_forma)
                    .toLowerCase()
                    .normalize('NFD')
                    .replace(
                        /[\u0300-\u036f]/g,
                        ''
                    );


            const ehCreditoAluno =
                nomeForma.includes(
                    'credito do aluno'
                );


            let contaCredito = null;


            if (ehCreditoAluno) {

                if (!id_cliente) {

                    throw new Error(
                        'Pagamento com crédito do aluno exige um cliente aluno.'
                    );
                }


                const [contas] =
                    await connection.query(`
                        SELECT
                            cc.id_conta_credito,
                            cc.saldo
                        FROM Aluno a
                        INNER JOIN Conta_credito cc
                            ON cc.id_aluno = a.id_aluno
                        WHERE a.id_cliente = ?
                        FOR UPDATE
                    `, [id_cliente]);


                if (!contas.length) {

                    throw new Error(
                        'O cliente selecionado não possui conta de crédito de aluno.'
                    );
                }


                if (
                    Number(contas[0].saldo) <
                    total
                ) {

                    throw new Error(
                        'Saldo de crédito insuficiente.'
                    );
                }


                contaCredito = contas[0];
            }


            // ============================================
            // CRIAR VENDA
            // ============================================

            const [vendaResult] =
                await connection.query(
                    `
                    INSERT INTO Venda
                    (
                        id_cliente,
                        id_usuario,
                        status
                    )
                    VALUES (?, ?, 'Pendente')
                    `,
                    [
                        id_cliente || null,
                        id_usuario || null
                    ]
                );


            const id_venda =
                vendaResult.insertId;


            // ============================================
            // REGISTRAR ITENS E ATUALIZAR ESTOQUE
            // ============================================

            for (
                const item of itensPreparados
            ) {

                await connection.query(
                    `
                    INSERT INTO Item_venda
                    (
                        id_venda,
                        id_produto,
                        quantidade,
                        valor_unitario
                    )
                    VALUES (?, ?, ?, ?)
                    `,
                    [
                        id_venda,
                        item.id_produto,
                        item.quantidade,
                        item.valor_unitario
                    ]
                );


                await connection.query(
                    `
                    UPDATE Estoque
                    SET quantidade =
                        quantidade - ?
                    WHERE id_produto = ?
                    `,
                    [
                        item.quantidade,
                        item.id_produto
                    ]
                );


                await connection.query(
                    `
                    INSERT INTO Movimentacao_estoque
                    (
                        id_produto,
                        id_usuario,
                        tipo,
                        quantidade,
                        observacao
                    )
                    VALUES (?, ?, 'Saída', ?, ?)
                    `,
                    [
                        item.id_produto,
                        id_usuario || null,
                        item.quantidade,
                        `Venda #${id_venda}`
                    ]
                );
            }


            // ============================================
            // REGISTRAR PAGAMENTO
            // ============================================

            await connection.query(
                `
                INSERT INTO Pagamento
                (
                    id_venda,
                    id_forma_pagamento,
                    valor,
                    quantidade_parcelas,
                    status
                )
                VALUES (?, ?, ?, ?, 'Confirmado')
                `,
                [
                    id_venda,
                    id_forma_pagamento,
                    total,
                    quantidade_parcelas
                ]
            );


            // ============================================
            // DESCONTAR CRÉDITO DO ALUNO
            // ============================================
            //
            // Só entra aqui quando a forma escolhida
            // realmente for "Crédito do Aluno".
            //
            // ============================================

            if (contaCredito) {

                await connection.query(
                    `
                    UPDATE Conta_credito
                    SET saldo = saldo - ?
                    WHERE id_conta_credito = ?
                    `,
                    [
                        total,
                        contaCredito.id_conta_credito
                    ]
                );


                await connection.query(
                    `
                    INSERT INTO Movimentacao_credito
                    (
                        id_conta_credito,
                        id_venda,
                        id_usuario,
                        tipo,
                        valor,
                        observacao
                    )
                    VALUES (?, ?, ?, 'Compra', ?, ?)
                    `,
                    [
                        contaCredito.id_conta_credito,
                        id_venda,
                        id_usuario || null,
                        total,
                        `Compra da venda #${id_venda}`
                    ]
                );
            }


            // ============================================
            // FINALIZAR VENDA
            // ============================================

            await connection.query(
                `
                UPDATE Venda
                SET status = 'Concluída'
                WHERE id_venda = ?
                `,
                [id_venda]
            );


            await connection.commit();


            return {
                id_venda,
                total,
                status: 'Concluída'
            };


        } catch (error) {

            await connection.rollback();

            throw error;

        } finally {

            connection.release();
        }
    }


    async cancelarVenda(
        id_venda,
        id_usuario = null
    ) {

        const connection =
            await pool.getConnection();

        try {

            await connection.beginTransaction();


            const [vendas] =
                await connection.query(
                    `
                    SELECT *
                    FROM Venda
                    WHERE id_venda = ?
                    FOR UPDATE
                    `,
                    [id_venda]
                );


            if (!vendas.length) {
                throw new Error(
                    'Venda não encontrada.'
                );
            }


            if (
                vendas[0].status ===
                'Cancelada'
            ) {

                throw new Error(
                    'Esta venda já está cancelada.'
                );
            }


            // ============================================
            // DEVOLVER PRODUTOS AO ESTOQUE
            // ============================================

            const [itens] =
                await connection.query(
                    `
                    SELECT *
                    FROM Item_venda
                    WHERE id_venda = ?
                    `,
                    [id_venda]
                );


            for (const item of itens) {

                await connection.query(
                    `
                    UPDATE Estoque
                    SET quantidade =
                        quantidade + ?
                    WHERE id_produto = ?
                    `,
                    [
                        item.quantidade,
                        item.id_produto
                    ]
                );


                await connection.query(
                    `
                    INSERT INTO Movimentacao_estoque
                    (
                        id_produto,
                        id_usuario,
                        tipo,
                        quantidade,
                        observacao
                    )
                    VALUES (?, ?, 'Entrada', ?, ?)
                    `,
                    [
                        item.id_produto,
                        id_usuario,
                        item.quantidade,
                        `Estorno da venda #${id_venda}`
                    ]
                );
            }


            // ============================================
            // DEVOLVER CRÉDITO DO ALUNO
            // ============================================

            const [movCredito] =
                await connection.query(
                    `
                    SELECT
                        id_conta_credito,
                        valor
                    FROM Movimentacao_credito
                    WHERE id_venda = ?
                    AND tipo = 'Compra'
                    LIMIT 1
                    `,
                    [id_venda]
                );


            if (movCredito.length) {

                await connection.query(
                    `
                    UPDATE Conta_credito
                    SET saldo = saldo + ?
                    WHERE id_conta_credito = ?
                    `,
                    [
                        movCredito[0].valor,
                        movCredito[0]
                            .id_conta_credito
                    ]
                );


                await connection.query(
                    `
                    INSERT INTO Movimentacao_credito
                    (
                        id_conta_credito,
                        id_venda,
                        id_usuario,
                        tipo,
                        valor,
                        observacao
                    )
                    VALUES (?, ?, ?, 'Estorno', ?, ?)
                    `,
                    [
                        movCredito[0]
                            .id_conta_credito,
                        id_venda,
                        id_usuario,
                        movCredito[0].valor,
                        `Estorno da venda #${id_venda}`
                    ]
                );
            }


            // ============================================
            // CANCELAR PAGAMENTO
            // ============================================

            await connection.query(
                `
                UPDATE Pagamento
                SET status = 'Cancelado'
                WHERE id_venda = ?
                `,
                [id_venda]
            );


            // ============================================
            // CANCELAR VENDA
            // ============================================

            await connection.query(
                `
                UPDATE Venda
                SET status = 'Cancelada'
                WHERE id_venda = ?
                `,
                [id_venda]
            );


            await connection.commit();

            return true;


        } catch (error) {

            await connection.rollback();

            throw error;

        } finally {

            connection.release();
        }
    }
}


module.exports = new VendaInfrastructure();