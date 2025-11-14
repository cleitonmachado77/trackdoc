# Guia Passo a Passo - Correção de Departamentos

## 🎯 Objetivo
Corrigir os problemas na página de Departamentos onde:
1. Mensagem laranja "Gerente obrigatório" aparece mesmo com gerente atribuído
2. Botão "Departamento ativo" não funciona

---

## 📋 Passo 1: Verificar o Console do Navegador

1. Abra a aplicação no navegador
2. Pressione **F12** para abrir o DevTools
3. Vá para a aba **Console**
4. Navegue até a página de **Administração > Departamentos**
5. Observe os logs que aparecem:

### Logs Esperados (Situação Normal):
```
🔍 [DEBUG] Departamentos retornados do Supabase: 3
🔍 [DEBUG] Primeiro departamento (raw): { id: "...", name: "...", manager_id: "...", ... }
🔍 [DEBUG] Departamento carregado: { id: "...", name: "Tesouraria", manager_id: "...", manager_name: "João Silva", status: "active" }
🔍 [DEBUG] DepartmentManagerInfo: { departmentId: "...", departmentName: "Tesouraria", manager_id: "...", manager_name: "João Silva", hasManagerName: true }
```

### Logs de Problema:
```
⚠️ [AVISO] Departamento tem manager_id mas manager_name não foi carregado
❌ [ERRO] Não foi possível carregar o nome do gerente
```

---

## 📋 Passo 2: Executar Diagnóstico SQL

1. Acesse o **Supabase Dashboard**
2. Vá para **SQL Editor**
3. Abra o arquivo `DIAGNOSTICO_E_CORRECAO_DEPARTAMENTOS.sql`
4. Execute as queries da **PARTE 1 (DIAGNÓSTICO)**

### Queries Principais:

#### Query 1.3 - Ver todos os departamentos
```sql
SELECT 
    d.id,
    d.name AS departamento,
    d.manager_id,
    p.full_name AS gerente_nome,
    p.email AS gerente_email,
    d.status,
    CASE 
        WHEN d.manager_id IS NULL THEN '❌ SEM GERENTE'
        WHEN p.id IS NULL THEN '⚠️ GERENTE NÃO ENCONTRADO (ID INVÁLIDO)'
        WHEN p.full_name IS NULL OR p.full_name = '' THEN '⚠️ GERENTE SEM NOME'
        ELSE '✅ OK'
    END AS status_gerente
FROM departments d
LEFT JOIN profiles p ON d.manager_id = p.id
ORDER BY d.name;
```

**Resultado Esperado:**
- Todos os departamentos devem mostrar `✅ OK` na coluna `status_gerente`
- Se aparecer `⚠️`, há um problema no banco de dados

#### Query 1.4 - Verificar manager_id inválidos
```sql
SELECT 
    d.id,
    d.name AS departamento,
    d.manager_id,
    '⚠️ PROBLEMA CRÍTICO: manager_id existe mas usuário não encontrado' AS problema
FROM departments d
LEFT JOIN profiles p ON d.manager_id = p.id
WHERE d.manager_id IS NOT NULL 
    AND p.id IS NULL;
```

**Resultado Esperado:**
- Nenhuma linha retornada
- Se retornar linhas, esses departamentos têm `manager_id` inválido

---

## 📋 Passo 3: Analisar os Resultados

### Cenário A: Tudo OK no Banco de Dados
Se as queries SQL mostraram `✅ OK` para todos os departamentos:
- O problema era apenas no código frontend
- As correções já aplicadas devem resolver
- Vá para o **Passo 5 (Testar)**

### Cenário B: Problemas no Banco de Dados
Se as queries SQL mostraram `⚠️` ou `❌`:
- Há problemas nos dados
- Vá para o **Passo 4 (Corrigir Banco)**

---

## 📋 Passo 4: Corrigir Banco de Dados (Se Necessário)

### Problema 1: manager_id inválido
Se a query 1.4 retornou linhas:

```sql
-- Limpar manager_id inválidos
UPDATE departments d
SET manager_id = NULL,
    updated_at = NOW()
WHERE manager_id IS NOT NULL
    AND NOT EXISTS (
        SELECT 1 FROM profiles p WHERE p.id = d.manager_id
    );
```

### Problema 2: Gerente não está em user_departments
Se a query 1.6 mostrou problemas:

```sql
-- Adicionar gerentes à tabela user_departments
INSERT INTO user_departments (user_id, department_id, role_in_department, is_primary, assigned_at)
SELECT 
    d.manager_id,
    d.id,
    'manager',
    true,
    NOW()
FROM departments d
WHERE d.manager_id IS NOT NULL
    AND NOT EXISTS (
        SELECT 1 
        FROM user_departments ud 
        WHERE ud.user_id = d.manager_id 
            AND ud.department_id = d.id
    );
```

### Problema 3: Gerente sem nome
Se a query 1.5 mostrou problemas:

```sql
-- Verificar quais usuários não têm nome
SELECT id, email, full_name
FROM profiles
WHERE id IN (SELECT manager_id FROM departments WHERE manager_id IS NOT NULL)
    AND (full_name IS NULL OR full_name = '');

-- Atualizar manualmente os nomes se necessário
-- UPDATE profiles SET full_name = 'Nome Completo' WHERE id = 'user_id_aqui';
```

---

## 📋 Passo 5: Testar as Correções

### Teste 1: Verificar Cards dos Departamentos
1. Recarregue a página de Departamentos (Ctrl+F5)
2. Verifique cada card de departamento
3. **Resultado esperado:**
   - Cards com gerente devem mostrar o nome do gerente em azul
   - Cards sem gerente devem mostrar alerta amarelo "Sem gerente atribuído"
   - **NÃO** deve aparecer alerta laranja "Gerente obrigatório" nos cards

### Teste 2: Editar Departamento com Gerente
1. Clique em **Editar** em um departamento que tem gerente
2. Verifique o modal que abre
3. **Resultado esperado:**
   - O dropdown "Gerente" deve mostrar o gerente atual selecionado
   - **NÃO** deve aparecer o alerta laranja "Gerente obrigatório"
   - O Switch "Departamento ativo" deve estar no estado correto

### Teste 3: Testar Switch de Status
1. No modal de edição, clique no Switch "Departamento ativo"
2. **Resultado esperado:**
   - O Switch deve mudar de estado visualmente
   - Ao clicar novamente, deve voltar ao estado anterior
3. Mude o status e clique em "Atualizar Departamento"
4. Verifique se o status foi salvo corretamente

### Teste 4: Criar Novo Departamento
1. Clique em **Novo Departamento**
2. Preencha o nome: "Teste"
3. **Resultado esperado:**
   - Deve aparecer o alerta laranja "Gerente obrigatório"
4. Selecione um gerente no dropdown
5. **Resultado esperado:**
   - O alerta laranja deve desaparecer
6. Teste o Switch "Departamento ativo"
7. Clique em "Criar Departamento"
8. Verifique se foi criado corretamente

### Teste 5: Verificar Console
1. Durante todos os testes, observe o console (F12)
2. **Resultado esperado:**
   - Logs `🔍 [DEBUG]` mostrando os dados corretos
   - **NÃO** deve aparecer `⚠️ [AVISO]` ou `❌ [ERRO]`

---

## 📋 Passo 6: Verificar Logs de Debug

### Logs ao Carregar a Página:
```
🔍 [DEBUG] Departamentos retornados do Supabase: 3
🔍 [DEBUG] Primeiro departamento (raw): { ... }
🔍 [DEBUG] Departamento carregado: { manager_name: "João Silva" }
🔍 [DEBUG] DepartmentManagerInfo: { hasManagerName: true }
```

### Logs ao Editar Departamento:
```
🔍 [DEBUG] Carregando departamento: { manager_id: "...", manager_name: "João Silva" }
```

### Logs ao Mudar Campos:
```
🔍 [DEBUG] Atualizando campo: { field: "status", value: true, newValue: "active" }
🔍 [DEBUG] FormData atualizado: { status: "active" }
```

---

## 📋 Passo 7: Remover Logs de Debug (Produção)

Após confirmar que tudo está funcionando:

1. Abra `app/components/admin/department-management.tsx`
2. Remova todos os `console.log` que começam com `🔍 [DEBUG]`
3. Abra `hooks/use-departments.ts`
4. Remova todos os `console.log` de debug

---

## ❓ Troubleshooting

### Problema: Ainda aparece alerta laranja no card
**Possíveis causas:**
1. `manager_name` está vazio no banco
2. Políticas RLS bloqueando acesso aos dados do gerente
3. Cache do navegador

**Solução:**
1. Execute a query 1.3 do SQL para verificar
2. Limpe o cache do navegador (Ctrl+Shift+Delete)
3. Verifique os logs no console

### Problema: Switch não funciona
**Possíveis causas:**
1. Código não foi atualizado corretamente
2. Cache do navegador

**Solução:**
1. Faça hard refresh (Ctrl+F5)
2. Verifique se o arquivo foi salvo corretamente
3. Verifique os logs no console ao clicar no Switch

### Problema: Erro ao salvar departamento
**Possíveis causas:**
1. Políticas RLS bloqueando atualização
2. Usuário sem permissão
3. Dados inválidos

**Solução:**
1. Verifique o console para ver o erro exato
2. Execute a query 3.1 do SQL para verificar políticas
3. Verifique se o usuário tem permissão de admin

---

## 📞 Suporte

Se os problemas persistirem, forneça:

1. **Screenshots do console** (F12 > Console)
2. **Resultado das queries SQL** (especialmente 1.3, 1.4, 1.6)
3. **Descrição detalhada** do comportamento observado
4. **Passos para reproduzir** o problema

---

## ✅ Checklist Final

- [ ] Logs de debug aparecem no console
- [ ] Query 1.3 mostra `✅ OK` para todos os departamentos
- [ ] Query 1.4 não retorna nenhuma linha
- [ ] Cards dos departamentos mostram gerente corretamente
- [ ] Alerta laranja NÃO aparece em departamentos com gerente
- [ ] Switch "Departamento ativo" funciona
- [ ] Possível criar novo departamento
- [ ] Possível editar departamento existente
- [ ] Logs de debug removidos (produção)
