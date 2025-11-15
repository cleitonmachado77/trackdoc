# Resumo: Problema de Usuário Específico

## 🎯 Problema
Um usuário administrador específico não consegue inativar ou excluir outros usuários, mas outros administradores conseguem.

## 🔍 Causa Provável
O problema está relacionado a uma das seguintes causas:

1. **Cache do navegador** com dados antigos (mais comum)
2. **Entity role** não está como 'admin' no banco de dados
3. **Entity ID** ausente ou inválido
4. **Status** não está como 'active'

## ⚡ Solução Rápida (Teste Primeiro)

### Opção 1: Limpar Cache
```
1. Fazer logout
2. Limpar cache do navegador (Ctrl + Shift + Delete)
3. Fechar todas as abas
4. Abrir janela anônima
5. Fazer login novamente
6. Testar
```

### Opção 2: Verificar Permissões
```
1. Login com o usuário problemático
2. Acessar: /admin/debug-permissions
3. Verificar se todos os itens estão com ✅
4. Se algum estiver com ❌, seguir para correção no banco
```

## 🛠️ Correção no Banco de Dados

### Verificar o Problema
```sql
-- Use o arquivo DIAGNOSTICO_SIMPLES.sql
-- Substitua 'email@do.usuario' pelo email real
-- Execute a QUERY 1 primeiro:

SELECT 
  id,
  email,
  full_name,
  entity_id,
  entity_role,
  status
FROM profiles
WHERE email = 'email@do.usuario';
```

### Aplicar Correção
```sql
-- Se entity_role não for 'admin'
UPDATE profiles 
SET entity_role = 'admin'
WHERE email = 'email@do.usuario';

-- Se entity_id for NULL (substitua pelo ID correto)
UPDATE profiles 
SET entity_id = 'ID_DA_ENTIDADE'
WHERE email = 'email@do.usuario';

-- Se status não for 'active'
UPDATE profiles 
SET status = 'active'
WHERE email = 'email@do.usuario';
```

## 📁 Arquivos Criados

1. **DIAGNOSTICO_SIMPLES.sql** - Script SQL simplificado (USE ESTE!)
2. **DIAGNOSTICO_USUARIO_ESPECIFICO.sql** - Script completo de diagnóstico
3. **SOLUCAO_PROBLEMA_USUARIO_ESPECIFICO.md** - Guia detalhado passo a passo
4. **app/admin/debug-permissions/page.tsx** - Página de debug
5. **app/components/admin/debug-user-permissions.tsx** - Componente de debug

## 🎬 Próximos Passos

1. **Teste a solução rápida** (limpar cache)
2. **Se não resolver**, acesse `/admin/debug-permissions`
3. **Identifique o problema** específico
4. **Execute o SQL** apropriado no Supabase
5. **Faça logout e login** novamente
6. **Teste as ações** de inativar/excluir

## ✅ Como Saber se Resolveu

- ✅ Página `/admin/debug-permissions` mostra todos os itens com ✅
- ✅ Botões de ação (três pontos) aparecem ao lado dos usuários
- ✅ Clicar em "Inativar" funciona
- ✅ Clicar em "Ativar" funciona
- ✅ Após 7 dias, "Excluir" aparece e funciona

## 📞 Suporte

Se o problema persistir após todas as tentativas:
1. Capture screenshot da página `/admin/debug-permissions`
2. Execute o script SQL de diagnóstico
3. Verifique o console do navegador (F12) por erros
4. Compare com um usuário admin que funciona
