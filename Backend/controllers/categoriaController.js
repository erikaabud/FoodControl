const categoriaService = require('../services/categoriaService');

class CategoriaController {

    async listarCategorias(req, res) {
        try {
            const categorias = await categoriaService.listarCategorias();

            return res.status(200).json(categorias);

        } catch (error) {
            return res.status(500).json({
                mensagem: `Erro ao listar categorias: ${error.message}`
            });
        }
    }

}

module.exports = new CategoriaController();