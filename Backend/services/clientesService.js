const clientesInfrastructure =
    require("../infrastructure/clientesInfrastructure");

const Cliente =
    require("../models/entidades/cliente");

class ClientesService {
    normalizarTipo(tipo) {
        const tipos = {
            aluno: "Aluno",
            professor: "Professor",
            funcionario: "Funcionário",
            funcionário: "Funcionário",
            visitante: "Visitante",
        };

        return tipos[
            String(tipo)
                .trim()
                .toLowerCase()
        ];
    }

    async listarClientes() {
        try {
            return await clientesInfrastructure
                .listarClientes();
        } catch (error) {
            throw new Error(
                `Erro ao listar clientes: ${error.message}`
            );
        }
    }

    async buscarClientePorID(id) {
        try {
            const cliente =
                await clientesInfrastructure
                    .buscarClientePorID(id);

            if (!cliente) {
                throw new Error(
                    `Cliente com ID ${id} não encontrado.`
                );
            }

            return cliente;
        } catch (error) {
            throw new Error(
                `Erro ao buscar cliente: ${error.message}`
            );
        }
    }

    async cadastrarCliente(dados) {
        try {
            const tipoCliente =
                this.normalizarTipo(
                    dados.tipo_cliente ||
                    dados.tipoCliente
                );

            if (!dados.nome?.trim()) {
                throw new Error(
                    "O nome do cliente é obrigatório."
                );
            }

            if (!tipoCliente) {
                throw new Error(
                    "Tipo de cliente inválido."
                );
            }

            if (
                tipoCliente === "Aluno" &&
                !(
                    dados.matricula ||
                    dados.ra
                )?.trim()
            ) {
                throw new Error(
                    "O RA do aluno é obrigatório."
                );
            }

            if (
                tipoCliente === "Aluno" &&
                !dados.responsavel?.trim()
            ) {
                throw new Error(
                    "O responsável do aluno é obrigatório."
                );
            }

            const matricula =
                dados.matricula ||
                dados.ra;

            if (tipoCliente === "Aluno") {
                const alunoExistente =
                    await clientesInfrastructure
                        .buscarAlunoPorMatricula(
                            matricula.trim()
                        );

                if (alunoExistente) {
                    throw new Error(
                        "Já existe um aluno cadastrado com este RA."
                    );
                }
            }

            const cliente =
                new Cliente(
                    null,
                    dados.nome.trim(),
                    tipoCliente,
                    dados.telefone?.trim() ||
                        null,
                    dados.observacoes?.trim() ||
                        null,
                    true
                );

            return await clientesInfrastructure
                .cadastrarCliente({
                    nome:
                        cliente.nome,

                    tipo_cliente:
                        cliente.tipo_cliente,

                    telefone:
                        cliente.telefone,

                    observacoes:
                        cliente.observacoes,

                    matricula:
                        matricula?.trim(),

                    turma:
                        dados.turma?.trim(),

                    responsavel:
                        dados.responsavel?.trim(),

                    telefone_responsavel:
                        dados.telefone_responsavel
                            ?.trim(),

                    email_responsavel:
                        dados.email_responsavel
                            ?.trim(),

                    parentesco:
                        dados.parentesco?.trim(),
                });
        } catch (error) {
            throw new Error(
                `Erro ao cadastrar cliente: ${error.message}`
            );
        }
    }

    async atualizarCliente(id, dados) {
        try {
            const clienteAtual =
                await clientesInfrastructure
                    .buscarClientePorID(id);

            if (!clienteAtual) {
                throw new Error(
                    `Cliente com ID ${id} não encontrado.`
                );
            }

            const tipoCliente =
                this.normalizarTipo(
                    dados.tipo_cliente ||
                    dados.tipoCliente ||
                    clienteAtual.tipo_cliente
                );

            if (!tipoCliente) {
                throw new Error(
                    "Tipo de cliente inválido."
                );
            }

            const nome =
                dados.nome?.trim() ||
                clienteAtual.nome;

            if (!nome) {
                throw new Error(
                    "O nome do cliente é obrigatório."
                );
            }

            let matricula =
                dados.matricula ??
                dados.ra ??
                clienteAtual.matricula;

            if (
                typeof matricula === "string"
            ) {
                matricula =
                    matricula.trim();
            }

            if (
                tipoCliente === "Aluno" &&
                !matricula
            ) {
                throw new Error(
                    "O RA do aluno é obrigatório."
                );
            }

            const responsavel =
                dados.responsavel !== undefined
                    ? dados.responsavel?.trim()
                    : clienteAtual.responsavel;

            if (
                tipoCliente === "Aluno" &&
                !responsavel
            ) {
                throw new Error(
                    "O responsável do aluno é obrigatório."
                );
            }

            if (tipoCliente === "Aluno") {
                const alunoComMatricula =
                    await clientesInfrastructure
                        .buscarAlunoPorMatricula(
                            matricula
                        );

                if (
                    alunoComMatricula &&
                    Number(
                        alunoComMatricula.id_aluno
                    ) !==
                        Number(
                            clienteAtual.id_aluno
                        )
                ) {
                    throw new Error(
                        "Já existe outro aluno cadastrado com este RA."
                    );
                }
            }

            const telefone =
                dados.telefone !== undefined
                    ? dados.telefone?.trim() ||
                      null
                    : clienteAtual.telefone;

            const observacoes =
                dados.observacoes !== undefined
                    ? dados.observacoes?.trim() ||
                      null
                    : clienteAtual.observacoes;

            const turma =
                dados.turma !== undefined
                    ? dados.turma?.trim() ||
                      null
                    : clienteAtual.turma;

            const telefoneResponsavel =
                dados.telefone_responsavel !==
                undefined
                    ? dados.telefone_responsavel
                          ?.trim() || null
                    : clienteAtual
                          .telefone_responsavel;

            const emailResponsavel =
                dados.email_responsavel !==
                undefined
                    ? dados.email_responsavel
                          ?.trim() || null
                    : clienteAtual
                          .email_responsavel;

            const parentesco =
                dados.parentesco !== undefined
                    ? dados.parentesco?.trim() ||
                      null
                    : null;

            const ativo =
                dados.ativo === undefined
                    ? Boolean(
                          Number(
                              clienteAtual.ativo
                          )
                      )
                    : Boolean(dados.ativo);

            const resultado =
                await clientesInfrastructure
                    .atualizarCliente(
                        id,
                        {
                            nome,

                            tipo_cliente:
                                tipoCliente,

                            telefone,

                            observacoes,

                            ativo,

                            matricula,

                            turma,

                            responsavel,

                            telefone_responsavel:
                                telefoneResponsavel,

                            email_responsavel:
                                emailResponsavel,

                            parentesco,
                        }
                    );

            if (!resultado) {
                throw new Error(
                    `Cliente com ID ${id} não encontrado.`
                );
            }

            return {
                mensagem:
                    "Cliente atualizado com sucesso!",
            };
        } catch (error) {
            throw new Error(
                `Erro ao atualizar cliente: ${error.message}`
            );
        }
    }

    async desativarCliente(id) {
        try {
            const resultado =
                await clientesInfrastructure
                    .desativarCliente(id);

            if (!resultado) {
                throw new Error(
                    `Cliente com ID ${id} não encontrado.`
                );
            }

            return {
                mensagem:
                    "Cliente desativado com sucesso!",
            };
        } catch (error) {
            throw new Error(
                `Erro ao desativar cliente: ${error.message}`
            );
        }
    }

    async alterarStatusCliente(id, ativo) {
        try {
            if (typeof ativo !== "boolean") {
                throw new Error(
                    "Status do cliente inválido."
                );
            }

            const cliente =
                await clientesInfrastructure
                    .buscarClientePorID(id);

            if (!cliente) {
                throw new Error(
                    `Cliente com ID ${id} não encontrado.`
                );
            }

            const resultado =
                await clientesInfrastructure
                    .alterarStatusCliente(
                        id,
                        ativo
                    );

            if (!resultado) {
                throw new Error(
                    `Cliente com ID ${id} não encontrado.`
                );
            }

            return {
                mensagem: ativo
                    ? "Cliente ativado com sucesso!"
                    : "Cliente desativado com sucesso!",
            };
        } catch (error) {
            throw new Error(
                `Erro ao alterar status do cliente: ${error.message}`
            );
        }
    }

    async excluirCliente(id) {
        try {
            const cliente =
                await clientesInfrastructure
                    .buscarClientePorID(id);

            if (!cliente) {
                throw new Error(
                    `Cliente com ID ${id} não encontrado.`
                );
            }

            const resultado =
                await clientesInfrastructure
                    .excluirCliente(id);

            if (
                !resultado.excluido &&
                resultado.motivo ===
                    "possui_vendas"
            ) {
                throw new Error(
                    "Este cliente possui vendas registradas e não pode ser excluído. Desative o cliente para preservar o histórico."
                );
            }

            if (
                !resultado.excluido &&
                resultado.motivo ===
                    "possui_movimentacao_credito"
            ) {
                throw new Error(
                    "Este cliente possui movimentações de crédito e não pode ser excluído. Desative o cliente para preservar o histórico."
                );
            }

            if (
                !resultado.excluido &&
                resultado.motivo ===
                    "nao_encontrado"
            ) {
                throw new Error(
                    `Cliente com ID ${id} não encontrado.`
                );
            }

            if (!resultado.excluido) {
                throw new Error(
                    "Não foi possível excluir o cliente."
                );
            }

            return {
                mensagem:
                    "Cliente excluído com sucesso!",
            };
        } catch (error) {
            throw new Error(
                `Erro ao excluir cliente: ${error.message}`
            );
        }
    }
}

module.exports =
    new ClientesService();