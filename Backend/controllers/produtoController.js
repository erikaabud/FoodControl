const ProdutosService = require('../services/produtoService');

const produtosService = new ProdutosService();

class ProdutoController {

    // LISTAR TODOS OS PRODUTOS
    async listarProdutos(req, res) {

        try {

            const produtos = await produtosService.listarProdutos();

            return res.status(200).json(produtos);

        } catch (error) {

            return res.status(500).json({
                mensagem: error.message
            });

        }

    }


    // CADASTRAR PRODUTO
    async cadastrarProduto(req, res) {

        try {

            const produto = req.body;

            const resposta = await produtosService.cadastrarProduto(produto);

            return res.status(201).json({
                mensagem: "Produto cadastrado com sucesso!",
                produto: resposta
            });

        } catch (error) {

            return res.status(400).json({
                mensagem: error.message
            });

        }

    }


    // BUSCAR PRODUTO POR ID
    async buscarPorID(req, res) {

        try {

            const { id } = req.params;

            const produto = await produtosService.buscarPorID(id);

            return res.status(200).json(produto);

        } catch (error) {

            return res.status(404).json({
                mensagem: error.message
            });

        }

    }


    // ATUALIZAR PRODUTO
    async atualizarProduto(req, res) {

        try {

            const { id } = req.params;

            const produto = req.body;

            const resposta = await produtosService.atualizarProduto(
                id,
                produto
            );

            return res.status(200).json({
                mensagem: resposta
            });

        } catch (error) {

            return res.status(400).json({
                mensagem: error.message
            });

        }

    }


    // DELETAR PRODUTO
    async deletarProduto(req, res) {
        try {
            const { id } = req.params;
    
            const resposta =
                await produtosService.deletarProduto(id);
    
            return res.status(200).json(resposta);
    
        } catch (error) {
            return res.status(400).json({
                sucesso: false,
                mensagem: error.message
            });
        }
    }

}

module.exports = new ProdutoController();