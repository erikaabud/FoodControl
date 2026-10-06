import { useEffect, useState } from "react";

import {
  useNavigate,
} from "react-router-dom";

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

export default function CadastroUsuario() {
  const [nome, setNome] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [telefone, setTelefone] =
    useState("");

  const [usuario, setUsuario] =
    useState("");

  const [senha, setSenha] =
    useState("");

  const [
    confirmarSenha,
    setConfirmarSenha,
  ] = useState("");

  const [
    mostrarSenha,
    setMostrarSenha,
  ] = useState(false);

  const [erro, setErro] =
    useState("");

  const [sucesso, setSucesso] =
    useState("");

  const [tipo, setTipo] =
    useState("usuario");

  const [salvando, setSalvando] =
    useState(false);

  const [setupStatus, setSetupStatus] =
    useState({
      carregando: true,
      possuiUsuarios: true,
    });

  const navigate =
    useNavigate();

  const usuarioLogado =
    JSON.parse(
      localStorage.getItem(
        "usuarioLogado"
      ) || "null"
    );

  const ehAdministrador =
    usuarioLogado?.tipo ===
    "admin";

  const cadastroPublico =
    !setupStatus.possuiUsuarios;

  useEffect(() => {
    async function carregarSetup() {
      try {
        const dados =
          await authService.setupStatus();

        setSetupStatus({
          carregando: false,
          possuiUsuarios:
            dados.possuiUsuarios,
        });
      } catch (error) {
        setSetupStatus({
          carregando: false,
          possuiUsuarios: true,
        });
        setErro(
          "Nao foi possivel verificar o status inicial do sistema."
        );
      }
    }

    carregarSetup();
  }, []);

  useEffect(() => {
    if (
      !setupStatus.carregando &&
      !cadastroPublico &&
      !ehAdministrador
    ) {
      navigate("/login", {
        replace: true,
      });
    }
  }, [
    cadastroPublico,
    ehAdministrador,
    navigate,
    setupStatus.carregando,
  ]);

  if (
    setupStatus.carregando ||
    (!cadastroPublico &&
      !ehAdministrador)
  ) {
    return null;
  }

  function limparFormulario() {
    setNome("");
    setEmail("");
    setTelefone("");
    setUsuario("");
    setSenha("");
    setConfirmarSenha("");
    setTipo("usuario");
  }

  async function cadastrar(event) {
    event.preventDefault();
    setErro("");
    setSucesso("");

    if (
      senha !== confirmarSenha
    ) {
      setErro(
        "As senhas não coincidem."
      );
      return;
    }

    try {
      setSalvando(true);

      const payload = {
        nome,
        email,
        telefone,
        usuario,
        senha,
        tipo,
      };

      if (cadastroPublico) {
        const resposta =
          await authService.primeiroAcesso(
            payload
          );

        localStorage.setItem(
          "token",
          resposta.token
        );

        localStorage.setItem(
          "usuarioLogado",
          JSON.stringify(
            resposta.usuario
          )
        );

        navigate("/venda");
        return;
      }

      await authService.cadastrarUsuario(
        payload
      );

      limparFormulario();
      setSucesso(
        "Usuario cadastrado com sucesso no banco de dados."
      );
    } catch (error) {
      setErro(error.message);
    } finally {
      setSalvando(false);
    }
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
            <label className="user-register-field user-register-full">
              <span className="user-register-label">
                Nome completo <b>*</b>
              </span>

              <span className="user-register-input">
                <UserRound
                  size={20}
                />

                <input
                  type="text"
                  value={nome}
                  onChange={(event) =>
                    setNome(
                      event.target.value
                    )
                  }
                  placeholder="Digite o nome completo"
                  required
                />
              </span>
            </label>

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
                    setEmail(
                      event.target.value
                    )
                  }
                  placeholder="Digite o e-mail"
                  required
                />
              </span>
            </label>

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
                      event.target.value
                    )
                  }
                  placeholder="(11) 91234-5678"
                />
              </span>
            </label>

            <label className="user-register-field">
              <span className="user-register-label">
                Nome de usuário <b>*</b>
              </span>

              <span className="user-register-input">
                <UserRound
                  size={20}
                />

                <input
                  type="text"
                  value={usuario}
                  onChange={(event) =>
                    setUsuario(
                      event.target.value
                    )
                  }
                  placeholder="Escolha um nome de usuário"
                  required
                />
              </span>
            </label>

            {!cadastroPublico && (
              <label className="user-register-field">
                <span className="user-register-label">
                  Perfil <b>*</b>
                </span>

                <span className="user-register-input">
                  <select
                    value={tipo}
                    onChange={(event) =>
                      setTipo(
                        event.target.value
                      )
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

            <label className="user-register-field">
              <span className="user-register-label">
                Senha <b>*</b>
              </span>

              <span className="user-register-input">
                <LockKeyhole
                  size={20}
                />

                <input
                  type={
                    mostrarSenha
                      ? "text"
                      : "password"
                  }
                  value={senha}
                  onChange={(event) =>
                    setSenha(
                      event.target.value
                    )
                  }
                  placeholder="Digite a senha"
                  minLength={4}
                  required
                />

                <button
                  type="button"
                  onClick={() =>
                    setMostrarSenha(
                      !mostrarSenha
                    )
                  }
                  aria-label="Mostrar ou ocultar senha"
                >
                  {mostrarSenha ? (
                    <EyeOff
                      size={20}
                    />
                  ) : (
                    <Eye
                      size={20}
                    />
                  )}
                </button>
              </span>
            </label>

            <label className="user-register-field user-register-full">
              <span className="user-register-label">
                Confirmar senha <b>*</b>
              </span>

              <span className="user-register-input">
                <LockKeyhole
                  size={20}
                />

                <input
                  type={
                    mostrarSenha
                      ? "text"
                      : "password"
                  }
                  value={
                    confirmarSenha
                  }
                  onChange={(event) =>
                    setConfirmarSenha(
                      event.target.value
                    )
                  }
                  placeholder="Confirme a senha"
                  minLength={4}
                  required
                />
              </span>
            </label>
          </div>

          {erro && (
            <p className="user-register-error">
              {erro}
            </p>
          )}

          {sucesso && (
            <p className="form-message success">
              {sucesso}
            </p>
          )}

          <button
            className="user-register-submit"
            type="submit"
            disabled={salvando}
          >
            {salvando
              ? "Salvando..."
              : cadastroPublico
                ? "Criar administrador"
                : "Criar usuário"}
            <ArrowRight
              size={20}
            />
          </button>

          <div className="user-register-login-bottom">
            <button
              type="button"
              onClick={() =>
                navigate(
                  cadastroPublico
                    ? "/login"
                    : "/venda"
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
    </main>
  );
}
