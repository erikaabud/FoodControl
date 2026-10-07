import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  UserRound,
  LockKeyhole,
  Eye,
  EyeOff,
  ArrowRight,
  UserPlus,
  Package,
  ShoppingCart,
  ChartNoAxesColumnIncreasing,
} from "lucide-react";

import authService from "../../services/authService";
import "./Login.css";

export default function Login() {
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  const [setup, setSetup] = useState({
    carregando: true,
    possuiUsuarios: true,
  });

  const navigate = useNavigate();

  useEffect(() => {
    async function carregarSetup() {
      try {
        const dados = await authService.setupStatus();

        setSetup({
          carregando: false,
          possuiUsuarios: dados.possuiUsuarios,
        });
      } catch (error) {
        setSetup({
          carregando: false,
          possuiUsuarios: true,
        });

        setErro(
          "Não foi possível verificar a configuração inicial do sistema."
        );
      }
    }

    carregarSetup();
  }, []);

  async function entrar(event) {
    event.preventDefault();

    setCarregando(true);

    try {
      const resposta = await authService.login(
        usuario.trim(),
        senha
      );

      localStorage.setItem("token", resposta.token);

      localStorage.setItem(
        "usuarioLogado",
        JSON.stringify(resposta.usuario)
      );

      setErro("");

      navigate("/venda");
    } catch (error) {
      setErro(error.message);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main className="login-page">

      {/* ===============================
          LADO ESQUERDO
      =============================== */}

      <section className="login-brand">

        {/* Ondas decorativas */}
        <div className="login-wave login-wave-top"></div>
        <div className="login-wave login-wave-middle"></div>
        <div className="login-wave login-wave-bottom"></div>

        <div className="login-brand-wrapper">

          {/* Marca */}
          <div className="login-brand-header">

            <h1>
              Food<span>Control</span>
            </h1>

            <div className="login-brand-line"></div>

            <p>
              Mais organização
              <br />
              para a sua cantina.
            </p>

          </div>

          {/* Benefícios */}
          <div className="login-features">

            <div className="login-feature">

              <div className="login-feature-icon">
                <Package size={29} />
              </div>

              <div>
                <strong>
                  Controle de estoque
                </strong>

                <span>
                  Saiba sempre o que tem disponível.
                </span>
              </div>

            </div>

            <div className="login-feature">

              <div className="login-feature-icon">
                <ShoppingCart size={29} />
              </div>

              <div>
                <strong>
                  Vendas mais ágeis
                </strong>

                <span>
                  Atendimento prático e eficiente.
                </span>
              </div>

            </div>

            <div className="login-feature">

              <div className="login-feature-icon">
                <ChartNoAxesColumnIncreasing size={29} />
              </div>

              <div>
                <strong>
                  Relatórios completos
                </strong>

                <span>
                  Acompanhe seus resultados.
                </span>
              </div>

            </div>

          </div>

          {/* Frase inferior */}
          <div className="login-brand-footer">

            <div className="login-footer-line"></div>

            <p>
              Comida bem gerida,
              <br />
              dias melhores.
            </p>

          </div>

        </div>

      </section>

      {/* ===============================
          LADO DIREITO
      =============================== */}

      <section className="login-area">

        <div className="login-background-circle circle-one"></div>
        <div className="login-background-circle circle-two"></div>

        <div className="login-card">

          {/* Cabeçalho */}

          <div className="login-card-header">

            <h2>
              Food<span>Control</span>
            </h2>

            <div className="login-title-line"></div>

            <p>
              Acesse sua conta
            </p>

          </div>

          {/* Formulário */}

          <form onSubmit={entrar}>

            <div className="form-group">

              <label htmlFor="usuario">
                Usuário
              </label>

              <div className="input-container">

                <UserRound size={24} />

                <input
                  id="usuario"
                  type="text"
                  value={usuario}
                  onChange={(event) =>
                    setUsuario(event.target.value)
                  }
                  placeholder="Digite seu usuário"
                  autoComplete="username"
                  required
                />

              </div>

            </div>

            <div className="form-group">

              <label htmlFor="senha">
                Senha
              </label>

              <div className="input-container">

                <LockKeyhole size={24} />

                <input
                  id="senha"
                  type={
                    mostrarSenha
                      ? "text"
                      : "password"
                  }
                  value={senha}
                  onChange={(event) =>
                    setSenha(event.target.value)
                  }
                  placeholder="Digite sua senha"
                  autoComplete="current-password"
                  required
                />

                <button
                  className="show-password"
                  type="button"
                  onClick={() =>
                    setMostrarSenha(
                      (estado) => !estado
                    )
                  }
                  aria-label={
                    mostrarSenha
                      ? "Ocultar senha"
                      : "Mostrar senha"
                  }
                >
                  {mostrarSenha ? (
                    <EyeOff size={22} />
                  ) : (
                    <Eye size={22} />
                  )}
                </button>

              </div>

            </div>

            {/* Erro */}

            {erro && (
              <p className="login-error">
                {erro}
              </p>
            )}

            {/* Entrar */}

            <button
              className="login-button"
              type="submit"
              disabled={carregando}
            >

              <span>
                {carregando
                  ? "Entrando..."
                  : "Entrar"}
              </span>

              {!carregando && (
                <ArrowRight size={24} />
              )}

            </button>

            {/* Primeiro acesso */}

            {!setup.carregando &&
              !setup.possuiUsuarios && (
                <>

                  <div className="login-divider">
                    <span></span>
                    <p>ou</p>
                    <span></span>
                  </div>

                  <button
                    className="login-create-button"
                    type="button"
                    onClick={() =>
                      navigate("/cadastro-usuario")
                    }
                  >
                    <UserPlus size={21} />

                    Criar usuário
                  </button>

                </>
              )}

          </form>

        </div>

      </section>

    </main>
  );
}