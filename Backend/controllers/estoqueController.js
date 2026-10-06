const estoqueService = require('../services/estoqueService');

class EstoqueController {

    async buscarEstoquePorProduto(req, res) {
        try {
            const { id_produto } = req.params;

            const estoque = await estoqueService.buscarEstoquePorProduto(id_produto);

            return res.status(200).json(estoque);

        } catch (error) {
            return res.status(404).json({
                mensagem: error.message
            });
        }
    }

    async cadastrarEstoque(req, res) {
        try {
            const { id_produto, quantidade, estoque_minimo } = req.body;

            const resultado = await estoqueService.cadastrarEstoque(
                id_produto,
                quantidade,
                estoque_minimo
            );

            return res.status(201).json({
                mensagem: 'Estoque cadastrado com sucesso!',
                resultado
            });

        } catch (error) {
            return res.status(400).json({
                mensagem: error.message
            });
        }
    }

    async atualizarEstoque(req, res) {
        try {
            const { id_produto } = req.params;
            const { quantidade, estoque_minimo } = req.body;

            const resultado = await estoqueService.atualizarEstoque(
                id_produto,
                quantidade,
                estoque_minimo
            );

            return res.status(200).json({
                mensagem: 'Estoque atualizado com sucesso!',
                resultado
            });

        } catch (error) {
            return res.status(400).json({
                mensagem: error.message
            });
        }
    }

}

module.exports = new EstoqueController();