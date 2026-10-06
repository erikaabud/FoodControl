import api from "./api";

const authService = {
  setupStatus() {
    return api.get("/auth/setup-status");
  },

  login(identificador, senha) {
    return api.post("/auth/login", {
      identificador,
      senha,
    });
  },

  primeiroAcesso(payload) {
    return api.post("/auth/primeiro-acesso", payload);
  },

  cadastrarUsuario(payload) {
    return api.post("/auth/usuarios", payload);
  },

  me() {
    return api.get("/auth/me");
  },
};

export default authService;
