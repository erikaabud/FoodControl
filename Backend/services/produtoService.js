const produtosInfrastructure =
    require('../infrastructure/produtosInfrastructure');

const Produto =
    require('../models/entidades/produtos');

const categoriaInfrastructure =
    require('../infrastructure/categoriaInfrastructure');

class ProdutosService {
    async listarProdutos() {
        try {
            return await produtosInfrastructure.listarProdutos();

        } catch (error) {
            throw new Error(
                `Erro ao listar produtos: ${error.message}`
            );
        }
    }

    async cadastrarProduto(produto) {
        try {
            const categoria =
                await categoriaInfrastructure
                    .buscarCategoriaPorID(
                        produto.id_categoria
                    );

            if (!categoria) {
                throw new Error(
                    `Categoria com ID ${produto.id_categoria} não encontrada.`
                );
            }

            const novoProduto = new Produto(
                null,
                categoria,
                produto.nome_produto,
                produto.valor_unitario,
                produto.ativo
            );

            const quantidade =
                Number(produto.quantidade);

            const estoque_minimo =
                Number(produto.estoque_minimo);

            if (
                produto.quantidade === undefined ||
                produto.estoque_minimo === undefined ||
                !Number.isInteger(quantidade) ||
                !Number.isInteger(estoque_minimo) ||
                quantidade < 0 ||
                estoque_minimo < 0
            ) {
                throw new Error(
                    'A quantidade e o estoque mínimo devem ser números inteiros maiores ou iguais a zero.'
                );
            }

            const dadosProduto = {
                id_categoria:
                    categoria.id_categoria,

                nome_produto:
                    novoProduto.nome_produto,

                valor_unitario:
                    novoProduto.valor_unitario,

                ativo:
                    novoProduto.ativo,

                quantidade:
                    quantidade,

                estoque_minimo:
                    estoque_minimo
            };

            return await produtosInfrastructure
                .cadastrarProduto(
                    dadosProduto
                );

        } catch (error) {
            throw new Error(
                `Erro ao cadastrar produto: ${error.message}`
            );
        }
    }

    async deletarProduto(id) {
        try {
            const resposta =
                await produtosInfrastructure
                    .deletarProduto(id);

            if (
                resposta.acao ===
                'nao_encontrado'
            ) {
                throw new Error(
                    `Produto com ID ${id} não encontrado.`
                );
            }

            if (
                resposta.acao ===
                'possui_historico'
            ) {
                return {
                    sucesso: false,
                    excluido: false,
                    possui_historico: true,
                    mensagem:
                        'Este produto possui histórico de vendas ou movimentações de estoque e não pode ser excluído. Você pode desativá-lo usando o botão de status.'
                };
            }

            if (
                resposta.acao ===
                'deletado'
            ) {
                return {
                    sucesso: true,
                    excluido: true,
                    possui_historico: false,
                    mensagem:
                        'Produto excluído com sucesso!'
                };
            }

            throw new Error(
                'Não foi possível excluir o produto.'
            );

        } catch (error) {
            throw new Error(
                `Erro ao deletar produto: ${error.message}`
            );
        }
    }

    async buscarPorID(id) {
        try {
            const produto =
                await produtosInfrastructure
                    .buscarPorID(id);

            if (!produto) {
                throw new Error(
                    `Produto com ID ${id} não encontrado.`
                );
            }

            return produto;

        } catch (error) {
            throw new Error(
                `Erro ao buscar produto: ${error.message}`
            );
        }
    }

    async atualizarProduto(id, produto) {
        try {
            const categoria =
                await categoriaInfrastructure
                    .buscarCategoriaPorID(
                        produto.id_categoria
                    );

            if (!categoria) {
                throw new Error(
                    `Categoria com ID ${produto.id_categoria} não encontrada.`
                );
            }

            const produtoAtualizado =
                new Produto(
                    id,
                    categoria,
                    produto.nome_produto,
                    produto.valor_unitario,
                    produto.ativo
                );

            const quantidade =
                Number(produto.quantidade);

            const estoque_minimo =
                Number(produto.estoque_minimo);

            if (
                produto.quantidade === undefined ||
                produto.estoque_minimo === undefined ||
                !Number.isInteger(quantidade) ||
                !Number.isInteger(estoque_minimo) ||
                quantidade < 0 ||
                estoque_minimo < 0
            ) {
                throw new Error(
                    'A quantidade e o estoque mínimo devem ser números inteiros maiores ou iguais a zero.'
                );
            }

            const dadosProduto = {
                id_categoria:
                    categoria.id_categoria,

                nome_produto:
                    produtoAtualizado.nome_produto,

                valor_unitario:
                    produtoAtualizado.valor_unitario,

                ativo:
                    produtoAtualizado.ativo,

                quantidade:
                    quantidade,

                estoque_minimo:
                    estoque_minimo
            };

            const resposta =
                await produtosInfrastructure
                    .atualizarProduto(
                        id,
                        dadosProduto
                    );

            if (resposta > 0) {
                return `Produto com ID ${id} atualizado com sucesso!`;
            }

            throw new Error(
                `Produto com ID ${id} não encontrado.`
            );

        } catch (error) {
            throw new Error(
                `Erro ao atualizar produto: ${error.message}`
            );
        }
    }
}

module.exports = ProdutosService;