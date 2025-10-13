# Sistema de Ícones Coloridos para Documentos

## Visão Geral

Implementação de ícones coloridos diferenciados por tipo de arquivo para melhorar a experiência visual e identificação rápida de documentos no sistema.

## Tipos de Arquivo Suportados

### 📄 PDF - Vermelho
- **Cor**: `text-red-600` / `bg-red-100`
- **Ícone**: `FileText`
- **Extensões**: `.pdf`
- **MIME Types**: `application/pdf`

### 📘 Word - Azul
- **Cor**: `text-blue-600` / `bg-blue-100`
- **Ícone**: `FileText`
- **Extensões**: `.doc`, `.docx`
- **MIME Types**: `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`

### 📊 Excel - Verde
- **Cor**: `text-green-600` / `bg-green-100`
- **Ícone**: `FileSpreadsheet`
- **Extensões**: `.xls`, `.xlsx`, `.csv`
- **MIME Types**: `application/vnd.ms-excel`, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`

### 📈 PowerPoint - Laranja
- **Cor**: `text-orange-600` / `bg-orange-100`
- **Ícone**: `FileText`
- **Extensões**: `.ppt`, `.pptx`
- **MIME Types**: `application/vnd.ms-powerpoint`, `application/vnd.openxmlformats-officedocument.presentationml.presentation`

### 🖼️ Imagens - Roxo
- **Cor**: `text-purple-600` / `bg-purple-100`
- **Ícone**: `FileImage`
- **Extensões**: `.jpg`, `.jpeg`, `.png`, `.gif`, `.bmp`, `.svg`, `.webp`
- **MIME Types**: `image/*`

### 🎥 Vídeos - Rosa
- **Cor**: `text-pink-600` / `bg-pink-100`
- **Ícone**: `FileVideo`
- **Extensões**: `.mp4`, `.avi`, `.mov`, `.wmv`, `.flv`, `.webm`, `.mkv`
- **MIME Types**: `video/*`

### 🎵 Áudio - Amarelo
- **Cor**: `text-yellow-600` / `bg-yellow-100`
- **Ícone**: `FileAudio`
- **Extensões**: `.mp3`, `.wav`, `.flac`, `.aac`, `.ogg`, `.wma`
- **MIME Types**: `audio/*`

### 📦 Arquivos Compactados - Índigo
- **Cor**: `text-indigo-600` / `bg-indigo-100`
- **Ícone**: `Archive`
- **Extensões**: `.zip`, `.rar`, `.7z`, `.tar`, `.gz`, `.bz2`

### 💻 Código - Teal
- **Cor**: `text-teal-600` / `bg-teal-100`
- **Ícone**: `Code`
- **Extensões**: `.js`, `.ts`, `.jsx`, `.tsx`, `.html`, `.css`, `.scss`, `.json`, `.xml`, `.sql`, `.py`, `.java`, `.cpp`, `.c`, `.php`, `.rb`, `.go`, `.rs`

### 📝 Texto - Cinza
- **Cor**: `text-gray-600` / `bg-gray-100`
- **Ícone**: `FileText`
- **Extensões**: `.txt`, `.rtf`, `.md`
- **MIME Types**: `text/plain`

### 📁 Padrão - Cinza
- **Cor**: `text-gray-600` / `bg-gray-100`
- **Ícone**: `File`
- **Para**: Tipos não especificados

## Funções Utilitárias

### `getFileTypeInfo(fileType: string, fileName?: string): FileTypeInfo`

Retorna informações completas sobre o tipo de arquivo:

```typescript
interface FileTypeInfo {
  icon: React.ComponentType<{ className?: string }>
  color: string
  bgColor: string
  name: string
}
```

**Exemplo de uso:**
```typescript
const info = getFileTypeInfo('application/pdf', 'documento.pdf')
// Retorna: { icon: FileText, color: 'text-red-600', bgColor: 'bg-red-100', name: 'PDF' }
```

### `getFileIcon(fileType: string, fileName?: string, className?: string)`

Retorna apenas o ícone com cor aplicada:

```typescript
const icon = getFileIcon('application/pdf', 'documento.pdf', 'h-6 w-6')
// Retorna: <FileText className="h-6 w-6 text-red-600" />
```

### `getFileIconWithBackground(fileType: string, fileName?: string, iconSize?: string, containerSize?: string)`

Retorna o ícone com background colorido:

```typescript
const iconWithBg = getFileIconWithBackground('application/pdf', 'documento.pdf', 'h-6 w-6', 'p-2')
// Retorna: <div className="p-2 bg-red-100 rounded-lg"><FileText className="h-6 w-6 text-red-600" /></div>
```

## Componentes Atualizados

### 1. DocumentList
- Ícones coloridos nos cards de documentos (grid e lista)
- Background colorido nos ícones
- Identificação visual imediata do tipo de arquivo

### 2. DocumentVersionManager
- Ícones coloridos na tabela de versões
- Diferenciação visual entre tipos de arquivo nas versões

### 3. DocumentViewer
- Ícone colorido no cabeçalho do visualizador
- Consistência visual com o resto do sistema

### 4. DocumentUpload / DocumentUploadWithApproval
- Ícones coloridos durante o processo de upload
- Preview visual do tipo de arquivo sendo enviado

### 5. FileIconsDemo (Novo)
- Componente de demonstração de todos os tipos
- Útil para testes e documentação visual

## Lógica de Detecção

A detecção do tipo de arquivo segue esta ordem de prioridade:

1. **Extensão do arquivo** (mais confiável)
2. **MIME type** (fallback)
3. **Conteúdo do MIME type** (verificação parcial)

### Exemplo de Detecção:

```typescript
// Para um arquivo "relatorio.docx" com MIME type "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

1. Verifica extensão: "docx" → Encontra em ['doc', 'docx'] → Retorna Word (Azul)
2. Se não encontrar extensão, verifica MIME type
3. Se não encontrar MIME type específico, usa padrão (Cinza)
```

## Benefícios

### 1. **Identificação Visual Rápida**
- Usuários identificam tipos de arquivo instantaneamente
- Reduz tempo de busca e navegação
- Melhora a experiência do usuário

### 2. **Consistência Visual**
- Cores padronizadas em todo o sistema
- Ícones apropriados para cada tipo
- Interface mais profissional

### 3. **Acessibilidade**
- Cores contrastantes para melhor legibilidade
- Ícones descritivos além das cores
- Suporte a diferentes necessidades visuais

### 4. **Escalabilidade**
- Fácil adição de novos tipos de arquivo
- Sistema modular e reutilizável
- Configuração centralizada

## Personalização

### Adicionar Novo Tipo de Arquivo:

```typescript
// Em lib/utils/file-icons.tsx

// Novo tipo - Arquivos CAD - Marrom
if (['dwg', 'dxf', 'step', 'iges'].includes(extension)) {
  return {
    icon: Drafting, // Ícone personalizado
    color: 'text-amber-700',
    bgColor: 'bg-amber-100',
    name: 'CAD'
  }
}
```

### Modificar Cores Existentes:

```typescript
// Alterar cor do PDF de vermelho para azul escuro
if (type.includes('pdf') || extension === 'pdf') {
  return {
    icon: FileText,
    color: 'text-blue-800', // Alterado
    bgColor: 'bg-blue-50',  // Alterado
    name: 'PDF'
  }
}
```

## Arquivos Criados/Modificados

### Novos Arquivos:
- `lib/utils/file-icons.tsx` - Utilitários de ícones
- `app/components/file-icons-demo.tsx` - Demonstração visual
- `SISTEMA_ICONES_COLORIDOS_DOCUMENTOS.md` - Esta documentação

### Arquivos Modificados:
- `app/components/document-list.tsx` - Ícones nos cards
- `app/components/document-version-manager.tsx` - Ícones nas versões
- `app/components/document-viewer.tsx` - Ícone no visualizador
- `app/components/document-upload.tsx` - Ícones no upload
- `app/components/document-upload-with-approval.tsx` - Ícones no upload com aprovação

## Testes

Para testar o sistema de ícones:

1. **Upload de diferentes tipos de arquivo**
2. **Verificação visual nos cards**
3. **Teste do componente de demonstração**
4. **Validação em diferentes resoluções**

### Comando para visualizar demonstração:
```typescript
import { FileIconsDemo } from '@/app/components/file-icons-demo'

// Use o componente em qualquer página para ver todos os ícones
<FileIconsDemo />
```

## Conclusão

O sistema de ícones coloridos melhora significativamente a usabilidade do sistema de documentos, proporcionando identificação visual rápida e uma interface mais moderna e profissional. O sistema é extensível e pode ser facilmente personalizado conforme necessário.