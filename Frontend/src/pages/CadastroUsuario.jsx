
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  UserRound,
  Mail,
  Phone,
  LockKeyhole,
  Eye,
  EyeOff,
  ArrowRight,
} from "lucide-react";

import "./CadastroUsuario.css";
import authService from "../../services/authService";
import ModalAviso from "../components/ModalAviso";

// Máscara automática para telefone fixo e celular.
function mascaraTelefone(valor) {
  const numeros = String(valor ?? "")
    .replace(/\D/g, "")
    .slice(0, 11);

  if (numeros.length === 0) return "";

  if (numeros.length <= 2) {
    return `(${numeros}`;
  }

  if (numeros.length <= 6) {
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`;
  }

  if (numeros.length <= 10) {
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 6)}-${numeros.slice(6)}`;
  }

  return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7)}`;
}

function telefoneValido(valor) {
  const numeros = String(valor ?? "").replace(/\D/g, "");
  return numeros.length === 10 || numeros.length === 11;
}

export default function CadastroUsuario() {
  const navigate = useNavigate();

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState("");
  const [tipo, setTipo] = useState("usuario");
  const [salvando, setSalvando] = useState(false);

  // Controla a exibição do modal de sucesso.
  const [modalSucesso, setModalSucesso] = useState(false);

  const [setupStatus, setSetupStatus] = useState({
    carregando: true,
    possuiUsuarios: true,
  });

  // Recupera o usuário autenticado.
  let usuarioLogado = null;

  try {
    usuarioLogado = JSON.parse(
      localStorage.getItem("usuarioLogado") || "null"
    );
  } catch {
    usuarioLogado = null;
  }

  const ehAdministrador = usuarioLogado?.tipo === "admin";
  const cadastroPublico = !setupStatus.possuiUsuarios;

  // Verifica se é o primeiro acesso ao sistema.
  useEffect(() => {
    let ativo = true;

    async function carregarSetup() {
      try {
        const dados = await authService.setupStatus();

        if (!ativo) return;

        setSetupStatus({
          carregando: false,
          possuiUsuarios: dados.possuiUsuarios,
        });
      } catch {
        if (!ativo) return;

        setSetupStatus({
          carregando: false,
          possuiUsuarios: true,
        });

        setErro(
          "Não foi possível verificar o status inicial do sistema."
        );
      }
    }

    carregarSetup();

    return () => {
      ativo = false;
    };
  }, []);

  // Impede acesso não autorizado à tela de cadastro.
  useEffect(() => {
    if (
      !setupStatus.carregando &&
      !cadastroPublico &&
      !ehAdministrador &&
      !modalSucesso
    ) {
      navigate("/login", { replace: true });
    }
  }, [
    cadastroPublico,
    ehAdministrador,
    navigate,
    setupStatus.carregando,
    modalSucesso,
  ]);

  // Fecha o modal e direciona para o login.
  function confirmarCadastro() {
    setModalSucesso(false);

    // Encerra a sessão atual para exigir novo login.
    localStorage.removeItem("token");
    localStorage.removeItem("usuarioLogado");

    navigate("/login", { replace: true });
  }

  // Realiza o cadastro do usuário.
  async function cadastrar(event) {
    event.preventDefault();

    if (salvando || modalSucesso) return;

    setErro("");

    // Validação das senhas.
    if (senha !== confirmarSenha) {
      setErro("As senhas não coincidem.");
      return;
    }

    // Validação do telefone, caso preenchido.
    if (telefone.trim() && !telefoneValido(telefone)) {
      setErro(
        "Informe um telefone válido com DDD e 10 ou 11 dígitos."
      );
      return;
    }

    try {
      setSalvando(true);

      const payload = {
        nome: nome.trim(),
        email: email.trim(),
        telefone,
        usuario: usuario.trim(),
        senha,
        tipo: cadastroPublico ? "admin" : tipo,
      };

      if (cadastroPublico) {
        // Cadastro do primeiro administrador.
        await authService.primeiroAcesso(payload);
      } else {
        // Cadastro de usuários pelo administrador.
        await authService.cadastrarUsuario(payload);
      }

      // Exibe o modal somente após o cadastro ter sucesso.
      setModalSucesso(true);
    } catch (error) {
      setErro(
        error?.message ||
          "Não foi possível cadastrar o usuário. Tente novamente."
      );
    } finally {
      setSalvando(false);
    }
  }

  if (
    setupStatus.carregando ||
    (!cadastroPublico && !ehAdministrador && !modalSucesso)
  ) {
    return null;
  }

  return (
    <main className="user-register-page">
      <aside className="user-register-panel">
        <div className="user-register-panel-content">
          <h1>
            Food<span>Control</span>
          </h1>

          <div className="user-register-line"></div>

          <p>
            Mais organização
            <br />
            para a sua cantina.
          </p>
        </div>

        <div className="user-register-message">
          Comida boa gera grandes histórias!
        </div>
      </aside>

      <section className="user-register-content">
        <form
          className="user-register-card"
          onSubmit={cadastrar}
        >
          <header className="user-register-header">
            <h2>
              Food<span>Control</span>
            </h2>

            <div className="user-register-title-line"></div>

            <h3>
              {cadastroPublico
                ? "Primeiro acesso"
                : "Criar novo usuário"}
            </h3>

            <p>
              {cadastroPublico
                ? "Cadastre o primeiro administrador para liberar o sistema."
                : "Cadastre um novo usuário para acessar o sistema."}
            </p>
          </header>

          <div className="user-register-grid">
            {/* Nome completo */}
            <label className="user-register-field user-register-full">
              <span className="user-register-label">
                Nome completo <b>*</b>
              </span>

              <span className="user-register-input">
                <UserRound size={20} />

                <input
                  type="text"
                  value={nome}
                  onChange={(event) =>
                    setNome(event.target.value)
                  }
                  placeholder="Digite o nome completo"
                  autoComplete="name"
                  required
                />
              </span>
            </label>

            {/* E-mail */}
            <label className="user-register-field">
              <span className="user-register-label">
                E-mail <b>*</b>
              </span>

              <span className="user-register-input">
                <Mail size={20} />

                <input
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  placeholder="Digite o e-mail"
                  autoComplete="email"
                  required
                />
              </span>
            </label>

            {/* Telefone com máscara automática */}
            <label className="user-register-field">
              <span className="user-register-label">
                Telefone (opcional)
              </span>

              <span className="user-register-input">
                <Phone size={20} />

                <input
                  type="tel"
                  value={telefone}
                  onChange={(event) =>
                    setTelefone(
                      mascaraTelefone(event.target.value)
                    )
                  }
                  placeholder="(11) 91234-5678"
                  maxLength={15}
                  inputMode="numeric"
                  autoComplete="tel"
                />
              </span>
            </label>

            {/* Nome de usuário */}
            <label className="user-register-field">
              <span className="user-register-label">
                Nome de usuário <b>*</b>
              </span>

              <span className="user-register-input">
                <UserRound size={20} />

                <input
                  type="text"
                  value={usuario}
                  onChange={(event) =>
                    setUsuario(event.target.value)
                  }
                  placeholder="Escolha um nome de usuário"
                  autoComplete="username"
                  required
                />
              </span>
            </label>

            {/* Perfil de acesso */}
            {!cadastroPublico && (
              <label className="user-register-field">
                <span className="user-register-label">
                  Perfil <b>*</b>
                </span>

                <span className="user-register-input">
                  <select
                    value={tipo}
                    onChange={(event) =>
                      setTipo(event.target.value)
                    }
                  >
                    <option value="usuario">
                      Usuário
                    </option>
                    <option value="admin">
                      Administrador
                    </option>
                  </select>
                </span>
              </label>
            )}

            {/* Senha */}
            <label className="user-register-field">
              <span className="user-register-label">
                Senha <b>*</b>
              </span>

              <span className="user-register-input">
                <LockKeyhole size={20} />

                <input
                  type={mostrarSenha ? "text" : "password"}
                  value={senha}
                  onChange={(event) =>
                    setSenha(event.target.value)
                  }
                  placeholder="Digite a senha"
                  minLength={4}
                  autoComplete="new-password"
                  required
                />

                <button
                  type="button"
                  onClick={() =>
                    setMostrarSenha(!mostrarSenha)
                  }
                  aria-label={
                    mostrarSenha
                      ? "Ocultar senha"
                      : "Mostrar senha"
                  }
                >
                  {mostrarSenha ? (
                    <EyeOff size={20} />
                  ) : (
                    <Eye size={20} />
                  )}
                </button>
              </span>
            </label>

            {/* Confirmar senha */}
            <label className="user-register-field user-register-full">
              <span className="user-register-label">
                Confirmar senha <b>*</b>
              </span>

              <span className="user-register-input">
                <LockKeyhole size={20} />

                <input
                  type={mostrarSenha ? "text" : "password"}
                  value={confirmarSenha}
                  onChange={(event) =>
                    setConfirmarSenha(event.target.value)
                  }
                  placeholder="Confirme a senha"
                  minLength={4}
                  autoComplete="new-password"
                  required
                />
              </span>
            </label>
          </div>

          {/* Mensagem de erro */}
          {erro && (
            <p className="user-register-error" role="alert">
              {erro}
            </p>
          )}

          {/* Botão de cadastro */}
          <button
            className="user-register-submit"
            type="submit"
            disabled={salvando || modalSucesso}
          >
            {salvando
              ? "Salvando..."
              : cadastroPublico
                ? "Criar administrador"
                : "Criar usuário"}

            <ArrowRight size={20} />
          </button>

          {/* Botão de retorno */}
          <div className="user-register-login-bottom">
            <button
              type="button"
              onClick={() =>
                navigate(
                  cadastroPublico ? "/login" : "/venda"
                )
              }
            >
              {cadastroPublico
                ? "Voltar ao login"
                : "Voltar ao sistema"}
            </button>
          </div>
        </form>
      </section>

      {/* Modal de cadastro realizado */}
      <ModalAviso
        aberto={modalSucesso}
        tipo="sucesso"
        titulo="Cadastro realizado!"
        mensagem="Usuário criado com sucesso!"
        onFechar={confirmarCadastro}
      />
    </main>
  );
}
