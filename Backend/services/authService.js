const crypto = require("crypto");
const authInfrastructure = require("../infrastructure/authInfrastructure");

const HASH_PREFIX = "pbkdf2";
const HASH_ITERATIONS = 100000;
const HASH_KEYLEN = 64;
const HASH_DIGEST = "sha512";

function normalizarTexto(valor = "") {
  return String(valor).trim();
}

function normalizarEmail(email = "") {
  return normalizarTexto(email).toLowerCase();
}

function normalizarUsuario(usuario = "") {
  return normalizarTexto(usuario).toLowerCase();
}

function sanitizeUser(usuario) {
  return {
    id: usuario.id_usuario,
    nome: usuario.nome,
    email: usuario.email,
    telefone: usuario.telefone || "",
    usuario: usuario.usuario,
    tipo: usuario.tipo || "usuario",
    ativo: Boolean(Number(usuario.ativo)),
    dataCadastro: usuario.data_cadastro,
  };
}

function hashPassword(senha) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .pbkdf2Sync(
      senha,
      salt,
      HASH_ITERATIONS,
      HASH_KEYLEN,
      HASH_DIGEST
    )
    .toString("hex");

  return `${HASH_PREFIX}$${HASH_ITERATIONS}$${salt}$${hash}`;
}

function verifyPassword(senha, armazenada) {
  if (!armazenada?.startsWith(`${HASH_PREFIX}$`)) {
    return senha === armazenada;
  }

  const [, iterations, salt, hash] = armazenada.split("$");
  const tentativa = crypto
    .pbkdf2Sync(
      senha,
      salt,
      Number(iterations),
      HASH_KEYLEN,
      HASH_DIGEST
    )
    .toString("hex");

  return crypto.timingSafeEqual(
    Buffer.from(hash, "hex"),
    Buffer.from(tentativa, "hex")
  );
}

function base64Url(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function decodeBase64Url(input) {
  const normalized = input
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(Math.ceil(input.length / 4) * 4, "=");

  return Buffer.from(normalized, "base64").toString("utf8");
}

function signToken(payload) {
  const secret =
    process.env.AUTH_SECRET || "foodcontrol-auth-secret";

  const header = base64Url(
    JSON.stringify({
      alg: "HS256",
      typ: "JWT",
    })
  );

  const body = base64Url(JSON.stringify(payload));
  const content = `${header}.${body}`;
  const signature = crypto
    .createHmac("sha256", secret)
    .update(content)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  return `${content}.${signature}`;
}

function verifyToken(token) {
  const secret =
    process.env.AUTH_SECRET || "foodcontrol-auth-secret";

  const [header, payload, signature] = token.split(".");

  if (!header || !payload || !signature) {
    throw new Error("Token inválido");
  }

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(`${header}.${payload}`)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  if (expectedSignature !== signature) {
    throw new Error("Token inválido");
  }

  const decoded = JSON.parse(decodeBase64Url(payload));

  if (decoded.exp && Date.now() > decoded.exp) {
    throw new Error("Sessão expirada");
  }

  return decoded;
}

function buildSession(usuario) {
  const safeUser = sanitizeUser(usuario);
  const payload = {
    sub: safeUser.id,
    nome: safeUser.nome,
    usuario: safeUser.usuario,
    tipo: safeUser.tipo,
    iat: Date.now(),
    exp: Date.now() + 1000 * 60 * 60 * 12,
  };

  return {
    token: signToken(payload),
    usuario: safeUser,
  };
}

async function validateNewUserPayload(payload) {
  const nome = normalizarTexto(payload.nome);
  const email = normalizarEmail(payload.email);
  const telefone = normalizarTexto(payload.telefone);
  const usuario = normalizarUsuario(payload.usuario);
  const senha = String(payload.senha || "");
  const tipo =
    payload.tipo === "admin" ? "admin" : "usuario";

  if (!nome || !email || !usuario || !senha) {
    throw new Error("Preencha nome, e-mail, usuário e senha");
  }

  if (senha.length < 4) {
    throw new Error("A senha deve ter pelo menos 4 caracteres");
  }

  if (await authInfrastructure.existsByEmailOrUsername(email, usuario)) {
    throw new Error("Esse usuário ou e-mail já está cadastrado");
  }

  return {
    nome,
    email,
    telefone,
    usuario,
    senha: hashPassword(senha),
    tipo,
    ativo: true,
  };
}

module.exports = {
  async setupStatus() {
    await authInfrastructure.ensureSchema();
    const totalUsuarios = await authInfrastructure.countUsers();

    return {
      possuiUsuarios: totalUsuarios > 0,
      totalUsuarios,
    };
  },

  async primeiroAcesso(payload) {
    await authInfrastructure.ensureSchema();

    if ((await authInfrastructure.countUsers()) > 0) {
      throw new Error("O primeiro acesso já foi configurado");
    }

    const novoUsuario = await validateNewUserPayload({
      ...payload,
      tipo: "admin",
    });

    const usuarioCriado = await authInfrastructure.createUser(
      novoUsuario
    );

    return {
      mensagem: "Primeiro administrador criado com sucesso",
      primeiroUsuario: true,
      ...buildSession(usuarioCriado),
    };
  },

  async cadastrarUsuario(payload, usuarioLogado) {
    await authInfrastructure.ensureSchema();

    if (!usuarioLogado || usuarioLogado.tipo !== "admin") {
      throw new Error("Apenas administradores podem criar usuários");
    }

    const novoUsuario = await validateNewUserPayload(payload);
    const usuarioCriado = await authInfrastructure.createUser(
      novoUsuario
    );

    return {
      mensagem: "Usuário cadastrado com sucesso",
      usuario: sanitizeUser(usuarioCriado),
    };
  },

  async login({ identificador, senha }) {
    await authInfrastructure.ensureSchema();

    const login = normalizarUsuario(identificador);
    const senhaDigitada = String(senha || "");

    if (!login || !senhaDigitada) {
      throw new Error("Informe usuário/e-mail e senha");
    }

    const usuario = await authInfrastructure.findByIdentifier(login);

    if (!usuario || !verifyPassword(senhaDigitada, usuario.senha)) {
      throw new Error("Usuário ou senha incorretos");
    }

    if (!Boolean(Number(usuario.ativo))) {
      throw new Error("Usuário inativo");
    }

    return {
      mensagem: "Login realizado com sucesso",
      ...buildSession(usuario),
    };
  },

  async me(idUsuario) {
    await authInfrastructure.ensureSchema();
    const usuario = await authInfrastructure.findById(idUsuario);

    if (!usuario) {
      throw new Error("Usuário não encontrado");
    }

    return sanitizeUser(usuario);
  },

  verifyToken,
};
