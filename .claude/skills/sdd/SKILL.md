---
name: sdd
description: >-
  Conduz o desenvolvimento neste projeto com Spec-Driven Development, em etapas
  com revisão da pessoa entre elas. A spec diz o quê e por quê, o plan diz como,
  as tasks quebram em passos pequenos e o implement faz cada passo com um teste
  que falha primeiro. Use quando pedirem para resolver uma das tasks de
  tasks/index.html (por exemplo "task 2" ou "/sdd task 2"), corrigir um bug, ou
  criar ou mudar uma funcionalidade do Gestor de Tarefas.
---

# SDD: da task ao código testado

Este projeto segue o ciclo do capítulo 17 do guia (`trilha-estudos-fullstack.html`): constitution, spec, plan, tasks e implement. Cada etapa gera um arquivo em `specs/NNN-nome-curto/`, e a pessoa revisa cada um antes de seguir. Nunca pule uma revisão, mesmo quando a etapa parecer óbvia: o objetivo é a pessoa aprender e decidir junto.

Fale sempre em português, explique o que vai fazer antes de fazer e use exemplos do próprio projeto.

## Antes de começar

1. Leia `constitution.md`, nesta pasta. São as regras que todo trabalho precisa cumprir.
2. Entenda o pedido:
   - Se citarem uma task (por exemplo "task 3"), abra `tasks/index.html` e leia a task com esse número.
   - Se for outro pedido, resuma em uma frase e confirme com a pessoa antes de seguir.
3. Se for um problema, reproduza antes de escrever qualquer coisa. Diga o passo a passo que mostra o erro e o que aconteceu. Se não conseguir reproduzir, pare e conte o que tentou.
4. Escolha o próximo número livre em `specs/` (001, 002, ...) e um nome curto em kebab-case, por exemplo `specs/001-aviso-ao-cancelar/`.

## 1. Spec: o quê e por quê

- Crie `spec.md` a partir de `modelos/spec.md`.
- Escreva do ponto de vista de quem usa o sistema: problema, histórias, regras testáveis, critérios de aceite no formato "Dado, quando, então" e o que fica fora do escopo.
- Não cite tecnologia, arquivo nem nome de função. Isso é assunto do plan.
- Mostre a spec e **pare**. Só siga quando a pessoa aprovar. Se ela pedir ajustes, ajuste e mostre de novo.

## 2. Plan: como

- Crie `plan.md` a partir de `modelos/plan.md`.
- Para cada regra e critério da spec, diga em que camada (frontend, API, banco) e em quais arquivos ele vai morar, e qual teste vai provar que funciona.
- Confira o plano contra cada item da constituição.
- Mostre o plano e **pare** até a aprovação.

## 3. Tasks: passos pequenos

- Crie `tasks.md` a partir de `modelos/tasks.md`.
- A primeira tarefa de cada comportamento é o teste que reproduz o problema, e ele precisa falhar.
- Cada tarefa cabe num diff pequeno, fácil de ler. Marque com `[P]` as que podem ser feitas em qualquer ordem.
- Mostre a lista e **pare** até a aprovação.

## 4. Implement: uma tarefa por vez

Para cada tarefa, em ordem:

1. Escreva o teste e rode. Mostre a saída falhando pelo motivo certo.
2. Faça a menor mudança que resolve.
3. Rode de novo e mostre passando.
4. Marque a tarefa com `[x]` no `tasks.md`.

Se descobrir que a spec ou o plan estão errados, pare, proponha a correção do arquivo e só continue depois do OK. Spec e código nunca podem ficar diferentes.

## 5. Verificação final

- Rode todas as verificações (tabela abaixo) e mostre o resultado real.
- Teste na mão o que a spec promete, por exemplo com `npm run dev` e o navegador.
- Marque cada critério de aceite da spec com `[x]` e diga como conferiu.
- Confira que não ficou nenhum comentário no código (regra 2 da constituição).
- Termine com um resumo: o que mudou, quais arquivos, quais testes novos e o que a pessoa deve olhar no diff. Não faça commit nem push sem a pessoa pedir.

## Comandos do projeto

Rode na raiz do projeto.

| Para quê | Comando |
| --- | --- |
| Testes unitários da API e do frontend | `npm test` |
| Testes ponta a ponta da API (liga o banco antes) | `npm run test:e2e` |
| Só os testes da API | `npm test --prefix api` |
| Só os testes do frontend | `npm test --prefix frontend -- --watch=false --browsers=ChromeHeadless` |
| Build do frontend | `npm run build --prefix frontend` |
| Subir banco, API e frontend para testar na mão | `npm run dev` |

Nunca rode `npm test` dentro de `frontend/` sem `--watch=false`: ele fica esperando mudanças e a sessão trava.

Para entender a estrutura do projeto, leia o `README.md`. Para os conceitos, o guia `trilha-estudos-fullstack.html`.
