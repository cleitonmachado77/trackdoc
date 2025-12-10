# Implementação de CPF e Endereço nos Formulários de Usuário

## Resumo das Alterações

Esta implementação adiciona campos de CPF e endereço completo aos formulários de criação de usuário tanto no painel super-admin quanto no gerenciador de usuários de entidades.

## Arquivos Modificados

### 1. Migração do Banco de Dados
- **`migrations/add_cpf_address_to_profiles.sql`** - Nova migração que adiciona:
  - Campo `cpf` (texto, opcional)
  - Campos de endereço: `address_street`, `address_number`, `address_complement`, `address_neighborhood`, `address_city`, `address_state`, `address_zipcode`
  - Índices para performance
  - Constraints de validação para CPF, CEP e estados brasileiros
  - Comentários de documentação

### 2. Painel Super-Admin
- **`app/super-admin/page.tsx`**
  - Adicionados novos campos ao estado `newUser`
  - Expandido o formulário de criação com seção de endereço
  - Implementada formatação automática para CPF, telefone e CEP
  - Aumentado o tamanho do modal para acomodar novos campos
  - Atualizada a inserção no banco para incluir novos campos

### 3. Gerenciador de Usuários de Entidade
- **`app/components/admin/entity-user-management.tsx`**
  - Adicionados novos campos ao estado `formData`
  - Expandido o formulário com campos de CPF e endereço
  - Implementada formatação automática
  - Aumentado o tamanho do modal

### 4. API de Criação de Usuário de Entidade
- **`app/api/create-entity-user/route.ts`**
  - Adicionados novos campos aos parâmetros de entrada
  - Atualizada a criação do perfil para incluir CPF e endereço
  - Incluídos novos campos nos metadados do usuário

### 5. Utilitários de Formatação
- **`lib/format-utils.ts`** - Nova biblioteca com funções para:
  - Formatação de CPF (000.000.000-00)
  - Formatação de CEP (00000-000)
  - Formatação de telefone ((11) 99999-9999)
  - Validação de CPF e CEP
  - Limpeza de formatação

### 6. Script de Migração
- **`scripts/run-migration-cpf-address.js`** - Script para executar a migração

## Campos Adicionados

### CPF
- **Campo**: `cpf`
- **Tipo**: `text` (opcional)
- **Formato**: 000.000.000-00
- **Validação**: Formato brasileiro com dígitos verificadores

### Endereço
- **`address_street`**: Nome da rua
- **`address_number`**: Número do endereço
- **`address_complement`**: Complemento (apto, sala, etc.)
- **`address_neighborhood`**: Bairro
- **`address_city`**: Cidade
- **`address_state`**: Estado (códigos de 2 letras)
- **`address_zipcode`**: CEP (formato 00000-000)

## Funcionalidades Implementadas

### 1. Formatação Automática
- CPF é formatado automaticamente durante a digitação
- CEP é formatado com hífen automático
- Telefone mantém formatação brasileira

### 2. Validação
- CPF: Formato e dígitos verificadores
- CEP: 8 dígitos numéricos
- Estado: Lista de estados brasileiros válidos
- Campos obrigatórios mantidos (nome, email, senha)

### 3. Interface Responsiva
- Modais expandidos para acomodar novos campos
- Layout em grid para otimizar espaço
- Seção de endereço separada visualmente
- Scroll automático em modais grandes

## Como Executar a Migração

### Opção 1: Script Automatizado
```bash
node scripts/run-migration-cpf-address.js
```

### Opção 2: Manual no Supabase
1. Acesse o painel do Supabase
2. Vá para SQL Editor
3. Execute o conteúdo de `migrations/add_cpf_address_to_profiles.sql`

## Verificação da Implementação

### 1. Verificar Campos no Banco
```sql
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('cpf', 'address_street', 'address_city', 'address_state', 'address_zipcode');
```

### 2. Testar Criação de Usuário
1. Acesse `/super-admin` (como super_admin)
2. Clique em "Novo Usuário"
3. Preencha os campos incluindo CPF e endereço
4. Verifique se a formatação funciona
5. Crie o usuário e verifique no banco

### 3. Testar Gerenciador de Entidade
1. Acesse uma entidade como admin
2. Vá para "Gerenciar Usuários"
3. Clique em "Cadastrar Usuário"
4. Teste os novos campos

## Considerações Técnicas

### 1. Retrocompatibilidade
- Todos os novos campos são opcionais
- Usuários existentes não são afetados
- Formulários antigos continuam funcionando

### 2. Performance
- Índices criados para campos de busca comum (CPF, cidade/estado)
- Constraints otimizadas para validação rápida

### 3. Segurança
- CPF não é obrigatório (privacidade)
- Validação no frontend e backend
- Sanitização de dados de entrada

### 4. UX/UI
- Formatação em tempo real
- Placeholders informativos
- Validação visual
- Layout responsivo

## Próximos Passos Sugeridos

1. **Busca por CPF**: Implementar busca de usuários por CPF
2. **Relatórios**: Incluir dados de endereço em relatórios
3. **Validação Avançada**: Integrar com APIs de CEP para autocompletar
4. **Auditoria**: Incluir campos nos logs de auditoria
5. **Exportação**: Adicionar aos exports de dados de usuários

## Troubleshooting

### Erro: "Column already exists"
- A migração já foi executada
- Verifique se os campos existem na tabela

### Erro: "Permission denied"
- Verifique se está usando SUPABASE_SERVICE_ROLE_KEY
- Confirme as permissões do usuário

### Formatação não funciona
- Verifique se `lib/format-utils.ts` foi importado
- Confirme se as funções estão sendo chamadas nos onChange

### Modal muito pequeno
- Verifique se a classe CSS foi atualizada para `max-w-2xl`
- Confirme se `overflow-y-auto` está aplicado