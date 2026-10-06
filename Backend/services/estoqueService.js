const estoqueInfrastructure = require('../infrastructure/estoqueInfrastructure');

class EstoqueService {

    async buscarEstoquePorProduto(id_produto) {
        try {
            const estoque = await estoqueInfrastructure.buscarEstoquePorProduto(id_produto);

            if (!estoque) {
                throw new Error(`Estoque do produto com ID ${id_produto} não encontrado.`);
            }

            return estoque;

        } catch (error) {
            throw new Error(`Erro ao buscar estoque: ${error.message}`);
        }
    }

    async cadastrarEstoque(id_produto, quantidade, estoque_minimo) {
        try {
            if (quantidade < 0 || estoque_minimo < 0) {
                throw new Error('A quantidade e o estoque mínimo não podem ser negativos.');
            }

            const resultado = await estoqueInfrastructure.cadastrarEstoque(
                id_produto,
                quantidade,
                estoque_minimo
            );

            return resultado;

        } catch (error) {
            throw new Error(`Erro ao cadastrar estoque: ${error.message}`);
        }
    }

    async atualizarEstoque(id_produto, quantidade, estoque_minimo) {
        try {
            if (quantidade < 0 || estoque_minimo < 0) {
                throw new Error('A quantidade e o estoque mínimo não podem ser negativos.');
            }

            const resultado = await estoqueInfrastructure.atualizarEstoque(
                id_produto,
                quantidade,
                estoque_minimo
            );

            if (resultado === 0) {
                throw new Error(`Estoque do produto com ID ${id_produto} não encontrado.`);
            }

            return resultado;

        } catch (error) {
            throw new Error(`Erro ao atualizar estoque: ${error.message}`);
        }
    }

}

module.exports = new EstoqueService();