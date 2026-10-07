import { useEffect, useMemo, useState } from "react";

import clienteService from "../../services/clienteService";
import produtoService from "../../services/produtoService";
import vendasService from "../../services/vendasService";

import { PageHeader, Card, Button, money } from "../components/UI";
import ModalAviso from "../components/ModalAviso";

/*
 * Verifica especificamente se a forma de pagamento
 * é "Crédito do Aluno".
 *
 * Cartão de Crédito NÃO entra nessa regra.
 */
function formaEhCreditoAluno(nomeForma = "") {
  const texto = String(nomeForma)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  return texto.includes("credito do aluno");
}

function ordenarPorPesquisa(lista, texto, seletor) {
  const busca = texto.toLowerCase().trim();

  return [...lista].sort((a, b) => {
    const valorA = seletor(a).toLowerCase();
    const valorB = seletor(b).toLowerCase();

    const aComeca = valorA.startsWith(busca);
    const bComeca = valorB.startsWith(busca);

    if (aComeca && !bComeca) {
      return -1;
    }

    if (!aComeca && bComeca) {
      return 1;
    }

    return valorA.localeCompare(valorB);
  });
}

export default function Venda() {
  const [carrinho, setCarrinho] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [formasPagamento, setFormasPagamento] = useState([]);

  const [clienteSelecionado, setClienteSelecionado] = useState(null);

  const [pesquisaCliente, setPesquisaCliente] = useState("");
  const [pesquisaProduto, setPesquisaProduto] = useState("");

  const [formaPagamento, setFormaPagamento] = useState("");

  const [carregando, setCarregando] = useState(true);
  const [finalizando, setFinalizando] = useState(false);

  const [modal, setModal] = useState({
    aberto: false,
    tipo: "sucesso",
    titulo: "",
    mensagem: "",
  });

  async function carregarDados() {
    setCarregando(true);

    try {
      const [clientesData, produtosData, formasData] = await Promise.all([
        clienteService.listarClientes(),
        produtoService.listarProdutos(),
        vendasService.listarFormasPagamento(),
      ]);

      setClientes(
        (clientesData || []).filter((cliente) => cliente.ativo)
      );

      setProdutos(
        (produtosData || []).filter((produto) => produto.ativo)
      );

      setFormasPagamento(formasData || []);
    } catch (error) {
      mostrarAviso(
        error.message,
        "erro",
        "Erro ao carregar dados"
      );
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarDados();
  }, []);

  const total = useMemo(
    () =>
      carrinho.reduce(
        (soma, item) => soma + item.preco * item.quantidade,
        0
      ),
    [carrinho]
  );

  const quantidadeItens = useMemo(
    () =>
      carrinho.reduce(
        (soma, item) => soma + item.quantidade,
        0
      ),
    [carrinho]
  );

  const formaSelecionada = formasPagamento.find(
    (forma) =>
      String(forma.id_forma_pagamento) === formaPagamento
  );

  const clientesFiltrados = useMemo(() => {
    const pesquisa = pesquisaCliente.toLowerCase().trim();

    if (!pesquisa) {
      return [];
    }

    const filtrados = clientes.filter((cliente) => {
      const alvo = [
        cliente.nome,
        cliente.ra,
        cliente.telefone,
        cliente.tipoCliente,
        cliente.responsavel,
      ]
        .join(" ")
        .toLowerCase();

      return alvo.includes(pesquisa);
    });

    return ordenarPorPesquisa(
      filtrados,
      pesquisa,
      (cliente) => cliente.nome
    ).slice(0, 8);
  }, [clientes, pesquisaCliente]);

  const produtosFiltrados = useMemo(() => {
    const pesquisa = pesquisaProduto.toLowerCase().trim();

    const filtrados = produtos.filter((produto) => {
      if (produto.quantidade <= 0) {
        return false;
      }

      if (!pesquisa) {
        return true;
      }

      const alvo = [
        produto.nome,
        produto.categoria,
      ]
        .join(" ")
        .toLowerCase();

      return alvo.includes(pesquisa);
    });

    return ordenarPorPesquisa(
      filtrados,
      pesquisa || "a",
      (produto) => produto.nome
    ).slice(0, 20);
  }, [produtos, pesquisaProduto]);

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

  function selecionarCliente(cliente) {
    setClienteSelecionado(cliente);
    setPesquisaCliente("");

    /*
     * Se estiver selecionado "Crédito do Aluno"
     * e trocar para um cliente que não é aluno,
     * limpa a forma de pagamento.
     *
     * Cartão de Crédito NÃO será afetado.
     */
    if (
      formaSelecionada &&
      formaEhCreditoAluno(formaSelecionada.nome_forma) &&
      cliente.tipoCliente !== "Aluno"
    ) {
      setFormaPagamento("");
    }
  }

  function removerCliente() {
    setClienteSelecionado(null);
    setFormaPagamento("");
  }

  function limparVenda() {
    setCarrinho([]);
    setFormaPagamento("");
  }

  function adicionarProduto(produto) {
    if (produto.quantidade <= 0) {
      mostrarAviso(
        "Este produto está sem estoque disponível.",
        "aviso",
        "Produto sem estoque"
      );

      return;
    }

    setCarrinho((estadoAtual) => {
      const itemExistente = estadoAtual.find(
        (item) => item.idProduto === produto.id
      );

      if (!itemExistente) {
        return [
          ...estadoAtual,
          {
            idProduto: produto.id,
            nome: produto.nome,
            preco: produto.preco,
            quantidade: 1,
            estoque: produto.quantidade,
          },
        ];
      }

      if (itemExistente.quantidade >= produto.quantidade) {
        mostrarAviso(
          "Nao ha mais unidades disponiveis deste produto.",
          "aviso",
          "Estoque insuficiente"
        );

        return estadoAtual;
      }

      return estadoAtual.map((item) =>
        item.idProduto === produto.id
          ? {
              ...item,
              quantidade: item.quantidade + 1,
            }
          : item
      );
    });
  }

  function alterarQuantidade(idProduto, variacao) {
    setCarrinho((estadoAtual) =>
      estadoAtual
        .map((item) => {
          if (item.idProduto !== idProduto) {
            return item;
          }

          const novaQuantidade =
            item.quantidade + variacao;

          if (novaQuantidade > item.estoque) {
            mostrarAviso(
              "Quantidade acima do estoque disponivel.",
              "aviso",
              "Limite de estoque"
            );

            return item;
          }

          return {
            ...item,
            quantidade: novaQuantidade,
          };
        })
        .filter((item) => item.quantidade > 0)
    );
  }

  async function finalizarVenda() {
    if (!clienteSelecionado) {
      mostrarAviso(
        "Selecione um cliente antes de finalizar a venda.",
        "aviso",
        "Cliente nao selecionado"
      );

      return;
    }

    if (carrinho.length === 0) {
      mostrarAviso(
        "Adicione pelo menos um produto antes de finalizar a venda.",
        "aviso",
        "Carrinho vazio"
      );

      return;
    }

    if (!formaSelecionada) {
      mostrarAviso(
        "Selecione uma forma de pagamento vinda do backend.",
        "aviso",
        "Forma de pagamento"
      );

      return;
    }

    /*
     * SOMENTE Crédito do Aluno exige
     * que o cliente seja um aluno.
     */
    if (
      formaEhCreditoAluno(formaSelecionada.nome_forma) &&
      clienteSelecionado.tipoCliente !== "Aluno"
    ) {
      mostrarAviso(
        "O pagamento com credito do aluno so esta disponivel para alunos.",
        "erro",
        "Pagamento nao permitido"
      );

      return;
    }

    /*
     * SOMENTE Crédito do Aluno verifica
     * o saldo disponível.
     *
     * Cartão de Crédito não verifica
     * o saldo do aluno.
     */
    if (
      formaEhCreditoAluno(formaSelecionada.nome_forma) &&
      total > Number(clienteSelecionado.credito || 0)
    ) {
      mostrarAviso(
        "O aluno nao possui saldo suficiente para concluir a compra.",
        "erro",
        "Saldo insuficiente"
      );

      return;
    }

    setFinalizando(true);

    try {
      const resposta = await vendasService.criarVenda({
        id_cliente: clienteSelecionado.id,
        id_forma_pagamento: Number(formaPagamento),
        quantidade_parcelas: 1,

        itens: carrinho.map((item) => ({
          id_produto: item.idProduto,
          quantidade: item.quantidade,
        })),
      });

      limparVenda();

      setClienteSelecionado(null);
      setPesquisaCliente("");
      setPesquisaProduto("");

      await carregarDados();

      mostrarAviso(
        `${resposta.mensagem} Total registrado: ${money(total)}`,
        "sucesso",
        "Venda concluida"
      );
    } catch (error) {
      mostrarAviso(
        error.message,
        "erro",
        "Erro ao finalizar venda"
      );
    } finally {
      setFinalizando(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Venda"
        subtitle="Busque clientes e produtos, monte o carrinho e persista a venda no banco."
      />

      <div className="sales-layout">
        <div className="sales-main">

          {/* CLIENTE */}
          <Card className="sales-card">
            <div className="sales-card-header">
              <div>
                <h2>Cliente da Venda</h2>
                <p>
                  Pesquise por nome, RA, telefone ou
                  responsavel.
                </p>
              </div>

              {clienteSelecionado && (
                <button
                  type="button"
                  className="link"
                  onClick={removerCliente}
                >
                  Trocar cliente
                </button>
              )}
            </div>

            <div className="sales-search">
              <input
                type="search"
                value={pesquisaCliente}
                onChange={(event) =>
                  setPesquisaCliente(event.target.value)
                }
                placeholder="Ex.: Maria, RA 12345, telefone..."
              />
            </div>

            {clienteSelecionado ? (
              <div className="student-mini selected-client sales-selected-client">
                <div className="avatar big">
                  {String(
                    clienteSelecionado.nome || ""
                  )
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <div>
                  <b>{clienteSelecionado.nome}</b>

                  <small>
                    {clienteSelecionado.tipoCliente ===
                    "Aluno"
                      ? `RA: ${
                          clienteSelecionado.ra ||
                          "Nao informado"
                        }`
                      : `Tipo: ${clienteSelecionado.tipoCliente}`}
                  </small>

                  <em>
                    {clienteSelecionado.tipoCliente ===
                    "Aluno"
                      ? `Saldo disponivel: ${money(
                          Number(
                            clienteSelecionado.credito || 0
                          )
                        )}`
                      : clienteSelecionado.telefone ||
                        "Sem telefone"}
                  </em>
                </div>
              </div>
            ) : (
              pesquisaCliente.trim() !== "" && (
                <div className="credit-search-results">
                  {clientesFiltrados.map((cliente) => (
                    <button
                      type="button"
                      className="student-result"
                      key={cliente.id}
                      onClick={() =>
                        selecionarCliente(cliente)
                      }
                    >
                      <div className="avatar">
                        {String(cliente.nome || "")
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <div>
                        <b>{cliente.nome}</b>

                        <small>
                          {cliente.tipoCliente ===
                          "Aluno" ? (
                            <>
                              RA:{" "}
                              {cliente.ra ||
                                "Não informado"}

                              {cliente.turma
                                ? ` • Turma ${cliente.turma}`
                                : ""}
                            </>
                          ) : (
                            <>
                              Tipo:{" "}
                              {cliente.tipoCliente}
                            </>
                          )}
                        </small>

                        <em>
                          {cliente.tipoCliente ===
                          "Aluno"
                            ? `Saldo: ${money(
                                Number(
                                  cliente.credito || 0
                                )
                              )}`
                            : cliente.telefone ||
                              "Sem telefone"}
                        </em>
                      </div>
                    </button>
                  ))}

                  {clientesFiltrados.length === 0 && (
                    <p className="empty-result">
                      Nenhum cliente encontrado.
                    </p>
                  )}
                </div>
              )
            )}
          </Card>

          {/* PRODUTOS */}
          <Card className="sales-card">
            <div className="sales-card-header">
              <div>
                <h2>Produtos</h2>
                <p>
                  Adicione itens com busca inteligente e
                  controle de estoque.
                </p>
              </div>

              <span className="status ok">
                {produtosFiltrados.length} disponiveis
              </span>
            </div>

            <div className="sales-search">
              <input
                type="search"
                value={pesquisaProduto}
                onChange={(event) =>
                  setPesquisaProduto(event.target.value)
                }
                placeholder="Buscar por produto ou categoria..."
              />
            </div>

            <div className="sales-product-grid">
              {produtosFiltrados.map((produto) => (
                <button
                  type="button"
                  key={produto.id}
                  className="sales-product-card"
                  onClick={() =>
                    adicionarProduto(produto)
                  }
                >
                  <div>
                    <b>{produto.nome}</b>
                    <small>
                      {produto.categoria ||
                        "Sem categoria"}
                    </small>
                  </div>

                  <div className="sales-product-meta">
                    <strong>
                      {money(produto.preco)}
                    </strong>

                    <span>
                      Estoque: {produto.quantidade}
                    </span>
                  </div>
                </button>
              ))}

              {!carregando &&
                produtosFiltrados.length === 0 && (
                  <div className="empty-table sales-empty-card">
                    Nenhum produto encontrado.
                  </div>
                )}
            </div>
          </Card>
        </div>

        {/* RESUMO DA VENDA */}
        <Card className="sales-summary">
          <div className="sales-card-header">
            <div>
              <h2>Resumo da Venda</h2>
              <p>
                Revise os itens e conclua a operacao.
              </p>
            </div>

            <button
              type="button"
              className="link"
              onClick={limparVenda}
            >
              Limpar
            </button>
          </div>

          <div className="sales-highlights">
            <div className="sales-highlight">
              <small>Itens</small>
              <strong>{quantidadeItens}</strong>
            </div>

            <div className="sales-highlight">
              <small>Total</small>
              <strong>{money(total)}</strong>
            </div>
          </div>

          <div className="sales-cart-list">
            {carrinho.map((item) => (
              <div
                className="sales-cart-item"
                key={item.idProduto}
              >
                <div>
                  <b>{item.nome}</b>

                  <small>
                    {money(item.preco)} por unidade
                  </small>
                </div>

                <div className="sales-qty-control">
                  <button
                    type="button"
                    className="trash"
                    onClick={() =>
                      alterarQuantidade(
                        item.idProduto,
                        -1
                      )
                    }
                  >
                    -
                  </button>

                  <span>{item.quantidade}</span>

                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() =>
                      alterarQuantidade(
                        item.idProduto,
                        1
                      )
                    }
                  >
                    +
                  </button>
                </div>
              </div>
            ))}

            {carrinho.length === 0 && (
              <div className="empty-table">
                Nenhum produto adicionado.
              </div>
            )}
          </div>

          {/* PAGAMENTO */}
          <div className="checkout">
            <div className="row-between">
              <b>Forma de pagamento</b>

              <small>
                {formaSelecionada?.nome_forma ||
                  "Nao selecionada"}
              </small>
            </div>

            <select
              value={formaPagamento}
              onChange={(event) =>
                setFormaPagamento(event.target.value)
              }
            >
              <option value="">
                Selecione a forma de pagamento
              </option>

              {formasPagamento.map((forma) => {
                /*
                 * Agora SOMENTE Crédito do Aluno
                 * é bloqueado para quem não é aluno.
                 */
                const desabilitada =
                  formaEhCreditoAluno(
                    forma.nome_forma
                  ) &&
                  clienteSelecionado?.tipoCliente !==
                    "Aluno";

                return (
                  <option
                    key={
                      forma.id_forma_pagamento
                    }
                    value={
                      forma.id_forma_pagamento
                    }
                    disabled={desabilitada}
                  >
                    {forma.nome_forma}

                    {desabilitada
                      ? " - disponivel apenas para alunos"
                      : ""}
                  </option>
                );
              })}
            </select>

            <div className="row-between sales-total-row">
              <b>Total da venda</b>
              <strong>{money(total)}</strong>
            </div>

            <Button
              type="button"
              onClick={finalizarVenda}
              disabled={
                finalizando || carregando
              }
            >
              {finalizando
                ? "Finalizando..."
                : "Finalizar Venda"}
            </Button>
          </div>
        </Card>
      </div>

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