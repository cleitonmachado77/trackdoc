# Problemas Identificados no Sistema de Aprovação

## Resumo dos Problemas Encontrados

### 1. **API de Aprovações Desabilitada**
- **Problema**: A API `/api/approvals/route.ts` estava retornando dados vazios e mensagem "Sistema de aprovações desabilitado"
- **Impacto**: Nenhuma aprovação funcionava pois a API principal estava desabilitada
- **Status**: ❌ CRÍTICO

### 2. **Foreign Key Faltando**
- **Problema**: A tabela `approval_requests` pode não ter a foreign key para `documents(id)`
- **Impacto**: Dados órfãos e queries falhando
- **Correção**: Script SQL criado para adicionar a constraint

### 3. **Queries Incorretas nos Componentes**
- **Problema**: Componentes usando joins incorretos e referências de foreign key inexistentes
- **Impacto**: Dados não carregavam corretamente
- **Correção**: Queries reescritas para buscar dados separadamente

### 4. **Notificações Incompletas**
- **Problema**: Tabela `notifications` sem colunas necessárias (`recipients`, `channels`, `status`, `priority`)
- **Impacto**: Notificações não eram enviadas aos aprovadores
- **Correção**: Script SQL para adicionar colunas faltantes

### 5. **Triggers e Funções Ausentes**
- **Problema**: Não havia triggers automáticos para notificar aprovadores
- **Impacto**: Usuários não recebiam avisos de documentos pendentes
- **Correção**: Criadas funções e triggers automáticos

## Correções Aplicadas

### 1. **Scripts SQL Criados**
- `database/fix-approval-system.sql` - Corrige estrutura do banco
- `database/test-approval-system.sql` - Testa o sistema

### 2. **Componentes Corrigidos**
- `app/components/document-upload-with-approval.tsx` - Corrigido upload com aprovação
- `app/components/pending-approval-documents.tsx` - Corrigidas queries
- `hooks/use-approvals.ts` - Corrigido hook de aprovações

### 3. **Debug Criado**
- `app/components/debug-approval-system.tsx` - Componente para testar o sistema
- Acesso via URL: `?view=debug-approvals`

## Passos para Resolver

### 1. **Executar Scripts SQL**
```sql
-- 1. Execute no SQL Editor do Supabase:
-- database/fix-approval-system.sql

-- 2. Teste o sistema:
-- database/test-approval-system.sql
```

### 2. **Reativar API de Aprovações**
A API `/api/approvals/route.ts` precisa ser reativada ou o sistema precisa usar apenas o Supabase diretamente.

### 3. **Testar Funcionalidade**
1. Acesse `?view=debug-approvals`
2. Crie um teste de aprovação
3. Verifique se as notificações são criadas
4. Teste aprovação/rejeição

### 4. **Verificar Políticas RLS**
As políticas RLS foram atualizadas para permitir:
- Aprovadores verem documentos que precisam aprovar
- Autores verem status de seus documentos
- Notificações serem criadas automaticamente

## Fluxo Correto de Aprovação

### 1. **Upload com Aprovação**
1. Usuário faz upload do documento
2. Seleciona aprovador
3. Documento fica com status `pending_approval`
4. `approval_request` é criado com status `pending`
5. Trigger automático cria notificação para o aprovador

### 2. **Aprovação**
1. Aprovador acessa página de aprovações
2. Vê documentos pendentes
3. Aprova ou rejeita com comentários
4. Status do `approval_request` é atualizado
5. Se não há mais aprovadores pendentes, documento fica `approved`/`rejected`
6. Trigger automático notifica o autor

### 3. **Notificações**
- Aprovador recebe notificação quando documento é enviado
- Autor recebe notificação quando documento é aprovado/rejeitado
- Notificações incluem comentários do aprovador

## Próximos Passos

1. **Execute os scripts SQL**
2. **Teste com o componente de debug**
3. **Verifique se as notificações estão funcionando**
4. **Teste o fluxo completo de aprovação**

## Monitoramento

Use as queries do arquivo `test-approval-system.sql` para monitorar:
- Approval requests órfãos
- Documentos sem approval requests
- Estatísticas do sistema
- Triggers e funções ativas