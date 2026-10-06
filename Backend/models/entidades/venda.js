class Venda {
    constructor(
        id_venda,
        id_cliente,
        id_usuario,
        data_venda,
        status = "Pendente"
    ) {
        this.id_venda = id_venda;
        this.id_cliente = id_cliente;
        this.id_usuario = id_usuario;
        this.data_venda = data_venda;
        this.status = status;
    }
}

module.exports = Venda;