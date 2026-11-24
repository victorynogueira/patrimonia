# Guia do usuário — Patrimônia

Bem-vindo! Este guia ensina, passo a passo, como usar a Patrimônia no dia a dia.

- **Se você é profissional**, comece pela [Parte 2](#parte-2--painel-do-profissional).
- **Se você foi convidado para uma família**, comece pela [Parte 3](#parte-3--painel-da-família).
- Para entender a tela e os primeiros acessos, leia a [Parte 1](#parte-1--primeiro-acesso).

Endereço de acesso: **https://patrimonia-pied.vercel.app**

---

## Parte 1 — Primeiro acesso

### 1.1 Entrar na plataforma

1. Abra o site e clique em **Entrar na plataforma**.
2. Informe seu **e-mail** e sua **senha**.
3. Se quiser conferir a senha digitada, use o ícone do olho ao lado do campo.
4. Clique em **Entrar na plataforma**.

Na tela de login também há atalhos de demonstração: **Profissional**, **Integrante** e **Somente leitura**. Eles preenchem automaticamente e-mail e senha.

Depois de entrar:
- quem é **Profissional** vai para o painel administrativo;
- quem é **Integrante** vai para o painel da família.

### 1.2 Criar minha conta

Use quando você for o responsável por acompanhar famílias.

1. Na tela de login, clique em **Criar conta grátis** (link no rodapé do formulário).
2. Preencha:
   - **Seu nome**
   - **E-mail**
   - **Nome da família** — opcional; você pode criar outras depois
   - **Senha** — mínimo de 8 caracteres
   - **Confirmar senha**
3. Clique em **Criar minha conta**.

Sua conta será criada como **Profissional** e a família informada já ficará pronta para uso.

### 1.3 Esqueci a senha

1. Clique em **Esqueceu a senha?** na tela de login.
2. Digite o e-mail cadastrado e clique em **Enviar instruções**.
3. O link de recuperação expira em **60 minutos**.

> **Importante:** nesta versão não há envio de e-mail real. Em desenvolvimento, o próprio site mostra um token e um link **Definir nova senha →**. Em produção, procure o administrador do sistema para receber o link/token.

Na tela **Redefinir senha**, informe o token, a nova senha e a confirmação, depois clique em **Salvar nova senha**. Você será levado de volta ao login.

### 1.4 Aceitar um convite

Você receberá um link parecido com `.../convite/ABCD`.

1. Abra o link.
2. Se ainda não tiver conta, clique em **Criar conta**. Se já tiver, clique em **Entrar para aceitar**.
3. Entre **obrigatoriamente com o e-mail convidado**.
4. Confira a família e a função mostradas, depois clique em **Aceitar convite**.
5. Você será encaminhado para o painel da família.

Convites valem por **7 dias**. Se expirar, peça ao responsável para gerar outro.

---

## Parte 2 — Painel do profissional

O menu **ADMINISTRAÇÃO** aparece apenas para usuários Profissionais.

### 2.1 Visão geral

Em **Visão geral** você vê, de forma consolidada:

- patrimônio administrado;
- receitas, lucros e despesas do mês;
- famílias ativas e integrantes;
- gráficos de evolução, distribuição de despesas e fluxo;
- últimas movimentações e registros de auditoria.

É o ponto de partida para acompanhar todas as famílias.

### 2.2 Famílias

Em **Famílias**:

- **Nova família** — cadastra uma família (nome, descrição e cor);
- **Gerenciar família** — abre os detalhes da família;
- **Editar** (ícone de lápis) — altera nome, descrição, cor e status;
- **Suspender / Reativar** (ícone de pausa/play) — bloqueia ou libera o acesso dos integrantes;
- **Excluir** (ícone de lixeira) — remove a família e **todos** os dados dela. A pergunta de confirmação não pode ser ignorada.

Na página de detalhes da família você encontra:

- indicadores de patrimônio, receitas, despesas e bens;
- a lista de **Integrantes** e convites pendentes;
- contas e ativos;
- últimas movimentações;
- o botão **Abrir painel**, que leva ao painel familiar daquela família.

> Somente o **Responsável (owner)** pode editar ou excluir a família. Um integrante com papel ADMIN pode acessar os detalhes, mas não alterar os dados da família.

### 2.3 Usuários e acessos

Em **Usuários e acessos** você vê:

- total de usuários, profissionais e convites pendentes;
- a função global de cada pessoa: **Profissional** ou **Integrante**;
- as famílias vinculadas a cada usuário;
- convites aguardando aceite, com data de expiração.

Use o controle na coluna **Ação** para alternar a função global de um usuário. Você não pode alterar a própria função.

> A função global é diferente do papel na família. Uma pessoa pode ser **Integrante** no sistema e **ADMIN** em uma família específica.

### 2.4 Relatórios gerenciais

Em **Relatórios gerenciais** você acompanha indicadores consolidados das famílias administradas: patrimônio, receitas, despesas, distribuição por categoria e evolução no tempo.

---

## Parte 3 — Painel da família

Todas as páginas desta área usam a **família selecionada no topo**. Se você tem acesso a mais de uma, troque pelo seletor de família no cabeçalho.

### 3.1 Painel familiar

É a página inicial da família. Mostra:

- cartões com receitas, despesas, lucros e resultado do mês;
- gráfico de evolução, distribuição de despesas e fluxo financeiro;
- cartão de **Insights** com alertas e sugestões;
- últimas movimentações;
- uso de orçamentos e andamento de metas;
- lista de bens e patrimônio.

Quando você tem permissão para lançar, aparece o botão **Lançar despesa** no topo. Ele abre o formulário de movimentação já no tipo despesa.

Os insights trazem frases como “as despesas deste mês estão acima das do mês anterior” ou “você usou 80% do orçamento”. Quando há um link disponível, clique na ação do cartão para ir direto aos dados relacionados.

### 3.2 Movimentações

Em **Movimentações**:

- use o campo **Buscar por descrição, categoria ou conta** para filtrar;
- use o filtro **Todos os tipos** para ver receitas, despesas, lucros ou transferências;
- clique em **Carregar mais (... restantes)** para ver lotes de 30 lançamentos;
- **Nova movimentação** abre o formulário;
- os ícones de lápis e lixeira editam ou excluem um lançamento.

Ao criar ou editar, você informa:

| Campo | O que é |
| --- | --- |
| **Tipo** | Receita, Despesa, Lucro ou Transferência |
| **Valor (R$)** | Aceita `1234,56`, `1.234,56` ou `1234.56` |
| **Descrição** | Texto que aparece nas listas e relatórios |
| **Data** | Data do lançamento |
| **Conta** | Conta que será debitada ou creditada |
| **Categoria** | Categoria existente ou **Sem categoria** |
| **Comprovante** | Documento já enviado em Documentos |
| **Recorrência** | Marque quando for um gasto/rendimento repetido |
| **Observações** | Detalhes livres |

O saldo da conta é atualizado automaticamente quando a movimentação é criada, editada ou excluída.

> Despesas a partir de R$ 2.000 geram uma notificação de alerta para os integrantes.

> Não há uma tela específica para criar categorias no menu. Use as categorias já existentes ou deixe **Sem categoria**.

### 3.3 Contas

Em **Contas** você cadastra contas bancárias, investimentos, dinheiro em caixa ou crédito.

Para cada conta informe nome, tipo, instituição, saldo, cor e se está ativa. O saldo aparece nos cartões da página e entra no cálculo do patrimônio. Botões de lápis e lixeira editam e excluem.

### 3.4 Patrimônio

Em **Patrimônio** você cadastra bens como imóveis, veículos, participações e outros ativos.

Cada bem mostra:

- valor de aquisição;
- valor atual;
- variação percentual;
- localização e data de aquisição;
- histórico de avaliações.

Use o botão **Novo registro** para cadastrar um bem e o ícone de atividade (gráfico) para **Registrar avaliação**: informe o novo valor e a data. O histórico fica salvo e alimenta a evolução patrimonial.

### 3.5 Orçamentos

Em **Orçamentos** defina um limite por categoria e mês (`AAAA-MM`).

É possível criar um **Orçamento geral** (sem categoria) ou por categoria. A tabela mostra o limite e o percentual utilizado no mês. O sistema gera alertas quando o uso chega a 80% e alerta crítico quando passa de 100%.

### 3.6 Metas

Em **Metas** acompanhe objetivos como reserva de emergência ou viagem.

Informe nome, valor alvo, valor atual, prazo e cor. A barra de progresso mostra o quanto já foi conquistado. Metas com mais de 75% do alvo ganham um insight positivo.

### 3.7 Integrantes

Em **Integrantes** o responsável ou um gestor pode:

- clicar em **Convidar** e informar e-mail, função e permissões;
- alterar papel e permissões com o botão **Acessos**;
- remover um integrante com o ícone de lixeira;
- ver convites pendentes e suas datas de expiração.

Se o e-mail já tiver conta, a pessoa é vinculada imediatamente e recebe uma notificação. Se não tiver, o sistema gera um link de convite: **copie o link imediatamente** com o botão de copiar, pois ele é exibido apenas naquele momento.

Permissões específicas: deixe todas as caixas desmarcadas para usar o padrão da função escolhida. Marque apenas o que deseja liberar além do padrão.

O **Responsável** não pode ter papel ou permissões alteradas e não pode ser removido.

### 3.8 Documentos

Em **Documentos**, clique na área **Selecione comprovantes e documentos** para enviar arquivos.

Formatos aceitos: **PDF, PNG, JPG, TXT, CSV ou DOCX**, com até **8 MB** por arquivo. É possível enviar vários arquivos de uma vez.

Para cada documento você pode:
- abrir/baixar com o ícone de download;
- excluir com o ícone de lixeira (se tiver permissão de upload).

### 3.9 Relatórios

Em **Relatórios**, escolha o período no topo: **3m, 6m, 12m ou 24m** (padrão: 6 meses).

A página mostra receitas, despesas, lucros, resultado, fluxo mensal, despesas por categoria, evolução patrimonial e o demonstrativo de movimentações.

Para exportar, clique em:

- **CSV** — ideal para abrir no Excel;
- **Excel** — arquivo `.xlsx`;
- **PDF** — relatório para compartilhar (limite de 45 lançamentos por arquivo).

> A tela mostra as 40 movimentações mais recentes do período. Para ver tudo, exporte em CSV ou Excel.

### 3.10 Notificações e perfil

- **Notificações** (ícone de sino no topo): veja avisos, marque como lidas ou exclua. Há botões para marcar uma ou todas como lidas.
- **Meu perfil**: altere nome, telefone, cor do avatar e senha. Para trocar a senha, preencha **Senha atual**, **Nova senha** e **Confirmar**. Depois clique em **Salvar alterações**.
- **Sair da conta**: encerra a sessão e volta ao login.

---

## Parte 4 — O que cada pessoa pode fazer

| Função na família | Pode ver | Pode fazer |
| --- | --- | --- |
| **Responsável** | Tudo | Tudo, incluindo editar/excluir a família e gerenciar acessos |
| **ADMIN** | Tudo | Tudo, exceto alterar/excluir a família |
| **GERENTE** | Tudo | Lançar e editar transações, gerenciar contas, ativos, orçamentos, metas, documentos e a família |
| **INTEGRANTE** | Tudo | Lançar e editar transações, enviar documentos e gerenciar metas |
| **LEITOR** | Tudo | Somente consultar; nenhuma ação de edição |

Se um botão não aparece, provavelmente sua permissão não permite aquela ação. Peça ao responsável para revisar seu acesso em **Integrantes → Acessos**.

---

## Parte 5 — Dicas de uso

1. **Comece pelas contas.** Cadastre as contas antes das movimentações para que os saldos fiquem corretos.
2. **Use categorias consistentemente.** Facilita a leitura dos gráficos e dos orçamentos.
3. **Atualize o valor dos bens.** Registre avaliações periódicas em Patrimônio para acompanhar a variação.
4. **Defina orçamentos mensais.** Os alertas ajudam a evitar estouros.
5. **Anexe comprovantes.** Envie o documento primeiro e selecione-o na movimentação.
6. **Exporte relatórios antes de reuniões.** CSV/Excel para analisar, PDF para apresentar.
7. **Troque de família pelo topo.** Confira sempre qual família está ativa antes de lançar.
8. **Cuide do link de convite.** Copie no momento em que ele aparece.

---

## Parte 6 — Instalar no celular (PWA)

A Patrimônia pode ser instalada como um aplicativo:

- **Android / Chrome:** menu do navegador → **Instalar aplicativo**.
- **iPhone / Safari:** botão de compartilhar → **Adicionar à Tela de Início**.

Quando um convite ou atualização importante chegar, o navegador pode exibir uma notificação. Ao clicar nela, você é levado para **Notificações**.

---

## Parte 7 — Perguntas frequentes

**Por que não vejo o menu Administração?**
Porque sua conta é de Integrante. Esse menu existe apenas para Profissionais.

**Por que recebo “Acesso restrito” ao abrir uma página?**
Sua função na família não tem a permissão de leitura daquela área. Peça ao responsável para revisar seus acessos.

**Por que um registro que eu vi não aparece agora?**
Você pode estar com outra família selecionada. Use o seletor no topo para trocar.

**Por que recebo “Não foi possível editar”?**
A permissão de edição não está marcada para você, ou o registro pertence a outra família.

**Como sei quem alterou um dado?**
O painel administrativo exibe os registros de auditoria com ação, usuário e data.

**O sistema envia e-mails?**
Ainda não. Convites são copiados da tela e a recuperação de senha mostra o token no ambiente de desenvolvimento.

**Posso usar fora do Brasil?**
A moeda e os formatos de data estão em português/BRL.

**Esqueci minha senha e não sou dev.**
Solicite ao administrador do sistema uma nova senha ou o link de recuperação.

---

## Parte 8 — Glosário rápido

| Termo | Significado |
| --- | --- |
| **Família** | Conjunto isolado de dados financeiros e integrantes |
| **Responsável** | Dono da família; tem acesso total |
| **Papel / Função** | Nível de acesso dentro da família (ADMIN, GERENTE, INTEGRANTE, LEITOR) |
| **Permissão** | Liberação específica para uma ação, podendo complementar o papel |
| **Lançamento** | Movimentação financeira (receita, despesa, lucro ou transferência) |
| **Insight** | Alerta ou sugestão gerado automaticamente a partir dos dados |
| **Orçamento** | Limite de gasto por categoria e mês |
| **Avaliação** | Registro do valor de um bem em uma data |
| **Auditoria** | Histórico de ações realizadas no sistema |

---

Precisa de detalhes técnicos, arquitetura ou referência de API? Consulte o **[documento de explicação e funcionamento](DOCUMENTACAO.md)**.
