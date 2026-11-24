# Patrimônia — Explicação e funcionamento do sistema

> Documento de referência do projeto. Última atualização: **24/11/2026**.
> Repositório: [github.com/victorynogueira/patrimonia](https://github.com/victorynogueira/patrimonia)
> Produção: [patrimonia-pied.vercel.app](https://patrimonia-pied.vercel.app)
> Para usuários finais, veja o **[Guia do usuário](GUIA_USUARIO.md)**.

---

## 1. Visão geral

A **Patrimônia** é uma aplicação web financeira para famílias e para o profissional que as acompanha. Ela reúne, em um único lugar, receitas, despesas, lucros, contas, ativos, orçamentos, metas, documentos e relatórios, com acesso separado por perfil e isolamento rigoroso dos dados de cada família.

A plataforma é dividida em dois ambientes integrados:

| Ambiente | Público | O que faz |
| --- | --- | --- |
| **Painel do profissional** (`/app/admin`) | Usuários com `globalRole = PROFESSIONAL` | Administra famílias, usuários e acessos; acompanha indicadores consolidados e auditoria. |
| **Painel da família** (`/app/family`) | Membros convidados para uma família | Lança movimentações, gerencia patrimônio, orçamentos, metas e documentos, e consulta insights e relatórios daquela família. |

Tudo o que é exibido no painel familiar depende da **família ativa** selecionada no cabeçalho. A troca de família é gravada em cookie e todas as consultas são filtradas por `familyId`.

### 1.1 Principais recursos

- CRUD real de transações, contas, categorias, ativos, orçamentos e metas.
- Histórico de avaliações de ativos e cálculo de variação patrimonial.
- Upload, download e exclusão de documentos com metadados e bytes no banco.
- Convites por e-link com token, papel e permissões específicas por família.
- RBAC em duas camadas: papel global + papel/permissões por família.
- Insights automáticos, alertas, projeção linear e KPIs.
- Exportação de relatórios em **CSV**, **XLSX** e **PDF**.
- Auditoria de ações e notificações internas.
- Interface responsiva, tema claro/escuro, estados vazios e skeletons.
- PWA instalável com service worker e ícones.

---

## 2. Stack tecnológica

| Camada | Tecnologia |
| --- | --- |
| Framework | Next.js 15.5.29 (App Router), React 19.1.10 |
| Linguagem | TypeScript (strict, alias `@/*` → `./src/*`) |
| Estilização | Tailwind CSS 3, classes utilitárias em `src/app/globals.css` |
| Gráficos | Recharts 2.x |
| Banco | PostgreSQL (Neon em produção), via Prisma 6.19.3 |
| Validação | Zod |
| Exportação | ExcelJS (XLSX) e jsPDF (PDF) |
| Testes | Vitest 3 (18 casos em 4 arquivos) |
| Ícones PWA | Gerados por `scripts/generate-icons.mjs` |
| Deploy | Vercel + Neon, com deploy automático a cada push em `main` |

---

## 3. Como executar

### 3.1 Localmente com VS Code

Requisitos: **Node.js 20+** e acesso a um banco PostgreSQL.

1. Abra a pasta do projeto no VS Code.
2. No terminal integrado, rode:
   ```cmd
   npm install
   npm run db:migrate
   npm run db:seed
   ```
3. Pressione **F5** (configuração *Patrimônia: iniciar servidor*) ou execute `npm run dev`.
4. Acesse `http://localhost:3000`.

O diretório `.vscode/` contém:

- `launch.json` — inicia o servidor e abre o navegador;
- `tasks.json` — tarefas para instalar, migrar, semear, testar e buildar;
- `settings.json` — usa Command Prompt no Windows para evitar bloqueio de scripts do PowerShell.

> **Atenção:** o `.env` local aponta para o mesmo banco Neon usado em produção. Alterações feitas localmente aparecem no site publicado. Para desenvolver isoladamente, crie outro projeto/branch na Neon e troque apenas `DATABASE_URL`.

### 3.2 Produção

- URL pública: `https://patrimonia-pied.vercel.app`
- Repositório conectado à Vercel; cada push em `main` gera um deploy.
- `vercel-build` executa `prisma migrate deploy && prisma generate && next build`.
- Variáveis de ambiente configuradas na Vercel: `DATABASE_URL`, `AUTH_SECRET` e `NEXT_PUBLIC_APP_URL`.

### 3.3 Variáveis de ambiente

| Variável | Uso |
| --- | --- |
| `DATABASE_URL` | Connection string PostgreSQL, consumida por `prisma/schema.prisma`. |
| `AUTH_SECRET` | Declarada no `.env.example`; **atualmente não é lida pelo código** (as sessões são opacas, não JWT). |
| `NEXT_PUBLIC_APP_URL` | Base para montar a URL de aceite do convite. Padrão: `http://localhost:3000`. |

### 3.4 Scripts npm

| Script | O que faz |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento na porta 3000 |
| `npm run build` | Gera o Prisma Client e builda o Next.js |
| `npm run vercel-build` | Aplica migrações, gera client e builda (usado pela Vercel) |
| `npm run start` | Servidor de produção na porta 3000 |
| `npm test` | Executa os testes Vitest |
| `npm run db:migrate` | Aplica as migrações PostgreSQL |
| `npm run db:push` | Sincroniza o schema diretamente (desenvolvimento) |
| `npm run db:seed` | Carrega os dados de demonstração |
| `npm run db:reset` | Recria o banco e roda o seed |
| `npm run icons` | Regera os ícones PWA |

---

## 4. Arquitetura

```text
Navegador (UI / React)
        │  fetch
        ▼
Rotas App Router  ──►  Route Handlers (/api/*)
   src/app             src/app/api
                            │
                            ▼
        Bibliotecas de domínio (src/lib)
   auth · permissions · security · validators
   insights · queries · resource-api · audit · api
                            │
                            ▼
                     Prisma Client (src/lib/db.ts)
                            │
                            ▼
                      PostgreSQL (Neon)
```

A regra central: **a interface não confia no cliente**. Cada página verifica permissões para decidir o que renderiza e cada rota de API reaplica a verificação com `requireFamilyContext(familyId, permissão)` antes de tocar no banco.

### 4.1 Estrutura de pastas

```text
prisma/
  schema.prisma              # 15 modelos, valores em centavos
  seed.ts                    # dados de demonstração
  migrations/                # migração inicial PostgreSQL
src/
  app/
    page.tsx                 # redireciona / → /app ou /login
    login, cadastro, esqueci-senha, redefinir-senha, convite/[token]
    app/                     # área autenticada
      layout.tsx             # exige sessão e monta AppShell
      page.tsx               # /app → /app/admin ou /app/family
      admin/                 # visão geral, famílias, usuários, relatórios
      family/                # painel, transações, ativos, contas, orçamentos,
                             # metas, relatórios, integrantes, documentos
      profile, notifications
    api/                     # 22 arquivos de rota (ver seção 9)
  components/
    auth/                    # formulários de login, cadastro, recuperação, convite
    layout/                  # AppShell, FamilyPicker
    forms/                   # EntityDialog, MemberManager, DocumentManager etc.
    tables/                  # ResourceTable, TransactionsTable
    charts/                  # EvolutionChart, FlowBars, AllocationDonut
    dashboard/parts.tsx      # StatCard, InsightList, BudgetRows, GoalRows
    ui/                      # Button, Input, Select, Card, Badge, Modal, EmptyState
    pwa-register.tsx         # registra o service worker
  lib/                       # 16 módulos (ver seção 5)
public/
  manifest.webmanifest, sw.js, icons/
tests/                       # money, permissions, insights, validators
.vscode/                     # configuração de execução no VS Code
scripts/generate-icons.mjs
```

---

## 5. Bibliotecas internas (`src/lib`)

| Arquivo | Responsabilidade |
| --- | --- |
| `db.ts` | Singleton do Prisma Client; loga `error`/`warn` em desenvolvimento. |
| `security.ts` | `hashPassword`/`verifyPassword` (scrypt + salt), `generateToken`, `hashToken` (SHA-256), `constantTimeEqual`. |
| `auth.ts` | Sessão, cookies, contexto de família e isolamento. Exporta `SESSION_COOKIE`, `FAMILY_COOKIE`, `SESSION_DAYS`, `getSessionUser`, `requireUser`, `createSession`, `destroySession`, `setActiveFamily`, `getFamilyContext`, `requireFamilyContext`, `getAccessibleFamilies`, `getSelectedFamily`, `sanitize`. |
| `permissions.ts` | Catálogo de permissões, presets por papel, `parsePermissionOverride`, `resolvePermissions`, `hasPermission`. |
| `validators.ts` | Schemas Zod para autenticação, família, membro, transação, conta, categoria, ativo, avaliação, orçamento, meta etc. |
| `api.ts` | Wrappers `authHandler`/`publicHandler`, `assertSameOrigin`, `parseBody`, `ok`, `fail`, `handleError`, `requestMeta`. |
| `resource-api.ts` | Define `RESOURCES` (transações, contas, categorias, ativos, orçamentos, metas), mapeamento de permissões, `include`/`orderBy` e conversão de valores para centavos. |
| `balance.ts` | `signedAmount`, `applyMovement`, `replaceMovement` — ajustam `balanceCents` das contas quando transações mudam. |
| `audit.ts` | `logAudit` (grava `AuditLog`) e `notifyUser` (grava `Notification`). |
| `insights.ts` | `monthKey`, `lastMonths`, `monthlyTotals`, `projectNet`, `categoryBreakdown`, `buildInsights`. |
| `queries.ts` | Agregações: `getFamilyDashboard`, `getAdminDashboard`, `getReportData`. |
| `money.ts` | `parseMoneyInput` (aceita `1234,56`, `1.234,56`, `1234.56`), `formatMoney`, `formatMoneyCompact`, `formatNumber`, `formatPercent`, `variationPercent`. |
| `page-helpers.ts` | `resolveFamilyPage` e `canView` — resolvem a família ativa das páginas. |
| `format.ts` | `formatBytes`, `formatDate`, `formatDateTime`. |
| `errors.ts` | `ApiError` (mensagem + status HTTP + detalhes). |
| `utils.ts` | `cn`, `initials`, `slugify`. |

---

## 6. Modelo de dados

`prisma/schema.prisma` usa PostgreSQL, com **15 modelos**. Convenções:

- Valores monetários são `Int` em **centavos** (evita erro de ponto flutuante e facilita migração).
- "Enums" são `String` com valores controlados pela validação (`INCOME`, `EXPENSE`, `PROFIT`, `TRANSFER`, etc.).
- `features`, `permissions` e `details` são JSON serializado em `String`.

| Modelo | Finalidade |
| --- | --- |
| `User` | Conta global: e-mail único, senha, `globalRole`, avatar, telefone. |
| `Session` | Token de sessão em hash, expiração e vínculo com usuário. |
| `PasswordReset` | Token de recuperação de uso único. |
| `Family` | Família: nome, slug, cor, status (`ACTIVE`/`SUSPENDED`), plano, `features`, owner. |
| `FamilyMember` | Vínculo usuário ↔ família com papel, permissões em JSON e status. |
| `Invite` | Convite com token em hash, papel, permissões, validade e aceite. |
| `Account` | Conta bancária, investimento, caixa ou crédito; saldo em centavos. |
| `Category` | Categoria de receita, despesa ou lucro. |
| `Transaction` | Movimentação com tipo, valor, data, conta, categoria, comprovante e criador. |
| `Asset` | Bem com valor de aquisição e valor atual. |
| `AssetValuation` | Histórico de avaliações de um bem. |
| `Budget` | Limite por categoria e mês (`YYYY-MM`). |
| `Goal` | Meta com valor alvo, valor atual e prazo. |
| `Document` | Arquivo (bytes) com MIME, tamanho e metadados. |
| `Notification` | Aviso interno para um usuário, opcionalmente ligado a uma família. |
| `AuditLog` | Registro de ações (quem, quando, o quê, detalhes JSON). |

> A migração inicial está em `prisma/migrations/20261124000000_init/migration.sql`.

---

## 7. Controle de acesso (RBAC)

### 7.1 Papéis

**Global (`User.globalRole`)**

- `PROFESSIONAL` — vê o painel administrativo, cria famílias e altera papéis globais.
- `MEMBER` — acessa apenas as famílias às quais foi vinculado.

**Por família (`FamilyMember.role`)**

| Papel | Permissões |
| --- | --- |
| `ADMIN` | Todas as permissões. |
| `MANAGER` | Leitura + criar/editar transações, gerenciar contas, ativos, orçamentos, metas, documentos e família. |
| `MEMBER` | Leitura + criar/editar transações, upload de documentos e gerenciar metas. |
| `VIEWER` | Somente leitura. |

O **owner** (`Family.ownerId`) tem todas as permissões independentemente do registro de membro.

### 7.2 Catálogo de permissões

- **Família e integrantes:** `family.view`, `family.manage`, `members.view`, `members.manage`
- **Finanças:** `accounts.view`, `accounts.manage`, `transactions.view`, `transactions.create`, `transactions.edit`, `transactions.delete`, `budgets.manage`, `goals.manage`
- **Patrimônio e documentos:** `assets.view`, `assets.manage`, `documents.view`, `documents.upload`, `sensitive.view`
- **Análise:** `reports.view`, `insights.view`

`FamilyMember.permissions` pode conter um JSON com uma lista de chaves para **sobrescrever** o preset do papel. String vazia (`""`) significa "usar o padrão do papel". Chaves desconhecidas são descartadas.

### 7.3 Onde é aplicado

1. **Página:** `requireUser` na layout, `resolveFamilyPage` nas páginas familiar e verificações como `canView("transactions.view")`.
2. **API:** `requireFamilyContext(familyId, permissão)` valida sessão, existência da família, vínculo ativo, status da família e a permissão pedida.
3. **Registro:** `findFirst({ where: { id, familyId } })` em rotas de registro específico garante que um ID de outra família retorne `404`.
4. **Componentes:** `canCreate`, `canEdit`, `canDelete`, `canManage`, `canUpload` escondem ações não permitidas.

Permissões por recurso (`RESOURCES` em `resource-api.ts`):

| Recurso | Leitura | Escrita |
| --- | --- | --- |
| `transactions` | `transactions.view` | `create` / `edit` / `delete` conforme a operação |
| `accounts` | `accounts.view` | `accounts.manage` |
| `categories` | `transactions.view` | `family.manage` |
| `assets` | `assets.view` | `assets.manage` |
| `budgets` | `transactions.view` | `budgets.manage` |
| `goals` | `family.view` | `goals.manage` |

---

## 8. Segurança

| Tema | Implementação |
| --- | --- |
| Senhas | `scrypt` com salt aleatório de 16 bytes; comparação com `timingSafeEqual`. |
| Sessão | Token opaco de 32 bytes em cookie HttpOnly, `SameSite=lax`, `Secure` em produção, 7 dias. O banco guarda só o SHA-256 do token. |
| Família ativa | Cookie HttpOnly `patrimonia_family`, validado antes de ser gravado. |
| Recuperação | Token de 24 bytes, 1 hora, uso único; ao redefinir, todas as sessões do usuário são apagadas. |
| Isolamento | `getFamilyContext`/`requireFamilyContext` centralizam vínculo, status e permissão. Consultas de registros filtram por `id` **e** `familyId`. |
| Validação | Zod em todas as rotas com corpo; `parseBody` retorna `400` com detalhes. |
| Valores | Entrada em reais convertida para centavos antes de persistir. |
| CSRF | `assertSameOrigin` compara `Origin` ao `Host` em POST/PUT/PATCH/DELETE. |
| XSS | Escape automático do React; downloads com `nosniff` e `no-store`. |
| SQLi | Consultas parametrizadas pelo Prisma. |
| Auditoria | `logAudit` registra criação, edição, exclusão, login, logout, upload, convites e mudanças de acesso. |
| Headers | `nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`, `poweredByHeader: false`. |

Não há middleware de autenticação: as proteções vivem nas layouts/páginas e nas rotas de API.

---

## 9. API REST

Formato padrão de sucesso: `{ "data": ... }`. Erro: `{ "error": { "message": "...", "details": ... } }`.

### 9.1 Autenticação e conta

| Método | Rota | Finalidade |
| --- | --- | --- |
| POST | `/api/auth/login` | Valida senha, cria sessão e registra `LOGIN`. |
| POST | `/api/auth/register` | Cria profissional, família, membro ADMIN, sessão e auditoria. |
| POST | `/api/auth/forgot` | Gera token de recuperação (1h). |
| POST | `/api/auth/reset` | Redefine a senha, invalida token e sessões. |
| GET | `/api/auth/me` | Usuário atual + famílias acessíveis. |
| POST | `/api/auth/logout` | Registra `LOGOUT` e apaga sessão/cookies. |
| PATCH | `/api/profile` | Nome, telefone, cor do avatar e senha. |
| POST | `/api/session/family` | Valida e define a família ativa. |

### 9.2 Famílias, usuários e convites

| Método | Rota | Finalidade |
| --- | --- | --- |
| GET / POST | `/api/families` | Lista famílias acessíveis / cria família (somente PROFESSIONAL). |
| GET / PATCH / DELETE | `/api/families/[id]` | Detalhe, edição, suspensão e exclusão (exclusão só do owner). |
| GET / POST | `/api/families/[id]/members` | Lista membros e convites / convida por e-mail. |
| PATCH / DELETE | `/api/families/[id]/members/[memberId]` | Altera papel/permissões ou remove membro (nunca o owner). |
| GET / POST | `/api/invites/[token]` | Valida e aceita convite. |
| PATCH | `/api/admin/users/[id]` | Alterna `globalRole` (somente PROFESSIONAL; não permite a própria conta). |

### 9.3 Recursos financeiros

| Método | Rota | Finalidade |
| --- | --- | --- |
| GET / POST | `/api/families/[id]/[resource]` | Lista / cria em `transactions`, `accounts`, `categories`, `assets`, `budgets`, `goals`. |
| PATCH / DELETE | `/api/families/[id]/[resource]/[recordId]` | Edita / exclui um registro da família. |
| POST | `/api/families/[id]/assets/[assetId]/valuations` | Registra nova avaliação de ativo. |

Efeitos especiais:

- Criar/editar/excluir transação chama `applyMovement`/`replaceMovement` para atualizar o saldo da conta.
- Despesa ≥ R$ 2.000 gera notificação de alerta.
- Criar ativo cria uma avaliação inicial; mudar o valor atual cria uma avaliação nova.
- Orçamento usa `upsert` por família/categoria/mês.

### 9.4 Documentos, insights, relatórios e notificações

| Método | Rota | Finalidade |
| --- | --- | --- |
| GET / POST | `/api/families/[id]/documents` | Lista metadados / envia arquivo (≤ 8 MB; PDF, PNG, JPEG, TXT, CSV, DOCX). |
| GET / DELETE | `/api/families/[id]/documents/[docId]` | Download com `no-store`/`nosniff` / exclusão. |
| GET | `/api/families/[id]/insights` | Insights e projeção de 6 meses. |
| GET | `/api/families/[id]/reports/export` | Exporta `?from=...&to=...&format=csv\|xlsx\|pdf`. |
| GET / PATCH / DELETE | `/api/notifications` | Lista, marca como lida e exclui notificações do usuário. |

---

## 10. Fluxos ponta a ponta

### 10.1 Login e entrada

1. Usuário abre `/` e é redirecionado para `/login` (ou `/app` se já autenticado).
2. `POST /api/auth/login` valida senha com scrypt.
3. `createSession` gera token, grava hash no banco e define o cookie HttpOnly.
4. Auditoria `LOGIN` é gravada com IP.
5. `/app` redireciona para `/app/admin` (profissional) ou `/app/family` (demais).

### 10.2 Cadastro de profissional

`/cadastro` → `POST /api/auth/register` → cria `User(PROFESSIONAL)`, `Family` com slug derivado do nome, `FamilyMember(ADMIN)`, features habilitadas, sessão e auditoria → `/app/admin`.

### 10.3 Troca de família

`FamilyPicker` no cabeçalho → `POST /api/session/family` → `requireFamilyContext` valida o vínculo → grava `patrimonia_family` → a interface recarrega com os dados da nova família.

### 10.4 Lançamento de transação

`EntityDialog` ou lançamento rápido → `POST /api/families/[id]/transactions` → Zod → conversão reais → centavos → cria `Transaction` → `applyMovement` ajusta saldo da conta → alerta se despesa ≥ R$ 2.000 → `logAudit`. Edição usa `replaceMovement`; exclusão reverte o movimento.

### 10.5 Convite de integrante

`MemberManager` envia e-mail, papel e permissões opcionais:

- E-mail já cadastrado: cria/atualiza `FamilyMember` e notifica o usuário.
- E-mail novo: gera convite com token de 24 bytes, validade de 7 dias e URL `/convite/<token>`.

O convidado abre o link, a rota GET valida token/expiração, e o POST aceita o convite vinculando o usuário e marcando `acceptedAt`.

### 10.6 Ativos e avaliações

Criar ativo gera uma `AssetValuation` inicial. Alterar `currentValueCents` cria uma nova avaliação. O modal de avaliação em `ResourceTable` chama a rota específica, que atualiza valor e histórico em uma transação.

### 10.7 Documentos

`FormData` com campo `file` → validação de MIME e tamanho → bytes gravados em `Document.data` → auditoria `UPLOAD`. O download filtra por família e devolve cabeçalhos que impedem cache e execução de conteúdo.

### 10.8 Insights e relatórios

`buildInsights` analisa até 600 transações, ativos, orçamentos e metas para gerar alertas de pico de despesa, concentração, uso de orçamento, recorrência, variação patrimonial, projeção e metas próximas. A tela inicial liga cada insight à página correspondente.

`GET /api/families/[id]/reports/export` filtra transações por período e gera:

- **CSV:** `;` como separador, BOM para Excel, colunas Data, Tipo, Descrição, Categoria, Conta, Valor.
- **XLSX:** aba `Movimentações`, valor numérico com formato `#,##0.00`.
- **PDF:** cabeçalho com família, período e totais; limite de 45 linhas por arquivo.

### 10.9 Notificações e auditoria

`notifyUser` cria avisos internos (por exemplo, despesa alta ou convite). A layout exibe a quantidade de não lidas; `/app/notifications` permite marcar como lidas e excluir. `logAudit` registra as principais mutações, que aparecem no painel administrativo.

---

## 11. Interface e PWA

- **Tema:** claro/escuro com preferência salva em `localStorage` (`patrimonia-theme`).
- **Responsividade:** menu lateral no desktop, gaveta e barra inferior no mobile.
- **Feedback:** skeletons, estados vazios (`EmptyState`) e notificações `sonner`.
- **PWA:** `public/manifest.webmanifest` (`display: standalone`, `start_url: /app/admin`) + `public/sw.js` + ícones 192/512/maskable/Apple Touch.
- **Service worker:** navegação *network-first* com fallback em cache; estáticos *cache-first*; ignora requisições não-GET, cross-origin e **todas as rotas `/api/`** — dados financeiros nunca ficam em cache.
- **Instalação:** `pwa-register.tsx` intercepta `beforeinstallprompt` e oferece um botão "Instalar".

---

## 12. Testes

`npm test` executa 18 casos distribuídos em:

| Arquivo | O que cobre |
| --- | --- |
| `tests/money.test.ts` | Conversão e formatação de valores (incluindo centavos). |
| `tests/permissions.test.ts` | Owner, presets de papel e override de permissões. |
| `tests/insights.test.ts` | Agregações mensais, projeção e regras de insights. |
| `tests/validators.test.ts` | Schemas Zod e regras de negócio. |

---

## 13. Dados de demonstração

`npm run db:seed` recria o banco com 3 usuários, 3 famílias, 6 meses de transações, categorias, ativos com avaliações, orçamentos, metas, um documento, notificações e logs de auditoria.

| E-mail | Perfil no seed |
| --- | --- |
| `admin@patrimonia.app` | Ricardo Mendes — `PROFESSIONAL`, owner das 3 famílias |
| `marina@exemplo.com` | Marina Almeida — `MEMBER` da Família Almeida (override com preset MEMBER) |
| `joao@exemplo.com` | João Castro — `VIEWER` da Família Castro |

Senha para todos: `Senha@123!`.

---

## 14. Pontos de atenção do estado atual

Estes pontos são conhecidos e estão documentados para evitar surpresas durante uso ou manutenção:

1. **`/offline` não existe.** O service worker inclui `/offline` no shell e no fallback, mas não há página com essa rota.
2. **Sem envio real de e-mail.** Recuperação de senha expõe `devToken` fora de produção e registra o token no console; convites são copiados pela interface.
3. **Flags de `features` não são aplicadas.** `Family.features` é editável e exibida, mas as rotas de relatórios/documentos/insights não verificam essas chaves.
4. **CSRF depende apenas do `Origin`.** Requisições sem esse header passam pela checagem.
5. **`AUTH_SECRET` não é usado** no código (as sessões são tokens opacos com hash no banco).
6. **`PATCH /api/profile` não grava auditoria**, embora a tela de perfil afirme que alterações são registradas.
7. **`sensitive.view` e `notificationSchema` existem, mas não são usados** em verificações/rotas.
8. **Sem middleware, rate limiting, 2FA ou verificação de e-mail.** As proteções são feitas por página e por rota de API.
9. **Limites de agregação:** dashboards leem até 600/1000 transações; PDF limita a 45 linhas; a tela de relatórios mostra 40 linhas (CSV/XLSX exportam o conjunto completo).
10. **`resolveFamilyPage` faz fallback silencioso** para a família do cookie quando `?familyId=` é inválido, enquanto a API responde `403`/`404`.
11. **Banco local compartilhado:** `prisma/dev.db` é um artefato antigo e ignorado pelo Git; o `.env` ativo aponta para Neon.
12. **Recomendação de produção:** antes de expor a usuários reais, enviar e-mails de verdade, aplicar as flags de features nas rotas, criar a página `/offline` e rever a política de CSRF.

---

## 15. Solução rápida de problemas

| Sintoma | Causa provável | Ação |
| --- | --- | --- |
| `npm` não é reconhecido no VS Code | Node instalado após abrir o terminal | Recarregue a janela do VS Code. |
| `npm.ps1` bloqueado no PowerShell | Política de execução | Use Command Prompt (já configurado em `.vscode/settings.json`) ou `npm.cmd`. |
| Erro ao conectar no banco | `DATABASE_URL` inválida | Confira a connection string no `.env` e rode `npm run db:migrate`. |
| `403` em uma ação familiar | Permissão insuficiente | Verifique o papel do membro em `/app/family/members`. |
| `404` ao editar um registro | Registro de outra família | Troque a família ativa no cabeçalho. |
| PWA não instala | Service worker não registrado | Verifique `public/sw.js` e use HTTPS (ou `localhost`). |
| Testes falham após mudança de schema | Prisma Client desatualizado | Rode `npm run build` ou `npx prisma generate`. |
