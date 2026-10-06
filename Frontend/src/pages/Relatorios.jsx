import { useMemo, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

import {
  PageHeader,
  Card,
  Button,
  money,
} from "../components/UI";
import relatorioService from "../../services/relatorioService";

const tiposRelatorio = {
  vendas: "Vendas por Período",
  produtos: "Produtos Mais Vendidos",
  formas_pagamento: "Formas de Pagamento",
  estoque_baixo: "Estoque Baixo",
  dashboard: "Resumo do Dashboard",
};

const periodos = {
  dia: "Diário",
  semanal: "Semanal",
  quinzenal: "15 em 15 dias",
  semestral: "Semestral",
  anual: "Anual",
};

function converterData(valor) {
  if (!valor) {
    return null;
  }

  if (valor.includes("/")) {
    const [dia, mes, ano] = valor.split("/");
    return new Date(`${ano}-${mes}-${dia}T12:00:00`);
  }

  return new Date(valor);
}

function obterDataInicial(periodo) {
  const inicio = new Date();
  inicio.setHours(0, 0, 0, 0);

  if (periodo === "dia") {
    return inicio;
  }

  if (periodo === "semanal") {
    inicio.setDate(inicio.getDate() - 7);
  }

  if (periodo === "quinzenal") {
    inicio.setDate(inicio.getDate() - 15);
  }

  if (periodo === "semestral") {
    inicio.setMonth(inicio.getMonth() - 6);
  }

  if (periodo === "anual") {
    inicio.setFullYear(inicio.getFullYear() - 1);
  }

  return inicio;
}

function formatarData(valor) {
  const data = converterData(valor);

  if (!data || Number.isNaN(data.getTime())) {
    return "—";
  }

  return data.toLocaleDateString("pt-BR");
}

function paraDataInput(data) {
  return data.toISOString().split("T")[0];
}

function valorNumericoGrafico(item) {
  return Number(
    item.valor ??
      item.faturamento ??
      item.receita ??
      item.quantidade ??
      0
  );
}

function montarAlturasGrafico(grafico = []) {
  const lista = grafico.slice(0, 9);
  const maiorValor = Math.max(
    ...lista.map(valorNumericoGrafico),
    1
  );

  return lista.map((item) => ({
    rotulo: item.rotulo,
    valor: item.valor,
    altura: Math.max(
      18,
      Math.round((valorNumericoGrafico(item) / maiorValor) * 100)
    ),
  }));
}

function montarDonutGradiente(categorias = []) {
  const total = categorias.reduce(
    (soma, item) => soma + Number(item.faturamento || 0),
    0
  );

  if (!total) {
    return "conic-gradient(#eceffd 0 100%)";
  }

  const cores = [
    "#5b39f4",
    "#7e63ff",
    "#4bc0ff",
    "#ff8a4c",
    "#24b47e",
    "#f5b545",
  ];

  let acumulado = 0;

  return `conic-gradient(${categorias
    .map((categoria, indice) => {
      const percentual =
        (Number(categoria.faturamento || 0) / total) * 100;
      const inicio = acumulado;
      const fim = acumulado + percentual;
      acumulado = fim;
      return `${cores[indice % cores.length]} ${inicio}% ${fim}%`;
    })
    .join(", ")})`;
}

export default function Relatorios() {
  const [tipoRelatorio, setTipoRelatorio] =
    useState("vendas");

  const [periodo, setPeriodo] = useState("semanal");
  const [relatorio, setRelatorio] = useState(null);
  const [mensagem, setMensagem] = useState("");
  const [carregando, setCarregando] = useState(false);

  function mostrarMensagem(texto) {
    setMensagem(texto);

    setTimeout(() => {
      setMensagem("");
    }, 3000);
  }

  async function gerarRelatorio() {
    const inicio = paraDataInput(obterDataInicial(periodo));
    const fim = paraDataInput(new Date());

    let colunas = [];
    let linhas = [];
    let dadosExcel = [];
    let totalVendas = 0;
    let totalItens = 0;
    let ticketMedio = 0;
    let alunosAtendidos = 0;
    let kpis = null;
    let categorias = [];
    let grafico = [];

    try {
      setCarregando(true);

      if (tipoRelatorio === "vendas") {
        const dados = await relatorioService.vendasPorPeriodo(inicio, fim);
        const resumo = dados.resumo || {};
        const lista = dados.vendas_por_dia || [];
        kpis = dados.kpis || null;
        categorias = dados.categorias || [];

        colunas = ["Dia", "Vendas", "Faturamento"];
        dadosExcel = lista.map((item) => ({
          Dia: formatarData(item.dia),
          Vendas: Number(item.total_vendas || 0),
          Faturamento: Number(item.faturamento || 0),
        }));
        linhas = dadosExcel.map((item) => [
          item.Dia,
          item.Vendas,
          money(item.Faturamento),
        ]);
        totalVendas = Number(resumo.faturamento_total || 0);
        totalItens = lista.reduce(
          (soma, item) => soma + Number(item.total_vendas || 0),
          0
        );
        ticketMedio = Number(resumo.ticket_medio || 0);
        alunosAtendidos = Number(resumo.total_vendas || 0);
        grafico = lista
          .slice()
          .reverse()
          .map((item) => ({
            rotulo: formatarData(item.dia),
            valor: Number(item.faturamento || 0),
          }));
      }

      if (tipoRelatorio === "produtos") {
        const [dados, dadosKpis, dadosCategorias] = await Promise.all([
          relatorioService.produtosMaisVendidos(10),
          relatorioService.kpis(inicio, fim),
          relatorioService.categorias(inicio, fim),
        ]);
        kpis = dadosKpis;
        categorias = dadosCategorias;
        colunas = ["Produto", "Quantidade", "Receita"];
        dadosExcel = dados.map((item) => ({
          Produto: item.nome_produto,
          Quantidade: Number(item.quantidade_vendida || 0),
          Receita: Number(item.receita || 0),
        }));
        linhas = dadosExcel.map((item) => [
          item.Produto,
          item.Quantidade,
          money(item.Receita),
        ]);
        totalVendas = dadosExcel.reduce((soma, item) => soma + item.Receita, 0);
        totalItens = dadosExcel.reduce((soma, item) => soma + item.Quantidade, 0);
        ticketMedio = Number(dadosKpis.ticketMedio || 0);
        alunosAtendidos = Number(dadosKpis.clientesUnicos || 0);
        grafico = dadosExcel.map((item) => ({
          rotulo: item.Produto,
          valor: item.Quantidade,
        }));
      }

      if (tipoRelatorio === "formas_pagamento") {
        const [dados, dadosKpis, dadosCategorias] = await Promise.all([
          relatorioService.formasPagamento(inicio, fim),
          relatorioService.kpis(inicio, fim),
          relatorioService.categorias(inicio, fim),
        ]);
        kpis = dadosKpis;
        categorias = dadosCategorias;
        colunas = ["Forma", "Quantidade", "Valor"];
        dadosExcel = dados.map((item) => ({
          Forma: item.forma_pagamento,
          Quantidade: Number(item.quantidade || 0),
          Valor: Number(item.valor_total || 0),
        }));
        linhas = dadosExcel.map((item) => [
          item.Forma,
          item.Quantidade,
          money(item.Valor),
        ]);
        totalVendas = dadosExcel.reduce((soma, item) => soma + item.Valor, 0);
        totalItens = dadosExcel.reduce((soma, item) => soma + item.Quantidade, 0);
        ticketMedio = Number(dadosKpis.ticketMedio || 0);
        alunosAtendidos = Number(dadosKpis.clientesUnicos || 0);
        grafico = dadosExcel.map((item) => ({
          rotulo: item.Forma,
          valor: item.Valor,
        }));
      }

      if (tipoRelatorio === "estoque_baixo") {
        const [dados, dadosKpis] = await Promise.all([
          relatorioService.estoqueBaixo(10),
          relatorioService.kpis(inicio, fim),
        ]);
        kpis = dadosKpis;
        colunas = ["Produto", "Quantidade", "Minimo", "Preco"];
        dadosExcel = dados.map((item) => ({
          Produto: item.nome,
          Quantidade: Number(item.quantidade || 0),
          Minimo: Number(item.estoque_minimo || 0),
          Preco: Number(item.preco || 0),
        }));
        linhas = dadosExcel.map((item) => [
          item.Produto,
          item.Quantidade,
          item.Minimo,
          money(item.Preco),
        ]);
        totalItens = dadosExcel.length;
        totalVendas = Number(dadosKpis.faturamentoTotal || 0);
        ticketMedio = Number(dadosKpis.ticketMedio || 0);
        alunosAtendidos = Number(dadosKpis.clientesUnicos || 0);
        grafico = dadosExcel.map((item) => ({
          rotulo: item.Produto,
          valor: item.Quantidade,
        }));
      }

      if (tipoRelatorio === "dashboard") {
        const [dados, dadosKpis, dadosCategorias] = await Promise.all([
          relatorioService.dashboard(),
          relatorioService.kpis(inicio, fim),
          relatorioService.categorias(inicio, fim),
        ]);
        kpis = dadosKpis;
        categorias = dadosCategorias;
        colunas = ["Indicador", "Valor"];
        dadosExcel = [
          {
            Indicador: "Vendas de hoje",
            Valor: Number(dados.vendasHoje?.quantidade || 0),
          },
          {
            Indicador: "Faturamento de hoje",
            Valor: Number(dados.vendasHoje?.total || 0),
          },
          {
            Indicador: "Produtos ativos",
            Valor: Number(dados.totalProdutos || 0),
          },
          {
            Indicador: "Clientes ativos",
            Valor: Number(dados.totalClientes || 0),
          },
          {
            Indicador: "Produtos com estoque baixo",
            Valor: Number(dados.produtosEstoqueBaixo || 0),
          },
          {
            Indicador: "Alunos com saldo",
            Valor: Number(dados.alunosComSaldo || 0),
          },
          {
            Indicador: "Saldo de crédito total",
            Valor: Number(dados.saldoCreditoTotal || 0),
          },
        ];
        linhas = dadosExcel.map((item) => [item.Indicador, item.Valor]);
        totalVendas = Number(dados.vendasHoje?.total || 0);
        totalItens = Number(dados.totalProdutos || 0);
        alunosAtendidos = Number(dados.totalClientes || 0);
        ticketMedio = Number(dadosKpis.ticketMedio || 0);
        grafico = [
          {
            rotulo: "Vendas hoje",
            valor: Number(dados.vendasHoje?.total || 0),
          },
          {
            rotulo: "Produtos ativos",
            valor: Number(dados.totalProdutos || 0),
          },
          {
            rotulo: "Clientes ativos",
            valor: Number(dados.totalClientes || 0),
          },
          {
            rotulo: "Estoque baixo",
            valor: Number(dados.produtosEstoqueBaixo || 0),
          },
        ];
      }

      setRelatorio({
        titulo: tiposRelatorio[tipoRelatorio],
        periodo: periodos[periodo],
        colunas,
        linhas,
        dadosExcel,
        totalVendas,
        totalItens,
        alunosAtendidos,
        ticketMedio,
        kpis,
        categorias,
        grafico,
        inicio,
        fim,
      });

      mostrarMensagem("Relatório gerado com sucesso!");
    } catch (error) {
      mostrarMensagem(`Erro ao gerar relatório: ${error.message}`);
    } finally {
      setCarregando(false);
    }
  }

  function exportarPDF() {
    if (!relatorio) {
      mostrarMensagem(
        "Gere o relatório antes de exportar."
      );
      return;
    }

    const documento = new jsPDF({
      orientation: "landscape",
    });

    documento.setFontSize(18);
    documento.text(
      `FoodControl - ${relatorio.titulo}`,
      14,
      18
    );

    documento.setFontSize(11);
    documento.text(
      `Período: ${relatorio.periodo}`,
      14,
      27
    );

    documento.text(
      `Gerado em: ${new Date().toLocaleString("pt-BR")}`,
      14,
      34
    );

    autoTable(documento, {
      startY: 42,
      head: [relatorio.colunas],
      body: relatorio.linhas,
      styles: {
        fontSize: 9,
      },
      headStyles: {
        fillColor: [84, 36, 238],
      },
    });

    documento.save(
      `relatorio-${tipoRelatorio}-${periodo}.pdf`
    );
  }

  function exportarExcel() {
    if (!relatorio) {
      mostrarMensagem(
        "Gere o relatório antes de exportar."
      );
      return;
    }

    if (relatorio.dadosExcel.length === 0) {
      mostrarMensagem(
        "O relatório não possui dados para exportar."
      );
      return;
    }

    const planilha = XLSX.utils.json_to_sheet(
      relatorio.dadosExcel
    );

    const arquivo = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      arquivo,
      planilha,
      "Relatório"
    );

    XLSX.writeFile(
      arquivo,
      `relatorio-${tipoRelatorio}-${periodo}.xlsx`
    );
  }

  const graficoRender = useMemo(
    () => montarAlturasGrafico(relatorio?.grafico || []),
    [relatorio]
  );

  const totalCategorias = useMemo(
    () =>
      (relatorio?.categorias || []).reduce(
        (soma, item) => soma + Number(item.faturamento || 0),
        0
      ),
    [relatorio]
  );

  const resumoKpis = relatorio?.kpis || null;
  const donutStyle = useMemo(
    () => ({
      background: montarDonutGradiente(relatorio?.categorias || []),
    }),
    [relatorio]
  );

  return (
    <>
      <PageHeader
        title="Relatórios"
        subtitle="Acompanhe o desempenho da cantina."
        action={
          <Button
            type="button"
            onClick={gerarRelatorio}
            disabled={carregando}
          >
            {carregando ? "Gerando..." : "Gerar Relatório"}
          </Button>
        }
      />

      {mensagem && (
        <div className="form-message success">
          {mensagem}
        </div>
      )}

      <Card>
        <h2>Configuração do Relatório</h2>

        <div className="report-filters">
          <label className="field">
            Tipo de relatório

            <select
              value={tipoRelatorio}
              onChange={(event) =>
                setTipoRelatorio(event.target.value)
              }
            >
              <option value="vendas">
                Vendas por Período
              </option>

              <option value="produtos">
                Produtos Mais Vendidos
              </option>

              <option value="formas_pagamento">
                Formas de Pagamento
              </option>

              <option value="estoque_baixo">
                Estoque Baixo
              </option>

              <option value="dashboard">
                Dashboard
              </option>
            </select>
          </label>

          <label className="field">
            Período

            <select
              value={periodo}
              onChange={(event) =>
                setPeriodo(event.target.value)
              }
            >
              <option value="dia">Diário</option>
              <option value="semanal">Semanal</option>
              <option value="quinzenal">
                15 em 15 dias
              </option>
              <option value="semestral">
                Semestral
              </option>
              <option value="anual">Anual</option>
            </select>
          </label>
        </div>
      </Card>

      <div className="stats">
        <Card>
          <small>Faturamento</small>

          <strong>
            {money(relatorio?.totalVendas || 0)}
          </strong>
        </Card>

        <Card>
          <small>Itens vendidos</small>

          <strong>{relatorio?.totalItens || 0}</strong>
        </Card>

        <Card>
          <small>Clientes únicos</small>

          <strong>
            {relatorio?.alunosAtendidos || 0}
          </strong>
        </Card>

        <Card>
          <small>Ticket Médio</small>

          <strong>
            {money(relatorio?.ticketMedio || 0)}
          </strong>
        </Card>
      </div>

      {resumoKpis && (
        <div className="stats">
          <Card>
            <small>Forma líder</small>
            <strong>
              {resumoKpis.formaPagamentoLider?.nome || "—"}
            </strong>
          </Card>

          <Card>
            <small>Produto líder</small>
            <strong>
              {resumoKpis.produtoLider?.nome || "—"}
            </strong>
          </Card>

          <Card>
            <small>Alunos com saldo</small>
            <strong>{resumoKpis.alunosComSaldo || 0}</strong>
          </Card>

          <Card>
            <small>Crédito disponível</small>
            <strong>
              {money(resumoKpis.saldoCreditoTotal || 0)}
            </strong>
          </Card>
        </div>
      )}

      <div className="report-grid">
        <Card>
          <h2>
            {relatorio
              ? `${relatorio.titulo} — ${relatorio.periodo}`
              : "Vendas por Dia"}
          </h2>

          <div className="chart">
            {graficoRender.length > 0 ? (
              graficoRender.map((item) => (
                <div
                  key={item.rotulo}
                  className="chart-column"
                  title={`${item.rotulo}: ${item.valor}`}
                >
                  <i
                    style={{
                      height: `${item.altura}%`,
                    }}
                  />
                  <small>{item.rotulo}</small>
                </div>
              ))
            ) : (
              <div className="empty-table">
                Gere um relatório para visualizar o gráfico.
              </div>
            )}
          </div>
        </Card>

        <Card>
          <h2>Vendas por Categoria</h2>

          <div
            className="donut"
            data-label={money(totalCategorias || 0)}
            style={donutStyle}
          ></div>

          <div className="legend">
            {(relatorio?.categorias || []).length > 0 ? (
              relatorio.categorias.map((categoria) => {
                const percentual =
                  totalCategorias > 0
                    ? (
                        (Number(categoria.faturamento || 0) /
                          totalCategorias) *
                        100
                      ).toFixed(1)
                    : "0.0";

                return (
                  <div
                    key={categoria.nome_categoria || "Sem categoria"}
                    className="legend-item"
                  >
                    <span>
                      {categoria.nome_categoria || "Sem categoria"}
                    </span>
                    <b>
                      {percentual}% • {money(Number(categoria.faturamento || 0))}
                    </b>
                  </div>
                );
              })
            ) : (
              <span>Nenhuma categoria com venda no período.</span>
            )}
          </div>
        </Card>
      </div>

      {relatorio && (
        <Card>
          <h2>
            Resultado: {relatorio.titulo}
          </h2>

          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  {relatorio.colunas.map((coluna) => (
                    <th key={coluna}>{coluna}</th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {relatorio.linhas.map(
                  (linha, indiceLinha) => (
                    <tr key={indiceLinha}>
                      {linha.map(
                        (valor, indiceColuna) => (
                          <td key={indiceColuna}>
                            {valor}
                          </td>
                        )
                      )}
                    </tr>
                  )
                )}

                {relatorio.linhas.length === 0 && (
                  <tr>
                    <td
                      colSpan={relatorio.colunas.length}
                      className="empty-table"
                    >
                      Nenhum registro encontrado no período
                      selecionado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <div className="actions left">
        <Button
          secondary
          type="button"
          onClick={exportarPDF}
        >
          Exportar PDF
        </Button>

        <Button
          secondary
          type="button"
          onClick={exportarExcel}
        >
          Exportar Excel
        </Button>
      </div>
    </>
  );
}
