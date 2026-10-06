const categoriaInfrastructure = require('../infrastructure/categoriaInfrastructure');

class CategoriaService {

    async listarCategorias() {
        try {
            const categorias = await categoriaInfrastructure.listarCategorias();

            return categorias;

        } catch (error) {
            throw new Error(`Erro ao listar categorias: ${error.message}`);
        }
    }

}

module.exports = new CategoriaService();