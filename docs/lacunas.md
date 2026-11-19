# O que ainda falta no projeto

Levantamento de 19/11/2026: o guia `trilha-estudos-fullstack.html` comparado com o repositório, mais uma revisão da API, do frontend e de infra/docs.

- 6 auditores procuraram lacunas: 45 encontradas.
- 2 verificadores tentaram derrubar cada uma.
- Restaram **21 lacunas confirmadas**, todas com evidência no código (arquivo e linha) ou no guia.

**Atualizado no mesmo dia, depois das correções:** os 10 bugs estão resolvidos, cada um com o teste que o pega, o projeto está no GitHub e o `.gitignore` do frontend ficou sem comentários. Restam 9 itens em aberto ou parciais, mais um achado novo (22).

## Resumo

| # | Lacuna | Área | Impacto | Esforço | Situação |
| --- | --- | --- | --- | --- | --- |
| 1 | Cancelar no formulário avisa "Tarefa criada" | frontend | médio | pequeno | resolvida |
| 2 | `null` em campo obrigatório vira erro 500 | API | médio | pequeno | resolvida |
| 3 | Busca repetida é ignorada e o filtro não volta à página 1 | frontend | médio | pequeno | resolvida |
| 4 | Navbar diz "API offline" quando só o banco caiu | frontend + docs | médio | pequeno | resolvida |
| 5 | Swagger sem `id`, datas e respostas de erro | API | médio | pequeno | resolvida |
| 6 | Id gigante derruba a rota com 500 | API | baixo | pequeno | resolvida |
| 7 | Busca trata `%` e `_` como curinga | API | baixo | pequeno | resolvida |
| 8 | Tela de tarefas sem saída quando dá erro | frontend | baixo | pequeno | resolvida |
| 9 | Ordenação erra acentos e o plural "As 1 tarefas" | frontend | baixo | pequeno | resolvida |
| 10 | Acessibilidade: nomes, foco e textos em inglês | frontend | baixo | pequeno | resolvida |
| 11 | `CLAUDE.md` na raiz | guia | alto | pequeno | em aberto, de propósito |
| 12 | Skill `criar-endpoint` em `.claude/skills/` | guia | médio | pequeno | em aberto |
| 13 | SDD com Spec Kit em `specs/` | guia | médio | médio | parcial |
| 14 | Projeto fora do Git e do GitHub | guia | alto | pequeno | resolvida |
| 15 | README com comandos que falham no Windows | docs | médio | pequeno | parcial |
| 16 | Guia manda corrigir CORS no lugar errado | docs | baixo | pequeno | em aberto |
| 17 | `ng generate` cria nomes fora do padrão do projeto | frontend + docs | baixo | pequeno | em aberto |
| 18 | Esquema do banco só via `synchronize`, sem migrations | API | médio | médio | em aberto |
| 19 | Lint e format não rodam da raiz; frontend sem ESLint | qualidade | médio | pequeno | em aberto |
| 20 | `.vscode` só dentro de `frontend/` e nenhum arquivo `.http` | experiência de desenvolvimento | baixo | pequeno | em aberto |
| 21 | Comentários do scaffold no `frontend/.gitignore` | qualidade | baixo | pequeno | resolvida |
| 22 | Foco se perde quando o estado de erro entra ou sai | frontend | baixo | pequeno | em aberto |

Ordem sugerida para o que falta:

1. Documentação (15 a 17).
2. O que o guia espera no repositório (12 e 13). O 11 fica para o aluno, no cap. 7.
3. Qualidade (18 a 20 e 22).

---

## 1. Bugs (resolvidos)

Cada correção começou por um teste que falhava antes da mudança.

### 1. Cancelar no formulário avisa "Tarefa criada"

O botão Cancelar usava `mat-dialog-close` sem valor, então o diálogo fechava com `''` (texto vazio). O filtro `salva !== undefined` deixava esse valor passar, e aparecia "Tarefa criada.", "Tarefa atualizada.", "Categoria criada." ou "Categoria atualizada." mesmo ao cancelar.

- Como ficou: os diálogos de tarefa e de categoria só avisam quando recebem o objeto salvo. Um teste clica em Cancelar e confere que nenhum aviso aparece.

### 2. `null` em campo obrigatório vira erro 500

O `@IsOptional()` também deixava passar `null`. `PATCH /tarefas/1` com `{"titulo": null}`, por exemplo, chegava ao banco, que recusava por causa do `NOT NULL`, e a API respondia 500.

- Como ficou: o validador `OpcionalNaoNulo` (`api/src/common/validadores.ts`) deixa passar o campo ausente e recusa `null` com 400. Só `descricao` e `categoriaId` aceitam `null`. Testes e2e cobrem cada campo.

### 3. Busca repetida é ignorada e o filtro não volta à página 1

O `distinctUntilChanged` comparava com o último texto digitado, e não com a URL: buscar "docker", limpar os filtros e buscar "docker" de novo não filtrava. Quem estava na página 3 continuava na página 3 do novo resultado.

- Como ficou: a busca compara com o valor da URL, e toda mudança de filtro leva a tabela para a primeira página. Dois testes cobrem os casos.

### 4. Navbar diz "API offline" quando só o banco caiu

Com o banco fora, o `/health` responde 503, mas a API continua de pé. O frontend tratava qualquer falha como "API offline", e o README mandava rodar `npm run api`, que dava `EADDRINUSE`.

- Como ficou: o 503 aparece como "Banco offline", com a dica `npm run banco`. Testes cobrem os três estados, e o README e o guia explicam cada um.

### 5. Swagger sem `id`, datas e respostas de erro

O plugin do Swagger não lia a base `entidade-base.ts`, então Tarefa e Categoria apareciam sem `id`, `criadaEm` e `atualizadaEm`. `Categoria.tarefas` aparecia sem nunca vir nas respostas, nenhuma rota documentava os erros e não havia exemplos.

- Como ficou: os campos da base têm `@ApiProperty`, `tarefas` saiu do schema, as rotas documentam 400, 404, 409 e 503 e o "Try it out" tem exemplos. Testes do documento Swagger protegem tudo isso.

### 6. Id gigante derruba a rota com 500

`GET /tarefas/99999999999` e `?categoriaId=99999999999` passavam do limite do `int` do Postgres e voltavam 500.

- Como ficou: o `ParseIdPipe` e o validador `EhId` aceitam de 1 a 2147483647 e respondem 400 com mensagem em português.

### 7. Busca trata `%` e `_` como curinga

`?busca=_` devolvia todas as tarefas.

- Como ficou: `escaparParaLike`, em `tarefas.service.ts`, escapa `\`, `%` e `_` antes do `ILike`.

### 8. Tela de tarefas sem saída quando dá erro

O estado de erro escondia a barra de filtros, o "Tentar de novo" repetia o filtro sem recarregar as categorias e o campo Buscar aceitava mais de 120 caracteres.

- Como ficou: o erro substitui só a tabela, o "Tentar de novo" recarrega tarefas e categorias, uma falha só das categorias mostra um aviso próprio e a busca tem `maxlength="120"`.

### 9. Ordenação erra acentos e o plural "As 1 tarefas"

"Água", "Ética" e "Óculos" iam para depois de "Zebra", o aviso de exclusão dizia "As 1 tarefas dela..." e o `LOCALE_ID` pt-BR não estava registrado.

- Como ficou: a ordenação usa `Intl.Collator('pt-BR')`, o aviso diz "A única tarefa dela..." e o locale pt-BR está registrado.

### 10. Acessibilidade

No celular, a marca e o status ficavam sem nome acessível. Concluir uma tarefa pelo teclado fazia o foco se perder, as barras de progresso não tinham nome e os cabeçalhos ordenáveis anunciavam "Sort".

- Como ficou: marca, status e barras têm nome acessível; a tabela usa `trackBy` por id; o foco volta ao mesmo controle da tarefa ou, se ela saiu da página, ao da linha que ficou na mesma posição, e à tabela quando a lista esvazia; o leitor de tela ouve "Tarefa concluída" ou "Tarefa reaberta"; os textos de ordenação estão em português.

---

## 2. O que o guia espera no repositório

### 11. `CLAUDE.md` na raiz

O guia põe o arquivo no mapa do projeto (cap. 3 e 15), ensina a criá-lo (cap. 7) e o checklist lê `@CLAUDE.md`. As regras do projeto estão hoje na constituição da skill `sdd` (`.claude/skills/sdd/constitution.md`) e no README. Uma regra que vale pôr no `CLAUDE.md`: `cd frontend && npm test` fica em modo watch e trava uma sessão do Claude; use `npm test` na raiz.

- Fica de fora de propósito: pelo guia, o aluno cria esse arquivo no cap. 7.

### 12. Skill `criar-endpoint` em `.claude/skills/`

O cap. 16 e o checklist esperam uma skill para criar endpoints. Hoje o projeto tem só a skill `sdd`.

- Atenção: o `nest g resource` do exemplo do guia gera nomes em inglês (`create-*.dto.ts`, pasta `entities/`), diferentes do padrão do projeto. A skill precisa descrever o padrão real.

### 13. SDD com Spec Kit em `specs/`

- Parcial: o projeto tem a skill `sdd` (cap. 18), que cria `specs/NNN-nome/` com spec, plan e tasks a partir dos modelos em `.claude/skills/sdd/modelos/`.
- Falta o Spec Kit do cap. 17, que precisa de `uv` e de Python 3.11 ou mais novo.
- A opção atual do Spec Kit parece ser `--integration claude`, e não `--ai claude` como no guia. Falta confirmar antes de mudar o guia.

### 14. Projeto fora do Git e do GitHub

- Resolvida: o projeto está no GitHub, e o `.claude/settings.local.json` entrou no `.gitignore` do projeto.

---

## 3. Documentação

### 15. README com comandos que falham no Windows

O README novo usa os scripts da raiz (`npm run setup`, `npm run dev`) e cita o Chrome nos testes. Ainda falham no Windows PowerShell 5.1, que é o padrão do Terminal:

- `cd api && npm run start:dev`, porque o PowerShell 5.1 não aceita `&&`.
- O exemplo de `curl -X POST ... '{...}'`, por causa das aspas.

### 16. Guia manda corrigir CORS no lugar errado

O guia manda pôr `app.enableCors()` no `main.ts` (cap. 13, tabela do cap. 15 e gabarito do quiz). No projeto, o CORS está em `api/src/configurar-app.ts`, com a origem lida de `CORS_ORIGIN` no `api/.env`. É isso que se ajusta quando o frontend roda em outra porta.

### 17. `ng generate` cria nomes fora do padrão do projeto

No Angular 20, `ng g s tarefas` gera `tarefas.ts` com `class Tarefas`, e pipes e interceptors usam hífen (`x-pipe.ts`). O projeto usa `tarefas.service.ts`, `rotulo-prioridade.pipe.ts` e assim por diante.

- Proposta: configurar os schematics no `angular.json` e atualizar o cap. 12.

---

## 4. Qualidade

### 18. Esquema do banco só via `synchronize`, sem migrations

- Num banco novo com `DB_SYNCHRONIZE=false`, as tabelas não existem e todas as rotas de dados dão 500.
- O índice único em `LOWER(nome)`, que garantiria a regra de nome de categoria único, não pode ser criado pelo `synchronize`.
- O exercício do cap. 7 (aceitar título com 150 caracteres) quebra: mexendo na entidade, a API não sobe; mexendo só no DTO, títulos longos dão 500.
- Proposta: `data-source.ts`, scripts `migration:generate` e `migration:run`, e a migration inicial com o índice.

### 19. Lint e format não rodam da raiz; frontend sem ESLint

- O frontend não tem ESLint.
- O Prettier não tem config na raiz nem `.prettierignore`. Com o "formatar ao salvar" do cap. 5, salvar o guia HTML geraria um diff de milhares de linhas.
- O `npm run lint` da API usa `--fix` e reescreve arquivos.
- Proposta: `angular-eslint` no frontend, `.prettierrc` e `.prettierignore` na raiz, scripts `lint`, `format` e `format:check` na raiz, além de `.editorconfig` e `.gitattributes`.

### 20. `.vscode` só dentro de `frontend/` e nenhum arquivo `.http`

O guia abre a raiz no VS Code, então as recomendações que estão em `frontend/.vscode` não valem. Um arquivo `requisicoes.http` (extensão REST Client) resolve o problema do `curl` no Windows e documenta as rotas.

### 21. Comentários do scaffold no `frontend/.gitignore`

- Resolvida: o arquivo ficou só com as regras.

### 22. Foco se perde quando o estado de erro entra ou sai

Achado na revisão final do item 10. O `EstadoErro` (`frontend/src/app/shared/ui/estado-erro/`) toma o lugar do conteúdo nas telas de tarefas, categorias e dashboard. Na troca, o elemento com foco some e o foco cai no `body`:

- Ao clicar em "Tentar de novo" e o conteúdo voltar.
- Ao concluir uma tarefa quando o PATCH dá certo e o GET seguinte falha: o erro substitui a tabela.

O `role="alert"` anuncia o erro, mas quem usa o teclado recomeça do topo da página.

- Proposta: um contêiner fixo com `tabindex="-1"` em volta do conteúdo que alterna, focado antes da troca. Testar nas três telas.

---

## Descartadas na verificação

Não são exigidas pelo guia nem ligadas a um problema real de agora:

- CI no GitHub Actions
- Dockerfiles da API e do frontend
- `.nvmrc` e `engines`
- `strict` na API: o código já não usa `any`
- Mensagens de erro da API em português
- Spinner em cada página e rolagem ao trocar de página
- Recusar campos desconhecidos (`forbidNonWhitelisted`)
- A skill de testes do exercício 16
- Mais cobertura genérica de testes: os testes que importam entraram junto com cada correção

## Fora do projeto: preparo da máquina

O checklist do guia pede, mas o projeto roda sem eles. Na máquina do levantamento, faltavam:

- `gh` (GitHub CLI)
- `uv` e Spec Kit
- `ng` e `nest` globais; os scripts do projeto usam as versões locais
- Comando `code` no PATH
- Extensões do VS Code do cap. 5, fora a do Claude Code
