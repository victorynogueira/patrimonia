# Patrimônia — SaaS financeiro familiar

Plataforma financeira com **painel do profissional** e **painel da família**, isolamento por família, RBAC granular, CRUD real, relatórios, insights automáticos, auditoria e PWA instalável.

📘 **[Documentação completa de explicação e funcionamento](DOCUMENTACAO.md)** — arquitetura, modelos, API, RBAC, segurança, fluxos e limitações.

## Stack

- Next.js 15 (App Router), React 19, TypeScript
- Tailwind CSS 3, Recharts, lucide-react, sonner
- Prisma 6 + PostgreSQL (Neon em produção)
- Zod (validação), Vitest (testes)
- ExcelJS / jsPDF (exportação XLSX e PDF)

## Executar localmente (VS Code)

Requisitos: **Node.js 20+** (instalado globalmente) e um banco **PostgreSQL**.
O `.env` local já aponta para o banco Neon usado em produção; se quiser um banco isolado, crie outro projeto/branch na Neon e troque apenas a `DATABASE_URL`.

1. Abra a pasta do projeto no VS Code (`File → Open Folder`).
2. No terminal integrado (`Ctrl + ` `), execute:

```powershell
npm install
npm run db:migrate
npm run db:seed     # opcional: dados de demonstração
```

3. Pressione **F5** (configuração *Patrimônia: iniciar servidor*) ou rode `npm run dev`.
4. Acesse **http://localhost:3000**.

Também há tasks prontas no menu **Terminal → Run Task** (`Instalar dependências`, `Aplicar migrações`, `Rodar testes`, `Build de produção`, etc.).

> Ao usar o mesmo banco da produção, alterações feitas localmente aparecem no site publicado. Para desenvolver sem afetar a produção, use um banco separado.

### Produção

A aplicação está publicada em:

**https://patrimonia-pied.vercel.app**

O deploy é feito na Vercel, com banco PostgreSQL gerenciado pela Neon. O repositório GitHub está conectado: cada push em `main` gera um novo deploy automaticamente. O script `vercel-build` aplica as migrações antes do build.

### Credenciais de demonstração

Senha para todas: `Senha@123!`

| E-mail | Perfil |
| --- | --- |
| `admin@patrimonia.app` | Profissional — owner das 3 famílias |
| `marina@exemplo.com` | Integrante (`MEMBER` da família Almeida) |
| `joao@exemplo.com` | Leitor (`VIEWER` da família Castro) |

> Os convites pendentes são exibidos em **Admin → Usuários**. O link completo só é gerado no momento do convite e nunca é exposto depois.

## Scripts

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` / `npm run start` | Build e servidor de produção |
| `npm test` | Suíte Vitest (money, permissions, insights, validators) |
| `npm run db:migrate` | Aplica migrações PostgreSQL |
| `npm run db:push` | Sincroniza o schema diretamente (desenvolvimento) |
| `npm run db:seed` | Carrega dados de demonstração |
| `npm run db:reset` | Recria o banco e faz o seed |
| `npm run vercel-build` | Migra + gera client + build (usado pela Vercel) |
| `npm run icons` | Gera os ícones PWA em `public/icons` |

## Estrutura

```
src/
  app/
    api/                 # REST: auth, famílias, membros, recursos, relatórios etc.
    app/admin/           # Painel do profissional
    app/family/          # Painel da família
    login/ cadastro/ ... # Autenticação e convites
  components/            # Shell, tabelas, formulários, gráficos, UI
  lib/
    auth.ts              # Sessão e getFamilyContext (isolamento centralizado)
    permissions.ts       # RBAC: presets por papel + override por membro
    resource-api.ts      # CRUD genérico com validação e conversão para centavos
    insights.ts          # Tendências, alertas e projeções
    queries.ts           # Agregações dos dashboards e relatórios
prisma/schema.prisma     # Modelo de dados
public/sw.js             # Service worker (somente shell/assets, nunca /api/)
```

## Segurança

- Senhas com `scrypt` + salt; sessões com token opaco de 32 bytes em cookie **HttpOnly + SameSite=Lax**, hash SHA-256 no banco e expiração de 7 dias.
- Recuperação de senha por token de uso único, com expiração.
- Todo acesso a dados de família passa por `getFamilyContext(familyId, permissão)`, que valida vínculo, status e permissão antes da consulta.
- Validação backend com Zod; valores monetários persistidos em **centavos** (`Int`).
- Proteção contra CSRF via checagem de `Origin`, XSS pelo escaping do React, e consultas parametrizadas pelo Prisma.
- Auditoria de criação/edição/exclusão, convites, alteração de permissões e acesso a documentos.
- O service worker **não** faz cache de rotas `/api/`, evitando vazamento de dados financeiros entre contas.

## PWA

`public/manifest.webmanifest` + `public/sw.js` + ícones em `public/icons`. Instalável via menu do navegador (Android/Chrome e iOS/Safari → *Adicionar à Tela de Início*). Notificações são usadas quando o navegador oferece suporte.

## Banco de dados

O projeto usa **PostgreSQL**. Em produção, recomenda-se Neon (`https://neon.tech`):

1. Crie um projeto Neon e copie a connection string.
2. Defina `DATABASE_URL` no `.env` e nas variáveis de ambiente da Vercel.
3. Rode `npm run db:migrate` e, se quiser os dados de demonstração, `npm run db:seed`.

A migração inicial está em `prisma/migrations/20261124000000_init/migration.sql`.
Os enums são `String` e os valores monetários são centavos (`Int`).

## Testes

```bash
npm test
```

18 testes cobrindo conversão monetária, RBAC (owner/presets/override), agregações e insights, validação Zod e regras de negócio.
