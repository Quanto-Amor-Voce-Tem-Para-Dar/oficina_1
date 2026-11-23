-- Esquema do banco (MySQL 8). Segue o modelo relacional da documentação (Figura 5).
-- Tabelas extras, fora do diagrama: LogAuditoria (RNF12) e IntegracaoGoogle (RNF04).
-- Pode rodar quantas vezes quiser: só cria o que ainda não existe.

CREATE TABLE IF NOT EXISTS Usuario (
    id_usuario       INT AUTO_INCREMENT PRIMARY KEY,
    nome             VARCHAR(100) NOT NULL,
    email            VARCHAR(100) NOT NULL UNIQUE,
    senha_hash       VARCHAR(255) NOT NULL,
    perfil           ENUM('ADMINISTRADOR', 'VOLUNTARIO') NOT NULL,
    status           ENUM('ATIVO', 'INATIVO') NOT NULL DEFAULT 'ATIVO',
    horas_acumuladas DECIMAL(5,2) NOT NULL DEFAULT 0,
    criado_em        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS Disponibilidade (
    id_disponibilidade INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario         INT NOT NULL,
    dia_semana         ENUM('SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB', 'DOM') NOT NULL,
    hora_inicio        TIME NOT NULL,
    hora_fim           TIME NOT NULL,
    FOREIGN KEY (id_usuario) REFERENCES Usuario(id_usuario) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Acao (
    id_acao   INT AUTO_INCREMENT PRIMARY KEY,
    nome      VARCHAR(100) NOT NULL,
    descricao TEXT,
    status    ENUM('PLANEJADA', 'EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA') NOT NULL DEFAULT 'PLANEJADA'
);

CREATE TABLE IF NOT EXISTS Turno (
    id_turno                   INT AUTO_INCREMENT PRIMARY KEY,
    id_acao                    INT NOT NULL,
    data                       DATE NOT NULL,
    hora_inicio                TIME NOT NULL,
    hora_fim                   TIME NOT NULL,
    qtd_voluntarios_necessaria INT NOT NULL,
    FOREIGN KEY (id_acao) REFERENCES Acao(id_acao) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Escala (
    id_escala              INT AUTO_INCREMENT PRIMARY KEY,
    id_acao                INT NOT NULL,
    data_geracao           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status                 ENUM('PROPOSTA', 'CONFIRMADA') NOT NULL DEFAULT 'PROPOSTA',
    id_usuario_confirmacao INT NULL,
    FOREIGN KEY (id_acao) REFERENCES Acao(id_acao) ON DELETE CASCADE,
    FOREIGN KEY (id_usuario_confirmacao) REFERENCES Usuario(id_usuario)
);

CREATE TABLE IF NOT EXISTS AtribuicaoTurno (
    id_atribuicao   INT AUTO_INCREMENT PRIMARY KEY,
    id_escala       INT NOT NULL,
    id_turno        INT NOT NULL,
    id_usuario      INT NOT NULL,
    status_presenca ENUM('PENDENTE', 'CONFIRMADO', 'PRESENTE', 'AUSENTE') NOT NULL DEFAULT 'PENDENTE',
    FOREIGN KEY (id_escala) REFERENCES Escala(id_escala) ON DELETE CASCADE,
    FOREIGN KEY (id_turno) REFERENCES Turno(id_turno) ON DELETE CASCADE,
    FOREIGN KEY (id_usuario) REFERENCES Usuario(id_usuario),
    -- RNF06: a mesma pessoa não entra duas vezes no mesmo turno da mesma escala
    UNIQUE KEY uq_atribuicao (id_escala, id_turno, id_usuario)
);

CREATE TABLE IF NOT EXISTS SolicitacaoTroca (
    id_solicitacao       INT AUTO_INCREMENT PRIMARY KEY,
    id_atribuicao_origem INT NOT NULL,
    id_usuario_destino   INT NULL,
    data_solicitacao     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status               ENUM('PENDENTE', 'APROVADA', 'REJEITADA') NOT NULL DEFAULT 'PENDENTE',
    motivo               TEXT,
    id_admin_analise     INT NULL,
    FOREIGN KEY (id_atribuicao_origem) REFERENCES AtribuicaoTurno(id_atribuicao) ON DELETE CASCADE,
    FOREIGN KEY (id_usuario_destino) REFERENCES Usuario(id_usuario),
    FOREIGN KEY (id_admin_analise) REFERENCES Usuario(id_usuario)
);

CREATE TABLE IF NOT EXISTS Notificacao (
    id_notificacao INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario     INT NOT NULL,
    mensagem       TEXT NOT NULL,
    tipo_evento    ENUM('ESCALA_CONFIRMADA', 'TROCA_ANALISADA') NOT NULL,
    data_envio     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status_envio   ENUM('ENVIADO', 'FALHA') NOT NULL,
    FOREIGN KEY (id_usuario) REFERENCES Usuario(id_usuario) ON DELETE CASCADE
);

-- RNF12: registro das operações de criação, alteração e confirmação de escalas (e trocas).
CREATE TABLE IF NOT EXISTS LogAuditoria (
    id_log      INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario  INT NULL,
    operacao    VARCHAR(50) NOT NULL,
    entidade    VARCHAR(50) NOT NULL,
    id_entidade INT NULL,
    detalhes    TEXT,
    criado_em   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES Usuario(id_usuario) ON DELETE SET NULL
);

-- RNF04: token OAuth da conta Google do projeto (antes ficava no token.json).
-- Uma linha só (id = 1).
CREATE TABLE IF NOT EXISTS IntegracaoGoogle (
    id             INT PRIMARY KEY,
    tokens         TEXT NOT NULL,
    conta_email    VARCHAR(100),
    atualizado_em  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
