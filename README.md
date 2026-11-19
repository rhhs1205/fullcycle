# Gestor de Tarefas

Projeto de estudo full stack com três camadas, cada uma na sua pasta:

| Camada | Tecnologia | Pasta | Porta |
| --- | --- | --- | --- |
| Tela (frontend) | Angular 20 + Angular Material | `frontend/` | 4200 |
| Servidor (API) | NestJS 11 + TypeORM | `api/` | 3000 |
| Banco de dados | PostgreSQL 16 no Docker | `docker-compose.yml` | 5433 |

O passo a passo para aprender cada peça está no guia [`trilha-estudos-fullstack.html`](trilha-estudos-fullstack.html). Abra o arquivo no navegador: o plano de estudo sugerido cabe em 4 dias.

Depois de rodar e entender o projeto, vá para a seção [Mão na massa](#mão-na-massa): ela mostra como usar o Claude Code no VS Code e o que você precisa fazer, que são 5 tasks para resolver com a skill `/sdd`.

---

## Rodando pela primeira vez

### 1. Confira o que precisa estar instalado

Os comandos deste README são para **Ubuntu 20.04 ou mais novo**, no terminal padrão (`bash`). O capítulo 4 do guia instala tudo isso do zero.

| Ferramenta | Versão | Como conferir |
| --- | --- | --- |
| Node.js | 20.19+ ou 22.12+ (recomendado: 22) | `node -v` |
| Docker Engine | qualquer versão recente, **ligado** | `docker ps` |
| Git | qualquer versão recente | `git --version` |

Se `docker ps` responder `Cannot connect to the Docker daemon`, ligue o serviço com `sudo systemctl start docker`. Se responder `permission denied`, falta o seu usuário no grupo: `sudo usermod -aG docker $USER` e, depois, sair e entrar de novo na sessão.

### 2. Instale as dependências (só na primeira vez)

```bash
npm run setup
```

Isso instala as bibliotecas da raiz, da `api/` e do `frontend/`, e cria o arquivo `api/.env` a partir do `api/.env.example`.

### 3. Suba tudo com um comando

```bash
npm run dev
```

O comando liga o banco no Docker, espera ele ficar pronto e depois sobe a API e o frontend juntos no mesmo terminal. As linhas da API aparecem com `[API]` e as do frontend com `[FRONTEND]`.

Quando aparecer `Local: http://localhost:4200/`, abra no navegador:

| O quê | Endereço |
| --- | --- |
| Sistema (frontend) | http://localhost:4200 |
| Documentação da API (Swagger) | http://localhost:3000/docs |
| Saúde da API e do banco | http://localhost:3000/health |

Para parar, aperte `Ctrl + C` no terminal. O banco continua ligado em segundo plano; para desligar também:

```bash
npm run banco:parar
```

---

## O que dá para fazer no sistema

- **Dashboard**: totais, progresso geral, pendentes por prioridade, progresso por categoria e as próximas tarefas mais importantes.
- **Tarefas**: criar, editar, concluir e excluir; buscar por texto e filtrar por categoria, status e prioridade. Os filtros ficam na URL, então dá para copiar o link e compartilhar a mesma visão.
- **Categorias**: criar, editar e excluir, com cor; o botão "Ver tarefas" abre a lista já filtrada.
- **Navbar**: mostra se a API e o banco estão no ar, tem tema claro e escuro e uma barra de carregamento sempre que o sistema conversa com a API.

---

## Como as peças conversam

```
Navegador ──► Frontend (Angular) ──HTTP/JSON──► API (NestJS) ──SQL──► PostgreSQL (Docker)
              localhost:4200                    localhost:3000         localhost:5433
```

1. Você clica em algo na tela (frontend).
2. O frontend chama a API, por exemplo `POST /tarefas`.
3. A API valida os dados, aplica as regras e grava no banco.
4. A API responde em JSON e a tela se atualiza.

O frontend nunca fala direto com o banco: senha do banco e regras ficam só na API.

---

## Onde fica cada coisa

```
fullcycle/
├── docker-compose.yml          banco PostgreSQL
├── package.json                atalhos: setup, dev, test...
├── scripts/                    script que cria o api/.env
├── trilha-estudos-fullstack.html   guia de estudos
├── tasks/index.html            as 5 tasks para resolver (veja Mão na massa)
├── .claude/skills/sdd/         skill /sdd do Claude Code
├── specs/                      specs criadas pela /sdd (surge na primeira task)
│
├── api/                        servidor NestJS
│   ├── .env.example            modelo das configurações (copiado para .env)
│   ├── src/
│   │   ├── main.ts             liga a API e o Swagger
│   │   ├── app.module.ts       junta todos os módulos
│   │   ├── config/             valida as variáveis do .env
│   │   ├── database/           conexão com o PostgreSQL
│   │   ├── common/             peças reaproveitadas (entidade base, transformações)
│   │   ├── categorias/         módulo de categorias
│   │   ├── tarefas/            módulo de tarefas
│   │   ├── dashboard/          módulo de indicadores
│   │   └── health/             módulo que confere API e banco
│   └── test/                   testes ponta a ponta (e2e)
│
└── frontend/                   tela Angular
    └── src/app/
        ├── core/               peças globais: navbar, sidebar, interceptors, tema
        ├── shared/             componentes reaproveitados: cabeçalho, estados vazio e de erro
        └── features/           uma pasta por funcionalidade
            ├── dashboard/
            ├── tarefas/
            └── categorias/
```

### Como um módulo da API é organizado

Cada pasta em `api/src/` segue o mesmo desenho (exemplo com `tarefas/`):

| Arquivo | Papel |
| --- | --- |
| `tarefas.module.ts` | Junta as peças do módulo e diz do que ele depende |
| `tarefas.controller.ts` | Recebe a requisição (rotas) e repassa para o service |
| `tarefas.service.ts` | Regras de negócio |
| `tarefa.entity.ts` | Formato da tabela no banco |
| `dto/` | Formato e validação dos dados que chegam |
| `tarefas.service.spec.ts` | Testes do service |

### Como uma funcionalidade do frontend é organizada

Cada pasta em `frontend/src/app/features/` segue o mesmo desenho (exemplo com `tarefas/`):

| Pasta ou arquivo | Papel |
| --- | --- |
| `data/tarefa.model.ts` | Tipos usados na tela (o que é uma Tarefa) |
| `data/tarefas.service.ts` | Chamadas HTTP para a API |
| `data/tarefas.store.ts` | Estado da tela com signals: lista, carregando, erro |
| `tarefas-page/` | A página com a tabela e os filtros |
| `tarefa-form-dialog/` | O formulário de criar e editar |
| `ui/` | Componentes pequenos da funcionalidade (selo de prioridade) |

---

## Rotas da API

Todas também estão documentadas, com botão de testar, em http://localhost:3000/docs.

| Método | Rota | O que faz |
| --- | --- | --- |
| GET | `/tarefas` | Lista tarefas. Filtros opcionais: `?categoriaId=1&concluida=false&prioridade=alta&busca=texto` |
| GET | `/tarefas/:id` | Busca uma tarefa |
| POST | `/tarefas` | Cria uma tarefa |
| PATCH | `/tarefas/:id` | Altera parte de uma tarefa |
| DELETE | `/tarefas/:id` | Exclui uma tarefa |
| GET | `/categorias` | Lista categorias com o total de tarefas de cada uma |
| GET | `/categorias/:id` | Busca uma categoria |
| POST | `/categorias` | Cria uma categoria |
| PATCH | `/categorias/:id` | Altera uma categoria |
| DELETE | `/categorias/:id` | Exclui uma categoria (as tarefas dela ficam sem categoria) |
| GET | `/dashboard/resumo` | Indicadores para o dashboard |
| GET | `/health` | Confirma que a API e o banco estão respondendo |

Exemplo pelo terminal:

```bash
curl -X POST http://localhost:3000/tarefas -H "Content-Type: application/json" -d '{"titulo":"Estudar HTTP","prioridade":"alta"}'
```

Regras que a API garante:

- Título da tarefa é obrigatório e tem até 120 caracteres.
- Prioridade é `alta`, `media` ou `baixa`.
- Nome de categoria é único, sem diferenciar maiúsculas e minúsculas, e a cor segue o formato `#RRGGBB`.
- Tarefa só pode apontar para uma categoria que existe.

---

## Comandos do dia a dia

Rode sempre na pasta raiz do projeto.

| Comando | O que faz |
| --- | --- |
| `npm run setup` | Instala tudo e cria o `api/.env` (primeira vez) |
| `npm run dev` | Sobe banco, API e frontend |
| `npm run banco` | Liga só o banco |
| `npm run banco:parar` | Desliga o banco (os dados ficam guardados) |
| `npm run api` | Sobe só a API |
| `npm run frontend` | Sobe só o frontend |
| `npm test` | Testes unitários da API e do frontend |
| `npm run test:e2e` | Testes ponta a ponta da API (liga o banco antes) |

Prefere um terminal por camada, como no capítulo 15 do guia? Abra três terminais na raiz e rode, nesta ordem:

```bash
docker compose up -d
```

```bash
cd api && npm run start:dev
```

```bash
cd frontend && npm start
```

### Olhando dentro do banco

```bash
docker exec -it estudo-db psql -U app -d tarefas
```

Dentro do `psql`: `\dt` lista as tabelas, `SELECT * FROM tarefa;` mostra as tarefas e `\q` sai.

Para usar um programa visual (DBeaver, por exemplo): servidor `localhost`, porta `5433`, usuário `app`, senha `app`, banco `tarefas`.

### Começar do zero

```bash
docker compose down -v
```

Apaga o banco **e todos os dados**. Na próxima vez que a API subir, as tabelas são criadas de novo, vazias.

---

## Configurações (`api/.env`)

| Variável | Para que serve | Valor padrão |
| --- | --- | --- |
| `API_PORT` | Porta da API | `3000` |
| `DATABASE_URL` | Endereço do banco | `postgresql://app:app@localhost:5433/tarefas` |
| `DB_SYNCHRONIZE` | Cria e ajusta as tabelas sozinho a partir das entidades | `true` |
| `CORS_ORIGIN` | Endereço do frontend que pode chamar a API | `http://localhost:4200` |

O `api/.env` não vai para o Git. Se a API não subir com `Variáveis de ambiente inválidas`, compare o seu `.env` com o `.env.example`.

`DB_SYNCHRONIZE=true` é prático para estudar, mas não deve ser usado em produção: lá as mudanças no banco são feitas com migrations.

**Por que a porta 5433 e não 5432?** Dentro do container o PostgreSQL usa a 5432, que é a porta padrão. Do lado de fora usamos a 5433 para não brigar com outro PostgreSQL que já esteja rodando na máquina. Para voltar à 5432, troque em dois lugares: `ports` no `docker-compose.yml` e `DATABASE_URL` no `api/.env`.

---

## Testes

| Onde | Ferramenta | Comando | Precisa do banco? |
| --- | --- | --- | --- |
| API, unitários | Jest | `npm test --prefix api` | Não |
| API, ponta a ponta | Jest + Supertest | `npm run test:e2e` | Sim |
| Frontend | Karma + Jasmine | `npm test --prefix frontend` | Não (usa o Chrome) |

Os testes ponta a ponta criam os próprios dados e apagam tudo no final.

---

## Quando algo dá errado

Descubra primeiro **em qual camada** está o problema: aperte `F12` no navegador, abra a aba **Network** e recarregue a página.

| O que aparece | Onde está o problema | O que fazer |
| --- | --- | --- |
| Navbar mostra "API offline" | API parada | `npm run api` e leia o erro no terminal |
| Navbar mostra "Banco offline" | A API está no ar, mas o banco caiu | `npm run banco` e clique no indicador da navbar para verificar de novo |
| `ECONNREFUSED 127.0.0.1:5433` no terminal da API | Banco desligado | `npm run banco` |
| `Cannot connect to the Docker daemon` | Serviço do Docker parado | `sudo systemctl start docker` |
| `port is already allocated` ao ligar o banco | Outro programa usa a 5433 | Troque a porta (veja Configurações) |
| `EADDRINUSE :::3000` ou `:4200` | Já tem algo rodando nessa porta | Feche o terminal antigo ou o outro programa |
| `blocked by CORS policy` no navegador | Endereço do front diferente do `CORS_ORIGIN` | Ajuste `CORS_ORIGIN` no `api/.env` |
| `Variáveis de ambiente inválidas` | `api/.env` faltando ou errado | `node scripts/criar-env.mjs` ou compare com o `.env.example` |
| Os dados sumiram | Alguém rodou `docker compose down -v` | Os dados do volume foram apagados; cadastre de novo |

Ainda travado? Abra o Claude Code na raiz do projeto, cole o erro completo e diga o que estava fazendo.

---

## Mão na massa

Depois de rodar o projeto e entender as peças, é hora de trabalhar nele com o Claude Code. O projeto tem **5 problemas colocados de propósito**, descritos em [`tasks/index.html`](tasks/index.html) (abra no navegador). Cada task traz o sintoma e uma dica, mas não a solução. Os testes atuais passam: escrever o teste que pega cada problema faz parte da task.

### 1. Abra o projeto no VS Code com o Claude Code

1. Suba o sistema num terminal: `npm run dev`.
2. Abra a **raiz** do projeto no VS Code com `code .`, de dentro da pasta `fullcycle`. Não abra só `api/` ou `frontend/`: a skill e as tasks ficam na raiz.
3. Instale a extensão **Claude Code**, do autor Anthropic, se ainda não tiver: pela aba de extensões ou com `code --install-extension anthropic.claude-code`.
4. Abra qualquer arquivo e clique na faísca (✳) no canto superior direito do editor. Na primeira vez, faça login.
5. Deixe o modo de permissão em **Manual** (o indicador fica embaixo da caixa de pedido). Assim o Claude pede autorização antes de editar arquivos e de rodar comandos.
6. Digite `/skills` e confira que a skill `sdd` aparece. Se não aparecer, abra uma sessão nova.

O capítulo 8 do guia explica o painel em detalhes, e o capítulo 18 repete este roteiro com mais calma.

### 2. Use a skill `/sdd`

A skill fica em `.claude/skills/sdd/` e vem junto com o repositório: para usar neste projeto, não precisa instalar nada. Ela segue o ciclo de Spec-Driven Development do capítulo 17 do guia: spec (o quê e por quê), plan (como), tasks (passos pequenos) e implementação com o teste primeiro. Depois de cada etapa, ela para e espera a sua revisão.

| Quero... | Como fazer |
| --- | --- |
| Resolver uma task | `/sdd task 1` no painel do Claude Code |
| Pedir outra mudança com o mesmo método | `/sdd` seguido do pedido, em português |
| Ver se a skill foi encontrada | `/skills` |
| Usar a skill em todos os meus projetos | Copie a pasta e abra uma sessão nova: `cp -r .claude/skills/sdd ~/.claude/skills/` |
| Mudar as regras que a skill segue | Edite `.claude/skills/sdd/constitution.md` |

Os arquivos de cada task ficam em `specs/NNN-nome/`: `spec.md`, `plan.md` e `tasks.md`.

### 3. Resolva as tasks

| Task | Problema | Onde aparece | Nível |
| --- | --- | --- | --- |
| 1 | Tarefa excluída continua na lista | Frontend | Fácil |
| 2 | "Criada em" mostra a hora errada | Frontend | Fácil |
| 3 | Editar uma tarefa concluída faz ela voltar a pendente | Frontend | Médio |
| 4 | Nome de categoria comprido derruba a API | Frontend e API | Médio |
| 5 | "Pendentes por prioridade" conta tarefas concluídas | API | Médio |

A descrição de cada uma, com o passo a passo para reproduzir e uma dica, está em [`tasks/index.html`](tasks/index.html).

Para cada task:

1. Crie uma branch: `git checkout -b fix/task-1`.
2. No painel do Claude Code, digite `/sdd task 1`.
3. Revise a spec, o plan e as tasks antes de deixar o Claude implementar, e leia cada diff antes de aceitar.
4. Confira você mesmo: `npm test`, `npm run test:e2e` e o passo a passo da task na tela.
5. Faça o commit, o push e abra o pull request, como no capítulo 10 do guia.

---

## Próximos passos sugeridos

- Trocar `DB_SYNCHRONIZE` por migrations do TypeORM.
- Paginação e ordenação feitas pela API em vez de pela tela.
- Login e uma lista de tarefas por usuário.
- Dockerfile para a API e o frontend, para subir tudo com `docker compose up`.
