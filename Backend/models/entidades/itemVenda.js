class ItemVenda {
    constructor(id_produto, quantidade) {
        this.id_produto = Number(id_produto);
        this.quantidade = Number(quantidade);
    }
}
module.exports = ItemVenda;
