# Quanto Amor Você Tem Para Dar? — Gestão de Voluntários e Escalas

Sistema web do projeto de extensão (UTFPR – Oficina de Integração 1) para cadastrar voluntários, ações
e turnos, gerar **escalas de permanência** de forma automática e equilibrada, e acompanhar trocas e horas.

```
oficina_1/
├── backend/            API Node.js + Express + MySQL
├── frontend/           Interface React + Vite + Tailwind
└── docker-compose.yml  MySQL para desenvolvimento local
```

## O que o sistema faz

| Perfil | Funcionalidades |
|---|---|
| **Administrador** | Cadastrar/editar/desativar voluntários (RF01) · Ações e turnos (RF02, RF03) · Gerar proposta de escala, ajustar manualmente e confirmar (RF09–RF13) · Analisar trocas (RF15) · Registrar presença · Horas por voluntário (RF18) · Conectar o Google Agenda do projeto · Ver e-mails enviados e auditoria (RNF12) |
| **Voluntário** | Ver a própria escala (RF04) · Informar disponibilidade semanal (RF05) · Pedir troca ou desistência (RF14) · Ver histórico e horas (RF17) |

**Como a escala é gerada:** para cada turno, o sistema lista quem está livre juntando
(1) a disponibilidade semanal digitada pelo voluntário e (2) os horários ocupados no Google Agenda
de quem compartilhou a agenda com a conta do projeto (só livre/ocupado, sem ler os compromissos).
Também descarta quem já está em outro turno no mesmo horário. Depois distribui as vagas dando
prioridade a quem tem **menos horas acumuladas** e a quem tem **menos opções de horário**.
A escala nasce como **PROPOSTA**; o admin revisa, ajusta e **confirma** — aí os voluntários recebem e-mail.

---

## Rodando na sua máquina (passo a passo)

Precisa de: **Node.js 20+** e **Docker** (para o MySQL). Sem Docker, use um MySQL 8 instalado ou na nuvem.

### 1. Banco de dados

```bash
docker compose up -d
```

Sobe um MySQL 8 em `localhost:3306` (usuário `root`, senha `root`, banco `quanto_amor`).

### 2. Back-end

```bash
cd backend
npm install
cp .env.example .env
```

Abra o `.env` e troque o `JWT_SECRET` por um texto aleatório. Para gerar um:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Crie as tabelas com dados de exemplo (opcional, mas ajuda a testar):

```bash
npm run db:demo
```

Suba a API:

```bash
npm run dev
```

A API fica em `http://localhost:3000/api`. Na primeira vez ela cria as tabelas e o administrador padrão.

### 3. Front-end (em outro terminal)

```bash
cd frontend
npm install
npm run dev
```

Abra `http://localhost:5173`.

### 4. Contas para teste

| Perfil | E-mail | Senha |
|---|---|---|
| Administrador | `admin@quantoamor.com` | `admin123` (definido em `ADMIN_EMAIL`/`ADMIN_SENHA` no `.env`) |
| Voluntário (só com `db:demo`) | `lucas.alves@email.com` (e os outros da lista) | `voluntario123` |

**Roteiro rápido de teste:** entre como admin → *Ações / Eventos* (veja os turnos) → *Escalas* →
**Gerar proposta** → ajuste alguém → **Confirmar**. Entre como `lucas.alves@email.com` → *Minha Escala* →
**Solicitar troca**. Volte ao admin → *Escalas* → *Solicitações de troca* → **Analisar**.

---

## Integrações (opcionais — o sistema funciona sem elas)

### E-mail (SMTP com Gmail)

1. Na conta Gmail que vai enviar os e-mails, ative a **verificação em duas etapas**.
2. Crie uma **senha de app** em <https://myaccount.google.com/apppasswords>.
3. No `backend/.env`, descomente e preencha:
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORTA=465
   SMTP_USUARIO=sua.conta@gmail.com
   SMTP_SENHA=a-senha-de-app-de-16-letras
   ```
4. Reinicie a API. Em *Configurações* aparece “Configurado”. Sem SMTP, as notificações ficam
   registradas como **Falha** e o resto funciona normalmente.

### Google Agenda (conta do projeto)

1. Entre em <https://console.cloud.google.com>, crie um projeto e ative a **Google Calendar API**.
2. *Tela de consentimento OAuth*: tipo **Externo**. Em **Usuários de teste**, adicione a conta Google do projeto.
3. *Credenciais* → **Criar ID do cliente OAuth** → tipo **Aplicativo da Web**. Em
   **URIs de redirecionamento autorizados**, adicione:
   - `http://localhost:3000/api/google/oauth2callback`
   - (na Vercel) `https://SEU-BACKEND.vercel.app/api/google/oauth2callback`
4. Baixe o JSON, renomeie para `credentials.json` e coloque em `backend/` — **ou** copie o
   `client_id` e o `client_secret` para `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` no `.env`.
5. Reinicie a API, entre como admin → *Configurações* → **Conectar conta Google** e faça login
   com a conta do projeto.
6. Cada voluntário compartilha a própria agenda com a conta do projeto, com a permissão
   **“Ver apenas livre/ocupado”**. A tela *Minha Disponibilidade* mostra o e-mail certo.

---

## Publicando na Vercel (ambiente de testes do grupo)

São **dois projetos** na Vercel, os dois apontando para este repositório e para a branch de testes,
mais um **MySQL na nuvem** (a Vercel não tem MySQL).

### 1. MySQL gratuito na nuvem

Crie um banco MySQL grátis (ex.: **Aiven** – <https://aiven.io/mysql>). Anote a **Service URI**
(`mysql://usuario:senha@host:porta/banco?ssl-mode=REQUIRED`) e baixe o **CA certificate** (`ca.pem`).

Não precisa criar as tabelas: na primeira vez que a API é acessada na Vercel, ela cria as tabelas e o
administrador padrão sozinha (e os dados de exemplo, se `DADOS_EXEMPLO=true`).

### 2. Projeto do back-end

Na Vercel: **Add New → Project** → importe o repositório → **Root Directory: `backend`** →
**Framework Preset: Other**.
Em **Environment Variables**:

| Variável | Valor |
|---|---|
| `DATABASE_URL` | a URL do MySQL na nuvem |
| `DB_SSL` | `true` |
| `DB_SSL_CA` | conteúdo do `ca.pem` (Aiven) — cole o arquivo inteiro |
| `DADOS_EXEMPLO` | `true` para criar voluntários e ações de exemplo (opcional) |
| `JWT_SECRET` | texto longo e aleatório (**o mesmo** sempre, senão todos são deslogados) |
| `FRONTEND_URL` | a URL do front na Vercel (preencha depois do passo 3) |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` | opcionais (Google Agenda) |
| `SMTP_HOST`, `SMTP_PORTA`, `SMTP_USUARIO`, `SMTP_SENHA` | opcionais (e-mail) |

Em **Settings → Git → Production Branch**, coloque a branch de testes (ex.: `dev-rafael`).

### 3. Projeto do front-end

**Add New → Project** → mesmo repositório → **Root Directory: `frontend`** (a Vercel reconhece o Vite).
Variável: `VITE_API_URL` = URL do back-end (ex.: `https://quanto-amor-api.vercel.app`).
Production Branch: a mesma do back.

Depois, volte ao back-end, preencha `FRONTEND_URL` com a URL do front e faça **Redeploy**.

A cada `git push` nessa branch, os dois projetos são atualizados sozinhos.

---

## Estrutura do código

```
backend/
├── server.js            sobe a API localmente (cria tabelas e admin na primeira vez)
├── app.js               monta as rotas (usado também pela Vercel em api/index.js)
├── config.js            variáveis de ambiente
├── db/                  schema.sql, conexão e script de preparação/dados de exemplo
├── middleware/          autenticação (JWT + perfil), validação e erros padronizados
├── models/              regras de negócio: disponibilidade, distribuição, escala, troca, horas
├── routes/              endpoints da API
├── services/            integrações isoladas: Google Calendar, e-mail (SMTP), auditoria
└── test/                testes da lógica (npm test)

frontend/src/
├── api.js               cliente HTTP (token, erros)
├── context/             sessão do usuário e avisos (toast)
├── components/          layout, menu, modal, selos de status...
└── pages/               admin/ e voluntario/
```

O resumo de todas as rotas da API está no topo de cada arquivo em `backend/routes/`.
