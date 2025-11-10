# Guia Rápido de Implementação

## 🚀 Implementação em 5 Minutos

### Passo 1: Usar o Componente (2 min)

```tsx
import UniversalDocumentViewer from '@/app/components/universal-document-viewer'

// No seu componente
<UniversalDocumentViewer
  url={documento.file_path}
  fileType={documento.file_type}
  fileName={documento.file_name}
  scale={1}
  rotation={0}
  onLoadSuccess={() => console.log('Carregado!')}
  onLoadError={() => console.log('Erro!')}
/>
```

### Passo 2: Testar (2 min)

1. Acesse: `http://localhost:3000/test-universal-viewer`
2. Selecione um tipo de documento
3. Verifique se carrega corretamente

### Passo 3: Integrar (1 min)

Substitua o `PDFViewer` existente por `UniversalDocumentViewer` em:
- `app/components/document-viewer.tsx`
- `app/components/document-viewer-responsive.tsx` (se existir)

---

## 📋 Checklist de Implementação

### Antes de Começar
- [ ] Verificar se Supabase Storage está configurado
- [ ] Confirmar que bucket 'documents' é público
- [ ] Ter arquivos de teste disponíveis

### Implementação
- [ ] Componente `UniversalDocumentViewer` criado
- [ ] Página de teste criada
- [ ] Documentação lida

### Integração
- [ ] `DocumentViewer` atualizado
- [ ] Imports atualizados
- [ ] Tipos de arquivo aceitos atualizados

### Testes
- [ ] PDF testado
- [ ] Excel testado
- [ ] Word testado
- [ ] PowerPoint testado
- [ ] Imagens testadas
- [ ] Zoom funciona
- [ ] Rotação funciona
- [ ] Download funciona
- [ ] Nova aba funciona

### Produção
- [ ] Testes em diferentes navegadores
- [ ] Testes com arquivos grandes
- [ ] Testes com arquivos corrompidos
- [ ] Fallbacks validados

---

## 🎯 Casos de Uso Comuns

### Caso 1: Visualizar PDF
```tsx
<UniversalDocumentViewer
  url="contratos/contrato-2024.pdf"
  fileType="application/pdf"
  fileName="contrato-2024.pdf"
  scale={1}
  rotation={0}
/>
```

### Caso 2: Visualizar Excel
```tsx
<UniversalDocumentViewer
  url="relatorios/vendas-janeiro.xlsx"
  fileType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  fileName="vendas-janeiro.xlsx"
  scale={1}
  rotation={0}
/>
```

### Caso 3: Visualizar Word
```tsx
<UniversalDocumentViewer
  url="documentos/proposta-comercial.docx"
  fileType="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  fileName="proposta-comercial.docx"
  scale={1}
  rotation={0}
/>
```

### Caso 4: Visualizar Imagem
```tsx
<UniversalDocumentViewer
  url="fotos/documento-identidade.jpg"
  fileType="image/jpeg"
  fileName="documento-identidade.jpg"
  scale={1.5}
  rotation={0}
/>
```

---

## 🔧 Configuração Rápida do Supabase

### 1. Tornar Bucket Público

```sql
-- No SQL Editor do Supabase
UPDATE storage.buckets 
SET public = true 
WHERE id = 'documents';
```

### 2. Adicionar Política de Leitura

```sql
-- Permitir leitura pública
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'documents');
```

### 3. Verificar URL Pública

```typescript
// Formato da URL pública
const publicUrl = `https://[PROJECT_ID].supabase.co/storage/v1/object/public/documents/${filePath}`

// Exemplo
const publicUrl = `https://dhdeyznmncgukexofcxy.supabase.co/storage/v1/object/public/documents/test/sample.pdf`
```

---

## 🐛 Troubleshooting Rápido

### Problema: Documento não carrega

**Solução 1:** Verificar URL
```typescript
console.log('URL:', url)
console.log('Tipo:', fileType)
console.log('Nome:', fileName)
```

**Solução 2:** Testar URL diretamente
```typescript
// Abrir URL no navegador
window.open(publicUrl, '_blank')
```

**Solução 3:** Verificar bucket
```typescript
// Verificar se arquivo existe
const { data, error } = await supabase.storage
  .from('documents')
  .list('test/')

console.log('Arquivos:', data)
```

### Problema: Erro de CORS

**Solução:** Verificar configuração do bucket
```sql
-- Bucket deve ser público
SELECT * FROM storage.buckets WHERE id = 'documents';
```

### Problema: Google Viewer não carrega

**Solução 1:** Usar visualizador nativo
```typescript
// Alternar para visualizador nativo (apenas PDF)
// Clicar no botão "Visualizador Nativo"
```

**Solução 2:** Verificar tamanho do arquivo
```typescript
// Google Viewer tem limite de ~25MB
if (fileSize > 25 * 1024 * 1024) {
  console.warn('Arquivo muito grande para Google Viewer')
}
```

### Problema: Imagem não aparece

**Solução:** Verificar tipo MIME
```typescript
// Tipos suportados
const imageTypes = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml'
]

if (!imageTypes.includes(fileType)) {
  console.error('Tipo de imagem não suportado:', fileType)
}
```

---

## 📊 Comparação de Visualizadores

| Formato | Visualizador | Vantagens | Desvantagens |
|---------|--------------|-----------|--------------|
| PDF | Nativo | Rápido, sem dependências | Depende do navegador |
| PDF | Google Docs | Funciona em todos navegadores | Delay inicial |
| Excel | Google Docs | Renderiza fórmulas | Limite de 25MB |
| Word | Google Docs | Mantém formatação | Delay inicial |
| PowerPoint | Google Docs | Mostra slides | Sem animações |
| Imagens | Nativo | Instantâneo | - |

---

## 💡 Dicas de Performance

### 1. Lazy Loading
```tsx
import dynamic from 'next/dynamic'

const UniversalDocumentViewer = dynamic(
  () => import('@/app/components/universal-document-viewer'),
  { ssr: false }
)
```

### 2. Thumbnails
```typescript
// Gerar thumbnail para preview rápido
const generateThumbnail = async (file: File) => {
  // Implementar geração de thumbnail
}
```

### 3. Cache
```typescript
// Cachear URLs públicas
const urlCache = new Map<string, string>()

const getCachedUrl = (filePath: string) => {
  if (urlCache.has(filePath)) {
    return urlCache.get(filePath)
  }
  
  const url = generatePublicUrl(filePath)
  urlCache.set(filePath, url)
  return url
}
```

### 4. Compressão
```typescript
// Comprimir imagens antes do upload
import imageCompression from 'browser-image-compression'

const compressImage = async (file: File) => {
  const options = {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920
  }
  
  return await imageCompression(file, options)
}
```

---

## 🎨 Customização

### Alterar Cores
```tsx
// Personalizar cores do visualizador
<div className="bg-gray-100"> {/* Fundo */}
  <div className="bg-white shadow-lg"> {/* Container */}
    {/* Conteúdo */}
  </div>
</div>
```

### Alterar Tamanho
```tsx
// Ajustar altura do visualizador
<div className="h-[800px]"> {/* Desktop */}
<div className="h-[400px] sm:h-[600px] lg:h-[800px]"> {/* Responsivo */}
```

### Adicionar Controles
```tsx
// Adicionar controles personalizados
<div className="flex gap-2">
  <Button onClick={handlePrint}>Imprimir</Button>
  <Button onClick={handleShare}>Compartilhar</Button>
  <Button onClick={handleAnnotate}>Anotar</Button>
</div>
```

---

## 📚 Recursos Adicionais

### Documentação Completa
- [Visualização de Documentos](./VISUALIZACAO_DOCUMENTOS.md)
- [Guia de Integração](./INTEGRACAO_UNIVERSAL_VIEWER.md)
- [Tipos MIME](./TIPOS_MIME_SUPORTADOS.md)
- [Resumo Executivo](./RESUMO_VISUALIZACAO_UNIVERSAL.md)

### Links Externos
- [Google Docs Viewer](https://docs.google.com/viewer)
- [Supabase Storage](https://supabase.com/docs/guides/storage)
- [React Dropzone](https://react-dropzone.js.org/)
- [Lucide Icons](https://lucide.dev/)

---

## ✅ Pronto!

Agora você tem:
- ✅ Visualização de PDFs
- ✅ Visualização de Excel
- ✅ Visualização de Word
- ✅ Visualização de PowerPoint
- ✅ Visualização de Imagens
- ✅ Controles de zoom e rotação
- ✅ Fallbacks robustos
- ✅ Documentação completa

**Próximo passo:** Testar em `/test-universal-viewer` 🚀
