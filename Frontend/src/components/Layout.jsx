import { useState } from "react";
import ModalAviso from "./ModalAviso";

import {
  Outlet,
  NavLink,
  Navigate,
  useNavigate,
} from "react-router-dom";

import {
  ShoppingCart,
  Package,
  Boxes,
  Users,
  BarChart3,
  ChevronDown,
  UserPlus,
  LogOut,
} from "lucide-react";

const linkClass = ({ isActive }) =>
  `nav-link ${isActive ? "active" : ""}`;

export default function Layout() {
  const [clienteAberto, setClienteAberto] =
    useState(false);

  const [adminAberto, setAdminAberto] =
    useState(false);

  // NOVO: controla o modal de confirmação de saída
  const [modalSairAberto, setModalSairAberto] =
    useState(false);

  const navigate = useNavigate();

  const usuarioLogado = JSON.parse(
    localStorage.getItem("usuarioLogado") || "null"
  );

  const token =
    localStorage.getItem("token");

  if (!usuarioLogado || !token) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  const ehAdministrador =
    usuarioLogado.tipo === "admin";

  const nomeUsuario =
    usuarioLogado.nome ||
    usuarioLogado.usuario ||
    "Usuário";

  const inicial =
    nomeUsuario
      .charAt(0)
      .toUpperCase();

  // Abre o modal ao invés do window.confirm
  function sair() {
    setAdminAberto(false);
    setModalSairAberto(true);
  }

  // Só faz logout quando o usuário confirmar
  function confirmarSaida() {
    localStorage.removeItem(
      "usuarioLogado"
    );

    localStorage.removeItem(
      "token"
    );

    setModalSairAberto(false);

    navigate(
      "/login",
      {
        replace: true,
      }
    );
  }


  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          Food<span>Control</span>
        </div>

        <nav>
          <NavLink
            to="/venda"
            className={linkClass}
          >
            <ShoppingCart />
            Venda
          </NavLink>

          <NavLink
            to="/produtos"
            className={linkClass}
          >
            <Package />
            Produto
          </NavLink>

          <NavLink
            to="/estoque"
            className={linkClass}
          >
            <Boxes />
            Estoque
          </NavLink>

          <div className="nav-group">
            <button
              type="button"
              className="nav-group-title"
              onClick={() =>
                setClienteAberto(
                  !clienteAberto
                )
              }
              aria-expanded={
                clienteAberto
              }
            >
              <span className="nav-group-label">
                <Users />
                Cliente
              </span>

              <ChevronDown
                size={15}
                className={`chevron ${clienteAberto
                    ? "chevron-open"
                    : ""
                  }`}
              />
            </button>

            {clienteAberto && (
              <div className="nav-submenu">
                <NavLink
                  to="/alunos/cadastrar"
                  className={linkClass}
                >
                  Cadastrar Cliente
                </NavLink>

                <NavLink
                  to="/alunos/credito"
                  className={linkClass}
                >
                  Crédito do Aluno
                </NavLink>

                <NavLink
                  to="/alunos/lista"
                  className={linkClass}
                >
                  Lista de Clientes
                </NavLink>
              </div>
            )}
          </div>

          <NavLink
            to="/relatorios"
            className={linkClass}
          >
            <BarChart3 />
            Relatório
          </NavLink>
        </nav>

        <div className="sidebar-wave"></div>

        <p className="sidebar-quote">
          Comida boa
          <br />
          gera grandes
          <br />
          histórias!
        </p>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="admin-wrapper">
            <button
              type="button"
              className="admin"
              onClick={() =>
                setAdminAberto(
                  !adminAberto
                )
              }
              aria-expanded={
                adminAberto
              }
            >
              <div className="avatar">
                {inicial}
              </div>

              <div className="admin-info">
                <b>
                  {nomeUsuario}
                </b>

                <small>
                  {ehAdministrador
                    ? "Administrador"
                    : "Usuário"}
                </small>
              </div>

              <ChevronDown
                size={16}
                className={`admin-chevron ${adminAberto
                    ? "aberto"
                    : ""
                  }`}
              />
            </button>

            {adminAberto && (
              <div className="admin-menu">
                {ehAdministrador && (
                  <button
                    type="button"
                    onClick={() => {
                      setAdminAberto(
                        false
                      );

                      navigate(
                        "/cadastro-usuario"
                      );
                    }}
                  >
                    <UserPlus
                      size={17}
                    />
                    Criar usuário
                  </button>
                )}

                <button
                  type="button"
                  className="logout-option"
                  onClick={sair}
                >
                  <LogOut
                    size={17}
                  />
                  Sair
                </button>
              </div>
            )}
          </div>
        </header>

        <div className="page">
          <Outlet />
        </div>
      </main>

      {/* MODAL DE CONFIRMAÇÃO DE SAÍDA */}
      <ModalAviso
        aberto={modalSairAberto}
        tipo="aviso"
        titulo="Sair do sistema"
        mensagem="Deseja realmente sair do sistema?"
        onFechar={() =>
          setModalSairAberto(false)
        }
        onConfirmar={confirmarSaida}
        textoConfirmar="Sair"
        textoCancelar="Cancelar"
      />
    </div>
  );
}