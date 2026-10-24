# Escala de voluntários (back-end Node)

Lê as agendas dos voluntários no Google Agenda, reparte as permanências de forma equitativa
(por pontos) e devolve a escala em JSON.

## Como rodar

1. `npm install`
2. Coloque o `credentials.json` (OAuth 2.0 baixado do Google Cloud) na raiz do projeto.
   O redirect autorizado precisa ser `http://localhost:3000/oauth2callback` e `http://localhost:3000/auth/oauth2callback`.
3. `npm run dev` (ou `npm start`)
4. Abra `http://localhost:3000/auth` e faça login com a conta do projeto (cria o `token.json`).

Copie o `.env.example` para `.env` e confira o `GOOGLE_CREDENTIALS_PATH` (precisa terminar em `.json`). Se algo essencial faltar, o servidor avisa ao subir.

## Estrutura

| Pasta | O que tem |
|---|---|
| `routes/` | Os caminhos da API: `auth.js` (login Google) e `escala.js` (`POST /escala`, `GET /events`). |
| `middleware/` | O que roda antes da rota: `autenticacao.js` (exige login), `validarPayload.js`, `payloadDeTeste.js`, `erros.js`. |
| `models/` | As regras do sistema: `bloco.js` (permanência e pontos), `agendas.js` (Google Agenda e disponibilidade), `distribuicao.js` (algoritmo), `escala.js` (junta tudo). |
| `database/` | Onde os pontos ficam guardados. Hoje é `database/pontos.json`; para usar um BD, só `database/pontos.js` muda. |
| `config.js` | Caminhos, porta, fuso, máximo de permanências. |

## API

### `GET /`
Página inicial: se o login do Google está valendo, redireciona para `/escala`; se não há login ou ele venceu, redireciona para `/auth`.

### `GET /escala`
Confirma que o login está ativo (e volta para `/auth` se venceu). Para gerar a escala é o `POST /escala`, abaixo.

### `POST /escala`

```json
{
  "nomeEscala": "Escala de novembro",
  "pontuacao": { "minutosPorPonto": 60 },
  "cronograma": [
    { "data": "2026-11-03",
      "horarios": [ { "start": "10:00:00-03:00", "end": "10:20:00-03:00", "vagas": 1 } ] }
  ]
}
```

- `pontuacao.minutosPorPonto` (opcional): `60` = 1 ponto por hora (padrão), `30` = 1 ponto a cada 30 minutos.
  Cada unidade começada conta e toda permanência vale pelo menos 1 ponto.
- `?gravar=false` na URL: pré-visualização, não soma os pontos.

Resposta (`200`):

```json
{
  "status": "SUCESSO",
  "pontosGravados": true,
  "pontuacao": { "minutosPorPonto": 60 },
  "nomeEscala": "Escala de novembro",
  "escalaGerada": [
    { "data": "2026-11-03", "horarioInicio": "10:00:00-03:00", "horarioFim": "10:20:00-03:00",
      "vagasRequeridas": 1, "pontos": 1,
      "voluntariosAlocados": ["voluntario@gmail.com"], "alertaFaltaVagas": false }
  ],
  "pontosAcumulados": { "voluntario@gmail.com": 1 }
}
```

Erros: `400` payload inválido (lista em `erros`), `401` sem login ou login expirado (acessar `/auth`), `500` falha ao ler o Google Agenda.

### `GET /events`
Rota de teste: faz o mesmo que o `POST /escala`, usando o `payload.json` da raiz.

## Regras da distribuição

1. Blocos mais pesados primeiro; em empate, os mais apertados (poucos voluntários livres para as vagas).
2. Em cada vaga entra quem tem **menos pontos**; em empate, quem tem **menos horários possíveis**.
3. Cada voluntário no máximo 1 vez na primeira rodada; depois pode repetir até 2 permanências, sem choque de horário.
4. Vagas que sobram são rearranjadas trocando voluntários entre blocos, e as que ainda não fecham vêm com `alertaFaltaVagas: true`.

## Falta fazer

- Envio de e-mail (SMTP) para os voluntários confirmarem a escala.
- Reajuste automático dos turnos recusados quando todos responderem (remover o ponto de quem recusar).
- Trocar `database/pontos.json` por um banco de dados.
