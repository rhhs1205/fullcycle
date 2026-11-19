# Constituição do projeto

Regras que valem para toda mudança no Gestor de Tarefas. Se uma regra atrapalhar, converse com a pessoa e mude este arquivo antes de mudar o código.

1. **Teste antes da correção.** Todo comportamento novo ou corrigido tem um teste que falha antes da mudança e passa depois.
2. **Código sem comentários.** Nomes claros explicam o código. Nada de `//`, `/* */` ou `<!-- -->` explicativos.
3. **Português e padrão do projeto.** Nomes em português, no estilo que já existe (`carregar`, `filtrar`, `TarefasStore`, `ErroApi`), seguindo as pastas atuais.
4. **Cada coisa no seu lugar.** Na API, a regra de negócio fica no service e o controller só repassa. No frontend, o service só conversa com a API, o store guarda o estado e a página mostra.
5. **Dado inválido para no 400.** A API valida a entrada antes do banco. Erro previsível nunca vira 500.
6. **Nenhuma dependência nova sem motivo.** Toda biblioteca nova precisa de justificativa no `plan.md`.
7. **Documentação junto com o código.** Se a mudança altera algo que o `README.md` ou o guia descrevem, atualize os dois.
8. **Tudo verde no fim.** `npm test` e `npm run test:e2e` passam antes de dar o trabalho por encerrado.
