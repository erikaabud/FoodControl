
import { useEffect, useState } from "react";
import { Pencil, Trash2, Power, X } from "lucide-react";

import {
  PageHeader,
  Card,
  Status,
  money,
  Field,
  Button,
} from "../components/UI";

import ModalAviso from "../components/ModalAviso";
import clienteService from "../../services/clienteService";

// Máscara automática para telefones fixos e celulares.
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

// Valida a quantidade de dígitos do telefone.
function telefoneValido(valor) {
  const numeros = String(valor ?? "").replace(/\D/g, "");

  return numeros.length === 10 || numeros.length === 11;
}

const formularioInicial = {
  id: null,
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

export default function ListaClientes() {
  const [clientes, setClientes] = useState([]);
  const [pesquisa, setPesquisa] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [editando, setEditando] = useState(false);
  const [formulario, setFormulario] = useState(formularioInicial);

  const [modal, setModal] = useState({
    aberto: false,
    tipo: "sucesso",
    titulo: "",
    mensagem: "",
  });

  useEffect(() => {
    carregarClientes();
  }, []);

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

  async function carregarClientes() {
    try {
      setCarregando(true);
      setClientes(await clienteService.listarClientes());
    } catch (error) {
      mostrarAviso(
        error.message,
        "erro",
        "Erro ao carregar clientes"
      );
    } finally {
      setCarregando(false);
    }
  }

  const clientesFiltrados = clientes.filter((cliente) => {
    const texto = pesquisa.toLowerCase().trim();

    return (
      cliente.nome?.toLowerCase().includes(texto) ||
      cliente.ra?.toLowerCase().includes(texto) ||
      cliente.telefone?.toLowerCase().includes(texto) ||
      cliente.tipoCliente?.toLowerCase().includes(texto) ||
      cliente.responsavel?.toLowerCase().includes(texto)
    );
  });

  // Ativa ou desativa um cliente.
  async function alterarStatus(cliente) {
    try {
      const dados = await clienteService.alterarStatus(
        cliente.id,
        !cliente.ativo
      );

      await carregarClientes();

      mostrarAviso(
        dados.mensagem,
        "sucesso",
        cliente.ativo ? "Cliente desativado" : "Cliente ativado"
      );
    } catch (error) {
      mostrarAviso(
        error.message,
        "erro",
        "Erro ao alterar status"
      );
    }
  }

  // Busca os dados do cliente e abre a edição.
  async function editarCliente(cliente) {
    try {
      setCarregando(true);

      const dados = await clienteService.buscarClientePorID(
        cliente.id
      );

      setFormulario({
        id: dados.id,
        nome: dados.nome || "",
        tipoCliente: dados.tipoCliente?.toLowerCase() || "",
        ra: dados.ra || "",
        turma: dados.turma || "",
        responsavel: dados.responsavel || "",

        // Formata os telefones já cadastrados.
        telefone: mascaraTelefone(dados.telefone),
        telefoneResponsavel: mascaraTelefone(
          dados.telefoneResponsavel
        ),

        emailResponsavel: dados.emailResponsavel || "",
        observacoes: dados.observacoes || "",
      });

      setEditando(true);
    } catch (error) {
      mostrarAviso(
        error.message,
        "erro",
        "Erro ao editar cliente"
      );
    } finally {
      setCarregando(false);
    }
  }

  // Atualiza os campos do formulário.
  function atualizarCampo(event) {
    const { name, value } = event.target;

    // Aplica a máscara somente aos campos de telefone.
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
    const tipoCliente = event.target.value;

    setFormulario((dadosAnteriores) => ({
      ...dadosAnteriores,
      tipoCliente,
      ra: tipoCliente === "aluno" ? dadosAnteriores.ra : "",
      turma: tipoCliente === "aluno" ? dadosAnteriores.turma : "",
      responsavel:
        tipoCliente === "aluno"
          ? dadosAnteriores.responsavel
          : "",
      telefoneResponsavel:
        tipoCliente === "aluno"
          ? dadosAnteriores.telefoneResponsavel
          : "",
      emailResponsavel:
        tipoCliente === "aluno"
          ? dadosAnteriores.emailResponsavel
          : "",
    }));
  }

  function fecharEdicao() {
    if (salvando) return;

    setEditando(false);
    setFormulario(formularioInicial);
  }

  // Salva as alterações do cliente.
  async function salvarEdicao(event) {
    event.preventDefault();

    if (salvando) return;

    // Validação dos campos obrigatórios.
    if (!formulario.nome.trim() || !formulario.tipoCliente) {
      mostrarAviso(
        "Preencha nome e tipo do cliente.",
        "erro",
        "Campo obrigatório"
      );
      return;
    }

    if (
      formulario.tipoCliente === "aluno" &&
      (!formulario.ra.trim() || !formulario.responsavel.trim())
    ) {
      mostrarAviso(
        "Informe o RA e o responsável do aluno.",
        "erro",
        "Campo obrigatório"
      );
      return;
    }

    // Validação do telefone do cliente.
    if (
      formulario.telefone &&
      !telefoneValido(formulario.telefone)
    ) {
      mostrarAviso(
        "O telefone do cliente está incompleto. Informe o DDD e um número com 10 ou 11 dígitos.",
        "aviso",
        "Telefone inválido"
      );
      return;
    }

    // Validação do telefone do responsável.
    if (
      formulario.tipoCliente === "aluno" &&
      formulario.telefoneResponsavel &&
      !telefoneValido(formulario.telefoneResponsavel)
    ) {
      mostrarAviso(
        "O telefone do responsável está incompleto. Informe o DDD e um número com 10 ou 11 dígitos.",
        "aviso",
        "Telefone do responsável inválido"
      );
      return;
    }

    try {
      setSalvando(true);

      const dados = await clienteService.atualizarCliente(
        formulario.id,
        formulario
      );

      setEditando(false);
      setFormulario(formularioInicial);

      await carregarClientes();

      mostrarAviso(
        dados.mensagem || "Cliente atualizado com sucesso!",
        "sucesso",
        "Cliente atualizado"
      );
    } catch (error) {
      mostrarAviso(
        error.message,
        "erro",
        "Erro ao atualizar cliente"
      );
    } finally {
      setSalvando(false);
    }
  }

  // Exclui um cliente.
  async function excluirCliente(cliente) {
    try {
      const dados = await clienteService.deletarCliente(cliente.id);

      await carregarClientes();

      mostrarAviso(
        dados.mensagem || "Cliente excluído com sucesso!",
        "sucesso",
        "Cliente excluído"
      );
    } catch (error) {
      mostrarAviso(
        error.message,
        "erro",
        "Não foi possível excluir"
      );
    }
  }

  return (
    <>
      <PageHeader
        title="Lista de Clientes"
        subtitle="Consulte e gerencie os clientes cadastrados."
      />

      <Card>
        <div className="toolbar">
          <input
            type="search"
            value={pesquisa}
            onChange={(event) => setPesquisa(event.target.value)}
            placeholder="Pesquisar por nome, RA ou telefone..."
          />
        </div>

        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Tipo</th>
                <th>RA</th>
                <th>Responsável</th>
                <th>Telefone</th>
                <th>Crédito</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>

            <tbody>
              {clientesFiltrados.map((cliente) => (
                <tr key={cliente.id}>
                  <td>{cliente.nome}</td>

                  <td>
                    <Status type="ok">
                      {cliente.tipoCliente}
                    </Status>
                  </td>

                  <td>{cliente.ra || "—"}</td>
                  <td>{cliente.responsavel || "—"}</td>
                  <td>
                    {cliente.telefone
                      ? mascaraTelefone(cliente.telefone)
                      : "—"}
                  </td>

                  <td>
                    {cliente.tipoCliente === "Aluno"
                      ? money(cliente.credito)
                      : "—"}
                  </td>

                  <td>
                    <Status type={cliente.ativo ? "ok" : "bad"}>
                      {cliente.ativo ? "Ativo" : "Inativo"}
                    </Status>
                  </td>

                  <td>
                    <div className="table-actions">
                      <button
                        type="button"
                        className="action-button edit"
                        title="Editar cliente"
                        onClick={() => editarCliente(cliente)}
                      >
                        <Pencil size={16} />
                      </button>

                      <button
                        type="button"
                        className={`action-button ${
                          cliente.ativo ? "disable" : "enable"
                        }`}
                        title={
                          cliente.ativo
                            ? "Desativar cliente"
                            : "Ativar cliente"
                        }
                        onClick={() => alterarStatus(cliente)}
                      >
                        <Power size={16} />
                      </button>

                      <button
                        type="button"
                        className="action-button delete"
                        title="Excluir cliente"
                        onClick={() => excluirCliente(cliente)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {!carregando && clientesFiltrados.length === 0 && (
                <tr>
                  <td colSpan="8" className="empty-table">
                    Nenhum cliente encontrado.
                  </td>
                </tr>
              )}

              {carregando && (
                <tr>
                  <td colSpan="8" className="empty-table">
                    Carregando clientes...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal de edição */}
      {editando && (
        <div className="modal-aviso-overlay">
          <div className="modal-aviso modal-formulario">
            <div className="modal-formulario-topo">
              <div>
                <h2>Editar Cliente</h2>
                <p>
                  Atualize os dados do cliente e salve no banco.
                </p>
              </div>

              <button
                type="button"
                className="close-button"
                onClick={fecharEdicao}
                disabled={salvando}
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={salvarEdicao}>
              <div className="form-grid">
                {/* Nome */}
                <Field label="Nome completo" required>
                  <input
                    type="text"
                    name="nome"
                    value={formulario.nome}
                    onChange={atualizarCampo}
                    required
                  />
                </Field>

                {/* Categoria */}
                <Field label="Categoria do cliente" required>
                  <select
                    name="tipoCliente"
                    value={formulario.tipoCliente}
                    onChange={alterarTipoCliente}
                    required
                  >
                    <option value="">Selecione</option>
                    <option value="aluno">Aluno</option>
                    <option value="professor">Professor</option>
                    <option value="funcionario">Funcionário</option>
                    <option value="visitante">Visitante</option>
                  </select>
                </Field>

                {/* Telefone com máscara */}
                <Field label="Telefone">
                  <input
                    type="tel"
                    name="telefone"
                    value={formulario.telefone}
                    onChange={atualizarCampo}
                    placeholder="(11) 91234-5678"
                    inputMode="numeric"
                    maxLength={15}
                    autoComplete="tel"
                  />
                </Field>

                {formulario.tipoCliente === "aluno" && (
                  <>
                    {/* RA */}
                    <Field label="RA" required>
                      <input
                        type="text"
                        name="ra"
                        value={formulario.ra}
                        onChange={atualizarCampo}
                        required
                      />
                    </Field>

                    {/* Turma */}
                    <Field label="Turma">
                      <input
                        type="text"
                        name="turma"
                        value={formulario.turma}
                        onChange={atualizarCampo}
                      />
                    </Field>

                    {/* Responsável */}
                    <Field label="Responsável" required>
                      <input
                        type="text"
                        name="responsavel"
                        value={formulario.responsavel}
                        onChange={atualizarCampo}
                        required
                      />
                    </Field>

                    {/* Telefone do responsável com máscara */}
                    <Field label="Telefone do responsável">
                      <input
                        type="tel"
                        name="telefoneResponsavel"
                        value={formulario.telefoneResponsavel}
                        onChange={atualizarCampo}
                        placeholder="(11) 91234-5678"
                        inputMode="numeric"
                        maxLength={15}
                        autoComplete="tel"
                      />
                    </Field>

                    {/* E-mail do responsável */}
                    <Field label="E-mail do responsável">
                      <input
                        type="email"
                        name="emailResponsavel"
                        value={formulario.emailResponsavel}
                        onChange={atualizarCampo}
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

              <div
                className="actions"
                style={{ marginTop: "24px" }}
              >
                <Button
                  secondary
                  type="button"
                  onClick={fecharEdicao}
                  disabled={salvando}
                >
                  Cancelar
                </Button>

                <Button type="submit" disabled={salvando}>
                  {salvando
                    ? "Salvando..."
                    : "Salvar alterações"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de avisos */}
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
