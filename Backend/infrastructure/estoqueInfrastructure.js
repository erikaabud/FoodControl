const { pool } = require('../config/db');

class EstoqueInfrastructure {

    async buscarEstoquePorProduto(id_produto) {

        const [estoque] = await pool.query(
            'SELECT * FROM estoque WHERE id_produto = ?',
            [id_produto]
        );

        return estoque[0] || null;

    }

    async cadastrarEstoque(id_produto, quantidade, estoque_minimo) {

        const [resultado] = await pool.query(
            `INSERT INTO estoque
            (id_produto, quantidade, estoque_minimo)
            VALUES (?, ?, ?)`,
            [id_produto, quantidade, estoque_minimo]
        );

        return resultado.affectedRows;

    }

    async atualizarEstoque(id_produto, quantidade, estoque_minimo) {

        const [resultado] = await pool.query(
            `UPDATE estoque
             SET quantidade = ?, estoque_minimo = ?
             WHERE id_produto = ?`,
            [quantidade, estoque_minimo, id_produto]
        );

        return resultado.affectedRows;

    }

}

module.exports = new EstoqueInfrastructure();