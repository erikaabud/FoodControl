import api from "./api";

const vendasService = {
  listarVendas() {
    return api.get("/vendas");
  },

  obterVendaPorId(id) {
    return api.get(`/vendas/${id}`);
  },

  listarFormasPagamento() {
    return api.get("/vendas/formas-pagamento");
  },

  criarVenda(venda) {
    return api.post("/vendas", venda);
  },

  cancelarVenda(id, idUsuario = null) {
    return api.patch(`/vendas/${id}/cancelar`, {
      id_usuario: idUsuario,
    });
  },
};

export default vendasService;
