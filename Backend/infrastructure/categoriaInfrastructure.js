const {pool} = require('../config/db');

class CategoriaInfrastructure{
    async buscarCategoriaPorID(id_categoria) {
        const [categoria] = await pool.query('SELECT * FROM categoria WHERE id_categoria = ?', [id_categoria]);
        if (categoria.length === 0) {
             throw new Error(`Categoria com ID ${id_categoria} não encontrada.`);
        }
        return categoria[0];
    }

    async listarCategorias() {

        const [categorias] = await pool.query(
            'SELECT * FROM categoria'
        );
    
        return categorias;
    
    }
}

const categoriaInfrastructure = new CategoriaInfrastructure();
module.exports = categoriaInfrastructure;