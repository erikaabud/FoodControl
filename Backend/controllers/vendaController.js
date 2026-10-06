const vendaService = require('../services/vendaService');

class VendaController {
    async listar(req, res) {
        try {
            return res.status(200).json(await vendaService.listarVendas());
        } catch (error) {
            return res.status(500).json({ mensagem: error.message });
        }
    }

    async buscarPorID(req, res) {
        try {
            return res.status(200).json(await vendaService.buscarVendaPorID(req.params.id));
        } catch (error) {
            return res.status(404).json({ mensagem: error.message });
        }
    }

    async formasPagamento(req, res) {
        try {
            return res.status(200).json(await vendaService.listarFormasPagamento());
        } catch (error) {
            return res.status(500).json({ mensagem: error.message });
        }
    }

    async criar(req, res) {
        try {
            const venda = await vendaService.criarVenda(req.body);
            return res.status(201).json({ mensagem: 'Venda finalizada com sucesso!', venda });
        } catch (error) {
            return res.status(400).json({ mensagem: error.message });
        }
    }

    async cancelar(req, res) {
        try {
            const mensagem = await vendaService.cancelarVenda(req.params.id, req.body?.id_usuario);
            return res.status(200).json({ mensagem });
        } catch (error) {
            return res.status(400).json({ mensagem: error.message });
        }
    }
}

module.exports = new VendaController();
