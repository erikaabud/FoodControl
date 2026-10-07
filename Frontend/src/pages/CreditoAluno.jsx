import { useEffect, useMemo, useState } from "react";

import {
  PageHeader,
  Card,
  Button,
  Status,
  money,
} from "../components/UI";

import ModalAviso from "../components/ModalAviso";

import creditoService from "../../services/creditoService";
import clienteService from "../../services/clienteService";

function gerarPayloadQr(aluno, valor) {
  const valorFormatado = Number(valor).toFixed(2);

  const token = `${aluno.idAluno}${Math.round(
    valor * 100
  )}${Date.now()}`;

  const referencia = `FC-${token.slice(-10)}`;

  return {
    referencia,
    payload: `BANCO=FoodControl|ALUNO=${aluno.nome}|RA=${aluno.ra}|VALOR=${valorFormatado}|REF=${referencia}`,
    expiraEm: new Date(
      Date.now() + 30 * 60 * 1000
    ).toLocaleString("pt-BR"),
  };
}

function QrCodeSimulado({ valor }) {
  const celulas = useMemo(() => {
    const base = String(valor || "0");

    return Array.from({ length: 441 }, (_, index) => {
      const codigo =
        base.charCodeAt(index % base.length) || 0;

      const ativa =
        index < 49 ||
        (index >= 14 &&
          index < 63 &&
          index % 7 < 3) ||
        ((codigo + index * 7) % 5 !== 0);

      return ativa;
    });
  }, [valor]);

  return (
    <div className="qr-simulado">
      {celulas.map((ativa, index) => (
        <i
          key={index}
          className={ativa ? "ativo" : ""}
        />
      ))}
    </div>
  );
}

export default function CreditoAluno() {
  const [pesquisa, setPesquisa] =
    useState("");

  const [resultados, setResultados] =
    useState([]);

  const [
    alunoSelecionado,
    setAlunoSelecionado,
  ] = useState(null);

  const [responsavel, setResponsavel] =
    useState(null);

  const [
    movimentacoes,
    setMovimentacoes,
  ] = useState([]);

  const [carregando, setCarregando] =
    useState(false);

  const [
    valorOperacao,
    setValorOperacao,
  ] = useState("");

  const [qrValor, setQrValor] =
    useState("");

  const [qrGerado, setQrGerado] =
    useState(null);

  const [modal, setModal] = useState({
    aberto: false,
    tipo: "sucesso",
    titulo: "",
    mensagem: "",
  });

  function mostrarAviso(
    mensagem,
    tipo = "sucesso",
    titulo = ""
  ) {
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

  async function buscarAluno(texto) {
    const termo = (texto || pesquisa).trim();

    if (!termo) {
      setResultados([]);
      return;
    }

    try {
      setCarregando(true);

      const alunos =
        await creditoService.buscarAlunos(
          termo
        );

      setResultados(alunos || []);
    } catch (error) {
      console.error(
        "Erro ao buscar aluno:",
        error
      );

      setResultados([]);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    const texto = pesquisa.trim();

    if (!texto) {
      setResultados([]);
      return;
    }

    const timer = setTimeout(() => {
      buscarAluno(texto);
    }, 300);

    return () => clearTimeout(timer);
  }, [pesquisa]);

  // CARREGA O HISTÓRICO DO ALUNO
  async function carregarMovimentacoes(
    idAluno
  ) {
    try {
      const dados =
        await creditoService.listarMovimentacoes(
          idAluno
        );

      setMovimentacoes(dados || []);
    } catch (error) {
      console.error(
        "Erro ao carregar movimentações:",
        error
      );

      setMovimentacoes([]);
    }
  }

  // SELECIONA O ALUNO CLICADO
  async function selecionarAluno(aluno) {
    try {
      setCarregando(true);

      const conta =
        await creditoService.buscarConta(
          aluno.idAluno
        );

      setAlunoSelecionado(conta);

      setPesquisa(aluno.nome);

      setResultados([]);

      setValorOperacao("");
      setQrValor("");
      setQrGerado(null);

      await carregarMovimentacoes(
        aluno.idAluno
      );

      // Busca também os dados do responsável,
      // caso exista um cliente relacionado.
      if (aluno.idCliente) {
        try {
          const dadosCliente =
            await clienteService.buscarClientePorID(
              aluno.idCliente
            );

          setResponsavel(dadosCliente);
        } catch (error) {
          console.error(
            "Erro ao buscar responsável:",
            error
          );

          setResponsavel(null);
        }
      } else {
        setResponsavel(null);
      }
    } catch (error) {
      console.error(
        "Erro ao selecionar aluno:",
        error
      );

      setAlunoSelecionado(null);
      setMovimentacoes([]);
      setResponsavel(null);

      mostrarAviso(
        error.message ||
          "Não foi possível carregar os dados do aluno.",
        "erro",
        "Erro"
      );
    } finally {
      setCarregando(false);
    }
  }

  async function atualizarAlunoSelecionado() {
    if (!alunoSelecionado) {
      return;
    }

    const conta =
      await creditoService.buscarConta(
        alunoSelecionado.idAluno
      );

    setAlunoSelecionado(conta);

    await carregarMovimentacoes(
      alunoSelecionado.idAluno
    );
  }

  function obterValorDigitado() {
    const valor = Number(
      String(valorOperacao).replace(",", ".")
    );

    if (
      Number.isNaN(valor) ||
      valor <= 0
    ) {
      mostrarAviso(
        "Digite um valor válido.",
        "erro",
        "Valor inválido"
      );

      return null;
    }

    return valor;
  }

  async function adicionarCredito() {
    if (!alunoSelecionado) {
      mostrarAviso(
        "Busque e selecione um aluno primeiro.",
        "aviso",
        "Selecione um aluno"
      );

      return;
    }

    if (!alunoSelecionado.ativo) {
      mostrarAviso(
        "Não é possível adicionar crédito a um aluno inativo.",
        "erro",
        "Aluno inativo"
      );

      return;
    }

    const valor = obterValorDigitado();

    if (!valor) {
      return;
    }

    try {
      setCarregando(true);

      await creditoService.adicionarCredito(
        alunoSelecionado.idAluno,
        {
          valor,
          observacao:
            "Recarga via Cantina",
          id_usuario: null,
        }
      );

      await atualizarAlunoSelecionado();

      setValorOperacao("");

      mostrarAviso(
        "Crédito adicionado com sucesso!",
        "sucesso",
        "Crédito adicionado"
      );
    } catch (error) {
      mostrarAviso(
        error.message,
        "erro",
        "Erro ao adicionar crédito"
      );
    } finally {
      setCarregando(false);
    }
  }

  async function removerCredito() {
    if (!alunoSelecionado) {
      mostrarAviso(
        "Busque e selecione um aluno primeiro.",
        "aviso",
        "Selecione um aluno"
      );

      return;
    }

    if (!alunoSelecionado.ativo) {
      mostrarAviso(
        "Não é possível alterar o crédito de um aluno inativo.",
        "erro",
        "Aluno inativo"
      );

      return;
    }

    const valor = obterValorDigitado();

    if (!valor) {
      return;
    }

    if (
      valor >
      Number(alunoSelecionado.credito)
    ) {
      mostrarAviso(
        "O aluno não possui saldo suficiente.",
        "erro",
        "Saldo insuficiente"
      );

      return;
    }

    try {
      setCarregando(true);

      await creditoService.removerCredito(
        alunoSelecionado.idAluno,
        {
          valor,
          observacao:
            "Remoção de crédito",
          id_usuario: null,
        }
      );

      await atualizarAlunoSelecionado();

      setValorOperacao("");

      mostrarAviso(
        "Crédito removido com sucesso!",
        "sucesso",
        "Crédito removido"
      );
    } catch (error) {
      mostrarAviso(
        error.message,
        "erro",
        "Erro ao remover crédito"
      );
    } finally {
      setCarregando(false);
    }
  }

  function gerarQrCode() {
    if (!alunoSelecionado) {
      mostrarAviso(
        "Selecione um aluno antes de gerar o QR Code.",
        "aviso",
        "Selecione um aluno"
      );

      return;
    }

    const valor = Number(
      String(qrValor).replace(",", ".")
    );

    if (
      Number.isNaN(valor) ||
      valor <= 0
    ) {
      mostrarAviso(
        "Informe um valor válido para a cobrança.",
        "aviso",
        "Valor inválido"
      );

      return;
    }

    setQrGerado({
      valor,
      ...gerarPayloadQr(
        alunoSelecionado,
        valor
      ),
    });

    mostrarAviso(
      "QR Code simulado gerado com sucesso para envio ao responsável.",
      "sucesso",
      "QR Code pronto"
    );
  }

  function formatarData(data) {
    if (!data) {
      return "—";
    }

    return new Date(
      data
    ).toLocaleString("pt-BR");
  }

  function tipoMovimentacao(tipo) {
    if (
      tipo === "Compra" ||
      tipo === "Ajuste"
    ) {
      return "debito";
    }

    return "credito";
  }

  return (
    <>
      <PageHeader
        title="Crédito do Aluno"
        subtitle="Consulte o saldo, movimente créditos no banco e gere um QR Code simulado para recarga."
      />

      <Card>
        <div className="toolbar">
          <input
            type="search"
            value={pesquisa}
            onChange={(event) =>
              setPesquisa(
                event.target.value
              )
            }
            onKeyDown={(event) => {
              if (
                event.key === "Enter"
              ) {
                buscarAluno(pesquisa);
              }
            }}
            placeholder="Digite o nome, RA ou turma..."
          />
        </div>

        {resultados.length > 0 && (
          <div className="credit-search-results">
            {resultados.map((aluno) => (
              <button
                type="button"
                className="student-result"
                key={aluno.idAluno}
                onClick={() =>
                  selecionarAluno(aluno)
                }
              >
                <div className="avatar">
                  {aluno.nome
                    ?.charAt(0)
                    .toUpperCase()}
                </div>

                <div>
                  <b>{aluno.nome}</b>

                  <small>
                    RA:{" "}
                    {aluno.ra ||
                      "Não informado"}
                    {aluno.turma
                      ? ` • Turma ${aluno.turma}`
                      : ""}
                  </small>

                  <em>
                    Saldo:{" "}
                    {money(
                      Number(
                        aluno.credito ||
                          0
                      )
                    )}
                  </em>
                </div>
              </button>
            ))}
          </div>
        )}

        {alunoSelecionado ? (
          <>
            <div className="credit-box">
              <div>
                <h2>
                  {
                    alunoSelecionado.nome
                  }
                </h2>

                <p>
                  RA:{" "}
                  {alunoSelecionado.ra ||
                    "Não informado"}
                  {alunoSelecionado.turma
                    ? ` | ${alunoSelecionado.turma}`
                    : ""}
                </p>

                <Status
                  type={
                    alunoSelecionado.ativo
                      ? "ok"
                      : "bad"
                  }
                >
                  {alunoSelecionado.ativo
                    ? "Aluno ativo"
                    : "Aluno inativo"}
                </Status>

                <p className="credit-helper">
                  Responsável:{" "}
                  {responsavel?.responsavel ||
                    "Não informado"}
                </p>
              </div>

              <div>
                <small>
                  Saldo Atual
                </small>

                <strong>
                  {money(
                    Number(
                      alunoSelecionado.credito ||
                        0
                    )
                  )}
                </strong>
              </div>
            </div>

            <div className="credit-actions-panel">
              <div className="credit-action-card">
                <h3>
                  Movimentar crédito
                </h3>

                <p>
                  Adicione ou remova
                  créditos da conta do
                  aluno.
                </p>

                <input
                  type="text"
                  value={valorOperacao}
                  onChange={(event) =>
                    setValorOperacao(
                      event.target.value
                    )
                  }
                  placeholder="Ex.: 25,00"
                />

                <div className="actions left">
                  <Button
                    type="button"
                    onClick={
                      adicionarCredito
                    }
                    disabled={
                      carregando
                    }
                  >
                    + Adicionar Crédito
                  </Button>

                  <Button
                    danger
                    type="button"
                    onClick={
                      removerCredito
                    }
                    disabled={
                      carregando
                    }
                  >
                    − Remover Crédito
                  </Button>
                </div>
              </div>

              <div className="credit-action-card">
                <h3>
                  QR Code para
                  responsável
                </h3>

                <p>
                  Gera uma cobrança
                  simulada para ser
                  enviada por mensagem.
                </p>

                <input
                  type="text"
                  value={qrValor}
                  onChange={(event) =>
                    setQrValor(
                      event.target.value
                    )
                  }
                  placeholder="Valor da recarga"
                />

                <Button
                  type="button"
                  onClick={gerarQrCode}
                  disabled={carregando}
                >
                  Gerar QR Code Simulado
                </Button>

                {qrGerado && (
                  <div className="qr-card">
                    <QrCodeSimulado
                      valor={
                        qrGerado.payload
                      }
                    />

                    <div className="qr-info">
                      <strong>
                        {money(
                          qrGerado.valor
                        )}
                      </strong>

                      <small>
                        Responsável:{" "}
                        {responsavel?.responsavel ||
                          "Não informado"}
                      </small>

                      <small>
                        Contato:{" "}
                        {responsavel?.telefoneResponsavel ||
                          responsavel?.emailResponsavel ||
                          "Não informado"}
                      </small>

                      <small>
                        Expira em:{" "}
                        {
                          qrGerado.expiraEm
                        }
                      </small>

                      <small>
                        Referência:{" "}
                        {
                          qrGerado.referencia
                        }
                      </small>
                    </div>

                    <textarea
                      readOnly
                      value={
                        qrGerado.payload
                      }
                      className="qr-payload"
                    />
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="credit-empty">
            Busque e selecione um
            aluno para consultar o
            saldo.
          </div>
        )}
      </Card>

      <Card>
        <h2>
          Histórico de Movimentações
        </h2>

        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Descrição</th>
                <th>Tipo</th>
                <th>Valor</th>
              </tr>
            </thead>

            <tbody>
              {movimentacoes.map(
                (movimentacao) => {
                  const natureza =
                    tipoMovimentacao(
                      movimentacao.tipo
                    );

                  return (
                    <tr
                      key={
                        movimentacao.id_movimentacao
                      }
                    >
                      <td>
                        {formatarData(
                          movimentacao.data_movimentacao
                        )}
                      </td>

                      <td>
                        {movimentacao.observacao ||
                          "—"}
                      </td>

                      <td>
                        <Status
                          type={
                            natureza ===
                            "debito"
                              ? "bad"
                              : "ok"
                          }
                        >
                          {
                            movimentacao.tipo
                          }
                        </Status>
                      </td>

                      <td>
                        {natureza ===
                        "debito"
                          ? "− "
                          : "+ "}

                        {money(
                          Number(
                            movimentacao.valor ||
                              0
                          )
                        )}
                      </td>
                    </tr>
                  );
                }
              )}

              {!alunoSelecionado && (
                <tr>
                  <td
                    colSpan="4"
                    className="empty-table"
                  >
                    Selecione um aluno
                    para visualizar o
                    histórico.
                  </td>
                </tr>
              )}

              {alunoSelecionado &&
                movimentacoes.length ===
                  0 && (
                  <tr>
                    <td
                      colSpan="4"
                      className="empty-table"
                    >
                      Nenhuma
                      movimentação
                      encontrada.
                    </td>
                  </tr>
                )}
            </tbody>
          </table>
        </div>
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