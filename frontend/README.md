# Quanto Amor Você Tem Para Dar? — Protótipo

Protótipo navegável do sistema de gestão de voluntários descrito no documento de
proposta do projeto de extensão universitária. Feito com **Vite + React + Tailwind CSS**,
sem backend: todos os dados são fictícios e vivem em memória (voltam ao estado
inicial a cada recarregamento da página).

## Como rodar

```bash
npm install
npm run dev
```

Abra o endereço mostrado no terminal (geralmente `http://localhost:5173`).

## O que está incluído

O protótipo cobre os dois perfis descritos na proposta (seção 2.3):

- **Administrador (Presidente/Diretoria)** — `Ana Souza`
  - Início: painel com indicadores (voluntários ativos, turnos pendentes, horas)
  - Voluntários: cadastro de membros e horas acumuladas
  - Ações / Eventos: ações cadastradas e os turnos que cada uma exige
  - **Escalas**: o coração do sistema — escolha uma ação e uma data, e clique em
    "Gerar Escala" para cruzar automaticamente a disponibilidade semanal de cada
    voluntário com os turnos necessários (ver `src/utils/schedule.js`)
  - Horas: total de horas por voluntário no semestre
  - Configurações: preferências gerais (dados de exemplo)

- **Voluntário** — `Lucas Alves`
  - Início: resumo pessoal (horas e próximos turnos)
  - Minha Disponibilidade: informar os horários livres por dia da semana
  - Minha Escala: turnos confirmados, agrupados por data
  - Horas: histórico pessoal de horas

Use o menu no canto superior direito ("Ana Souza" / "Lucas Alves") para alternar
entre os dois perfis a qualquer momento — é assim que se navega entre as duas
visões sem precisar de login real.

## Sobre os dados

Os voluntários, ações e escalas em `src/data/mockData.js` são inventados apenas
para demonstrar o fluxo. A escala da "Feira de Doações – Praça Central" em
27/09/2025 já vem pré-gerada (com um turno de Intervalo/Apoio propositalmente
pendente); ao clicar em "Gerar Escala" novamente para essa mesma ação/data, o
algoritmo roda de novo e pode preencher a vaga, já que dois voluntários de apoio
(Ana Clara e Rafael) têm disponibilidade cadastrada nesse horário — isso ilustra
justamente a proposta central do projeto (seção 1.3 do documento): substituir a
checagem manual de planilhas por um cruzamento automático de horários.

## Próximos passos sugeridos

- Conectar a um backend real (ex.: Supabase/Firebase) para persistência
- Autenticação real por perfil (Administrador / Voluntário)
- Regras de negócio adicionais (limite de horas, prioridade por equipe, etc.)
- Notificações reais por e-mail (hoje simuladas em Configurações)
