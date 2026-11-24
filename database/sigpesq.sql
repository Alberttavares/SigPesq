-- Estrutura compativel com os models, repositories e controllers atuais da API.
-- Banco existente: sigpesq. Este script nao cria nem recria o banco.
-- Somente tabelas ausentes sao criadas. Tabelas existentes nao sao alteradas.
-- Nao ha dados iniciais, comandos de remocao, cascatas ou triggers.
-- Decisoes de tipos, nulabilidade e limites: consulte database/README.md.

USE `sigpesq`;
SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS `participante` (
    `cpf` CHAR(11) NOT NULL,
    `nome` VARCHAR(255) NOT NULL,
    `senha` VARCHAR(255) NOT NULL,
    `email_institucional` VARCHAR(255) NOT NULL,
    `tipo` ENUM('Docente', 'Discente', 'Tecnico') NOT NULL,
    PRIMARY KEY (`cpf`),
    CONSTRAINT `uq_participante_email` UNIQUE (`email_institucional`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `projeto` (
    `codigo` VARCHAR(255) NOT NULL,
    `titulo` VARCHAR(255) NOT NULL,
    `descricao` TEXT NULL,
    `data_inicio` DATE NULL,
    `data_termino` DATE NULL,
    `situacao` ENUM('Em andamento', 'Concluido', 'Cancelado') NOT NULL,
    `cpf_coordenador` CHAR(11) NOT NULL,
    PRIMARY KEY (`codigo`),
    KEY `idx_projeto_coordenador` (`cpf_coordenador`),
    CONSTRAINT `fk_projeto_coordenador`
        FOREIGN KEY (`cpf_coordenador`) REFERENCES `participante` (`cpf`)
        ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `financiamento` (
    `id_financiamento` INT NOT NULL AUTO_INCREMENT,
    `agencia_financiadora` VARCHAR(255) NOT NULL,
    `tipo_fomento` VARCHAR(255) NOT NULL,
    `valor_total` DECIMAL(15, 2) NOT NULL,
    `data_inicio_vigencia` DATE NULL,
    `data_fim_vigencia` DATE NULL,
    PRIMARY KEY (`id_financiamento`),
    CONSTRAINT `chk_financiamento_valor_total` CHECK (`valor_total` > 0),
    CONSTRAINT `chk_financiamento_vigencia` CHECK (
        `data_inicio_vigencia` IS NULL OR `data_fim_vigencia` IS NULL
        OR `data_fim_vigencia` >= `data_inicio_vigencia`
    )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `producao_cientifica` (
    `id_producao` INT NOT NULL AUTO_INCREMENT,
    `codigo_projeto` VARCHAR(255) NOT NULL,
    `titulo` VARCHAR(255) NOT NULL,
    `tipo` VARCHAR(255) NOT NULL,
    `ano_publicacao` YEAR NULL,
    `meio_divulgacao` VARCHAR(255) NULL,
    PRIMARY KEY (`id_producao`),
    KEY `idx_producao_projeto` (`codigo_projeto`),
    CONSTRAINT `fk_producao_projeto`
        FOREIGN KEY (`codigo_projeto`) REFERENCES `projeto` (`codigo`)
        ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `vinculo_participacao_projeto` (
    `cpf_participante` CHAR(11) NOT NULL,
    `codigo_projeto` VARCHAR(255) NOT NULL,
    `funcao` VARCHAR(255) NOT NULL,
    `data_entrada` DATE NULL,
    `data_saida` DATE NULL,
    PRIMARY KEY (`cpf_participante`, `codigo_projeto`),
    KEY `idx_participacao_projeto` (`codigo_projeto`, `data_entrada`),
    CONSTRAINT `fk_participacao_participante`
        FOREIGN KEY (`cpf_participante`) REFERENCES `participante` (`cpf`)
        ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT `fk_participacao_projeto`
        FOREIGN KEY (`codigo_projeto`) REFERENCES `projeto` (`codigo`)
        ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `vinculo_financiamento_projeto` (
    `id_vinculo_financiamento` INT NOT NULL AUTO_INCREMENT,
    `id_financiamento` INT NOT NULL,
    `codigo_projeto` VARCHAR(255) NOT NULL,
    `tipo_apoio` ENUM('Total', 'Parcial') NOT NULL,
    `valor_apoio` DECIMAL(15, 2) NULL,
    PRIMARY KEY (`id_vinculo_financiamento`),
    KEY `idx_vinculo_financiamento` (`id_financiamento`),
    KEY `idx_vinculo_financiamento_projeto` (`codigo_projeto`),
    CONSTRAINT `fk_vinculo_financiamento`
        FOREIGN KEY (`id_financiamento`) REFERENCES `financiamento` (`id_financiamento`)
        ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT `fk_vinculo_financiamento_projeto`
        FOREIGN KEY (`codigo_projeto`) REFERENCES `projeto` (`codigo`)
        ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT `chk_vinculo_financiamento_valor` CHECK (
        `valor_apoio` IS NULL OR `valor_apoio` > 0
    )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `vinculo_participante_producao` (
    `id_producao` INT NOT NULL,
    `cpf_participante` CHAR(11) NOT NULL,
    `tipo_participacao` VARCHAR(255) NOT NULL,
    `data_inicio` DATE NULL,
    `data_termino` DATE NULL,
    PRIMARY KEY (`cpf_participante`, `id_producao`),
    KEY `idx_autoria_producao` (`id_producao`),
    CONSTRAINT `fk_autoria_participante`
        FOREIGN KEY (`cpf_participante`) REFERENCES `participante` (`cpf`)
        ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT `fk_autoria_producao`
        FOREIGN KEY (`id_producao`) REFERENCES `producao_cientifica` (`id_producao`)
        ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT `chk_autoria_tipo_participacao` CHECK (
        CHAR_LENGTH(TRIM(`tipo_participacao`)) > 0
    ),
    CONSTRAINT `chk_autoria_datas` CHECK (
        `data_inicio` IS NULL OR `data_termino` IS NULL
        OR `data_termino` >= `data_inicio`
    )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Conferencia somente de leitura. O resultado esperado e uma lista de 7 tabelas.
SELECT TABLE_NAME, ENGINE
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'sigpesq'
  AND TABLE_TYPE = 'BASE TABLE'
  AND TABLE_NAME IN (
      'participante', 'projeto', 'financiamento', 'producao_cientifica',
      'vinculo_participacao_projeto', 'vinculo_financiamento_projeto',
      'vinculo_participante_producao'
  )
ORDER BY TABLE_NAME;
