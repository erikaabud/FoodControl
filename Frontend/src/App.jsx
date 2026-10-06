import { Routes, Route, Navigate } from "react-router-dom";

import Layout from "./components/Layout";
import Venda from "./pages/Venda";
import Produtos from "./pages/Produtos";
import Estoque from "./pages/Estoque";
import Cadastrar from "./pages/CadastrarCliente";
import CreditoAluno from "./pages/CreditoAluno";
import Lista from "./pages/ListaClientes";
import Relatorios from "./pages/Relatorios";
import Login from "./pages/Login";
import CadastroUsuario from "./pages/CadastroUsuario";

export default function App() {
  return (
    <Routes>
      {/* Login separado, sem menu lateral e sem barra superior */}
      <Route path="/login" element={<Login />} />
      <Route path="/cadastro-usuario" element={<CadastroUsuario />} />

      {/* Páginas que utilizam o Layout */}
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/login" replace />} />

        <Route path="/venda" element={<Venda />} />
        <Route path="/produtos" element={<Produtos />} />
        <Route path="/estoque" element={<Estoque />} />
        <Route path="/alunos/cadastrar" element={<Cadastrar />} />
        <Route path="/alunos/credito" element={<CreditoAluno />} />
        <Route path="/alunos/lista" element={<Lista />} />
        <Route path="/relatorios" element={<Relatorios />} />
      </Route>

      {/* Endereço inexistente volta para o login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
