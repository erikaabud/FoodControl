import {
    CheckCircle,
    XCircle,
    AlertTriangle,
    Info,
  } from "lucide-react";
  
  import "./ModalAviso.css";
  
  export default function ModalAviso({
    aberto,
    tipo = "sucesso",
    titulo,
    mensagem,
    onFechar,
  }) {
    if (!aberto) {
      return null;
    }
  
    const configuracoes = {
      sucesso: {
        icone: <CheckCircle size={48} />,
        titulo: "Sucesso!",
      },
      erro: {
        icone: <XCircle size={48} />,
        titulo: "Erro",
      },
      aviso: {
        icone: <AlertTriangle size={48} />,
        titulo: "Atenção",
      },
      info: {
        icone: <Info size={48} />,
        titulo: "Informação",
      },
    };
  
    const configuracao =
      configuracoes[tipo] || configuracoes.info;
  
    function clicarFora(event) {
      if (event.target === event.currentTarget) {
        onFechar();
      }
    }
  
    return (
      <div
        className="modal-aviso-overlay"
        onClick={clicarFora}
      >
        <div
          className={`modal-aviso modal-${tipo}`}
        >
          <div className="modal-aviso-icone">
            {configuracao.icone}
          </div>
  
          <h2>
            {titulo || configuracao.titulo}
          </h2>
  
          <p>{mensagem}</p>
  
          <button
            type="button"
            className="modal-aviso-botao"
            onClick={onFechar}
          >
            OK
          </button>
        </div>
      </div>
    );
  }