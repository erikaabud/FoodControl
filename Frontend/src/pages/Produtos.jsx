import { useEffect, useState } from "react";
import {
  Pencil,
  Trash2,
  Power,
  X,
} from "lucide-react";

import {
  PageHeader,
  Card,
  Status,
  Button,
  money,
} from "../components/UI";

import ModalAviso from "../components/ModalAviso";
import produtoService from "../../services/produtoService";
import categoriaService from "../../services/categoriaService";

const formularioInicial = {
  nome: "",
  categoria: "",
  preco: "",
  quantidade: "",
  estoque_minimo: "",
  ativo: true,
};

export default function Produtos() {
  const [produtos, setProdutos] = useState([]);
  const [categoriasBanco, setCategoriasBanco] =
    useState([]);
  const [carregando, setCarregando] =
    useState(true);
  const [salvando, setSalvando] =
    useState(false);
  const [erroCategorias, setErroCategorias] =
    useState("");

  const [formulario, setFormulario] =
    useState(formularioInicial);

  const [formularioAberto, setFormularioAberto] =
    useState(false);

  const [produtoEmEdicao, setProdutoEmEdicao] =
    useState(null);

  const [pesquisa, setPesquisa] =
    useState("");

  const [categoriaFiltro, setCategoriaFiltro] =
    useState("");

  const [statusFiltro, setStatusFiltro] =
    useState("");

  const [filtrosAbertos, setFiltrosAbertos] =
    useState(false);

  const [produtoParaExcluir, setProdutoParaExcluir] =
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
    setModal((atual) => ({
      ...atual,
      aberto: false,
    }));
  }

  async function carregarProdutos() {
    const dados = await produtoService.listarProdutos();

    setProdutos(
      dados.map((produto) => ({
        id: produto.id,
        id_categoria: produto.idCategoria,
        nome: produto.nome,
        preco: produto.preco,
        quantidade: produto.quantidade,
        estoque_minimo: produto.estoqueMinimo,
        ativo: produto.ativo,
      }))
    );
  }

  useEffect(() => {
    async function carregarDados() {
      try {
        await carregarProdutos();
      } catch (erro) {
        mostrarAviso(
          `Erro ao carregar produtos: ${erro.message}`,
          "erro",
          "Erro"
        );
      } finally {
        setCarregando(false);
      }

      try {
        const dados =
          await categoriaService.listarCategorias();

        setCategoriasBanco(dados);
        setErroCategorias("");

      } catch (erro) {
        setErroCategorias(
          "Não foi possível carregar as categorias."
        );
      }
    }

    carregarDados();
  }, []);

  function nomeCategoria(id) {
    return (
      categoriasBanco.find(
        (categoria) =>
          Number(
            categoria.id_categoria
          ) === Number(id)
      )?.nome_categoria ||
      `Categoria ${id}`
    );
  }

  const categorias = [
    ...new Set(
      produtos.map(
        (produto) =>
          produto.id_categoria
      )
    ),
  ];

  const produtosFiltrados =
    produtos.filter((produto) => {
      const correspondePesquisa =
        produto.nome
          .toLowerCase()
          .includes(
            pesquisa
              .toLowerCase()
              .trim()
          );

      const correspondeCategoria =
        categoriaFiltro === "" ||
        String(
          produto.id_categoria
        ) === categoriaFiltro;

      const correspondeStatus =
        statusFiltro === "" ||
        (statusFiltro === "ativo" &&
          produto.ativo) ||
        (statusFiltro === "inativo" &&
          !produto.ativo);

      return (
        correspondePesquisa &&
        correspondeCategoria &&
        correspondeStatus
      );
    });

  const totalCategorias =
    categorias.length;

  const totalEstoqueBaixo =
    produtos.filter(
      (produto) =>
        produto.quantidade !== null &&
        produto.estoque_minimo !== null &&
        produto.quantidade <=
          produto.estoque_minimo
    ).length;

  function atualizarCampo(event) {
    const {
      name,
      value,
    } = event.target;

    setFormulario(
      (formularioAtual) => ({
        ...formularioAtual,
        [name]: value,
      })
    );
  }

  function abrirNovoProduto() {
    setProdutoEmEdicao(null);
    setFormulario(
      formularioInicial
    );
    setFormularioAberto(true);
  }

  function fecharFormulario() {
    setFormularioAberto(false);
    setProdutoEmEdicao(null);
    setFormulario(
      formularioInicial
    );
  }

  async function salvarProduto(event) {
    event.preventDefault();

    const precoConvertido =
      Number(
        String(
          formulario.preco
        ).replace(",", ".")
      );

    const quantidade =
      Number(
        formulario.quantidade
      );

    const estoqueMinimo =
      Number(
        formulario.estoque_minimo
      );

    if (
      formulario.nome.trim().length < 3 ||
      !formulario.categoria ||
      !Number.isFinite(
        precoConvertido
      ) ||
      precoConvertido <= 0 ||
      formulario.quantidade === "" ||
      formulario.estoque_minimo === "" ||
      !Number.isInteger(
        quantidade
      ) ||
      !Number.isInteger(
        estoqueMinimo
      ) ||
      quantidade < 0 ||
      estoqueMinimo < 0
    ) {
      mostrarAviso(
        "Preencha os dados corretamente.",
        "aviso",
        "Dados inválidos"
      );

      return;
    }

    const dadosProduto = {
      id_categoria:
        Number(
          formulario.categoria
        ),

      nome_produto:
        formulario.nome.trim(),

      valor_unitario:
        precoConvertido,

      quantidade,

      estoque_minimo:
        estoqueMinimo,

      ativo:
        produtoEmEdicao
          ? produtoEmEdicao.ativo
          : true,
    };

    setSalvando(true);

    try {
      if (produtoEmEdicao) {
        await produtoService.atualizarProduto(
          produtoEmEdicao.id,
          dadosProduto
        );
        await carregarProdutos();
        fecharFormulario();
        mostrarAviso(
          "Produto atualizado com sucesso!",
          "sucesso",
          "Produto atualizado"
        );

      } else {
        await produtoService.criarProduto(
          dadosProduto
        );

        await carregarProdutos();

        fecharFormulario();

        mostrarAviso(
          "Produto cadastrado com sucesso!",
          "sucesso",
          "Produto cadastrado"
        );
      }

    } catch (erro) {
      mostrarAviso(
        `Erro ao salvar produto: ${erro.message}`,
        "erro",
        "Erro"
      );

    } finally {
      setSalvando(false);
    }
  }

  function editarProduto(produto) {
    setProdutoEmEdicao(
      produto
    );

    setFormulario({
      nome:
        produto.nome,

      categoria:
        String(
          produto.id_categoria
        ),

      preco:
        produto.preco,

      quantidade:
        produto.quantidade ?? "",

      estoque_minimo:
        produto.estoque_minimo ?? "",

      ativo:
        produto.ativo,
    });

    setFormularioAberto(true);
  }

  function excluirProduto(produto) {
    setProdutoParaExcluir(
      produto
    );
  }

  function cancelarExclusao() {
    setProdutoParaExcluir(
      null
    );
  }

  async function confirmarExclusao() {
    if (!produtoParaExcluir) {
      return;
    }

    try {
      const resposta =
        await produtoService.deletarProduto(
          produtoParaExcluir.id
        );

      setProdutoParaExcluir(
        null
      );

      await carregarProdutos();

      if (
        resposta.possui_historico
      ) {
        mostrarAviso(
          resposta.mensagem,
          "aviso",
          "Produto possui histórico"
        );

        return;
      }

      mostrarAviso(
        resposta.mensagem ||
          "Produto excluído com sucesso!",
        "sucesso",
        "Produto excluído"
      );

    } catch (erro) {
      setProdutoParaExcluir(
        null
      );

      mostrarAviso(
        `Erro ao excluir produto: ${erro.message}`,
        "erro",
        "Erro"
      );
    }
  }

  async function alterarStatus(produto) {
    if (
      produto.quantidade === null ||
      produto.estoque_minimo === null
    ) {
      mostrarAviso(
        "Cadastre o estoque deste produto antes de alterar o status.",
        "aviso",
        "Estoque não cadastrado"
      );

      return;
    }

    try {
      await produtoService.atualizarProduto(
        produto.id,
        {
          id_categoria:
            produto.id_categoria,
          nome_produto:
            produto.nome,
          valor_unitario:
            produto.preco,
          quantidade:
            produto.quantidade,
          estoque_minimo:
            produto.estoque_minimo,
          ativo:
            !produto.ativo,
        }
      );

      await carregarProdutos();

      mostrarAviso(
        produto.ativo
          ? "Produto desativado com sucesso!"
          : "Produto ativado com sucesso!",
        "sucesso",
        "Status atualizado"
      );

    } catch (erro) {
      mostrarAviso(
        `Erro ao alterar status: ${erro.message}`,
        "erro",
        "Erro"
      );
    }
  }

  function limparFiltros() {
    setPesquisa("");
    setCategoriaFiltro("");
    setStatusFiltro("");
  }

  return (
    <>
      <PageHeader
        title="Produtos"
        subtitle="Cadastre, edite e gerencie os produtos da cantina."
        action={
          <Button
            type="button"
            onClick={
              abrirNovoProduto
            }
          >
            + Novo Produto
          </Button>
        }
      />

      {erroCategorias && (
        <div className="form-message error">
          {erroCategorias}
        </div>
      )}

      {formularioAberto && (
        <Card>
          <div className="row-between">
            <h2>
              {produtoEmEdicao
                ? "Editar Produto"
                : "Novo Produto"}
            </h2>

            <button
              type="button"
              className="close-button"
              onClick={
                fecharFormulario
              }
              title="Fechar"
            >
              <X size={20} />
            </button>
          </div>

          <form
            onSubmit={
              salvarProduto
            }
          >
            <div className="form-grid">
              <label className="field">
                Nome do produto <b>*</b>

                <input
                  type="text"
                  name="nome"
                  value={
                    formulario.nome
                  }
                  onChange={
                    atualizarCampo
                  }
                  placeholder="Digite o nome do produto"
                  required
                />
              </label>

              <label className="field">
                Categoria <b>*</b>

                <select
                  name="categoria"
                  value={
                    formulario.categoria
                  }
                  onChange={
                    atualizarCampo
                  }
                  required
                >
                  <option value="">
                    Selecione a categoria
                  </option>

                  {categoriasBanco.map(
                    (categoria) => (
                      <option
                        key={
                          categoria.id_categoria
                        }
                        value={
                          categoria.id_categoria
                        }
                      >
                        {
                          categoria.nome_categoria
                        }
                      </option>
                    )
                  )}
                </select>
              </label>

              <label className="field">
                Preço <b>*</b>

                <input
                  type="text"
                  name="preco"
                  value={
                    formulario.preco
                  }
                  onChange={
                    atualizarCampo
                  }
                  placeholder="Ex.: 3,50"
                  required
                />
              </label>

              <label className="field">
                Quantidade em estoque{" "}
                <b>*</b>

                <input
                  type="number"
                  name="quantidade"
                  min="0"
                  step="1"
                  value={
                    formulario.quantidade
                  }
                  onChange={
                    atualizarCampo
                  }
                  placeholder="Ex.: 30"
                  required
                />
              </label>

              <label className="field">
                Estoque mínimo{" "}
                <b>*</b>

                <input
                  type="number"
                  name="estoque_minimo"
                  min="0"
                  step="1"
                  value={
                    formulario.estoque_minimo
                  }
                  onChange={
                    atualizarCampo
                  }
                  placeholder="Ex.: 10"
                  required
                />
              </label>
            </div>

            <div className="actions">
              <Button
                secondary
                type="button"
                onClick={
                  fecharFormulario
                }
              >
                Cancelar
              </Button>

              <Button
                type="submit"
                disabled={
                  salvando ||
                  categoriasBanco.length ===
                    0
                }
              >
                {salvando
                  ? "Salvando..."
                  : produtoEmEdicao
                  ? "Salvar Alterações"
                  : "Cadastrar Produto"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className="stats">
        <Card>
          <small>
            Total de Produtos
          </small>

          <strong>
            {produtos.length}
          </strong>
        </Card>

        <Card>
          <small>
            Categorias
          </small>

          <strong>
            {totalCategorias}
          </strong>
        </Card>

        <Card>
          <small>
            Mais Vendido
          </small>

          <strong>—</strong>
        </Card>

        <Card>
          <small>
            Estoque Baixo
          </small>

          <strong>
            {totalEstoqueBaixo}
          </strong>
        </Card>
      </div>

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
            placeholder="Buscar produto..."
          />

          <Button
            secondary
            type="button"
            onClick={() =>
              setFiltrosAbertos(
                !filtrosAbertos
              )
            }
          >
            {filtrosAbertos
              ? "Fechar Filtros"
              : "Filtrar"}
          </Button>
        </div>

        {filtrosAbertos && (
          <div className="product-filters">
            <select
              value={
                categoriaFiltro
              }
              onChange={(event) =>
                setCategoriaFiltro(
                  event.target.value
                )
              }
            >
              <option value="">
                Todas as categorias
              </option>

              {categorias.map(
                (categoria) => (
                  <option
                    value={
                      categoria
                    }
                    key={
                      categoria
                    }
                  >
                    {nomeCategoria(
                      categoria
                    )}
                  </option>
                )
              )}
            </select>

            <select
              value={
                statusFiltro
              }
              onChange={(event) =>
                setStatusFiltro(
                  event.target.value
                )
              }
            >
              <option value="">
                Todos os status
              </option>

              <option value="ativo">
                Ativos
              </option>

              <option value="inativo">
                Inativos
              </option>
            </select>

            <Button
              secondary
              type="button"
              onClick={
                limparFiltros
              }
            >
              Limpar Filtros
            </Button>
          </div>
        )}

        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Produto</th>
                <th>Categoria</th>
                <th>Preço</th>
                <th>Estoque</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>

            <tbody>
              {produtosFiltrados.map(
                (produto) => (
                  <tr
                    key={
                      produto.id
                    }
                  >
                    <td>
                      {produto.nome}
                    </td>

                    <td>
                      {nomeCategoria(
                        produto.id_categoria
                      )}
                    </td>

                    <td>
                      {money(
                        produto.preco
                      )}
                    </td>

                    <td>
                      {produto.quantidade ===
                      null
                        ? "Sem estoque cadastrado"
                        : produto.quantidade}
                    </td>

                    <td>
                      <Status
                        type={
                          produto.ativo
                            ? "ok"
                            : "bad"
                        }
                      >
                        {produto.ativo
                          ? "Ativo"
                          : "Inativo"}
                      </Status>
                    </td>

                    <td>
                      <div className="table-actions">
                        <button
                          type="button"
                          className="action-button edit"
                          title="Editar produto"
                          disabled={
                            produto.quantidade ===
                              null ||
                            produto.estoque_minimo ===
                              null
                          }
                          onClick={() =>
                            editarProduto(
                              produto
                            )
                          }
                        >
                          <Pencil
                            size={16}
                          />
                        </button>

                        <button
                          type="button"
                          className={`action-button ${
                            produto.ativo
                              ? "disable"
                              : "enable"
                          }`}
                          title={
                            produto.ativo
                              ? "Desativar produto"
                              : "Ativar produto"
                          }
                          disabled={
                            produto.quantidade ===
                              null ||
                            produto.estoque_minimo ===
                              null
                          }
                          onClick={() =>
                            alterarStatus(
                              produto
                            )
                          }
                        >
                          <Power
                            size={16}
                          />
                        </button>

                        <button
                          type="button"
                          className="action-button delete"
                          title="Excluir produto"
                          onClick={() =>
                            excluirProduto(
                              produto
                            )
                          }
                        >
                          <Trash2
                            size={16}
                          />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              )}

              {produtosFiltrados.length ===
                0 && (
                <tr>
                  <td
                    colSpan="6"
                    className="empty-table"
                  >
                    {carregando
                      ? "Carregando produtos..."
                      : "Nenhum produto encontrado."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {produtoParaExcluir && (
        <div className="modal-aviso-overlay">
          <div className="modal-aviso modal-aviso">
            <h2>
              Excluir produto?
            </h2>

            <p>
              Deseja realmente excluir{" "}
              <strong>
                {produtoParaExcluir.nome}
              </strong>
              ?
            </p>

            <div
              style={{
                display: "flex",
                gap: "10px",
              }}
            >
              <button
                type="button"
                className="modal-aviso-botao"
                onClick={
                  cancelarExclusao
                }
                style={{
                  background:
                    "#64748b",
                }}
              >
                Cancelar
              </button>

              <button
                type="button"
                className="modal-aviso-botao"
                onClick={
                  confirmarExclusao
                }
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      <ModalAviso
        aberto={
          modal.aberto
        }
        tipo={
          modal.tipo
        }
        titulo={
          modal.titulo
        }
        mensagem={
          modal.mensagem
        }
        onFechar={
          fecharAviso
        }
      />
    </>
  );
}
