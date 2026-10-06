import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  UserRound,
  LockKeyhole,
  Eye,
  EyeOff,
  ArrowRight,
  UserPlus,
} from "lucide-react";
import authService from "../../services/authService";

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
          "Nao foi possivel verificar a configuracao inicial do sistema."
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
                setUsuario(
                  event.target.value
                )
              }
              placeholder="Digite seu usuário"
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
                setSenha(
                  event.target.value
                )
              }
              placeholder="Digite sua senha"
              required
            />

            <button
              className="show-password"
              type="button"
              onClick={() =>
                setMostrarSenha(
                  !mostrarSenha
                )
              }
            >
              {mostrarSenha ? (
                <EyeOff size={24} />
              ) : (
                <Eye size={24} />
              )}
            </button>
          </div>
        </div>

        {erro && (
          <p className="login-error">
            {erro}
          </p>
        )}

        {!setup.carregando &&
          !setup.possuiUsuarios && (
            <button
              className="login-button secondary"
              type="button"
              onClick={() =>
                navigate("/cadastro-usuario")
              }
            >
              Primeiro acesso
              <UserPlus size={22} />
            </button>
          )}

        <button
          className="login-button"
          type="submit"
          disabled={carregando}
        >
          {carregando ? "Entrando..." : "Entrar"}
          <ArrowRight size={25} />
        </button>
      </form>
    </main>
  );
}
