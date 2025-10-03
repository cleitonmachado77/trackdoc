# Plano de Testes – Tramitação de Documentos

## Cenários Principais

1. **Criação de Template Simples**
   - Abrir modal de novo template.
   - Adicionar nó de usuário (solicitante) e nó de ação (assinatura simples).
   - Salvar e verificar listagem via `/api/workflows/templates`.

2. **Criação de Template Assinatura Múltipla**
   - Configurar `targetUsers` com dois usuários.
   - Validar que `requiresAll` é true.

3. **Iniciar Processo**
   - Usar `StartProcess` com template simples, documento mock.
   - Confirmar resposta `{ success: true, processId }`.

4. **Fluxo Assinatura Simples**
   - Executar ação `sign` via `/api/workflows/{processId}/executions`.
   - Verificar update de `workflow_executions` e novo step/Golpes.

5. **Fluxo Assinatura Múltipla**
   - Assinar com usuário1 (status `waiting`).
   - Assinar usuário2 (status `advanced`).
   - Confirmar substituição do documento (mock) e finalização.

6. **Aprovação/Reprovação**
   - Template com ação `approve`.
   - Aprovar → fluxo avança.
   - Reprovar → processo finaliza/cancelado.

7. **Retorno de Etapa**
   - Executar `workflow_return_step` via PATCH.
   - Garantir recriação de execuções anteriores.

## Verificações Técnicas

- Logs em `workflow_logs` após cada ação.
- Estrutura JSON retornada por `/api/workflows` inclui execuções e `pendingExecutions`.
- Testes unitários/mock (pendente) para RPCs críticas.

## Documentação & Deploy

1. Atualizar README/Docs com enquadramento da nova arquitetura.
2. Checklist de deploy:
   - Rodar migrations + seed.
   - Atualizar env (se necessário) com variáveis de assinatura.
   - Rodar testes manuais listados acima.


