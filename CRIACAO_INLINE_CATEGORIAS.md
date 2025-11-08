# Criação Inline de Categorias, Departamentos e Tipos de Documento

## Funcionalidade Implementada

Agora é possível criar categorias, departamentos e tipos de documento diretamente na tela de upload/criação de documentos, sem precisar sair do fluxo de trabalho.

## Componente Criado

### InlineCreateSelect
**Arquivo:** `app/components/inline-create-select.tsx`

Componente reutilizável que combina:
- Select dropdown com opções existentes
- Botão "+" para criar novo item
- Dialog modal para criação inline
- Validação de campos obrigatórios
- Feedback visual de loading

#### Características:
- ✅ Totalmente tipado com TypeScript
- ✅ Suporta campos: text, textarea, select
- ✅ Validação de campos obrigatórios
- ✅ Feedback de loading durante criação
- ✅ Toast de sucesso após criação
- ✅ Atualização automática da lista após criação

## Onde Foi Implementado

### 1. Document Modal (document-modal.tsx)
Substituídos os selects tradicionais por InlineCreateSelect em:
- **Departamento/Setor** - Permite criar novo departamento
- **Tipo de Documento** - Permite criar novo tipo
- **Categoria** - Permite criar nova categoria

### 2. Document Upload (document-upload.tsx)
Substituídos os selects tradicionais por InlineCreateSelect em:
- **Categoria** - Permite criar nova categoria
- **Departamento** - Permite criar novo departamento
- **Tipo de Documento** - Permite criar novo tipo

## Como Usar

### Para o Usuário:

1. **Ao criar/editar documento:**
   - Clique no botão "+" ao lado do select
   - Preencha os campos no modal
   - Clique em "Criar"
   - O novo item é criado e automaticamente selecionado

2. **Campos disponíveis:**

   **Departamento:**
   - Nome do Departamento (obrigatório)
   - Nome Curto (obrigatório)
   - Descrição (opcional)

   **Tipo de Documento:**
   - Nome do Tipo (obrigatório)
   - Prefixo (obrigatório) - Ex: POL, PROC, INST
   - Descrição (opcional)
   - Cor (opcional) - Para identificação visual

   **Categoria:**
   - Nome da Categoria (obrigatório)
   - Descrição (opcional)
   - Cor (opcional) - Para identificação visual

## Exemplo de Uso no Código

```tsx
<InlineCreateSelect
  value={selectedCategory}
  onValueChange={setSelectedCategory}
  options={categories}
  placeholder="Selecione uma categoria"
  label="Categoria"
  onCreate={async (data) => {
    const { data: newCat, error } = await supabase
      .from('categories')
      .insert({
        name: data.name,
        description: data.description,
        color: data.color || '#3B82F6',
        status: 'active'
      })
      .select()
      .single()
    
    if (error) throw error
    
    toast({
      title: "Categoria criada!",
      description: `${newCat.name} foi criada com sucesso.`,
    })
    
    return newCat
  }}
  createFields={[
    { 
      name: 'name', 
      label: 'Nome da Categoria', 
      type: 'text', 
      required: true, 
      placeholder: 'Ex: Documentos Internos' 
    },
    { 
      name: 'description', 
      label: 'Descrição', 
      type: 'textarea', 
      placeholder: 'Descrição da categoria' 
    },
    { 
      name: 'color', 
      label: 'Cor', 
      type: 'select', 
      options: [
        { value: '#3B82F6', label: 'Azul' },
        { value: '#10B981', label: 'Verde' },
        // ... mais cores
      ]
    }
  ]}
  createTitle="Criar Nova Categoria"
/>
```

## Fluxo de Criação

```
1. Usuário clica no botão "+"
   ↓
2. Modal de criação abre
   ↓
3. Usuário preenche campos
   ↓
4. Clica em "Criar"
   ↓
5. Validação de campos obrigatórios
   ↓
6. Chamada à função onCreate
   ↓
7. Inserção no banco de dados
   ↓
8. Toast de sucesso
   ↓
9. Modal fecha
   ↓
10. Novo item é selecionado automaticamente
```

## Validações

### Campos Obrigatórios:
- Nome (todos os tipos)
- Nome Curto (departamento)
- Prefixo (tipo de documento)

### Validações Automáticas:
- Campos vazios não são aceitos
- Alert mostra campos faltantes
- Botão "Criar" desabilitado durante criação
- Tratamento de erros do banco de dados

## Benefícios

✅ **Produtividade:** Não precisa sair do fluxo de trabalho
✅ **UX Melhorada:** Criação rápida e intuitiva
✅ **Menos Cliques:** Tudo no mesmo lugar
✅ **Feedback Imediato:** Toast confirma criação
✅ **Seleção Automática:** Item criado já fica selecionado
✅ **Reutilizável:** Componente pode ser usado em outros lugares

## Cores Disponíveis

As cores são usadas para identificação visual:

- 🔵 Azul (#3B82F6)
- 🟢 Verde (#10B981)
- 🟡 Amarelo (#F59E0B)
- 🔴 Vermelho (#EF4444)
- 🟣 Roxo (#8B5CF6)
- 🌸 Rosa (#EC4899)

## Tratamento de Erros

- Erros de validação: Alert com campos faltantes
- Erros de banco: Toast com mensagem de erro
- Erros de rede: Capturados e exibidos
- Loading state: Botão desabilitado durante criação

## Compatibilidade

- ✅ Funciona em document-modal.tsx
- ✅ Funciona em document-upload.tsx
- ✅ Pode ser usado em qualquer formulário
- ✅ Totalmente responsivo
- ✅ Acessível via teclado

## Próximas Melhorias (Opcional)

1. Adicionar validação de duplicatas
2. Permitir edição inline
3. Adicionar preview de cores
4. Suporte a upload de ícones
5. Histórico de itens criados recentemente
6. Busca/filtro no select
7. Suporte a criação em lote

## Testes Recomendados

1. ✅ Criar categoria com todos os campos
2. ✅ Criar categoria apenas com nome
3. ✅ Criar departamento com nome curto
4. ✅ Criar tipo de documento com prefixo
5. ✅ Tentar criar sem preencher campos obrigatórios
6. ✅ Verificar se item criado aparece na lista
7. ✅ Verificar se item criado fica selecionado
8. ✅ Testar em diferentes resoluções
9. ✅ Testar com conexão lenta
10. ✅ Verificar toast de sucesso
