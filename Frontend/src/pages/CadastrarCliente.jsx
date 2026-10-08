
import { useState } from "react";
import { PageHeader, Card, Field, Button } from "../components/UI";
import ModalAviso from "../components/ModalAviso";
import clienteService from "../../services/clienteService";

// Máscara automática para telefone fixo e celular.
function mascaraTelefone(valor) {
  const numeros = String(valor ?? "")
    .replace(/\D/g, "")
    .slice(0, 11);

  if (!numeros) return "";

  if (numeros.length <= 2) {
    return `(${numeros}`;
  }

  if (numeros.length <= 6) {
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`;
  }

  if (numeros.length <= 10) {
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 6)}-${numeros.slice(6)}`;
  }

  return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7)}`;
}

// Valida telefones com DDD e 10 ou 11 dígitos.
function telefoneValido(valor) {
  const numeros = String(valor ?? "").replace(/\D/g, "");

  return numeros.length === 10 || numeros.length === 11;
}

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

  const ehAluno = formulario.tipoCliente === "aluno";

  // Se qualquer campo do responsável for preenchido,
  // os três passam a ser obrigatórios.
  const possuiDadosResponsavel =
    ehAluno &&
    Boolean(
      formulario.responsavel.trim() ||
      formulario.telefoneResponsavel.trim() ||
      formulario.emailResponsavel.trim()
    );

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

  // Atualiza os campos e aplica a máscara nos telefones.
  function atualizarCampo(event) {
    const { name, value } = event.target;

    const valorFormatado =
      name === "telefone" || name === "telefoneResponsavel"
        ? mascaraTelefone(value)
        : value;

    setFormulario((dadosAnteriores) => ({
      ...dadosAnteriores,
      [name]: valorFormatado,
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

    if (salvando) return;

    // Nome e categoria obrigatórios.
    if (!formulario.nome.trim() || !formulario.tipoCliente) {
      mostrarAviso(
        "Preencha o nome e a categoria do cliente.",
        "aviso",
        "Dados obrigatórios"
      );
      return;
    }

    // Telefone obrigatório para todos os clientes.
    if (!formulario.telefone.trim()) {
      mostrarAviso(
        "Informe o telefone do cliente.",
        "aviso",
        "Telefone obrigatório"
      );
      return;
    }

    // Verifica a quantidade de dígitos do telefone.
    if (!telefoneValido(formulario.telefone)) {
      mostrarAviso(
        "Informe um telefone válido com DDD e 10 ou 11 dígitos.",
        "aviso",
        "Telefone inválido"
      );
      return;
    }

    // RA e turma obrigatórios para alunos.
    if (ehAluno) {
      if (!formulario.ra.trim()) {
        mostrarAviso(
          "Informe o RA do aluno.",
          "aviso",
          "RA obrigatório"
        );
        return;
      }

      if (!formulario.turma.trim()) {
        mostrarAviso(
          "Informe a turma do aluno.",
          "aviso",
          "Turma obrigatória"
        );
        return;
      }
    }

    // Validação condicional dos dados do responsável.
    if (possuiDadosResponsavel) {
      if (!formulario.responsavel.trim()) {
        mostrarAviso(
          "Informe o nome do responsável para completar os dados.",
          "aviso",
          "Responsável obrigatório"
        );
        return;
      }

      if (!formulario.telefoneResponsavel.trim()) {
        mostrarAviso(
          "Informe o telefone do responsável.",
          "aviso",
          "Telefone do responsável obrigatório"
        );
        return;
      }

      if (!telefoneValido(formulario.telefoneResponsavel)) {
        mostrarAviso(
          "Informe um telefone válido para o responsável, com DDD e 10 ou 11 dígitos.",
          "aviso",
          "Telefone do responsável inválido"
        );
        return;
      }

      if (!formulario.emailResponsavel.trim()) {
        mostrarAviso(
          "Informe o e-mail do responsável.",
          "aviso",
          "E-mail do responsável obrigatório"
        );
        return;
      }
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
        error.message || "Não foi possível cadastrar o cliente.",
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
        <form onSubmit={salvarCliente} noValidate>
          <div className="form-grid">
            {/* Nome completo */}
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

            {/* Categoria do cliente */}
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

            {/* Telefone obrigatório para todos */}
            <Field label="Telefone" required>
              <input
                type="tel"
                name="telefone"
                value={formulario.telefone}
                onChange={atualizarCampo}
                placeholder="(11) 91234-5678"
                inputMode="numeric"
                maxLength={15}
                autoComplete="tel"
                required
              />
            </Field>

            {ehAluno && (
              <>
                {/* RA obrigatório */}
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

                {/* Turma obrigatória */}
                <Field label="Turma" required>
                  <input
                    type="text"
                    name="turma"
                    value={formulario.turma}
                    onChange={atualizarCampo}
                    placeholder="Ex.: 6A"
                    required
                  />
                </Field>

                {/* Responsável condicional */}
                <Field
                  label="Responsável"
                  required={possuiDadosResponsavel}
                >
                  <input
                    type="text"
                    name="responsavel"
                    value={formulario.responsavel}
                    onChange={atualizarCampo}
                    placeholder="Nome do responsável"
                    required={possuiDadosResponsavel}
                  />
                </Field>

                {/* Telefone do responsável condicional */}
                <Field
                  label="Telefone do responsável"
                  required={possuiDadosResponsavel}
                >
                  <input
                    type="tel"
                    name="telefoneResponsavel"
                    value={formulario.telefoneResponsavel}
                    onChange={atualizarCampo}
                    placeholder="(11) 91234-5678"
                    inputMode="numeric"
                    maxLength={15}
                    autoComplete="tel"
                    required={possuiDadosResponsavel}
                  />
                </Field>

                {/* E-mail do responsável condicional */}
                <Field
                  label="E-mail do responsável"
                  required={possuiDadosResponsavel}
                >
                  <input
                    type="email"
                    name="emailResponsavel"
                    value={formulario.emailResponsavel}
                    onChange={atualizarCampo}
                    placeholder="responsavel@exemplo.com"
                    required={possuiDadosResponsavel}
                  />
                </Field>
              </>
            )}

            {/* Observações */}
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
