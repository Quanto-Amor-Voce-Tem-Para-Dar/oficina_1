# Back-end (API)

Node.js + Express 5 + MySQL 8. O passo a passo para rodar está no [README da raiz](../README.md).

```bash
npm install
cp .env.example .env     # ajuste JWT_SECRET e o banco
npm run db:demo          # tabelas + admin + dados de exemplo (ou db:preparar, sem exemplo)
npm run dev              # http://localhost:3000/api
npm test                 # testes da lógica (não precisam de banco)
```

## Rotas principais

Todas (exceto o login) exigem `Authorization: Bearer <token>`. Erros vêm como
`{ "status": "ERRO", "mensagem": "...", "erros": [...] }`.

| Método e rota | Quem | O que faz |
|---|---|---|
| `POST /api/auth/login` | público | `{ email, senha }` → `{ token, usuario }` |
| `GET /api/auth/eu` · `PUT /api/auth/senha` | logado | dados do usuário · trocar senha |
| `GET/POST /api/usuarios` · `PUT/DELETE /api/usuarios/:id` | admin | voluntários e admins (DELETE desativa) |
| `GET/PUT /api/usuarios/:id/disponibilidade` | admin ou o próprio | `{ horarios: [{ dia_semana, hora_inicio, hora_fim }] }` |
| `GET /api/usuarios/:id/historico` | admin ou o próprio | participações em escalas confirmadas |
| `GET/POST /api/acoes` · `GET/PUT/DELETE /api/acoes/:id` | admin (GET: logado) | ações |
| `POST /api/acoes/:id/turnos` · `PUT/DELETE /api/turnos/:id` | admin | turnos |
| `POST /api/acoes/:id/escala` | admin | gera a PROPOSTA de escala da ação |
| `GET /api/escalas/:id` · `POST /api/escalas/:id/confirmar` · `DELETE /api/escalas/:id` | admin | ver · confirmar (envia e-mails) · descartar proposta |
| `POST /api/escalas/:id/atribuicoes` · `DELETE /api/escalas/:id/atribuicoes/:idAtrib` | admin | ajuste manual |
| `GET /api/turnos/:id/elegiveis` | admin | quem está disponível para o turno |
| `PATCH /api/atribuicoes/:id/presenca` | admin | `CONFIRMADO` / `PRESENTE` / `AUSENTE` |
| `GET /api/minha-escala` | logado | turnos confirmados do usuário |
| `POST /api/atribuicoes/:id/trocas` | voluntário | `{ motivo, id_usuario_destino? }` |
| `GET /api/trocas` · `POST /api/trocas/:id/analisar` | logado · admin | `{ aprovar: true/false }` |
| `GET /api/horas` · `GET /api/painel` | logado · admin | horas · números do painel |
| `GET /api/google/conectar` · `GET /api/google/status` · `DELETE /api/google` | admin | conta Google do projeto |
| `GET /api/notificacoes` · `GET /api/auditoria` | admin | e-mails enviados · log de operações |

## Regras importantes

- **Horas acumuladas** = soma dos turnos em escalas **confirmadas**, sem contar `AUSENTE`.
  São recalculadas a cada mudança e são o critério de equilíbrio da escala (quem tem menos, entra primeiro).
- **Elegível para um turno**: o turno cabe na disponibilidade digitada (se houver) **e** não cruza
  compromisso no Google Agenda (se a agenda estiver compartilhada) **e** a pessoa não está em outro turno
  confirmado no mesmo horário. Sem disponibilidade digitada e sem agenda compartilhada, não é elegível.
- O algoritmo de distribuição (`models/distribuicao.js`) reparte em rodadas: primeiro cada um no máximo
  1 vez, depois até `MAX_PERMANENCIAS`, e no fim tenta rearranjar para preencher vagas vazias.
- Desistência aprovada marca a atribuição como `AUSENTE` (a vaga reabre e o histórico é mantido).
