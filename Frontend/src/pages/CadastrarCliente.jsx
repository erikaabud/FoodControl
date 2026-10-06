import { useState } from "react";
import { PageHeader, Card, Field, Button } from "../components/UI";
import ModalAviso from "../components/ModalAviso";
import clienteService from "../../services/clienteService";

const formularioInicial = {
  nome: "",
  tipoCliente: "",
  ra: "",
  turma: "",
  responsavel: "",
  telefone: "",
  telefoneResponsavel: "",
  emailResponsavel: "",
  observacoes: "",
};

export default function CadastrarCliente() {
  const [formulario, setFormulario] = useState(formularioInicial);
  const [modal, setModal] = useState({
    aberto: false,
    tipo: "sucesso",
    titulo: "",
    mensagem: "",
  });
  const [salvando, setSalvando] = useState(false);

  function mostrarAviso(mensagem, tipo = "sucesso", titulo = "") {
    setModal({
      aberto: true,
      tipo,
      titulo,
      mensagem,
    });
  }

  function fecharAviso() {
    setModal((estadoAtual) => ({
      ...estadoAtual,
      aberto: false,
    }));
  }

  function atualizarCampo(event) {
    const { name, value } = event.target;

    setFormulario((dadosAnteriores) => ({
      ...dadosAnteriores,
      [name]: value,
    }));
  }

  function alterarTipoCliente(event) {
    const novoTipo = event.target.value;

    setFormulario((dadosAnteriores) => ({
      ...dadosAnteriores,
      tipoCliente: novoTipo,
      ra: novoTipo === "aluno" ? dadosAnteriores.ra : "",
      turma: novoTipo === "aluno" ? dadosAnteriores.turma : "",
      responsavel:
        novoTipo === "aluno" ? dadosAnteriores.responsavel : "",
      telefoneResponsavel:
        novoTipo === "aluno"
          ? dadosAnteriores.telefoneResponsavel
          : "",
      emailResponsavel:
        novoTipo === "aluno"
          ? dadosAnteriores.emailResponsavel
          : "",
    }));
  }

  function limparFormulario() {
    setFormulario(formularioInicial);
  }

  async function salvarCliente(event) {
    event.preventDefault();

    if (!formulario.nome.trim() || !formulario.tipoCliente) {
      mostrarAviso(
        "Preencha nome e tipo de cliente.",
        "aviso",
        "Dados obrigatórios"
      );
      return;
    }

    if (
      formulario.tipoCliente === "aluno" &&
      (!formulario.ra.trim() || !formulario.responsavel.trim())
    ) {
      mostrarAviso(
        "Preencha o RA e o responsável do aluno.",
        "aviso",
        "Dados incompletos"
      );
      return;
    }

    setSalvando(true);

    try {
      await clienteService.cadastrarCliente(formulario);
      setFormulario(formularioInicial);

      mostrarAviso(
        "Cliente cadastrado e salvo no banco com sucesso!",
        "sucesso",
        "Cliente cadastrado"
      );
    } catch (error) {
      mostrarAviso(
        error.message,
        "erro",
        "Erro ao cadastrar cliente"
      );
    } finally {
      setSalvando(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Cadastrar Cliente"
        subtitle="Preencha os dados para cadastrar um novo cliente."
      />

      <Card>
        <form onSubmit={salvarCliente}>
          <div className="form-grid">
            <Field label="Nome completo" required>
              <input
                type="text"
                name="nome"
                value={formulario.nome}
                onChange={atualizarCampo}
                placeholder="Digite o nome completo"
                required
              />
            </Field>

            <Field label="Categoria do cliente" required>
              <select
                name="tipoCliente"
                value={formulario.tipoCliente}
                onChange={alterarTipoCliente}
                required
              >
                <option value="">Selecione o tipo</option>
                <option value="aluno">Aluno</option>
                <option value="professor">Professor</option>
                <option value="funcionario">Funcionário</option>
                <option value="visitante">Visitante</option>
              </select>
            </Field>

            <Field label="Telefone">
              <input
                type="tel"
                name="telefone"
                value={formulario.telefone}
                onChange={atualizarCampo}
                placeholder="(11) 91234-5678"
              />
            </Field>

            {formulario.tipoCliente === "aluno" && (
              <>
                <Field label="RA" required>
                  <input
                    type="text"
                    name="ra"
                    value={formulario.ra}
                    onChange={atualizarCampo}
                    placeholder="Digite o RA"
                    required
                  />
                </Field>

                <Field label="Turma">
                  <input
                    type="text"
                    name="turma"
                    value={formulario.turma}
                    onChange={atualizarCampo}
                    placeholder="Ex.: 6A"
                  />
                </Field>

                <Field label="Responsável" required>
                  <input
                    type="text"
                    name="responsavel"
                    value={formulario.responsavel}
                    onChange={atualizarCampo}
                    placeholder="Nome do responsável"
                    required
                  />
                </Field>

                <Field label="Telefone do responsável">
                  <input
                    type="tel"
                    name="telefoneResponsavel"
                    value={formulario.telefoneResponsavel}
                    onChange={atualizarCampo}
                    placeholder="(11) 91234-5678"
                  />
                </Field>

                <Field label="E-mail do responsável">
                  <input
                    type="email"
                    name="emailResponsavel"
                    value={formulario.emailResponsavel}
                    onChange={atualizarCampo}
                    placeholder="responsavel@exemplo.com"
                  />
                </Field>
              </>
            )}

            <Field label="Observações">
              <textarea
                name="observacoes"
                value={formulario.observacoes}
                onChange={atualizarCampo}
                placeholder="Digite informações adicionais..."
              />
            </Field>
          </div>

          <div className="actions">
            <Button
              secondary
              type="button"
              onClick={limparFormulario}
              disabled={salvando}
            >
              Limpar
            </Button>

            <Button type="submit" disabled={salvando}>
              {salvando ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </Card>

      <ModalAviso
        aberto={modal.aberto}
        tipo={modal.tipo}
        titulo={modal.titulo}
        mensagem={modal.mensagem}
        onFechar={fecharAviso}
      />
    </>
  );
}
