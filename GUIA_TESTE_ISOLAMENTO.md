# Guia de Teste do Isolamento por Entidade

## 📋 Pré-requisitos

1. ✅ Correções aplicadas no código
2. ✅ Sistema em funcionamento
3. ✅ Acesso ao banco de dados
4. ✅ Usuários de teste de diferentes entidades

## 🔍 Etapa 1: Verificar Dados Existentes

Execute o script de verificação:

```sql
-- Execute: sql/verificar_dados_existentes.sql
```

**O que verificar:**
- Quantos registros existem sem `entity_id`
- Se há relacionamentos inconsistentes
- Quais entidades existem no sistema

## 🧪 Etapa 2: Testes Funcionais

### Teste 1: Isolamento de Tipos de Documentos

1. **Login com Usuário da Entidade A**
   ```
   - Ir para /admin/document-types
   - Verificar se aparecem apenas tipos da Entidade A
   - Tentar criar um novo tipo
   - Verificar se o tipo foi associado à Entidade A
   ```

2. **Login com Usuário da Entidade B**
   ```
   - Ir para /admin/document-types
   - Verificar se aparecem apenas tipos da Entidade B
   - Não deve ver os tipos da Entidade A
   ```

3. **Login com Usuário Único (sem entidade)**
   ```
   - Ir para /admin/document-types
   - Verificar se aparecem apenas tipos sem entity_id
   - Criar um novo tipo
   - Verificar se entity_id = NULL
   ```

### Teste 2: Isolamento de Categorias

Repetir os mesmos testes acima para categorias em `/admin/categories`

### Teste 3: Isolamento de Departamentos

Repetir os mesmos testes acima para departamentos em `/admin/departments`

### Teste 4: Contagem de Documentos

1. **Verificar Dashboard/Estatísticas**
   ```
   - Cada usuário deve ver apenas contagem de documentos da sua entidade
   - Usuários únicos veem apenas seus próprios documentos
   ```

## 🔒 Etapa 3: Testes de Segurança

### Teste 1: Tentativa de Edição Cruzada

1. **Obter ID de tipo de documento de outra entidade**
   ```sql
   -- No banco, pegar um ID de tipo de documento de entidade diferente
   SELECT id, name, entity_id FROM document_types WHERE entity_id != 'sua-entidade-id';
   ```

2. **Tentar editar via API**
   ```javascript
   // Deve retornar erro de permissão
   fetch('/api/admin/document-types/ID-DE-OUTRA-ENTIDADE', {
     method: 'PUT',
     body: JSON.stringify({ name: 'Tentativa de hack' })
   })
   ```

### Teste 2: Verificar URLs Diretas

1. **Tentar acessar dados de outras entidades via URL**
   ```
   - Não deve ser possível ver/editar dados de outras entidades
   - Sistema deve retornar erro ou dados vazios
   ```

## 📊 Etapa 4: Verificação no Banco de Dados

### Consulta 1: Verificar Filtros

```sql
-- Simular consulta de usuário da Entidade A
SELECT * FROM document_types WHERE entity_id = 'entidade-a-id';

-- Simular consulta de usuário único
SELECT * FROM document_types WHERE entity_id IS NULL;
```

### Consulta 2: Verificar Criações

```sql
-- Verificar se novos registros têm entity_id correto
SELECT 
    name, 
    entity_id, 
    created_at 
FROM document_types 
ORDER BY created_at DESC 
LIMIT 10;
```

## ✅ Etapa 5: Checklist de Validação

### Funcionalidade ✅
- [ ] Usuários veem apenas dados da sua entidade
- [ ] Usuários únicos veem apenas dados sem entidade
- [ ] Criação de dados associa automaticamente à entidade
- [ ] Contagens são isoladas por entidade

### Segurança ✅
- [ ] Não é possível editar dados de outras entidades
- [ ] Não é possível ver dados de outras entidades
- [ ] APIs retornam erro para tentativas de acesso cruzado
- [ ] URLs diretas não expõem dados de outras entidades

### Performance ✅
- [ ] Consultas são rápidas (usando índices por entity_id)
- [ ] Não há consultas desnecessárias
- [ ] Frontend e backend consistentes

## 🚨 Problemas Comuns e Soluções

### Problema: Ainda vejo dados de outras entidades
**Solução:**
1. Verificar se o usuário tem `entity_id` correto no perfil
2. Limpar cache do navegador
3. Verificar logs do servidor

### Problema: Erro ao criar novos dados
**Solução:**
1. Verificar se o usuário está autenticado
2. Verificar se o perfil tem `entity_id` definido
3. Verificar logs de erro no console

### Problema: Relacionamentos inconsistentes
**Solução:**
1. Executar `sql/verificar_dados_existentes.sql`
2. Usar `sql/corrigir_dados_inconsistentes.sql` se necessário
3. Verificar se dados foram migrados corretamente

## 📝 Relatório de Teste

Após executar todos os testes, documente:

```markdown
## Resultado dos Testes - [Data]

### Isolamento Funcional
- ✅/❌ Tipos de documentos isolados
- ✅/❌ Categorias isoladas  
- ✅/❌ Departamentos isolados
- ✅/❌ Contagens isoladas

### Segurança
- ✅/❌ Edição cruzada bloqueada
- ✅/❌ Visualização cruzada bloqueada
- ✅/❌ APIs protegidas

### Observações
- [Descrever qualquer problema encontrado]
- [Soluções aplicadas]
- [Melhorias sugeridas]
```

## 🎯 Critérios de Sucesso

O teste é considerado **APROVADO** se:

1. ✅ Cada entidade vê apenas seus próprios dados
2. ✅ Usuários únicos veem apenas dados sem entidade
3. ✅ Não é possível acessar dados de outras entidades
4. ✅ Criação de dados respeita a entidade do usuário
5. ✅ Performance mantida ou melhorada
6. ✅ Sem erros no console ou logs

Se algum critério falhar, revisar as correções e repetir os testes.