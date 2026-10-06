const express = require('express');
const cors = require('cors');
require('dotenv').config();
require('./config/db');

const produtoRoutes = require('./routes/produtoRoutes');
const categoriaRoutes = require('./routes/categoriaRoutes');
const estoqueRoutes = require('./routes/estoqueRoutes');
const vendaRoutes = require('./routes/vendaRoutes');
const clientesRoutes = require('./routes/clientesRoutes');
const creditoRoutes = require('./routes/creditoRoutes');
const authRoutes = require('./routes/authRoutes');
//vitor
const relatorioRoutes = require('./routes/relatorioRoutes');


const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.json({
        mensagem: 'API FoodControl funcionando!'
    });
});

app.use('/produtos', produtoRoutes);
app.use('/categorias', categoriaRoutes);
app.use('/estoque', estoqueRoutes);
app.use('/vendas', vendaRoutes);
app.use('/clientes', clientesRoutes);
app.use('/credito', creditoRoutes);
app.use('/auth', authRoutes);
//vitor
app.use('/relatorios', relatorioRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
