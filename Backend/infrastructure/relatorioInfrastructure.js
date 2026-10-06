const { pool } = require('../config/db');

module.exports = {
  // ==========================================
  // RESUMO GERAL DE VENDAS
  // ==========================================
  async resumoVendas(inicio, fim) {
    const sql = `
      SELECT 
        COUNT(DISTINCT v.id_venda) AS total_vendas,
        COALESCE(SUM(iv.quantidade * iv.valor_unitario), 0) AS faturamento_total,
        COALESCE(
          SUM(iv.quantidade * iv.valor_unitario) / NULLIF(COUNT(DISTINCT v.id_venda), 0), 
          0
        ) AS ticket_medio
      FROM Venda v
      LEFT JOIN Item_venda iv ON iv.id_venda = v.id_venda
      WHERE DATE(v.data_venda) BETWEEN ? AND ?
        AND v.status = 'Concluída'
    `;
    const [rows] = await pool.query(sql, [inicio, fim]);
    return rows[0];
  },

  // ==========================================
  // VENDAS POR DIA
  // ==========================================
  async vendasPorDia(inicio, fim) {
    const sql = `
      SELECT 
        DATE(v.data_venda) AS dia,
        COUNT(DISTINCT v.id_venda) AS total_vendas,
        COALESCE(SUM(iv.quantidade * iv.valor_unitario), 0) AS faturamento
      FROM Venda v
      LEFT JOIN Item_venda iv ON iv.id_venda = v.id_venda
      WHERE DATE(v.data_venda) BETWEEN ? AND ?
        AND v.status = 'Concluída'
      GROUP BY DATE(v.data_venda)
      ORDER BY dia DESC
    `;
    const [rows] = await pool.query(sql, [inicio, fim]);
    return rows;
  },

  // ==========================================
  // PRODUTOS MAIS VENDIDOS
  // ==========================================
  async produtosMaisVendidos(limite) {
    const sql = `
      SELECT 
        p.id_produto,
        p.nome_produto,
        SUM(iv.quantidade) AS quantidade_vendida,
        SUM(iv.quantidade * iv.valor_unitario) AS receita
      FROM Item_venda iv
      JOIN Produto p ON p.id_produto = iv.id_produto
      JOIN Venda v ON v.id_venda = iv.id_venda
      WHERE v.status = 'Concluída'
      GROUP BY p.id_produto, p.nome_produto
      ORDER BY quantidade_vendida DESC
      LIMIT ?
    `;
    const [rows] = await pool.query(sql, [limite]);
    return rows;
  },

  // ==========================================
  // FORMAS DE PAGAMENTO
  // ==========================================
  async formasPagamento(inicio, fim) {
    const sql = `
      SELECT 
        fp.nome_forma AS forma_pagamento,
        COUNT(p.id_pagamento) AS quantidade,
        COALESCE(SUM(p.valor), 0) AS valor_total
      FROM Pagamento p
      JOIN Forma_pagamento fp ON fp.id_forma_pagamento = p.id_forma_pagamento
      JOIN Venda v ON v.id_venda = p.id_venda
      WHERE DATE(v.data_venda) BETWEEN ? AND ?
        AND p.status = 'Confirmado'
      GROUP BY fp.nome_forma
      ORDER BY valor_total DESC
    `;
    const [rows] = await pool.query(sql, [inicio, fim]);
    return rows;
  },

  async kpisPeriodo(inicio, fim) {
    const [resumoRows] = await pool.query(
      `
        SELECT
          COUNT(DISTINCT v.id_venda) AS total_vendas,
          COUNT(DISTINCT v.id_cliente) AS clientes_unicos,
          COALESCE(SUM(iv.quantidade), 0) AS itens_vendidos,
          COALESCE(SUM(iv.quantidade * iv.valor_unitario), 0) AS faturamento_total,
          COALESCE(
            SUM(iv.quantidade * iv.valor_unitario) / NULLIF(COUNT(DISTINCT v.id_venda), 0),
            0
          ) AS ticket_medio
        FROM Venda v
        LEFT JOIN Item_venda iv ON iv.id_venda = v.id_venda
        WHERE DATE(v.data_venda) BETWEEN ? AND ?
          AND v.status = 'Concluída'
      `,
      [inicio, fim]
    );

    const [formaRows] = await pool.query(
      `
        SELECT
          fp.nome_forma,
          COUNT(*) AS quantidade,
          COALESCE(SUM(p.valor), 0) AS valor_total
        FROM Pagamento p
        JOIN Forma_pagamento fp
          ON fp.id_forma_pagamento = p.id_forma_pagamento
        JOIN Venda v ON v.id_venda = p.id_venda
        WHERE DATE(v.data_venda) BETWEEN ? AND ?
          AND p.status = 'Confirmado'
        GROUP BY fp.nome_forma
        ORDER BY valor_total DESC
        LIMIT 1
      `,
      [inicio, fim]
    );

    const [produtoRows] = await pool.query(
      `
        SELECT
          p.nome_produto,
          SUM(iv.quantidade) AS quantidade_vendida
        FROM Item_venda iv
        JOIN Produto p ON p.id_produto = iv.id_produto
        JOIN Venda v ON v.id_venda = iv.id_venda
        WHERE DATE(v.data_venda) BETWEEN ? AND ?
          AND v.status = 'Concluída'
        GROUP BY p.id_produto, p.nome_produto
        ORDER BY quantidade_vendida DESC
        LIMIT 1
      `,
      [inicio, fim]
    );

    const [creditoRows] = await pool.query(
      `
        SELECT
          COUNT(*) AS alunos_com_saldo,
          COALESCE(SUM(saldo_atual), 0) AS saldo_credito_total
        FROM Conta_credito
        WHERE saldo_atual > 0
      `
    );

    return {
      totalVendas: Number(resumoRows[0].total_vendas || 0),
      clientesUnicos: Number(resumoRows[0].clientes_unicos || 0),
      itensVendidos: Number(resumoRows[0].itens_vendidos || 0),
      faturamentoTotal: Number(
        resumoRows[0].faturamento_total || 0
      ),
      ticketMedio: Number(resumoRows[0].ticket_medio || 0),
      formaPagamentoLider: formaRows[0]
        ? {
            nome: formaRows[0].nome_forma,
            quantidade: Number(formaRows[0].quantidade || 0),
            valorTotal: Number(formaRows[0].valor_total || 0),
          }
        : null,
      produtoLider: produtoRows[0]
        ? {
            nome: produtoRows[0].nome_produto,
            quantidadeVendida: Number(
              produtoRows[0].quantidade_vendida || 0
            ),
          }
        : null,
      alunosComSaldo: Number(creditoRows[0].alunos_com_saldo || 0),
      saldoCreditoTotal: Number(
        creditoRows[0].saldo_credito_total || 0
      ),
    };
  },

  async vendasPorCategoria(inicio, fim) {
    const sql = `
      SELECT
        c.nome_categoria,
        COALESCE(SUM(iv.quantidade), 0) AS quantidade,
        COALESCE(SUM(iv.quantidade * iv.valor_unitario), 0) AS faturamento
      FROM Item_venda iv
      JOIN Produto p ON p.id_produto = iv.id_produto
      LEFT JOIN Categoria c ON c.id_categoria = p.id_categoria
      JOIN Venda v ON v.id_venda = iv.id_venda
      WHERE DATE(v.data_venda) BETWEEN ? AND ?
        AND v.status = 'Concluída'
      GROUP BY c.nome_categoria
      ORDER BY faturamento DESC
    `;

    const [rows] = await pool.query(sql, [inicio, fim]);
    return rows;
  },

  // ==========================================
  // ESTOQUE BAIXO
  // ==========================================
  async estoqueBaixo(minimo) {
    const sql = `
      SELECT 
        p.id_produto AS id,
        p.nome_produto AS nome,
        e.quantidade,
        e.estoque_minimo,
        p.valor_unitario AS preco
      FROM Estoque e
      JOIN Produto p ON p.id_produto = e.id_produto
      WHERE e.quantidade <= ?
      ORDER BY e.quantidade ASC
    `;
    const [rows] = await pool.query(sql, [minimo]);
    return rows;
  },

  // ==========================================
  // DASHBOARD
  // ==========================================
  async dashboard() {
    const hoje = new Date().toISOString().split('T')[0];

    const [vendasHoje] = await pool.query(`
      SELECT 
        COUNT(DISTINCT v.id_venda) AS quantidade,
        COALESCE(SUM(iv.quantidade * iv.valor_unitario), 0) AS total
      FROM Venda v
      LEFT JOIN Item_venda iv ON iv.id_venda = v.id_venda
      WHERE DATE(v.data_venda) = ?
        AND v.status = 'Concluída'
    `, [hoje]);

    const [produtos] = await pool.query('SELECT COUNT(*) AS total FROM Produto WHERE ativo = TRUE');
    const [clientes] = await pool.query('SELECT COUNT(*) AS total FROM Cliente WHERE ativo = TRUE');
    const [estoque] = await pool.query(`
      SELECT COUNT(*) AS total 
      FROM Estoque 
      WHERE quantidade <= estoque_minimo
    `);
    const [credito] = await pool.query(`
      SELECT
        COUNT(*) AS alunos_com_saldo,
        COALESCE(SUM(saldo_atual), 0) AS saldo_total
      FROM Conta_credito
      WHERE saldo_atual > 0
    `);

    return {
      vendasHoje: {
        quantidade: Number(vendasHoje[0].quantidade),
        total: Number(vendasHoje[0].total)
      },
      totalProdutos: Number(produtos[0].total),
      totalClientes: Number(clientes[0].total),
      produtosEstoqueBaixo: Number(estoque[0].total),
      alunosComSaldo: Number(credito[0].alunos_com_saldo),
      saldoCreditoTotal: Number(credito[0].saldo_total)
    };
  }
};
