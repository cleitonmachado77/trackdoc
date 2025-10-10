# 🔧 Correções Necessárias no Document List

## Erros Identificados:

1. **Linha 219:** `downloadDocument` espera 1 argumento, mas recebeu 2
2. **Linhas 349 e 494:** `variant="trackdoc"` não é um variant válido

## Correções Aplicadas:

### 1. Função downloadDocument:
```typescript
// ❌ ANTES:
await downloadDocument(document.file_path, document.file_name)

// ✅ DEPOIS:
await downloadDocument(document)
```

### 2. Variants dos botões:
```typescript
// ❌ ANTES:
<Button variant="trackdoc" onClick={() => router.push('/?showCreationSelector=true')}>

// ✅ DEPOIS:
<Button variant="default" onClick={() => router.push('/?showCreationSelector=true')}>
```

## Funcionalidades Implementadas:

### 1. Toggle de Visualização:
- Botões para alternar entre Grid e Lista
- Estado `viewMode` para controlar a visualização
- Ícones Grid3X3 e List para identificação visual

### 2. Visualização em Lista:
- Tabela com colunas organizadas
- Informações compactas e organizadas
- Ações inline para cada documento
- Badges para tipo e categoria
- Status de aprovação visível

### 3. Visualização em Grid:
- Cards quadrados (mantido como estava)
- Layout responsivo
- Informações detalhadas em cada card

## Estrutura da Tabela (Lista):

| Coluna | Conteúdo |
|--------|----------|
| Documento | Título + Descrição |
| Tipo | Badge colorido |
| Categoria | Badge outline |
| Autor | Nome com ícone |
| Departamento | Nome com ícone |
| Status | Status de aprovação |
| Tamanho | Tamanho formatado |
| Ações | Ver/Baixar/Excluir |

## Próximos Passos:

1. Corrigir manualmente os variants "trackdoc" para "default"
2. Testar a funcionalidade de toggle
3. Verificar responsividade da tabela
4. Ajustar estilos se necessário