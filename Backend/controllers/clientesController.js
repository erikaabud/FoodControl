const clientesService = require("../services/clientesService");

class ClientesController {
    async listarClientes(req, res) {
        try {
            const clientes = await clientesService.listarClientes();

            return res.status(200).json(clientes);
        } catch (error) {
            return res.status(500).json({
                mensagem: error.message,
            });
        }
    }

    async buscarClientePorID(req, res) {
        try {
            const cliente = await clientesService.buscarClientePorID(
                req.params.id
            );

            return res.status(200).json(cliente);
        } catch (error) {
            return res.status(404).json({
                mensagem: error.message,
            });
        }
    }

    async cadastrarCliente(req, res) {
        try {
            const resultado = await clientesService.cadastrarCliente(
                req.body
            );

            return res.status(201).json({
                mensagem: "Cliente cadastrado com sucesso!",
                ...resultado,
            });
        } catch (error) {
            return res.status(400).json({
                mensagem: error.message,
            });
        }
    }

    async atualizarCliente(req, res) {
        try {
            const resultado = await clientesService.atualizarCliente(
                req.params.id,
                req.body
            );

            return res.status(200).json(resultado);
        } catch (error) {
            return res.status(400).json({
                mensagem: error.message,
            });
        }
    }

    async alterarStatusCliente(req, res) {
        try {
            const resultado =
                await clientesService.alterarStatusCliente(
                    req.params.id,
                    req.body.ativo
                );

            return res.status(200).json(resultado);
        } catch (error) {
            return res.status(400).json({
                mensagem: error.message,
            });
        }
    }

    async excluirCliente(req, res) {
        try {
            const resultado = await clientesService.excluirCliente(
                req.params.id
            );

            return res.status(200).json(resultado);
        } catch (error) {
            return res.status(400).json({
                mensagem: error.message,
            });
        }
    }
}

module.exports = new ClientesController();