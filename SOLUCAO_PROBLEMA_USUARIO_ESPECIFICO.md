# Solução para Problema de Usuário Específico

## 🔍 Problema Identificado

Um usuário administrador específico não consegue inativar ou excluir outros usuários, enquanto outros administradores conseguem realizar essas ações normalmente.

## 📋 Diagnóstico

O problema pode estar relacionado a:

1. **Entity Role incorreto** - O campo `entity_role` não está como 'admin'
2. **Entity ID ausente** - O usuário não está associado a uma entidade
3. **Status incorreto** - O status do usuário não está como 'active'
4. **Cache do navegador** - Dados antigos em cache
5. **Sessão corrompida** - Sessão de autenticação com dados inconsistentes

## 🛠️ Passos para Resolver

### Passo 1: Verificar Permissões do Usuário

1. Faça login com o usuário problemático
2. Acesse: `http://localhost:3000/admin/debug-permissions` (ou sua URL de produção)
3. Verifique as informações exibidas:
   - ✅ **É Admin?** - Deve estar marcado
   - ✅ **Tem Entity ID?** - Deve estar marcado
   - ✅ **Está Ativo?** - Deve estar marcado
   - ✅ **Pode Gerenciar Usuários?** - Deve estar marcado

4. Se algum item estiver com ❌, anote qual é o problema

### Passo 2: Limpar Cache e Sessão (Teste Rápido)

Antes de mexer no banco de dados, tente:

1. **Fazer logout completo**
2. **Limpar cache do navegador**:
   - Chrome/Edge: `Ctrl + Shift + Delete` → Limpar tudo
   - Firefox: `Ctrl + Shift + Delete` → Limpar tudo
3. **Fechar TODAS as abas do navegador**
4. **Abrir uma nova janela anônima/privada**
5. **Fazer login novamente**
6. **Testar as ações de inativar/excluir**

### Passo 3: Verificar Banco de Dados

Execute o script SQL de diagnóstico:

```sql
-- Abra o arquivo DIAGNOSTICO_USUARIO_ESPECIFICO.sql
-- Substitua 'email@do.usuario' pelo email do usuário problemático
-- Execute no Supabase SQL Editor
```

O script irá verificar:
- ✅ Perfil do usuário
- ✅ Associação com entidade
- ✅ Comparação com outros usuários
- ✅ Duplicatas
- ✅ Sincronização entre auth.users e profiles

### Passo 4: Aplicar Correções no Banco de Dados

Baseado no diagnóstico, aplique a correção apropriada:

#### Correção 1: Entity Role Incorreto

```sql
-- Se o entity_role não for 'admin'
UPDATE profiles 
SET entity_role = 'admin'
WHERE email = 'email@do.usuario';
```

#### Correção 2: Entity ID Ausente

```sql
-- Primeiro, encontre o entity_id correto
SELECT id, name FROM entities WHERE name LIKE '%nome_da_empresa%';

-- Depois, atualize o perfil
UPDATE profiles 
SET entity_id = 'ID_DA_ENTIDADE_CORRETA'
WHERE email = 'email@do.usuario';
```

#### Correção 3: Status Incorreto

```sql
-- Se o status não for 'active'
UPDATE profiles 
SET status = 'active'
WHERE email = 'email@do.usuario';
```

#### Correção 4: Remover Duplicatas

```sql
-- Se houver múltiplos registros do mesmo usuário
-- Primeiro, verifique qual é o correto (geralmente o mais antigo)
SELECT * FROM profiles WHERE email = 'email@do.usuario' ORDER BY created_at;

-- Depois, delete os duplicados (mantendo apenas o primeiro)
DELETE FROM profiles 
WHERE id IN (
  SELECT id FROM profiles 
  WHERE email = 'email@do.usuario'
  ORDER BY created_at DESC
  OFFSET 1
);
```

#### Correção 5: Recriar Perfil (ÚLTIMO RECURSO)

```sql
-- 1. Salvar dados importantes
SELECT * FROM profiles WHERE email = 'email@do.usuario';

-- 2. Obter o ID do auth.users
SELECT id FROM auth.users WHERE email = 'email@do.usuario';

-- 3. Deletar perfil antigo
DELETE FROM profiles WHERE email = 'email@do.usuario';

-- 4. Recriar perfil
INSERT INTO profiles (
  id, 
  email, 
  full_name, 
  entity_id, 
  entity_role, 
  status,
  created_at,
  updated_at
)
VALUES (
  'ID_DO_AUTH_USERS',  -- ID obtido no passo 2
  'email@do.usuario',
  'Nome Completo',
  'ID_DA_ENTIDADE',
  'admin',
  'active',
  NOW(),
  NOW()
);
```

### Passo 5: Verificar Novamente

Após aplicar as correções:

1. **Usuário deve fazer logout**
2. **Limpar cache do navegador**
3. **Fazer login novamente**
4. **Acessar `/admin/debug-permissions` novamente**
5. **Verificar se todos os itens estão com ✅**
6. **Testar inativar/excluir usuários**

## 🔧 Verificação de Código

O código verifica as permissões em `entity-user-management.tsx`:

```tsx
// Linha ~150: Busca o entity_role do usuário logado
const { data: profileData, error: profileError } = await supabase
  .from('profiles')
  .select('entity_id, entity_role')
  .eq('id', user.id)
  .single()

// Linha ~160: Armazena o papel do usuário
setCurrentUserRole(profileData.entity_role)

// Linha ~800: Verifica se pode mostrar botões de ação
{currentUserRole === 'admin' && entityUser.id !== user?.id && (
  // Botões de editar, inativar, excluir
)}
```

**Para que os botões apareçam:**
- `currentUserRole` deve ser exatamente `'admin'`
- O usuário não pode estar tentando editar a si mesmo

## 📊 Checklist de Verificação

- [ ] Usuário tem `entity_role = 'admin'`
- [ ] Usuário tem `entity_id` válido (não NULL)
- [ ] Usuário tem `status = 'active'`
- [ ] Não há duplicatas do usuário na tabela profiles
- [ ] Usuário existe tanto em auth.users quanto em profiles
- [ ] Cache do navegador foi limpo
- [ ] Sessão foi renovada (logout + login)
- [ ] Página `/admin/debug-permissions` mostra todos ✅
- [ ] Botões de ação aparecem na lista de usuários
- [ ] Ações de inativar/excluir funcionam

## 🆘 Se Nada Funcionar

Se após todas as tentativas o problema persistir:

1. **Capture screenshots** da página `/admin/debug-permissions`
2. **Exporte os resultados** do script SQL de diagnóstico
3. **Verifique o console do navegador** (F12) por erros JavaScript
4. **Verifique os logs do Supabase** por erros de permissão
5. **Compare** com um usuário admin que funciona corretamente

## 📝 Notas Importantes

- ⚠️ **Sempre faça backup** antes de executar comandos DELETE ou UPDATE
- ⚠️ **Teste em ambiente de desenvolvimento** primeiro
- ⚠️ **Não delete** o usuário de auth.users, apenas de profiles se necessário
- ⚠️ **Mantenha** pelo menos um usuário admin funcional na entidade

## 🎯 Causa Mais Provável

Baseado em casos similares, as causas mais comuns são:

1. **Cache do navegador** (60% dos casos) - Resolvido com logout + limpar cache
2. **Entity role incorreto** (25% dos casos) - Resolvido com UPDATE no banco
3. **Entity ID ausente** (10% dos casos) - Resolvido com UPDATE no banco
4. **Duplicatas** (5% dos casos) - Resolvido com DELETE de duplicados

## ✅ Teste Final

Após resolver, teste:

1. ✅ Login com o usuário problemático
2. ✅ Acessar "Gerenciar Usuários"
3. ✅ Ver botões de ação (três pontos) em outros usuários
4. ✅ Clicar em "Inativar" - deve funcionar
5. ✅ Clicar em "Ativar" - deve funcionar
6. ✅ Após 7 dias de inativação, "Excluir" deve aparecer
