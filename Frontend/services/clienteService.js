import api from "./api";

function mapearCliente(cliente) {
  return {
    id: cliente.id_cliente,
    idCliente: cliente.id_cliente,
    idAluno: cliente.id_aluno || null,
    idContaCredito: cliente.id_conta_credito || null,
    nome: cliente.nome || "",
    tipoCliente: cliente.tipo_cliente || "",
    ra: cliente.matricula || "",
    turma: cliente.turma || "",
    responsavel: cliente.responsavel || "",
    telefone: cliente.telefone || "",
    telefoneResponsavel: cliente.telefone_responsavel || "",
    emailResponsavel: cliente.email_responsavel || "",
    observacoes: cliente.observacoes || "",
    credito: Number(cliente.credito || 0),
    ativo: Boolean(Number(cliente.ativo)),
  };
}

function normalizarPayload(dadosCliente) {
  return {
    nome: dadosCliente.nome?.trim(),
    tipoCliente: dadosCliente.tipoCliente,
    telefone: dadosCliente.telefone?.trim() || "",
    observacoes: dadosCliente.observacoes?.trim() || "",
    ra: dadosCliente.ra?.trim() || "",
    turma: dadosCliente.turma?.trim() || "",
    responsavel: dadosCliente.responsavel?.trim() || "",
    telefone_responsavel:
      dadosCliente.telefoneResponsavel?.trim() || "",
    email_responsavel:
      dadosCliente.emailResponsavel?.trim() || "",
    parentesco: dadosCliente.parentesco?.trim() || "",
  };
}

const clienteService = {
  async listarClientes() {
    const response = await api.get("/clientes");
    return (response || []).map(mapearCliente);
  },

  async buscarClientePorID(id) {
    const response = await api.get(`/clientes/${id}`);
    return mapearCliente(response);
  },

  async cadastrarCliente(dadosCliente) {
    return api.post("/clientes", normalizarPayload(dadosCliente));
  },

  async atualizarCliente(id, dadosAtualizados) {
    return api.put(
      `/clientes/${id}`,
      normalizarPayload(dadosAtualizados)
    );
  },

  async alterarStatus(id, ativo) {
    return api.patch(`/clientes/${id}/status`, { ativo });
  },

  async deletarCliente(id) {
    return api.delete(`/clientes/${id}`);
  },
};

export default clienteService;
