import produtoService from "./produtoService";

const estoqueService = {
  listarEstoque() {
    return produtoService.listarProdutos();
  },
};

export default estoqueService;
