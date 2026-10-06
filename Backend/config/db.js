const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'foodControl',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

async function testConnection() {
  try {

      const connection = await pool.getConnection();

      console.log("Conexão bem-sucedida ao banco de dados!");

      connection.release();

  } catch (error) {

      console.error(
          "Erro ao conectar ao banco de dados:",
          error.message
      );

  }
}

testConnection();

module.exports = {pool};