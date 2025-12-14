# Correção: Dados do Plano na Página Minha Conta

## Problema Identificado
Os dados exibidos na aba "Plano" da página "Minha Conta" não estavam refletindo corretamente todas as informações do plano cadastrado no banco de dados.

## Solução Implementada

### 1. Atualização da Função RPC
A função `get_user_active_subscription` foi atualizada para retornar todos os campos do plano:
- `usuario_adicional_preco` - Preço por usuário adicional
- `armazenamento_extra_preco` - Preço por GB adicional
- `plan_description` - Descrição do plano
- `plan_interval` - Intervalo de cobrança
- `plan_price_yearly` - Preço anual
- `max_documentos` - Limite de documentos

### 2. Atualização do Hook useSubscription
O hook foi atualizado para mapear corretamente os novos campos retornados pela função RPC.

### 3. Formatação de Preços
Os preços agora são exibidos com formatação brasileira (vírgula como separador decimal).

## Como Executar a Migração

Execute o seguinte SQL no Supabase:

```sql
-- Arquivo: migrations/fix_subscription_plan_data.sql
```

### Passos:
1. Acesse o painel do Supabase
2. Vá em "SQL Editor"
3. Cole o conteúdo do arquivo `migrations/fix_subscription_plan_data.sql`
4. Execute o script

## Verificação

Após executar a migração, teste com:

```sql
-- Substitua pelo ID de um usuário real
SELECT * FROM get_user_active_subscription('seu-user-id-aqui');
```

O resultado deve incluir todos os campos do plano, incluindo:
- `usuario_adicional_preco`
- `armazenamento_extra_preco`
- `plan_description`
- `plan_interval`

## Comportamento Esperado

Quando o plano de um usuário for alterado:
1. A subscription é atualizada com o novo `plan_id`
2. A função RPC busca os dados do novo plano via JOIN
3. O frontend exibe automaticamente os dados atualizados do novo plano

Não é necessário duplicar dados do plano na subscription - os dados sempre vêm diretamente da tabela `plans`.
