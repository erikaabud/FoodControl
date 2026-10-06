const { pool } = require('../config/db');

class ProdutosInfrastructure {
    async listarProdutos() {
        const [produtos] = await pool.query(`
            SELECT p.id_produto, p.id_categoria, p.nome_produto,
                   p.valor_unitario, p.ativo, e.quantidade, e.estoque_minimo
            FROM Produto p
            LEFT JOIN Estoque e ON p.id_produto = e.id_produto
            ORDER BY p.nome_produto
        `);

        return produtos;
    }

    async cadastrarProduto(produto) {
        const {
            id_categoria,
            nome_produto,
            valor_unitario,
            ativo,
            quantidade,
            estoque_minimo
        } = produto;

        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();

            const [result] = await connection.query(
                `INSERT INTO Produto
                (id_categoria, nome_produto, valor_unitario, ativo)
                VALUES (?, ?, ?, ?)`,
                [
                    id_categoria,
                    nome_produto,
                    valor_unitario,
                    ativo
                ]
            );

            const id_produto = result.insertId;

            await connection.query(
                `INSERT INTO Estoque
                (id_produto, quantidade, estoque_minimo)
                VALUES (?, ?, ?)`,
                [
                    id_produto,
                    quantidade,
                    estoque_minimo
                ]
            );

            await connection.commit();

            return id_produto;

        } catch (error) {
            await connection.rollback();
            throw error;

        } finally {
            connection.release();
        }
    }

    async deletarProduto(id_produto) {
        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();

            const [produto] = await connection.query(
                `SELECT id_produto
                 FROM Produto
                 WHERE id_produto = ?`,
                [id_produto]
            );

            if (produto.length === 0) {
                await connection.rollback();

                return {
                    afetados: 0,
                    acao: 'nao_encontrado'
                };
            }

            const [referencias] = await connection.query(
                `SELECT
                    (
                        SELECT COUNT(*)
                        FROM Item_venda
                        WHERE id_produto = ?
                    ) AS itens_venda,
                    (
                        SELECT COUNT(*)
                        FROM Movimentacao_estoque
                        WHERE id_produto = ?
                    ) AS movimentacoes`,
                [id_produto, id_produto]
            );

            const itensVenda =
                Number(referencias[0].itens_venda);

            const movimentacoes =
                Number(referencias[0].movimentacoes);

            if (
                itensVenda > 0 ||
                movimentacoes > 0
            ) {
                await connection.rollback();

                return {
                    afetados: 0,
                    acao: 'possui_historico',
                    itens_venda: itensVenda,
                    movimentacoes: movimentacoes
                };
            }

            await connection.query(
                `DELETE FROM Estoque
                 WHERE id_produto = ?`,
                [id_produto]
            );

            const [result] = await connection.query(
                `DELETE FROM Produto
                 WHERE id_produto = ?`,
                [id_produto]
            );

            await connection.commit();

            return {
                afetados: result.affectedRows,
                acao: 'deletado'
            };

        } catch (error) {
            await connection.rollback();
            throw error;

        } finally {
            connection.release();
        }
    }

    async buscarPorID(id_produto) {
        const [rows] = await pool.query(
            `SELECT p.id_produto,
                    p.id_categoria,
                    p.nome_produto,
                    p.valor_unitario,
                    p.ativo,
                    e.quantidade,
                    e.estoque_minimo
             FROM Produto p
             LEFT JOIN Estoque e
                ON p.id_produto = e.id_produto
             WHERE p.id_produto = ?`,
            [id_produto]
        );

        return rows.length
            ? rows[0]
            : null;
    }

    async atualizarProduto(id, produto) {
        const {
            id_categoria,
            nome_produto,
            valor_unitario,
            ativo,
            quantidade,
            estoque_minimo
        } = produto;

        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();

            const [existe] = await connection.query(
                `SELECT id_produto
                 FROM Produto
                 WHERE id_produto = ?`,
                [id]
            );

            if (!existe.length) {
                throw new Error(
                    `Produto com ID ${id} não encontrado.`
                );
            }

            const [resultadoProduto] =
                await connection.query(
                    `UPDATE Produto
                     SET id_categoria = ?,
                         nome_produto = ?,
                         valor_unitario = ?,
                         ativo = ?
                     WHERE id_produto = ?`,
                    [
                        id_categoria,
                        nome_produto,
                        valor_unitario,
                        ativo,
                        id
                    ]
                );

            await connection.query(
                `INSERT INTO Estoque
                    (id_produto, quantidade, estoque_minimo)
                 VALUES (?, ?, ?)
                 ON DUPLICATE KEY UPDATE
                    quantidade = VALUES(quantidade),
                    estoque_minimo = VALUES(estoque_minimo)`,
                [
                    id,
                    quantidade,
                    estoque_minimo
                ]
            );

            await connection.commit();

            return resultadoProduto.affectedRows;

        } catch (error) {
            await connection.rollback();
            throw error;

        } finally {
            connection.release();
        }
    }
}

module.exports = new ProdutosInfrastructure();