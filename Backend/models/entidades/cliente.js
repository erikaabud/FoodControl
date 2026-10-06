class Cliente {
    constructor(
        id_cliente,
        nome,
        tipo_cliente,
        telefone,
        observacoes,
        ativo = true
    ) {
        this.id_cliente = id_cliente;
        this.nome = nome;
        this.tipo_cliente = tipo_cliente;
        this.telefone = telefone;
        this.observacoes = observacoes;
        this.ativo = ativo;
    }
}

module.exports = Cliente;