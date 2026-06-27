# Estoca — Frontend

Frontend do Estoca em **HTML/CSS/JS puro (vanilla), sem build step**. Abre direto no
navegador ou via um servidor estático simples.

```
Frontend/
├── landing/            # Landing page (site institucional)
│   ├── index.html
│   ├── styles.css
│   └── script.js       # formulário → POST /api/public/leads
└── admin/              # Painel administrativo (SPA vanilla)
    ├── index.html      # shell + scripts (carregados em ordem, sem ES modules)
    ├── css/
    │   ├── tokens.css  # design system (cores, fontes, botões, pills, inputs)
    │   └── admin.css   # layout (sidebar, topbar, cards, tabelas, modal, toast, login)
    └── js/
        ├── config.js   # API_BASE
        ├── api.js      # fetch + token + refresh automático (localStorage)
        ├── ui.js       # helpers: formatadores, pills, toast, modal
        ├── auth.js     # login / logout / sessão
        ├── app.js      # bootstrap: shell + roteamento por hash
        └── views/      # login · leads · empresas · financeiro
```

> **Sem ES modules** (para funcionar via `file://`): os scripts são globais, carregados
> em ordem de dependência no `index.html` e expõem `window.Api`, `window.UI`, etc.

## Como rodar

Pré-requisito: **backend rodando** (`Hackathon/Backend`, porta 4001) e o **ERP**
(`Hackathon/ERP`, porta 4000) para o dashboard do cliente.

Servidor estático (qualquer um serve):

```bash
# na pasta Frontend/
npx serve -l 4321 .
```

- Landing: `http://localhost:4321/landing/`
- Admin:   `http://localhost:4321/admin/`

Também abre direto via `file://` (o backend tem CORS aberto).

A URL da API é configurada em `admin/js/config.js` e `landing/script.js` (`API_BASE`).

## Painel administrativo

Login: `admin@estoca.com` / `admin123` (apenas `PLATFORM_ADMIN`).

Três seções (mesma navegação do design):

- **Leads** — KPIs + tabela; criar lead; **converter lead em cliente** (cria empresa,
  usuário admin, assinatura e integração; mostra a senha temporária).
- **Clientes** — KPIs + tabela; detalhe da empresa com **configuração da integração ERP**
  (URL + API Key + testar conexão), dados da assinatura e usuários da empresa.
- **Financeiro** — MRR, receita, inadimplência, receita por plano, receita mensal e faturas
  (marcar como paga).

O painel do **cliente** (dashboard de previsão/cobertura) consome `GET /api/app/dashboard`
e será construído na próxima fase.
