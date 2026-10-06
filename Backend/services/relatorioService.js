const relatorioInfrastructure = require('../infrastructure/relatorioInfrastructure');

module.exports = {
  async vendasPorPeriodo(inicio, fim) {
    if (!inicio || !fim) throw new Error('Informe as datas de início e fim');

    const resumo = await relatorioInfrastructure.resumoVendas(inicio, fim);
    const porDia = await relatorioInfrastructure.vendasPorDia(inicio, fim);
    const kpis = await relatorioInfrastructure.kpisPeriodo(inicio, fim);
    const categorias = await relatorioInfrastructure.vendasPorCategoria(inicio, fim);

    return { resumo, porDia, vendas_por_dia: porDia, kpis, categorias };
  },

  async produtosMaisVendidos(limite) {
    return relatorioInfrastructure.produtosMaisVendidos(limite);
  },

  async formasPagamento(inicio, fim) {
    return relatorioInfrastructure.formasPagamento(inicio, fim);
  },

  async estoqueBaixo(minimo) {
    return relatorioInfrastructure.estoqueBaixo(minimo);
  },

  async dashboard() {
    return relatorioInfrastructure.dashboard();
  },

  async kpis(inicio, fim) {
    if (!inicio || !fim) throw new Error('Informe as datas de início e fim');

    return relatorioInfrastructure.kpisPeriodo(inicio, fim);
  },

  async categorias(inicio, fim) {
    if (!inicio || !fim) throw new Error('Informe as datas de início e fim');

    return relatorioInfrastructure.vendasPorCategoria(inicio, fim);
  }
};
