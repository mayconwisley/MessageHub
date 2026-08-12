# Frontend

O frontend fica em `frontend/` e é um console operacional para a API do Message Hub.

## Organização

Organizar React por funcionalidade, e não por tipo técnico global. Cada módulo concentra suas páginas, componentes específicos, chamadas de API, hooks, esquemas e tipos.

```text
frontend/src/
├── app/                           # rotas, providers e layouts
├── modules/
│   ├── auth/
│   ├── dashboard/
│   ├── tenants/
│   ├── applications/
│   ├── whatsapp-accounts/
│   ├── phone-numbers/
│   ├── api-keys/
│   ├── messages/
│   └── templates/
├── components/
│   ├── ui/                        # design system
│   └── shared/                    # componentes entre módulos
├── services/                      # cliente HTTP e autenticação
├── hooks/
├── lib/
└── styles/
```

## Regras obrigatórias

- Usar MUI como biblioteca de componentes e manter o tema centralizado.
- Usar TanStack Query para dados remotos, cache, invalidação e estados de carregamento.
- Usar React Hook Form e Zod em formulários e validar novamente no backend.
- Não duplicar autorização no frontend como mecanismo de segurança. O frontend apenas controla a experiência; o backend é a fonte de verdade.
- Construir interfaces acessíveis, responsivas e com estados vazios, de carregamento e de erro.
- Criar um item de menu e uma tela próprios quando áreas exibirem dados, permissões ou ações diferentes. Não agrupar cadastros independentes em uma única tela apenas por pertencerem ao mesmo contexto administrativo.
- Tipar contratos HTTP explicitamente e não usar `any`.
- Manter tokens somente no `sessionStorage`; nunca registrar, exibir novamente ou persistir API keys em texto puro.
- Não inventar listagens no cliente quando a API não possui endpoint de listagem. Oferecer consulta por identificador e registrar a limitação para evolução do backend.
