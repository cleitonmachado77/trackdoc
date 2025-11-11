# Como Adicionar o Logo Real da TrackDock

## Visão Geral

Atualmente, a página de resumo de assinaturas exibe o texto "TrackDock" no topo. Este guia mostra como substituir por uma imagem real do logo.

## Opções de Implementação

### Opção 1: Usar Logo Embutido (Base64)

Esta é a opção mais simples e não requer arquivos externos.

#### Passo 1: Converter Logo para Base64

```bash
# No terminal, converter imagem para base64
node -e "const fs = require('fs'); const img = fs.readFileSync('public/logo-trackdock.png'); console.log(img.toString('base64'));"
```

#### Passo 2: Modificar o Código

No arquivo `lib/digital-signature.ts`, localizar a seção que desenha o logo:

```typescript
// Logo TrackDock (texto por enquanto, pode ser substituído por imagem)
page.drawText("TrackDock", {
  x: margin,
  y: currentY,
  size: 16,
  font: boldFont,
  color: rgb(0.2, 0.4, 0.8) // Azul
})
```

Substituir por:

```typescript
// Logo TrackDock (imagem)
const logoBase64 = 'iVBORw0KGgoAAAANSUhEUgAA...' // Cole o base64 aqui
const logoImage = await pdfDoc.embedPng(Buffer.from(logoBase64, 'base64'))
const logoDims = logoImage.scale(0.3) // Ajustar escala conforme necessário

page.drawImage(logoImage, {
  x: margin,
  y: currentY - logoDims.height,
  width: logoDims.width,
  height: logoDims.height
})

currentY -= (logoDims.height + 10) // Ajustar posição para próximo elemento
```

### Opção 2: Carregar Logo do Storage

Esta opção carrega o logo do Supabase Storage.

#### Passo 1: Upload do Logo

1. Acessar Supabase Dashboard
2. Ir em Storage > Criar bucket "assets" (se não existir)
3. Fazer upload do logo: `logo-trackdock.png`
4. Tornar o arquivo público

#### Passo 2: Modificar o Código

```typescript
// Importar no topo do arquivo
import { createClient } from '@supabase/supabase-js'

// Dentro do método addSignatureSummaryPage, antes de desenhar o logo:

// Carregar logo do storage
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const { data: logoData, error: logoError } = await supabase.storage
  .from('assets')
  .download('logo-trackdock.png')

if (!logoError && logoData) {
  const logoBuffer = Buffer.from(await logoData.arrayBuffer())
  const logoImage = await pdfDoc.embedPng(logoBuffer)
  const logoDims = logoImage.scale(0.3)
  
  page.drawImage(logoImage, {
    x: margin,
    y: currentY - logoDims.height,
    width: logoDims.width,
    height: logoDims.height
  })
  
  currentY -= (logoDims.height + 10)
} else {
  // Fallback: usar texto se logo não carregar
  page.drawText("TrackDock", {
    x: margin,
    y: currentY,
    size: 16,
    font: boldFont,
    color: rgb(0.2, 0.4, 0.8)
  })
  currentY -= 40
}
```

### Opção 3: Logo do Public Folder

Esta opção usa o logo da pasta `public`.

#### Passo 1: Adicionar Logo

Colocar o arquivo `logo-trackdock.png` na pasta `public/`.

#### Passo 2: Modificar o Código

```typescript
// Importar no topo do arquivo
import fs from 'fs'
import path from 'path'

// Dentro do método addSignatureSummaryPage:

try {
  // Carregar logo do public folder
  const logoPath = path.join(process.cwd(), 'public', 'logo-trackdock.png')
  const logoBuffer = fs.readFileSync(logoPath)
  const logoImage = await pdfDoc.embedPng(logoBuffer)
  const logoDims = logoImage.scale(0.3)
  
  page.drawImage(logoImage, {
    x: margin,
    y: currentY - logoDims.height,
    width: logoDims.width,
    height: logoDims.height
  })
  
  currentY -= (logoDims.height + 10)
} catch (error) {
  console.warn('Erro ao carregar logo, usando texto:', error)
  // Fallback: usar texto
  page.drawText("TrackDock", {
    x: margin,
    y: currentY,
    size: 16,
    font: boldFont,
    color: rgb(0.2, 0.4, 0.8)
  })
  currentY -= 40
}
```

## Recomendações

### Formato do Logo

- **Formato**: PNG com transparência
- **Dimensões**: 200x50px (ou proporção similar)
- **Tamanho**: Máximo 50KB
- **Cores**: Preferencialmente com fundo transparente

### Escala

Ajustar o valor de `scale()` conforme necessário:
- `0.2` = 20% do tamanho original (menor)
- `0.3` = 30% do tamanho original (recomendado)
- `0.5` = 50% do tamanho original (maior)

### Posicionamento

Ajustar as coordenadas `x` e `y` para posicionar o logo:
- `x: margin` = Alinhado à esquerda
- `x: (width - logoDims.width) / 2` = Centralizado
- `x: width - margin - logoDims.width` = Alinhado à direita

## Exemplo Completo (Opção 1 - Base64)

```typescript
/**
 * Adiciona página final com resumo de todas as assinaturas
 */
private async addSignatureSummaryPage(
  pdfDoc: PDFDocument,
  signatures: SignatureData[],
  font: PDFFont,
  boldFont: PDFFont,
  customTemplate?: any
): Promise<void> {
  // Adicionar nova página
  const page = pdfDoc.addPage([595.28, 841.89])
  const { width, height } = page.getSize()
  
  // ... (código de configuração de cores)
  
  const margin = 50
  let currentY = height - margin
  
  // Logo TrackDock (imagem embutida)
  try {
    const logoBase64 = 'iVBORw0KGgoAAAANSUhEUgAA...' // Seu logo em base64
    const logoImage = await pdfDoc.embedPng(Buffer.from(logoBase64, 'base64'))
    const logoDims = logoImage.scale(0.3)
    
    page.drawImage(logoImage, {
      x: margin,
      y: currentY - logoDims.height,
      width: logoDims.width,
      height: logoDims.height
    })
    
    currentY -= (logoDims.height + 10)
  } catch (error) {
    console.warn('Erro ao carregar logo:', error)
    // Fallback para texto
    page.drawText("TrackDock", {
      x: margin,
      y: currentY,
      size: 16,
      font: boldFont,
      color: rgb(0.2, 0.4, 0.8)
    })
    currentY -= 40
  }
  
  // ... (resto do código)
}
```

## Testes

Após implementar, testar:

1. ✅ Logo aparece corretamente
2. ✅ Tamanho está adequado
3. ✅ Posicionamento está correto
4. ✅ Não quebra o layout
5. ✅ Fallback funciona se logo não carregar

## Troubleshooting

### Logo não aparece
- Verificar se o arquivo existe no caminho especificado
- Verificar se o formato é PNG
- Verificar se o base64 está correto

### Logo muito grande/pequeno
- Ajustar o valor de `scale()`
- Verificar dimensões originais da imagem

### Logo distorcido
- Verificar proporção da imagem original
- Usar `scaleToFit()` em vez de `scale()`

```typescript
const logoDims = logoImage.scaleToFit(100, 30) // largura max, altura max
```

### Erro de memória
- Reduzir tamanho do arquivo de imagem
- Comprimir PNG antes de usar
- Usar formato WebP e converter para PNG

## Próximos Passos

Após adicionar o logo:
1. Testar com diferentes documentos
2. Verificar em diferentes visualizadores de PDF
3. Validar impressão
4. Documentar a implementação escolhida
