import api from "./api";

const relatorioService = {
  dashboard() {
    return api.get("/relatorios/dashboard");
  },

  kpis(inicio, fim) {
    return api.get(`/relatorios/kpis?inicio=${inicio}&fim=${fim}`);
  },

  categorias(inicio, fim) {
    return api.get(`/relatorios/categorias?inicio=${inicio}&fim=${fim}`);
  },

  vendasPorPeriodo(inicio, fim) {
    return api.get(`/relatorios/vendas?inicio=${inicio}&fim=${fim}`);
  },

  produtosMaisVendidos(limite = 10) {
    return api.get(
      `/relatorios/produtos-mais-vendidos?limite=${limite}`
    );
  },

  formasPagamento(inicio, fim) {
    return api.get(
      `/relatorios/formas-pagamento?inicio=${inicio}&fim=${fim}`
    );
  },

  estoqueBaixo(minimo = 10) {
    return api.get(`/relatorios/estoque-baixo?minimo=${minimo}`);
  },
};

export default relatorioService;
