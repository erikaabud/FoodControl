import { useEffect, useState } from "react";

import {
  PageHeader,
  Card,
  Status,
  Button,
} from "../components/UI";
import estoqueService from "../../services/estoqueService";
import categoriaService from "../../services/categoriaService";

export default function Estoque() {

  const [produtos, setProdutos] = useState([]);
  const [categoriasBanco, setCategoriasBanco] = useState([]);

  const [pesquisa, setPesquisa] = useState("");
  const [categoria, setCategoria] = useState("");
  const [status, setStatus] = useState("");

  const [filtrosAbertos, setFiltrosAbertos] =
    useState(false);

  const [carregando, setCarregando] = useState(true);
  const [mensagem, setMensagem] = useState("");

  // BUSCAR OS PRODUTOS REAIS DO MYSQL
  async function carregarEstoque() {

    setCarregando(true);

    try {

      const [dadosProdutos, dadosCategorias] =
        await Promise.all([
          estoqueService.listarEstoque(),
          categoriaService.listarCategorias(),
        ]);

      const produtosFormatados = dadosProdutos.map(
        (produto) => ({
          id: produto.id,
          id_categoria: Number(produto.idCategoria),
          nome: produto.nome,

          // NULL SIGNIFICA QUE NÃO EXISTE ESTOQUE CADASTRADO
          estoque:
            produto.quantidade === null ? null : Number(produto.quantidade),

          minimo:
            produto.estoqueMinimo === null
              ? null
              : Number(produto.estoqueMinimo),

          ativo: Boolean(Number(produto.ativo)),
        })
      );

      setProdutos(produtosFormatados);
      setCategoriasBanco(dadosCategorias);
      setMensagem("");

    } catch (erro) {

      setMensagem(
        `Erro ao carregar estoque: ${erro.message}`
      );

    } finally {

      setCarregando(false);

    }
  }

  // CARREGA AO ABRIR A TELA E AO VOLTAR PARA A ABA
  useEffect(() => {

    carregarEstoque();

    function atualizarAoVoltar() {
      carregarEstoque();
    }

    window.addEventListener(
      "focus",
      atualizarAoVoltar
    );

    return () => {

      window.removeEventListener(
        "focus",
        atualizarAoVoltar
      );

    };

  }, []);

  // DESCOBRIR O NOME DA CATEGORIA PELO ID
  function nomeCategoria(id) {

    const categoriaEncontrada =
      categoriasBanco.find(
        (item) =>
          Number(item.id_categoria) === Number(id)
      );

    return (
      categoriaEncontrada?.nome_categoria ||
      `Categoria ${id}`
    );
  }

  // VERIFICAR SE O PRODUTO TEM ESTOQUE CADASTRADO
  function temEstoque(produto) {

    return (
      produto.estoque !== null &&
      produto.minimo !== null
    );

  }

  // VERIFICAR SE O ESTOQUE ESTÁ BAIXO
  function estoqueEstaBaixo(produto) {

    return (
      temEstoque(produto) &&
      produto.estoque <= produto.minimo
    );

  }

  // CATEGORIAS DOS PRODUTOS EXIBIDOS
  const categorias = [
    ...new Set(
      produtos.map(
        (produto) => produto.id_categoria
      )
    ),
  ];

  // PESQUISA E FILTROS
  const produtosFiltrados = produtos.filter(
    (produto) => {

      const correspondePesquisa = produto.nome
        .toLowerCase()
        .includes(
          pesquisa.toLowerCase().trim()
        );

      const correspondeCategoria =
        categoria === "" ||
        String(produto.id_categoria) === categoria;

      const estoqueBaixo =
        estoqueEstaBaixo(produto);

      const correspondeStatus =
        status === "" ||
        (
          status === "baixo" &&
          estoqueBaixo
        ) ||
        (
          status === "normal" &&
          temEstoque(produto) &&
          !estoqueBaixo
        ) ||
        (
          status === "semEstoque" &&
          !temEstoque(produto)
        );

      return (
        correspondePesquisa &&
        correspondeCategoria &&
        correspondeStatus
      );

    }
  );

  // SOMAR AS QUANTIDADES REAIS DO MYSQL
  const totalEstoque = produtos.reduce(
    (total, produto) =>
      total + (produto.estoque ?? 0),
    0
  );

  // CONTAR PRODUTOS COM ESTOQUE BAIXO
  const totalEstoqueBaixo = produtos.filter(
    (produto) => estoqueEstaBaixo(produto)
  ).length;

  function limparFiltros() {

    setPesquisa("");
    setCategoria("");
    setStatus("");

  }

  return (
    <>

      <PageHeader
        title="Estoque"
        subtitle="Acompanhe o estoque dos produtos em tempo real."
      />

      {mensagem && (
        <div className="form-message error">
          {mensagem}
        </div>
      )}

      <div className="stats">

        <Card>
          <small>Total em estoque</small>

          <strong>
            {totalEstoque} unidades
          </strong>
        </Card>

        <Card>
          <small>
            Produtos com estoque baixo
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
              setPesquisa(event.target.value)
            }
            placeholder="Buscar produto..."
          />

          <Button
            secondary
            type="button"
            onClick={() =>
              setFiltrosAbertos(!filtrosAbertos)
            }
          >

            {filtrosAbertos
              ? "Fechar filtros"
              : "Filtrar"}

          </Button>

        </div>

        {filtrosAbertos && (

          <div className="stock-filters">

            <select
              value={categoria}
              onChange={(event) =>
                setCategoria(event.target.value)
              }
            >

              <option value="">
                Todas as categorias
              </option>

              {categorias.map(
                (idCategoria) => (

                  <option
                    value={idCategoria}
                    key={idCategoria}
                  >

                    {nomeCategoria(idCategoria)}

                  </option>

                )
              )}

            </select>

            <select
              value={status}
              onChange={(event) =>
                setStatus(event.target.value)
              }
            >

              <option value="">
                Todos os status
              </option>

              <option value="normal">
                Estoque normal
              </option>

              <option value="baixo">
                Estoque baixo
              </option>

              <option value="semEstoque">
                Sem estoque cadastrado
              </option>

            </select>

            <Button
              secondary
              type="button"
              onClick={limparFiltros}
            >

              Limpar filtros

            </Button>

          </div>

        )}

        <div className="table-responsive">

          <table>

            <thead>

              <tr>
                <th>Produto</th>
                <th>Categoria</th>
                <th>Estoque Atual</th>
                <th>Estoque Mínimo</th>
                <th>Status</th>
              </tr>

            </thead>

            <tbody>

              {produtosFiltrados.map(
                (produto) => {

                  const estoqueBaixo =
                    estoqueEstaBaixo(produto);

                  const estoqueCadastrado =
                    temEstoque(produto);

                  return (

                    <tr key={produto.id}>

                      <td>
                        {produto.nome}
                      </td>

                      <td>
                        {nomeCategoria(
                          produto.id_categoria
                        )}
                      </td>

                      <td>

                        {produto.estoque === null
                          ? "—"
                          : produto.estoque}

                      </td>

                      <td>

                        {produto.minimo === null
                          ? "—"
                          : produto.minimo}

                      </td>

                      <td>

                        <Status
                          type={
                            !estoqueCadastrado
                              ? "bad"
                              : estoqueBaixo
                                ? "warn"
                                : "ok"
                          }
                        >

                          {!estoqueCadastrado
                            ? "Sem estoque cadastrado"
                            : estoqueBaixo
                              ? "Estoque baixo"
                              : "Normal"}

                        </Status>

                      </td>

                    </tr>

                  );

                }
              )}

              {produtosFiltrados.length === 0 && (

                <tr>

                  <td
                    colSpan="5"
                    className="empty-table"
                  >

                    {carregando
                      ? "Carregando estoque..."
                      : "Nenhum produto encontrado."}

                  </td>

                </tr>

              )}

            </tbody>

          </table>

        </div>

      </Card>

    </>
  );

}
