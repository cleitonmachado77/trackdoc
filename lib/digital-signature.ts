import { PDFDocument, PDFPage, PDFFont, rgb, StandardFonts, degrees } from 'pdf-lib'
import * as CryptoJS from 'crypto-js'

// Função helper para obter timestamp no horário de Brasília
function getBrasiliaDate(): Date {
  const now = new Date()
  // Converter para horário de Brasília (UTC-3)
  const brasiliaTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
  return brasiliaTime
}

export interface SignatureData {
  id: string
  userId: string
  documentId: string
  userName: string
  userEmail: string
  timestamp: Date
  hash: string
  digitalTimestamp: string
  verificationCode: string
  documentHash: string
  signatureHash: string
}

export interface DocumentSignature {
  id: string
  documentId: string
  userId: string
  status: 'pending' | 'completed' | 'failed' | 'cancelled'
  signatures: SignatureData[]
  createdAt: Date
  updatedAt: Date
  signedAt?: Date
  signedBy?: string
}

export class DigitalSignatureService {
  private static instance: DigitalSignatureService

  static getInstance(): DigitalSignatureService {
    if (!DigitalSignatureService.instance) {
      DigitalSignatureService.instance = new DigitalSignatureService()
    }
    return DigitalSignatureService.instance
  }

  /**
   * Gera um hash único para o documento
   */
  generateDocumentHash(pdfBuffer: Buffer, userId: string): string {
    const content = pdfBuffer.toString('base64') + userId + Date.now()
    return CryptoJS.SHA256(content).toString()
  }

  /**
   * Gera carimbo de tempo digital
   */
  generateDigitalTimestamp(userId: string, documentId: string, userName: string): string {
    const timestamp = new Date()
    const content = userId + documentId + userName + timestamp.getTime()
    
    // Criar carimbo de tempo com hash + timestamp ISO
    const hash = CryptoJS.SHA256(content).toString()
    const isoTimestamp = timestamp.toISOString()
    
    return `${hash}_${isoTimestamp}`
  }

  /**
   * Cria uma assinatura digital no rodapé do documento
   */
  async createSignature(
    pdfBuffer: Buffer,
    userId: string,
    userName: string,
    userEmail: string,
    documentId: string,
    customTemplate?: any
  ): Promise<{ signedPdf: Buffer; signature: SignatureData }> {
    // Carregar o PDF
    const pdfDoc = await PDFDocument.load(pdfBuffer)
    const pages = pdfDoc.getPages()
    
    // Carregar fonte padrão
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    
    // Gerar carimbo de tempo digital
    const digitalTimestamp = this.generateDigitalTimestamp(userId, documentId, userName)
    
    // Gerar hash da assinatura
    const signatureHash = this.generateSignatureHash(userId, documentId, userName, digitalTimestamp)
    
    // Gerar código de verificação único
    const verificationCode = this.generateVerificationCode()
    
    // Gerar hash do documento
    const documentHash = this.generateDocumentHash(pdfBuffer, userId)
    
    // Criar objeto de assinatura
    const signature: SignatureData = {
      id: this.generateId(),
      userId,
      documentId,
      userName,
      userEmail,
      timestamp: getBrasiliaDate(),
      hash: signatureHash,
      digitalTimestamp,
      verificationCode,
      documentHash,
      signatureHash
    }

    // Adicionar assinatura à lateral de todas as páginas
    for (let i = 0; i < pages.length; i++) {
      await this.addSignatureToSide(pages[i], signature, font, boldFont, i + 1, pages.length, customTemplate)
    }
    
    // Salvar PDF assinado
    const signedPdfBytes = await pdfDoc.save()
    
    return {
      signedPdf: Buffer.from(signedPdfBytes),
      signature
    }
  }

  /**
   * Cria assinaturas múltiplas no documento
   */
  async createMultiSignature(
    pdfBuffer: Buffer,
    users: Array<{id: string, full_name: string, email: string}>,
    documentId: string,
    customTemplate?: any
  ): Promise<{ signedPdf: Buffer; signatures: SignatureData[] }> {
    // Carregar o PDF
    const pdfDoc = await PDFDocument.load(pdfBuffer)
    const pages = pdfDoc.getPages()
    
    // Carregar fonte padrão
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    
    const allSignatures: SignatureData[] = []
    
    // Criar assinatura para cada usuário
    for (const user of users) {
      // Gerar carimbo de tempo digital
      const digitalTimestamp = this.generateDigitalTimestamp(user.id, documentId, user.full_name)
      
      // Gerar hash da assinatura
      const signatureHash = this.generateSignatureHash(user.id, documentId, user.full_name, digitalTimestamp)
      
      // Gerar código de verificação único
      const verificationCode = this.generateVerificationCode()
      
      // Gerar hash do documento
      const documentHash = this.generateDocumentHash(pdfBuffer, user.id)
      
      // Criar objeto de assinatura
      const signature: SignatureData = {
        id: this.generateId(),
        userId: user.id,
        documentId,
        userName: user.full_name,
        userEmail: user.email,
        timestamp: getBrasiliaDate(),
        hash: signatureHash,
        digitalTimestamp,
        verificationCode,
        documentHash,
        signatureHash
      }
      
      allSignatures.push(signature)
    }
    
    // Adicionar assinaturas à lateral de todas as páginas
    for (let i = 0; i < pages.length; i++) {
      await this.addMultiSignatureToSide(pages[i], allSignatures, font, boldFont, i + 1, pages.length, customTemplate)
    }
    
    // Adicionar página final com resumo de todas as assinaturas
    await this.addSignatureSummaryPage(pdfDoc, allSignatures, font, boldFont, customTemplate)
    
    // Salvar PDF assinado
    const signedPdfBytes = await pdfDoc.save()
    
    return {
      signedPdf: Buffer.from(signedPdfBytes),
      signatures: allSignatures
    }
  }

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
    const page = pdfDoc.addPage([595.28, 841.89]) // A4 size
    const { width, height } = page.getSize()
    
    // Configurações do template
    const template = customTemplate || {
      background_color: "#ffffff",
      border_color: "#000000",
      text_color: "#000000"
    }

    // Converter cores hex para RGB
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
      return result ? {
        r: parseInt(result[1], 16) / 255,
        g: parseInt(result[2], 16) / 255,
        b: parseInt(result[3], 16) / 255
      } : { r: 0, g: 0, b: 0 }
    }

    const borderColor = hexToRgb(template.border_color)
    const textColor = hexToRgb(template.text_color)
    
    // Margens
    const margin = 50
    let currentY = height - margin
    
    // Logo TrackDock (texto por enquanto, pode ser substituído por imagem)
    page.drawText("TrackDock", {
      x: margin,
      y: currentY,
      size: 16,
      font: boldFont,
      color: rgb(0.2, 0.4, 0.8) // Azul
    })
    
    currentY -= 40
    
    // Título
    page.drawText("CERTIFICADO DE ASSINATURA MÚLTIPLA", {
      x: margin,
      y: currentY,
      size: 18,
      font: boldFont,
      color: rgb(textColor.r, textColor.g, textColor.b)
    })
    
    currentY -= 30
    
    // Linha separadora
    page.drawLine({
      start: { x: margin, y: currentY },
      end: { x: width - margin, y: currentY },
      thickness: 2,
      color: rgb(borderColor.r, borderColor.g, borderColor.b)
    })
    
    currentY -= 30
    
    // Informações gerais
    page.drawText(`Total de Assinaturas: ${signatures.length}`, {
      x: margin,
      y: currentY,
      size: 12,
      font: boldFont,
      color: rgb(textColor.r, textColor.g, textColor.b)
    })
    
    currentY -= 20
    
    page.drawText(`Data de Geração: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, {
      x: margin,
      y: currentY,
      size: 10,
      font: font,
      color: rgb(textColor.r, textColor.g, textColor.b)
    })
    
    currentY -= 40
    
    // Lista de assinaturas
    page.drawText("SIGNATÁRIOS:", {
      x: margin,
      y: currentY,
      size: 14,
      font: boldFont,
      color: rgb(textColor.r, textColor.g, textColor.b)
    })
    
    currentY -= 25
    
    // Renderizar cada assinatura
    for (let i = 0; i < signatures.length; i++) {
      const signature = signatures[i]
      
      // Verificar se há espaço suficiente na página
      if (currentY < 150) {
        // Adicionar nova página se necessário
        const newPage = pdfDoc.addPage([595.28, 841.89])
        currentY = height - margin
        
        // Continuar na nova página
        newPage.drawText(`SIGNATÁRIOS (continuação):`, {
          x: margin,
          y: currentY,
          size: 14,
          font: boldFont,
          color: rgb(textColor.r, textColor.g, textColor.b)
        })
        
        currentY -= 25
      }
      
      // Box para cada assinatura
      const boxHeight = 110
      const boxY = currentY - boxHeight
      
      // Fundo do box
      page.drawRectangle({
        x: margin,
        y: boxY,
        width: width - 2 * margin,
        height: boxHeight,
        color: rgb(0.97, 0.97, 0.97),
        borderColor: rgb(borderColor.r, borderColor.g, borderColor.b),
        borderWidth: 1
      })
      
      // Número do signatário
      page.drawText(`${i + 1}.`, {
        x: margin + 10,
        y: currentY - 20,
        size: 12,
        font: boldFont,
        color: rgb(textColor.r, textColor.g, textColor.b)
      })
      
      // Nome
      page.drawText(`Nome: ${signature.userName}`, {
        x: margin + 30,
        y: currentY - 20,
        size: 11,
        font: boldFont,
        color: rgb(textColor.r, textColor.g, textColor.b)
      })
      
      // Email
      page.drawText(`Email: ${signature.userEmail}`, {
        x: margin + 30,
        y: currentY - 35,
        size: 9,
        font: font,
        color: rgb(textColor.r * 0.7, textColor.g * 0.7, textColor.b * 0.7)
      })
      
      // Data e hora
      page.drawText(`Data/Hora: ${signature.timestamp.toLocaleDateString('pt-BR')} às ${signature.timestamp.toLocaleTimeString('pt-BR')}`, {
        x: margin + 30,
        y: currentY - 50,
        size: 9,
        font: font,
        color: rgb(textColor.r * 0.7, textColor.g * 0.7, textColor.b * 0.7)
      })
      
      // Código de verificação
      page.drawText(`Código de Verificação: ${signature.verificationCode}`, {
        x: margin + 30,
        y: currentY - 65,
        size: 8,
        font: boldFont,
        color: rgb(0.2, 0.4, 0.8)
      })
      
      // Hash da assinatura
      const hashText = `Hash: ${signature.hash.substring(0, 40)}...`
      page.drawText(hashText, {
        x: margin + 30,
        y: currentY - 80,
        size: 7,
        font: font,
        color: rgb(textColor.r * 0.6, textColor.g * 0.6, textColor.b * 0.6)
      })
      
      // Hash do documento
      const docHashText = `Doc Hash: ${signature.documentHash.substring(0, 40)}...`
      page.drawText(docHashText, {
        x: margin + 30,
        y: currentY - 95,
        size: 7,
        font: font,
        color: rgb(textColor.r * 0.6, textColor.g * 0.6, textColor.b * 0.6)
      })
      
      currentY -= (boxHeight + 15)
    }
    
    // Rodapé com informações de segurança
    const footerY = 40
    page.drawText("Este documento foi assinado digitalmente. Todas as assinaturas são verificáveis através dos códigos fornecidos.", {
      x: margin,
      y: footerY,
      size: 8,
      font: font,
      color: rgb(textColor.r * 0.6, textColor.g * 0.6, textColor.b * 0.6)
    })
    
    // Adicionar barra lateral apenas com hashes e códigos (sem nomes)
    await this.addMultiSignatureToSideMinimal(page, signatures, font, boldFont, customTemplate)
  }

  /**
   * Adiciona múltiplas assinaturas visuais na lateral da página (vertical) - VERSÃO MÍNIMA
   * Apenas hashes e códigos de verificação, sem nomes
   */
  private async addMultiSignatureToSideMinimal(
    page: PDFPage,
    signatures: SignatureData[],
    font: PDFFont,
    boldFont: PDFFont,
    customTemplate?: any
  ): Promise<void> {
    const { width, height } = page.getSize()
    
    // Configurações da barra lateral
    const sidebarWidth = 26
    
    // Configurações do template
    const template = customTemplate || {
      background_color: "#ffffff",
      border_color: "#000000",
      text_color: "#000000"
    }

    // Converter cores hex para RGB
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
      return result ? {
        r: parseInt(result[1], 16) / 255,
        g: parseInt(result[2], 16) / 255,
        b: parseInt(result[3], 16) / 255
      } : { r: 0.95, g: 0.95, b: 0.95 }
    }

    const bgColor = hexToRgb(template.background_color)
    const borderColor = hexToRgb(template.border_color)
    const textColor = hexToRgb(template.text_color)
    
    // Posição da barra lateral
    const sidebarX = width - sidebarWidth
    const sidebarY = 0
    const sidebarHeight = height
    
    // Desenhar fundo da barra lateral
    page.drawRectangle({
      x: sidebarX,
      y: sidebarY,
      width: sidebarWidth,
      height: sidebarHeight,
      color: rgb(bgColor.r, bgColor.g, bgColor.b)
    })
    
    // Desenhar borda da barra lateral
    page.drawRectangle({
      x: sidebarX,
      y: sidebarY,
      width: sidebarWidth,
      height: sidebarHeight,
      borderColor: rgb(borderColor.r, borderColor.g, borderColor.b),
      borderWidth: 0.5
    })
    
    const smallFontSize = 5
    const centerX = sidebarX + (sidebarWidth / 2)
    
    let currentY = height - 20
    
    // Título
    page.drawText("VERIFICAÇÃO", {
      x: centerX + 2,
      y: currentY,
      size: 6,
      font: boldFont,
      color: rgb(borderColor.r, borderColor.g, borderColor.b),
      rotate: degrees(-90)
    })
    
    let signatureY = height - 60
    const lineSpacing = 2
    
    // Função para calcular altura do texto rotacionado
    const getTextHeight = (text: string, fontSize: number) => {
      return text.length * fontSize * 0.6
    }
    
    // Renderizar apenas códigos e hashes
    for (let i = 0; i < signatures.length; i++) {
      const signature = signatures[i]
      
      // Separador
      if (i > 0) {
        signatureY -= 5
        page.drawLine({
          start: { x: sidebarX + 2, y: signatureY },
          end: { x: sidebarX + sidebarWidth - 2, y: signatureY },
          thickness: 0.5,
          color: rgb(borderColor.r, borderColor.g, borderColor.b)
        })
        signatureY -= 5
      }
      
      // Código de verificação
      const codeText = `${i + 1}. ${signature.verificationCode}`
      page.drawText(codeText, {
        x: centerX,
        y: signatureY,
        size: smallFontSize,
        font: boldFont,
        color: rgb(textColor.r, textColor.g, textColor.b),
        rotate: degrees(-90)
      })
      const codeHeight = getTextHeight(codeText, smallFontSize)
      signatureY -= (codeHeight + lineSpacing)
      
      // Hash (primeiros 12 caracteres)
      const hashText = `${signature.hash.substring(0, 12)}`
      page.drawText(hashText, {
        x: centerX,
        y: signatureY,
        size: smallFontSize,
        font: font,
        color: rgb(textColor.r * 0.7, textColor.g * 0.7, textColor.b * 0.7),
        rotate: degrees(-90)
      })
      const hashHeight = getTextHeight(hashText, smallFontSize)
      signatureY -= (hashHeight + lineSpacing)
      
      // Verificar espaço
      if (signatureY < 50) {
        break
      }
    }
  }

  /**
   * Adiciona múltiplas assinaturas visuais na lateral da página (vertical)
   */
  private async addMultiSignatureToSide(
    page: PDFPage,
    signatures: SignatureData[],
    font: PDFFont,
    boldFont: PDFFont,
    pageNumber: number,
    totalPages: number,
    customTemplate?: any
  ): Promise<void> {
    const { width, height } = page.getSize()
    
    // Configurações da barra lateral de assinaturas (26px conforme solicitado)
    const sidebarWidth = 26 // Largura da barra lateral
    const margin = 1 // Margem interna
    
    // Configurações do template (usar personalizado ou padrão)
    const template = customTemplate || {
      title: "ASSINATURAS",
      show_date: true,
      show_time: true,
      show_user_name: false, // Não mostrar nomes na lateral
      show_email: false,
      show_verification_code: true,
      show_hash_code: true,
      position: "side-right",
      background_color: "#ffffff",
      border_color: "#000000",
      text_color: "#000000",
      font_size: "6",
      custom_text: "Documento assinado por múltiplos usuários."
    }

    // Converter cores hex para RGB
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
      return result ? {
        r: parseInt(result[1], 16) / 255,
        g: parseInt(result[2], 16) / 255,
        b: parseInt(result[3], 16) / 255
      } : { r: 0.95, g: 0.95, b: 0.95 }
    }

    const bgColor = hexToRgb(template.background_color)
    const borderColor = hexToRgb(template.border_color)
    const textColor = hexToRgb(template.text_color)
    
    // Posição da barra lateral (colada na borda direita)
    const sidebarX = width - sidebarWidth
    const sidebarY = 0
    const sidebarHeight = height
    
    // Desenhar fundo da barra lateral
    page.drawRectangle({
      x: sidebarX,
      y: sidebarY,
      width: sidebarWidth,
      height: sidebarHeight,
      color: rgb(bgColor.r, bgColor.g, bgColor.b)
    })
    
    // Desenhar borda da barra lateral (contorno extremamente fino)
    page.drawRectangle({
      x: sidebarX,
      y: sidebarY,
      width: sidebarWidth,
      height: sidebarHeight,
      borderColor: rgb(borderColor.r, borderColor.g, borderColor.b),
      borderWidth: 0.5
    })
    
    // Tamanho da fonte otimizado para coluna única vertical
    const fontSize = 6
    const titleSize = 7
    const smallFontSize = 5
    
    // Posição central da coluna única
    const centerX = sidebarX + (sidebarWidth / 2)
    
    // Posição inicial para o título
    let currentY = height - 20
    
    // Título "ASSINATURAS" rotacionado verticalmente (centro)
    page.drawText("ASSINATURAS", {
      x: centerX + 2,
      y: currentY,
      size: titleSize,
      font: boldFont,
      color: rgb(borderColor.r, borderColor.g, borderColor.b),
      rotate: degrees(-90)
    })
    
    // Posição inicial para as assinaturas
    let signatureY = height - 50
    const spacingY = 8
    const lineSpacing = 2
    
    // Função para calcular altura do texto rotacionado
    const getTextHeight = (text: string, fontSize: number) => {
      return text.length * fontSize * 0.6
    }
    
    // Renderizar cada assinatura (apenas códigos e hashes)
    for (let i = 0; i < signatures.length; i++) {
      const signature = signatures[i]
      
      // Separador entre assinaturas (exceto a primeira)
      if (i > 0) {
        signatureY -= 5
        page.drawLine({
          start: { x: sidebarX + 2, y: signatureY },
          end: { x: sidebarX + sidebarWidth - 2, y: signatureY },
          thickness: 0.5,
          color: rgb(borderColor.r, borderColor.g, borderColor.b)
        })
        signatureY -= 5
      }
      
      // Código de verificação
      if (template.show_verification_code) {
        const codeText = `${i + 1}. ${signature.verificationCode}`
        page.drawText(codeText, {
          x: centerX,
          y: signatureY,
          size: smallFontSize,
          font: boldFont,
          color: rgb(textColor.r, textColor.g, textColor.b),
          rotate: degrees(-90)
        })
        const codeHeight = getTextHeight(codeText, smallFontSize)
        signatureY -= (codeHeight + lineSpacing)
      }
      
      // Hash do documento (primeiros 12 caracteres)
      if (template.show_hash_code) {
        const hashText = `${signature.documentHash.substring(0, 12)}`
        page.drawText(hashText, {
          x: centerX,
          y: signatureY,
          size: smallFontSize,
          font: font,
          color: rgb(textColor.r, textColor.g, textColor.b),
          rotate: degrees(-90)
        })
        const hashHeight = getTextHeight(hashText, smallFontSize)
        signatureY -= (hashHeight + lineSpacing)
      }
      
      // Verificar se há espaço suficiente para a próxima assinatura
      if (signatureY < 50) {
        break // Não há mais espaço na página
      }
    }
  }

  /**
   * Adiciona assinatura visual na lateral da página (vertical)
   */
  private async addSignatureToSide(
    page: PDFPage,
    signature: SignatureData,
    font: PDFFont,
    boldFont: PDFFont,
    pageNumber: number,
    totalPages: number,
    customTemplate?: any
  ): Promise<void> {
    const { width, height } = page.getSize()
    
    // Configurações da barra lateral de assinaturas (26px conforme solicitado)
    const sidebarWidth = 26 // Largura da barra lateral
    const margin = 1 // Margem interna
    
    // Configurações do template (usar personalizado ou padrão)
    const template = customTemplate || {
      title: "ASSINATURA DIGITAL",
      show_date: true,
      show_time: true,
      show_user_name: true,
      show_email: false, // Removido conforme solicitado
      show_verification_code: true,
      show_hash_code: true,
      position: "side-right",
      background_color: "#ffffff", // Branco
      border_color: "#000000", // Preto
      text_color: "#000000", // Preto
      font_size: "6",
      custom_text: "Este documento foi assinado digitalmente com certificado válido."
    }

    // Converter cores hex para RGB
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
      return result ? {
        r: parseInt(result[1], 16) / 255,
        g: parseInt(result[2], 16) / 255,
        b: parseInt(result[3], 16) / 255
      } : { r: 0.95, g: 0.95, b: 0.95 }
    }

    const bgColor = hexToRgb(template.background_color)
    const borderColor = hexToRgb(template.border_color)
    const textColor = hexToRgb(template.text_color)
    
    // Posição da barra lateral (colada na borda direita)
    const sidebarX = width - sidebarWidth
    const sidebarY = 0
    const sidebarHeight = height
    
    // Desenhar fundo da barra lateral
    page.drawRectangle({
      x: sidebarX,
      y: sidebarY,
      width: sidebarWidth,
      height: sidebarHeight,
      color: rgb(bgColor.r, bgColor.g, bgColor.b)
    })
    
    // Desenhar borda da barra lateral (contorno extremamente fino)
    page.drawRectangle({
      x: sidebarX,
      y: sidebarY,
      width: sidebarWidth,
      height: sidebarHeight,
      borderColor: rgb(borderColor.r, borderColor.g, borderColor.b),
      borderWidth: 0.5 // Contorno extremamente fino
    })
    
    // Tamanho da fonte otimizado para coluna única vertical
    const fontSize = 6 // Fonte principal
    const titleSize = 7 // Título
    const smallFontSize = 5 // Auxiliar
    
    // Posição central da coluna única
    const centerX = sidebarX + (sidebarWidth / 2)
    
    // Posição inicial para o título
    let currentY = height - 20
    
    // Título "ASSINATURAS" rotacionado verticalmente (centro)
    page.drawText("ASSINATURAS", {
      x: centerX + 2,
      y: currentY,
      size: titleSize,
      font: boldFont,
      color: rgb(borderColor.r, borderColor.g, borderColor.b),
      rotate: degrees(-90)
    })
    
    // Posição inicial para a coluna única (espaçamento adequado)
    let columnY = height - 50
    const spacingY = 8 // Espaçamento adequado entre campos
    
    // === 2 COLUNAS VERTICAIS LADO A LADO (COMO NA IMAGEM) ===
    
    // Posições das 2 colunas (mais próximas)
    const column1X = centerX - 5  // Coluna esquerda
    const column2X = centerX + 5  // Coluna direita
    
    // Posições iniciais para as colunas (posição ajustada)
    let column1Y = height - 80
    let column2Y = height - 80
    const lineSpacing = 2 // Espaçamento reduzido entre blocos
    
    // === COLUNA 1 (Esquerda) - INFORMAÇÕES PRINCIPAIS ===
    // Função para calcular altura do texto rotacionado
    const getTextHeight = (text: string, fontSize: number) => {
      return text.length * fontSize * 0.6 // Aproximação da altura do texto rotacionado
    }
    
    if (template.show_user_name) {
      // Nome do usuário (sem limitação)
      const userName = signature.userName
      page.drawText(userName, {
        x: column1X,
        y: column1Y,
        size: smallFontSize,
        font: boldFont,
        color: rgb(textColor.r, textColor.g, textColor.b),
        rotate: degrees(-90)
      })
      // Calcula altura do nome e ajusta posição para próximo campo
      const nameHeight = getTextHeight(userName, smallFontSize)
      column1Y -= (nameHeight + lineSpacing)
    }
    
    
    if (template.show_date) {
      const dateStr = signature.timestamp.toLocaleDateString('pt-BR')
      page.drawText(dateStr, {
        x: column1X,
        y: column1Y,
        size: smallFontSize,
        font: font,
        color: rgb(textColor.r, textColor.g, textColor.b),
        rotate: degrees(-90)
      })
      // Calcula altura da data e ajusta posição para próximo campo
      const dateHeight = getTextHeight(dateStr, smallFontSize)
      column1Y -= (dateHeight + lineSpacing)
    }
    
    if (template.show_time) {
      const timeStr = signature.timestamp.toLocaleTimeString('pt-BR')
      page.drawText(timeStr, {
        x: column1X,
        y: column1Y,
        size: smallFontSize,
        font: font,
        color: rgb(textColor.r, textColor.g, textColor.b),
        rotate: degrees(-90)
      })
      // Calcula altura da hora e ajusta posição para próximo campo
      const timeHeight = getTextHeight(timeStr, smallFontSize)
      column1Y -= (timeHeight + lineSpacing)
    }
    
    if (template.show_verification_code) {
      // Código de verificação (sem limitação) em negrito
      const codeText = `Cod ${signature.verificationCode}`
      page.drawText(codeText, {
        x: column1X,
        y: column1Y,
        size: smallFontSize,
        font: boldFont,
        color: rgb(textColor.r, textColor.g, textColor.b),
        rotate: degrees(-90)
      })
      // Calcula altura do código e ajusta posição para próximo campo
      const codeHeight = getTextHeight(codeText, smallFontSize)
      column1Y -= (codeHeight + lineSpacing)
    }
    
    // Texto personalizado (movido para coluna 1) - posição ajustada para baixo
    if (template.custom_text && template.custom_text.trim()) {
      const customText = template.custom_text
      // Adiciona espaçamento extra para evitar invasão do código de verificação
      column1Y -= 8 // Espaçamento extra antes do texto personalizado
      page.drawText(customText, {
        x: column1X,
        y: column1Y,
        size: smallFontSize,
        font: font,
        color: rgb(textColor.r * 0.8, textColor.g * 0.8, textColor.b * 0.8),
        rotate: degrees(-90)
      })
      // Calcula altura do texto personalizado e ajusta posição para próximo campo
      const customTextHeight = getTextHeight(customText, smallFontSize)
      column1Y -= (customTextHeight + lineSpacing)
    }
    
    // === COLUNA 2 (Direita) - INFORMAÇÕES TÉCNICAS ===
    if (template.show_hash_code) {
      // Hash da assinatura (sem limitação)
      const hashText = `Hash ${signature.hash}`
      page.drawText(hashText, {
        x: column2X,
        y: column2Y,
        size: smallFontSize,
        font: font,
        color: rgb(textColor.r * 0.7, textColor.g * 0.7, textColor.b * 0.7),
        rotate: degrees(-90)
      })
      // Calcula altura do hash e ajusta posição para próximo campo
      const hashHeight = getTextHeight(hashText, smallFontSize)
      column2Y -= (hashHeight + lineSpacing)
    }
    
    // Hash do documento (sem limitação)
    const docHashText = `Doc ${signature.documentHash}`
    page.drawText(docHashText, {
      x: column2X,
      y: column2Y,
      size: smallFontSize,
      font: font,
      color: rgb(textColor.r * 0.6, textColor.g * 0.6, textColor.b * 0.6),
      rotate: degrees(-90)
    })
    // Calcula altura do hash do documento e ajusta posição para próximo campo
    const docHashHeight = getTextHeight(docHashText, smallFontSize)
    column2Y -= (docHashHeight + lineSpacing)
    
    
    // Número da página (pequeno, rotacionado no rodapé)
    page.drawText(`${pageNumber}/${totalPages}`, {
      x: centerX,
      y: 30,
      size: smallFontSize,
      font: font,
      color: rgb(textColor.r * 0.6, textColor.g * 0.6, textColor.b * 0.6),
      rotate: degrees(-90)
    })
  }

  /**
   * Verifica a autenticidade de uma assinatura
   */
  verifySignature(signature: SignatureData, originalHash: string): boolean {
    const calculatedHash = this.generateSignatureHash(
      signature.userId, 
      signature.documentId, 
      signature.userName, 
      signature.digitalTimestamp
    )
    return calculatedHash === signature.hash && signature.hash === originalHash
  }

  /**
   * Verifica o carimbo de tempo digital
   */
  verifyDigitalTimestamp(signature: SignatureData): boolean {
    const [hash, timestamp] = signature.digitalTimestamp.split('_')
    const expectedHash = this.generateDigitalTimestamp(
      signature.userId,
      signature.documentId,
      signature.userName
    ).split('_')[0]
    
    return hash === expectedHash
  }

  /**
   * Gera hash da assinatura
   */
  private generateSignatureHash(userId: string, documentId: string, userName: string, digitalTimestamp: string): string {
    const content = userId + documentId + userName + digitalTimestamp
    return CryptoJS.SHA256(content).toString()
  }

  /**
   * Gera ID único
   */
  private generateId(): string {
    return `sig_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Gera código de verificação único
   */
  private generateVerificationCode(): string {
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substr(2, 6)
    const hash = CryptoJS.SHA256(timestamp + random).toString().substr(0, 8)
    return `${timestamp}_${random}_${hash}`.toUpperCase()
  }

  /**
   * Extrai metadados do PDF
   */
  async extractPdfMetadata(pdfBuffer: Buffer): Promise<{
    pageCount: number
    title?: string
    author?: string
    subject?: string
    creator?: string
  }> {
    const pdfDoc = await PDFDocument.load(pdfBuffer)
    const pages = pdfDoc.getPages()
    
    return {
      pageCount: pages.length,
      title: pdfDoc.getTitle(),
      author: pdfDoc.getAuthor(),
      subject: pdfDoc.getSubject(),
      creator: pdfDoc.getCreator()
    }
  }

  /**
   * Valida se o arquivo é um PDF válido
   */
  async validatePdf(pdfBuffer: Buffer): Promise<boolean> {
    try {
      console.log('🔍 Validando PDF...')
      console.log('📊 Tamanho do buffer:', pdfBuffer.length)
      console.log('📊 Primeiros bytes:', pdfBuffer.slice(0, 10).toString('hex'))
      
      // Verificar se o buffer não está vazio
      if (!pdfBuffer || pdfBuffer.length === 0) {
        console.log('❌ Buffer vazio')
        return false
      }
      
      // Verificar se começa com %PDF
      const header = pdfBuffer.slice(0, 4).toString()
      if (header !== '%PDF') {
        console.log('❌ Não é um PDF válido (header incorreto):', header)
        return false
      }
      
      // Tentar carregar o PDF
      const pdfDoc = await PDFDocument.load(pdfBuffer)
      const pageCount = pdfDoc.getPageCount()
      
      console.log('✅ PDF válido - Páginas:', pageCount)
      return true
    } catch (error) {
      console.log('❌ Erro ao validar PDF:', error)
      return false
    }
  }
}

// Exportar instância singleton
export const digitalSignatureService = DigitalSignatureService.getInstance()
