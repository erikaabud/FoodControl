import api from "./api";

const categoriaService = {
  listarCategorias() {
    return api.get("/categorias");
  },
};

export default categoriaService;
