# Front-end

React 18 + Vite + Tailwind CSS. O passo a passo completo está no [README da raiz](../README.md).

```bash
npm install
npm run dev      # http://localhost:5173 (as chamadas /api vão para http://localhost:3000)
npm run build    # gera a pasta dist/
```

Em produção (Vercel), defina `VITE_API_URL` com o endereço do back-end.

## Organização

- `src/api.js` — cliente HTTP: envia o token, trata erros e sessão expirada.
- `src/context/AppContext.jsx` — usuário logado, login/logout e avisos (toast).
- `src/hooks/useCarregar.js` — carrega dados da API com estados de carregando/erro.
- `src/pages/admin/` — Início, Voluntários, Ações/Eventos, Escalas, Horas, Configurações.
- `src/pages/voluntario/` — Início, Minha Disponibilidade, Minha Escala, Horas.
