# Patrimônia — SaaS financeiro familiar

Plataforma financeira com **painel do profissional** e **painel da família**, isolamento por família, RBAC granular, CRUD real, relatórios, insights automáticos, auditoria e PWA instalável.

## Stack

- Next.js 15 (App Router), React 19, TypeScript
- Tailwind CSS 3, Recharts, lucide-react, sonner
- Prisma 6 + SQLite (dev) — pronto para PostgreSQL
- Zod (validação), Vitest (testes)
- ExcelJS / jsPDF (exportação XLSX e PDF)

## Executar localmente

Requisitos: **Node.js 20+**.

```bash
npm install
cp .env.example .env        # Windows: copy .env.example .env
npm run db:reset            # cria o banco e carrega os dados de demonstração
npm run dev
```

Acesse **http://localhost:3000**.

### Credenciais de demonstração

Senha para todas: `Senha@123!`

| E-mail | Perfil |
| --- | --- |
| `admin@patrimonia.app` | Profissional — administrador das 3 famílias |
| `marina@exemplo.com` | Integrante (ADMIN da família Almeida) |
| `joao@exemplo.com` | Integrante (MEMBER da família Almeida) |

> Os convites pendentes são exibidos em **Admin → Usuários**. O link completo só é gerado no momento do convite e nunca é exposto depois.

## Scripts

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` / `npm run start` | Build e servidor de produção |
| `npm test` | Suíte Vitest (money, permissions, insights, validators) |
| `npm run db:push` | Aplica o schema ao banco |
| `npm run db:seed` | Carrega dados de demonstração |
| `npm run db:reset` | Recria o banco e faz o seed |
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

## Migração para PostgreSQL

1. Instale o driver: `npm i @prisma/client@6.19.3 && npm i -D prisma@6.19.3` (já fixado).
2. No `prisma/schema.prisma`, troque:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

3. Atualize `DATABASE_URL` no `.env` para `postgresql://usuario:senha@host:5432/patrimonia`.
4. Rode `npx prisma migrate dev --name init` e `npm run db:seed`.

Os enums estão modelados como `String` e os valores como centavos, o que torna a troca de provider direta.

## Testes

```bash
npm test
```

18 testes cobrindo conversão monetária, RBAC (owner/presets/override), agregações e insights, validação Zod e regras de negócio.
