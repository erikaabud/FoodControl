CREATE DATABASE foodControl;

USE foodControl;

-- =====================================================
-- USUÁRIO DO SISTEMA
-- Login e cadastro de usuários
-- =====================================================

CREATE TABLE Usuario (
    id_usuario INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    telefone VARCHAR(15),
    usuario VARCHAR(50) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    tipo VARCHAR(20) NOT NULL DEFAULT 'usuario',
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    data_cadastro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- =====================================================
-- CATEGORIA
-- =====================================================

CREATE TABLE Categoria (
    id_categoria INT PRIMARY KEY AUTO_INCREMENT,
    nome_categoria VARCHAR(50) NOT NULL UNIQUE,
    descricao VARCHAR(150),
    ativo BOOLEAN NOT NULL DEFAULT TRUE
);


-- =====================================================
-- PRODUTO
-- =====================================================

CREATE TABLE Produto (
    id_produto INT PRIMARY KEY AUTO_INCREMENT,
    id_categoria INT NOT NULL,
    nome_produto VARCHAR(70) NOT NULL,
    valor_unitario DECIMAL(10,2) NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,

    CONSTRAINT chk_produto_valor
        CHECK (valor_unitario >= 0),

    CONSTRAINT fk_produto_categoria
        FOREIGN KEY (id_categoria)
        REFERENCES Categoria(id_categoria)
);


-- =====================================================
-- ESTOQUE
-- =====================================================

CREATE TABLE Estoque (
    id_produto INT PRIMARY KEY,
    quantidade INT UNSIGNED NOT NULL DEFAULT 0,
    estoque_minimo INT UNSIGNED NOT NULL DEFAULT 10,

    CONSTRAINT fk_estoque_produto
        FOREIGN KEY (id_produto)
        REFERENCES Produto(id_produto)
        ON DELETE CASCADE
);


-- =====================================================
-- MOVIMENTAÇÃO DE ESTOQUE
-- =====================================================

CREATE TABLE Movimentacao_estoque (
    id_movimentacao_estoque INT PRIMARY KEY AUTO_INCREMENT,
    id_produto INT NOT NULL,
    id_usuario INT,
    
    tipo ENUM(
        'Entrada',
        'Saída',
        'Ajuste'
    ) NOT NULL,

    quantidade INT UNSIGNED NOT NULL,
    data_movimentacao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    observacao VARCHAR(255),

    CONSTRAINT fk_mov_estoque_produto
        FOREIGN KEY (id_produto)
        REFERENCES Produto(id_produto),

    CONSTRAINT fk_mov_estoque_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES Usuario(id_usuario)
        ON DELETE SET NULL,

    CONSTRAINT chk_mov_estoque_quantidade
        CHECK (quantidade > 0)
);


-- =====================================================
-- CLIENTE
-- Aluno, professor, funcionário ou visitante
-- =====================================================

CREATE TABLE Cliente (
    id_cliente INT PRIMARY KEY AUTO_INCREMENT,

    nome VARCHAR(70) NOT NULL,

    tipo_cliente ENUM(
        'Aluno',
        'Professor',
        'Funcionário',
        'Visitante'
    ) NOT NULL,

    telefone VARCHAR(15),
    observacoes VARCHAR(255),

    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    data_cadastro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- =====================================================
-- ALUNO
-- Dados específicos quando o cliente for aluno
-- =====================================================

CREATE TABLE Aluno (
    id_aluno INT PRIMARY KEY AUTO_INCREMENT,
    id_cliente INT NOT NULL UNIQUE,
    matricula VARCHAR(30) NOT NULL UNIQUE,
    turma VARCHAR(30),

    CONSTRAINT fk_aluno_cliente
        FOREIGN KEY (id_cliente)
        REFERENCES Cliente(id_cliente)
        ON DELETE CASCADE
);


-- =====================================================
-- RESPONSÁVEL
-- =====================================================

CREATE TABLE Responsavel (
    id_responsavel INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(70) NOT NULL,
    telefone VARCHAR(15) NOT NULL,
    email VARCHAR(100),
    ativo BOOLEAN NOT NULL DEFAULT TRUE
);


-- =====================================================
-- RELAÇÃO ALUNO / RESPONSÁVEL
-- =====================================================

CREATE TABLE Aluno_responsavel (
    id_aluno INT NOT NULL,
    id_responsavel INT NOT NULL,

    parentesco VARCHAR(30),

    responsavel_principal BOOLEAN
        NOT NULL DEFAULT FALSE,

    status ENUM(
        'Ativo',
        'Inativo'
    ) NOT NULL DEFAULT 'Ativo',

    PRIMARY KEY (
        id_aluno,
        id_responsavel
    ),

    CONSTRAINT fk_aluno_responsavel_aluno
        FOREIGN KEY (id_aluno)
        REFERENCES Aluno(id_aluno)
        ON DELETE CASCADE,

    CONSTRAINT fk_aluno_responsavel_responsavel
        FOREIGN KEY (id_responsavel)
        REFERENCES Responsavel(id_responsavel)
        ON DELETE CASCADE
);


-- =====================================================
-- CONTA DE CRÉDITO
-- Somente alunos possuem crédito
-- =====================================================

CREATE TABLE Conta_credito (
    id_conta_credito INT PRIMARY KEY AUTO_INCREMENT,
    id_aluno INT NOT NULL UNIQUE,
    saldo DECIMAL(10,2) NOT NULL DEFAULT 0.00,

    CONSTRAINT fk_conta_credito_aluno
        FOREIGN KEY (id_aluno)
        REFERENCES Aluno(id_aluno)
        ON DELETE CASCADE,

    CONSTRAINT chk_conta_credito_saldo
        CHECK (saldo >= 0)
);


-- =====================================================
-- VENDA
-- =====================================================

CREATE TABLE Venda (
    id_venda INT PRIMARY KEY AUTO_INCREMENT,
    id_cliente INT,
    id_usuario INT,

    data_venda DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    status ENUM(
        'Pendente',
        'Concluída',
        'Cancelada'
    ) NOT NULL DEFAULT 'Pendente',

    CONSTRAINT fk_venda_cliente
        FOREIGN KEY (id_cliente)
        REFERENCES Cliente(id_cliente)
        ON DELETE SET NULL,

    CONSTRAINT fk_venda_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES Usuario(id_usuario)
        ON DELETE SET NULL
);


-- =====================================================
-- ITEM DA VENDA
-- =====================================================

CREATE TABLE Item_venda (
    id_venda INT NOT NULL,
    id_produto INT NOT NULL,

    quantidade SMALLINT UNSIGNED NOT NULL,
    valor_unitario DECIMAL(10,2) NOT NULL,

    PRIMARY KEY (
        id_venda,
        id_produto
    ),

    CONSTRAINT fk_item_venda
        FOREIGN KEY (id_venda)
        REFERENCES Venda(id_venda)
        ON DELETE CASCADE,

    CONSTRAINT fk_item_produto
        FOREIGN KEY (id_produto)
        REFERENCES Produto(id_produto),

    CONSTRAINT chk_item_quantidade
        CHECK (quantidade > 0),

    CONSTRAINT chk_item_valor
        CHECK (valor_unitario >= 0)
);


-- =====================================================
-- FORMAS DE PAGAMENTO
-- =====================================================

CREATE TABLE Forma_pagamento (
    id_forma_pagamento INT PRIMARY KEY AUTO_INCREMENT,
    nome_forma VARCHAR(30) NOT NULL UNIQUE,
    ativo BOOLEAN NOT NULL DEFAULT TRUE
);


-- =====================================================
-- PAGAMENTO
-- =====================================================

CREATE TABLE Pagamento (
    id_pagamento INT PRIMARY KEY AUTO_INCREMENT,

    id_venda INT NOT NULL,
    id_forma_pagamento INT NOT NULL,

    valor DECIMAL(10,2) NOT NULL,

    quantidade_parcelas TINYINT UNSIGNED
        NOT NULL DEFAULT 1,

    data_pagamento DATETIME
        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    status ENUM(
        'Pendente',
        'Confirmado',
        'Cancelado'
    ) NOT NULL DEFAULT 'Pendente',

    CONSTRAINT fk_pagamento_venda
        FOREIGN KEY (id_venda)
        REFERENCES Venda(id_venda)
        ON DELETE CASCADE,

    CONSTRAINT fk_pagamento_forma
        FOREIGN KEY (id_forma_pagamento)
        REFERENCES Forma_pagamento(id_forma_pagamento),

    CONSTRAINT chk_pagamento_valor
        CHECK (valor > 0),

    CONSTRAINT chk_pagamento_parcelas
        CHECK (quantidade_parcelas > 0)
);


-- =====================================================
-- CONTAS A RECEBER
-- =====================================================

CREATE TABLE Conta_receber (
    id_conta_receber INT PRIMARY KEY AUTO_INCREMENT,

    id_venda INT NOT NULL UNIQUE,

    data_vencimento DATE NOT NULL,

    status ENUM(
        'Pendente',
        'Pago',
        'Atrasado',
        'Cancelado'
    ) NOT NULL DEFAULT 'Pendente',

    url_comprovante VARCHAR(255),

    CONSTRAINT fk_conta_receber_venda
        FOREIGN KEY (id_venda)
        REFERENCES Venda(id_venda)
        ON DELETE CASCADE
);


-- =====================================================
-- MOVIMENTAÇÃO DO CRÉDITO
-- =====================================================

CREATE TABLE Movimentacao_credito (
    id_movimentacao INT PRIMARY KEY AUTO_INCREMENT,

    id_conta_credito INT NOT NULL,
    id_responsavel INT,
    id_venda INT,
    id_usuario INT,

    tipo ENUM(
        'Depósito',
        'Compra',
        'Estorno',
        'Ajuste'
    ) NOT NULL,

    valor DECIMAL(10,2) NOT NULL,

    data_movimentacao DATETIME
        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    observacao VARCHAR(255),

    CONSTRAINT fk_mov_credito_conta
        FOREIGN KEY (id_conta_credito)
        REFERENCES Conta_credito(id_conta_credito)
        ON DELETE CASCADE,

    CONSTRAINT fk_mov_credito_responsavel
        FOREIGN KEY (id_responsavel)
        REFERENCES Responsavel(id_responsavel)
        ON DELETE SET NULL,

    CONSTRAINT fk_mov_credito_venda
        FOREIGN KEY (id_venda)
        REFERENCES Venda(id_venda)
        ON DELETE SET NULL,

    CONSTRAINT fk_mov_credito_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES Usuario(id_usuario)
        ON DELETE SET NULL,

    CONSTRAINT chk_mov_credito_valor
        CHECK (valor > 0)
);


-- =====================================================
-- FORMAS DE PAGAMENTO INICIAIS
-- =====================================================

INSERT INTO Forma_pagamento (nome_forma)
VALUES
    ('Dinheiro'),
    ('Cartão de Débito'),
    ('Cartão de Crédito'),
    ('PIX'),
    ('Crédito do Aluno');


-- =====================================================
-- CATEGORIAS INICIAIS
-- =====================================================

INSERT INTO Categoria (nome_categoria)
VALUES
    ('Salgados'),
    ('Bebidas'),
    ('Doces');


-- INSERT DO USUARIO ADMIN
INSERT INTO usuario
(nome, email, telefone, usuario, senha, tipo, ativo)
VALUES
('Administrador', 'admin@foodcontrol.com', NULL, 'admin', '123', 'admin', 1);