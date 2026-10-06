const vendaInfrastructure = require('../infrastructure/vendaInfrastructure');
const ItemVenda = require('../models/entidades/itemVenda');

class VendaService {
    async listarVendas() {
        return vendaInfrastructure.listarVendas();
    }

    async buscarVendaPorID(id) {
        const venda = await vendaInfrastructure.buscarVendaPorID(id);
        if (!venda) throw new Error(`Venda com ID ${id} não encontrada.`);
        return venda;
    }

    async listarFormasPagamento() {
        return vendaInfrastructure.listarFormasPagamento();
    }

    async criarVenda(dados) {
        if (!dados || !Array.isArray(dados.itens) || dados.itens.length === 0) {
            throw new Error('A venda precisa ter pelo menos um item.');
        }
        if (!dados.id_forma_pagamento) {
            throw new Error('Informe a forma de pagamento.');
        }

        // Junta produtos repetidos para respeitar a PK (id_venda, id_produto).
        const agrupados = new Map();
        for (const bruto of dados.itens) {
            const item = new ItemVenda(bruto.id_produto, bruto.quantidade);
            if (!Number.isInteger(item.id_produto) || item.id_produto <= 0) {
                throw new Error('Todo item precisa ter um id_produto válido.');
            }
            if (!Number.isInteger(item.quantidade) || item.quantidade <= 0) {
                throw new Error('A quantidade dos itens deve ser um inteiro maior que zero.');
            }
            agrupados.set(item.id_produto, (agrupados.get(item.id_produto) || 0) + item.quantidade);
        }

        return vendaInfrastructure.criarVenda({
            id_cliente: dados.id_cliente ? Number(dados.id_cliente) : null,
            id_usuario: dados.id_usuario ? Number(dados.id_usuario) : null,
            id_forma_pagamento: Number(dados.id_forma_pagamento),
            quantidade_parcelas: Number(dados.quantidade_parcelas || 1),
            itens: [...agrupados.entries()].map(([id_produto, quantidade]) => ({ id_produto, quantidade }))
        });
    }

    async cancelarVenda(id, id_usuario) {
        await vendaInfrastructure.cancelarVenda(Number(id), id_usuario ? Number(id_usuario) : null);
        return `Venda ${id} cancelada com sucesso.`;
    }
}

module.exports = new VendaService();
