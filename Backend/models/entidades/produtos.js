const Categoria = require("./categoria");
class Produto{

constructor(id, categoria, nome, valor,ativo) {
    this.id_produto = id;
    this.categoria = categoria;
    this.verificarNome(nome);
    this.nome_produto = this.formatarNomeProduto(nome);
    this.verificarValor(valor);
    this.valor_unitario = valor;
    this.ativo = ativo;
  }

  verificarValor(valor) {

    if (!Number.isFinite(Number(valor)) || Number(valor) <= 0) {

        throw new Error(
            "O valor do produto deve ser um número maior que zero."
        );

    }

}

formatarNomeProduto(nome){
  return nome.trim().toUpperCase();
}

verificarNome(nome) {

  if (!nome || typeof nome !== 'string' || nome.trim().length < 3) {

      throw new Error(
          "O nome do produto deve ter pelo menos 3 caracteres."
      );

  }

}
};


module.exports = Produto;

// const categoria1 = new Categoria(1, "Categoria 1", "Descrição da categoria 1", true);

// const produto1 = new Produto(1, categoria1, "produto 1", 10.0, true);
// console.log(produto1.categoria.nome_categoria); 