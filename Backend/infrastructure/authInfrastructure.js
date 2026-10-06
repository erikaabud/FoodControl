const { pool } = require("../config/db");

async function ensureSchema() {
  const [columns] = await pool.query(
    "SHOW COLUMNS FROM Usuario LIKE 'tipo'"
  );

  if (columns.length === 0) {
    await pool.query(
      "ALTER TABLE Usuario ADD COLUMN tipo VARCHAR(20) NOT NULL DEFAULT 'usuario' AFTER senha"
    );
  }
}

async function countUsers() {
  const [rows] = await pool.query(
    "SELECT COUNT(*) AS total FROM Usuario"
  );

  return Number(rows[0].total || 0);
}

async function findByIdentifier(identificador) {
  const [rows] = await pool.query(
    `
      SELECT
        id_usuario,
        nome,
        email,
        telefone,
        usuario,
        senha,
        tipo,
        ativo,
        data_cadastro
      FROM Usuario
      WHERE usuario = ? OR email = ?
      LIMIT 1
    `,
    [identificador, identificador]
  );

  return rows[0] || null;
}

async function findById(idUsuario) {
  const [rows] = await pool.query(
    `
      SELECT
        id_usuario,
        nome,
        email,
        telefone,
        usuario,
        tipo,
        ativo,
        data_cadastro
      FROM Usuario
      WHERE id_usuario = ?
      LIMIT 1
    `,
    [idUsuario]
  );

  return rows[0] || null;
}

async function existsByEmailOrUsername(email, usuario) {
  const [rows] = await pool.query(
    `
      SELECT id_usuario
      FROM Usuario
      WHERE email = ? OR usuario = ?
      LIMIT 1
    `,
    [email, usuario]
  );

  return rows.length > 0;
}

async function createUser(usuario) {
  const [result] = await pool.query(
    `
      INSERT INTO Usuario
      (nome, email, telefone, usuario, senha, tipo, ativo)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    [
      usuario.nome,
      usuario.email,
      usuario.telefone,
      usuario.usuario,
      usuario.senha,
      usuario.tipo,
      usuario.ativo,
    ]
  );

  return findById(result.insertId);
}

module.exports = {
  ensureSchema,
  countUsers,
  findByIdentifier,
  findById,
  existsByEmailOrUsername,
  createUser,
};
