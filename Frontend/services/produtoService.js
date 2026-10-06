import api from "./api";

function mapearProduto(produto) {
  return {
    id: produto.id_produto,
    idProduto: produto.id_produto,
    idCategoria: Number(produto.id_categoria),
    nome: produto.nome_produto,
    preco: Number(produto.valor_unitario || 0),
    quantidade:
      produto.quantidade === null ? null : Number(produto.quantidade),
    estoqueMinimo:
      produto.estoque_minimo === null
        ? null
        : Number(produto.estoque_minimo),
    ativo: Boolean(Number(produto.ativo)),
    categoria: produto.nome_categoria || "",
  };
}

const produtoService = {
  async listarProdutos() {
    const response = await api.get("/produtos");
    return (response || []).map(mapearProduto);
  },

  async obterProdutoPorId(id) {
    const response = await api.get(`/produtos/${id}`);
    return mapearProduto(response);
  },

  async criarProduto(produto) {
    return api.post("/produtos", produto);
  },

  async atualizarProduto(id, produto) {
    return api.put(`/produtos/${id}`, produto);
  },

  async deletarProduto(id) {
    return api.delete(`/produtos/${id}`);
  },
};

export default produtoService;
