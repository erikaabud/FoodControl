import api from "./api";

function mapearAluno(aluno) {
  return {
    id: aluno.id_aluno,
    idAluno: aluno.id_aluno,
    idCliente: aluno.id_cliente,
    idContaCredito: aluno.id_conta_credito,
    nome: aluno.nome,
    ra: aluno.matricula || "",
    turma: aluno.turma || "",
    telefone: aluno.telefone || "",
    credito: Number(aluno.saldo || 0),
    ativo: Boolean(Number(aluno.ativo)),
  };
}

const creditoService = {
  async buscarAlunos(pesquisa) {
    const response = await api.get(
      `/credito/alunos?pesquisa=${encodeURIComponent(pesquisa)}`
    );
    return (response || []).map(mapearAluno);
  },

  async buscarConta(idAluno) {
    const response = await api.get(`/credito/aluno/${idAluno}`);
    return mapearAluno(response);
  },

  listarMovimentacoes(idAluno) {
    return api.get(`/credito/aluno/${idAluno}/movimentacoes`);
  },

  adicionarCredito(idAluno, payload) {
    return api.post(`/credito/aluno/${idAluno}/adicionar`, payload);
  },

  removerCredito(idAluno, payload) {
    return api.post(`/credito/aluno/${idAluno}/remover`, payload);
  },
};

export default creditoService;
