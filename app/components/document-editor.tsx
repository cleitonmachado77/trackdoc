"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Link,
  ImageIcon,
  Table,
  Save,
  Eye,
  FileText,
  Clock,
  Users,
  CheckCircle,
  X,
  Calendar,
  User,
  Building,
  Trash2,
  Undo,
} from "lucide-react"

import { mockDepartments } from "@/data/mock-departments"

const getCurrentUser = () => ({
  id: 1,
  name: "João Silva",
  email: "joao.silva@empresa.com",
  role: "Administrador",
  department: "Tecnologia da Informação",
})

// Função removida - números de documentos agora são gerados automaticamente pelo banco de dados
// ao criar o documento, usando uma sequência numérica simples (ex: 000001, 000002, etc)

export default function DocumentEditor() {
  const { toast } = useToast()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [contentHistory, setContentHistory] = useState<string[]>([])
  const [wordCount, setWordCount] = useState(0)
  const [showPreview, setShowPreview] = useState(false)
  const [showMetadataModal, setShowMetadataModal] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  const currentUser = getCurrentUser()

  interface DocumentHeader {
    number: string
    author: string
    department: string
    version: string
    createdDate: string
    lastModified: string
    lastRevision: string
    status: string
    approvers: string[]
  }

  // Estados para metadados
  const [documentHeader, setDocumentHeader] = useState<DocumentHeader>({
    number: "",
    author: currentUser.name, // Sempre o usuário logado
    department: currentUser.department, // Departamento do usuário logado
    version: "1.0",
    createdDate: new Date().toLocaleDateString("pt-BR"),
    lastModified: new Date().toLocaleDateString("pt-BR"),
    lastRevision: new Date().toLocaleDateString("pt-BR"), // Adicionado campo de última revisão
    status: "Rascunho",
    approvers: [], // Lista de aprovadores
  })

  const [documentType, setDocumentType] = useState("")
  const [department, setDepartment] = useState("")
  const [category, setCategory] = useState("")
  const [description, setDescription] = useState("")
  const [tags, setTags] = useState("")

  const getApprovers = (docType: string, dept: string) => {
    const approversByType: Record<string, string[]> = {
      policy: ["Supervisor do Departamento", "Gerente da Área", "Diretoria"],
      procedure: ["Supervisor do Departamento", "Gerente da Área"],
      manual: ["Supervisor do Departamento", "Gerente da Área"],
      memo: ["Supervisor do Departamento"],
      report: ["Gerente da Área"],
    }
    return approversByType[docType] || ["Supervisor do Departamento"]
  }

  const templates = [
    {
      id: "memo",
      name: "Memorando",
      content: `MEMORANDO

Para: [Destinatário]
De: [Remetente]
Data: ${new Date().toLocaleDateString("pt-BR")}
Assunto: [Assunto]

[Conteúdo do memorando]

Atenciosamente,
[Nome]
[Cargo]`,
    },
    {
      id: "policy",
      name: "Política Interna",
      content: `POLÍTICA INTERNA

1. OBJETIVO
[Descrever o objetivo da política]

2. APLICABILIDADE
[Definir a quem se aplica]

3. DIRETRIZES
[Listar as diretrizes principais]

4. RESPONSABILIDADES
[Definir responsabilidades]

5. VIGÊNCIA
Esta política entra em vigor a partir de ${new Date().toLocaleDateString("pt-BR")}.`,
    },
    {
      id: "procedure",
      name: "Procedimento Operacional",
      content: `PROCEDIMENTO OPERACIONAL PADRÃO

1. FINALIDADE
[Descrever a finalidade do procedimento]

2. ESCOPO
[Definir o escopo de aplicação]

3. PROCEDIMENTO
3.1. [Primeiro passo]
3.2. [Segundo passo]
3.3. [Terceiro passo]

4. RESPONSÁVEIS
[Definir os responsáveis]

5. DOCUMENTOS RELACIONADOS
[Listar documentos relacionados]`,
    },
  ]

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value
    setContentHistory((prev) => [...prev, content])
    setContent(newContent)
    setWordCount(
      newContent
        .trim()
        .split(/\s+/)
        .filter((word) => word.length > 0).length,
    )
    setDocumentHeader((prev) => ({
      ...prev,
      lastModified: new Date().toLocaleDateString("pt-BR"),
      lastRevision: new Date().toLocaleDateString("pt-BR"),
    }))
  }

  const applyTemplate = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId)
    if (template) {
      setContent(template.content)
      setTitle(template.name)
      setWordCount(
        template.content
          .trim()
          .split(/\s+/)
          .filter((word) => word.length > 0).length,
      )
      toast({
        title: "Template aplicado",
        description: `Template "${template.name}" foi aplicado ao documento.`,
      })
    }
  }

  const formatText = (format: string) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = content.substring(start, end)

    if (selectedText) {
      let formattedText = selectedText
      let newContent = content

      switch (format) {
        case "bold":
          formattedText = `**${selectedText}**`
          break
        case "italic":
          formattedText = `*${selectedText}*`
          break
        case "underline":
          formattedText = `<u>${selectedText}</u>`
          break
        case "link":
          const url = prompt("Digite a URL:")
          if (url) formattedText = `[${selectedText}](${url})`
          break
        default:
          break
      }

      newContent = content.substring(0, start) + formattedText + content.substring(end)
      setContent(newContent)
      setWordCount(
        newContent
          .trim()
          .split(/\s+/)
          .filter((word) => word.length > 0).length,
      )
    } else {
      const cursorPos = start
      let insertText = ""

      switch (format) {
        case "list":
          insertText = "\n• "
          break
        case "ordered-list":
          insertText = "\n1. "
          break
        case "table":
          insertText =
            "\n| Coluna 1 | Coluna 2 | Coluna 3 |\n|----------|----------|----------|\n| Dados    | Dados    | Dados    |\n"
          break
        case "image":
          const imageUrl = prompt("Digite a URL da imagem:")
          if (imageUrl) insertText = `\n![Descrição da imagem](${imageUrl})\n`
          break
        default:
          break
      }

      if (insertText) {
        const newContent = content.substring(0, cursorPos) + insertText + content.substring(cursorPos)
        setContent(newContent)
        setWordCount(
          newContent
            .trim()
            .split(/\s+/)
            .filter((word) => word.length > 0).length,
        )
      }
    }

    toast({
      title: "Formatação aplicada",
      description: `Formatação "${format}" aplicada com sucesso.`,
    })
  }

  const handleSave = () => {
    setLastSaved(new Date())
    setDocumentHeader((prev) => ({
      ...prev,
      lastModified: new Date().toLocaleDateString("pt-BR"),
      lastRevision: new Date().toLocaleDateString("pt-BR"),
    }))
    toast({
      title: "Documento salvo",
      description: "Suas alterações foram salvas automaticamente.",
    })
  }

  const handleSaveAndSubmit = () => {
    if (!title.trim() || !content.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Título e conteúdo são obrigatórios.",
        variant: "destructive",
      })
      return
    }
    setShowMetadataModal(true)
  }

  const handleSubmitForApproval = () => {
    if (!documentType || !department || !category) {
      toast({
        title: "Metadados obrigatórios",
        description: "Tipo, departamento e categoria são obrigatórios.",
        variant: "destructive",
      })
      return
    }

    const approvers = getApprovers(documentType, department)

    setDocumentHeader((prev) => ({
      ...prev,
      approvers: approvers,
      number: "", // Será gerado automaticamente pelo banco ao salvar
    }))

    setShowMetadataModal(false)
    toast({
      title: "Documento enviado para aprovação",
      description: "O documento foi enviado para o fluxo de aprovação configurado.",
    })

    setTitle("")
    setContent("")
    setWordCount(0)
    setDocumentType("")
    setDepartment("")
    setCategory("")
    setDescription("")
    setTags("")
    setDocumentHeader({
      number: "",
      author: currentUser.name,
      department: currentUser.department,
      version: "1.0",
      createdDate: new Date().toLocaleDateString("pt-BR"),
      lastModified: new Date().toLocaleDateString("pt-BR"),
      lastRevision: new Date().toLocaleDateString("pt-BR"),
      status: "Rascunho",
      approvers: [],
    })
  }

  const clearAllContent = () => {
    if (content.trim() || title.trim()) {
      setContentHistory((prev) => [...prev, content])
      setContent("")
      setTitle("")
      setWordCount(0)
      toast({
        title: "Conteúdo limpo",
        description: "Todo o conteúdo foi removido. Use 'Desfazer' para recuperar.",
      })
    }
  }

  const undoLastAction = () => {
    if (contentHistory.length > 0) {
      const lastContent = contentHistory[contentHistory.length - 1]
      setContent(lastContent)
      setContentHistory((prev) => prev.slice(0, -1))
      setWordCount(
        lastContent
          .trim()
          .split(/\s+/)
          .filter((word) => word.length > 0).length,
      )
      toast({
        title: "Ação desfeita",
        description: "A última alteração foi desfeita.",
      })
    } else {
      toast({
        title: "Nada para desfazer",
        description: "Não há ações anteriores para desfazer.",
        variant: "destructive",
      })
    }
  }

  const renderPreviewContent = (text: string) => {
    if (!text) return "O conteúdo do documento aparecerá aqui..."

    const formattedText = text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") // Negrito
      .replace(/\*(.*?)\*/g, "<em>$1</em>") // Itálico
      .replace(/<u>(.*?)<\/u>/g, "<u>$1</u>") // Sublinhado
      .replace(/\[(.*?)\]$$(.*?)$$/g, '<a href="$2" class="text-blue-600 underline hover:text-blue-800">$1</a>') // Links
      .replace(/!\[(.*?)\]$$(.*?)$$/g, '<img src="$2" alt="$1" class="max-w-full h-auto my-2 rounded border" />') // Imagens
      .replace(/^• (.+)$/gm, "<li class='ml-4 list-disc'>$1</li>") // Lista não ordenada
      .replace(/^\d+\. (.+)$/gm, "<li class='ml-4 list-decimal'>$1</li>") // Lista ordenada
      .replace(/\n\n/g, "</p><p>") // Parágrafos
      .replace(/\n/g, "<br>") // Quebras de linha

    return `<p>${formattedText}</p>`
  }

  return (
    <div className="h-full flex flex-col">
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Metadados do Documento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label className="text-sm font-medium">Número do Documento</Label>
              <div className="flex items-center mt-1">
                <FileText className="h-4 w-4 mr-2 text-gray-500" />
                <Input
                  value={documentHeader.number || "Será gerado automaticamente"}
                  readOnly
                  className="text-sm bg-gray-50"
                  placeholder="Aguardando metadados..."
                />
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">Autor</Label>
              <div className="flex items-center mt-1">
                <User className="h-4 w-4 mr-2 text-gray-500" />
                <Input value={documentHeader.author} readOnly className="text-sm bg-gray-50" />
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">Departamento</Label>
              <div className="flex items-center mt-1">
                <Building className="h-4 w-4 mr-2 text-gray-500" />
                <Select
                  value={documentHeader.department}
                  onValueChange={(value) => setDocumentHeader((prev) => ({ ...prev, department: value }))}
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Selecione o departamento" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockDepartments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.name}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">Versão</Label>
              <Input
                value={documentHeader.version}
                onChange={(e) => setDocumentHeader((prev) => ({ ...prev, version: e.target.value }))}
                placeholder="1.0"
                className="text-sm mt-1"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="flex items-center text-sm text-gray-600">
              <Calendar className="h-4 w-4 mr-2" />
              <span>Criado: {documentHeader.createdDate}</span>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <Clock className="h-4 w-4 mr-2" />
              <span>Modificado: {documentHeader.lastModified}</span>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <Clock className="h-4 w-4 mr-2" />
              <span>Última Revisão: {documentHeader.lastRevision}</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="flex items-center">
              <Badge variant="secondary">{documentHeader.status}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Editor de Documentos</CardTitle>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Clock className="h-4 w-4" />
              {lastSaved ? `Salvo às ${lastSaved.toLocaleTimeString()}` : "Não salvo"}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="mb-4">
            <Label className="text-sm font-medium mb-2 block">Templates Rápidos</Label>
            <Select onValueChange={(value) => applyTemplate(value)}>
              <SelectTrigger className="w-full max-w-xs">
                <SelectValue placeholder="Selecione um template" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator className="my-4" />

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center space-x-1 border rounded-md p-1 bg-gray-50">
              <Button
                variant="ghost"
                size="sm"
                onClick={undoLastAction}
                disabled={contentHistory.length === 0}
                title="Desfazer última ação (Ctrl+Z)"
                className="hover:bg-blue-100 hover:text-blue-700 disabled:opacity-50"
              >
                <Undo className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllContent}
                title="Limpar todo o conteúdo"
                className="hover:bg-red-100 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center space-x-1 border rounded-md p-1 bg-gray-50">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => formatText("bold")}
                title="Negrito (Ctrl+B)"
                className="hover:bg-gray-200"
              >
                <Bold className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => formatText("italic")}
                title="Itálico (Ctrl+I)"
                className="hover:bg-gray-200"
              >
                <Italic className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => formatText("underline")}
                title="Sublinhado (Ctrl+U)"
                className="hover:bg-gray-200"
              >
                <Underline className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center space-x-1 border rounded-md p-1 bg-gray-50">
              <Button variant="ghost" size="sm" onClick={() => formatText("align-left")}>
                <AlignLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => formatText("align-center")}>
                <AlignCenter className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => formatText("align-right")}>
                <AlignRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center space-x-1 border rounded-md p-1 bg-gray-50">
              <Button variant="ghost" size="sm" onClick={() => formatText("list")}>
                <List className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => formatText("ordered-list")}>
                <ListOrdered className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center space-x-1 border rounded-md p-1 bg-gray-50">
              <Button variant="ghost" size="sm" onClick={() => formatText("link")}>
                <Link className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => formatText("image")}>
                <ImageIcon className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => formatText("table")}>
                <Table className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className={`flex-1 grid gap-4 ${showPreview ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"}`}>
        <Card className="flex flex-col">
          <CardHeader>
            <div className="space-y-3">
              <Input
                placeholder="Título do documento..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-lg font-semibold"
              />
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>{wordCount} palavras</span>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm" onClick={handleSave}>
                    <Save className="h-4 w-4 mr-1" />
                    Salvar
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setShowPreview(!showPreview)}>
                    <Eye className="h-4 w-4 mr-1" />
                    {showPreview ? "Ocultar" : "Prévia"}
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1">
            <Textarea
              ref={textareaRef}
              placeholder="Comece a escrever seu documento aqui..."
              value={content}
              onChange={handleContentChange}
              className={`resize-none font-mono text-sm ${showPreview ? "min-h-[400px]" : "min-h-[600px]"}`}
            />
          </CardContent>
        </Card>

        {showPreview && (
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Prévia do Documento
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="border-b pb-4 mb-6">
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                  <div className="col-span-2">
                    <strong>Número:</strong> {documentHeader.number || "Será gerado após envio para aprovação"}
                  </div>
                  <div>
                    <strong>Autor:</strong> {documentHeader.author}
                  </div>
                  <div>
                    <strong>Departamento:</strong> {documentHeader.department}
                  </div>
                  <div>
                    <strong>Versão:</strong> {documentHeader.version}
                  </div>
                  <div>
                    <strong>Criado em:</strong> {documentHeader.createdDate}
                  </div>
                  <div>
                    <strong>Última Revisão:</strong> {documentHeader.lastRevision}
                  </div>
                  <div>
                    <strong>Status:</strong> {documentHeader.status}
                  </div>
                  <div className="col-span-2">
                    <strong>Aprovadores:</strong>{" "}
                    <span className="text-gray-500 italic">
                      {documentHeader.approvers.length > 0
                        ? documentHeader.approvers.join(", ")
                        : "Os aprovadores serão exibidos aqui após o envio para aprovação"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="prose prose-sm max-w-none">
                <h1 className="text-xl font-bold mb-4">{title || "Título do documento"}</h1>

                <div
                  className="whitespace-pre-wrap text-sm leading-relaxed prose-headings:font-bold prose-links:text-blue-600 prose-strong:font-bold prose-em:italic"
                  dangerouslySetInnerHTML={{ __html: renderPreviewContent(content) }}
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Card className="mt-4">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span>Status: {documentHeader.status}</span>
              <Badge variant="secondary">{documentHeader.status}</Badge>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Salvar Rascunho
              </Button>
              <Button onClick={handleSaveAndSubmit}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Salvar e Enviar para Aprovação
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showMetadataModal} onOpenChange={setShowMetadataModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Metadados do Documento</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-4 bg-gray-50 rounded-lg border">
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-gray-600" />
                <div>
                  <Label className="text-sm font-medium text-gray-700">Número do Documento</Label>
                  <p className="text-lg font-mono font-semibold text-gray-900 mt-1">
                    Será gerado automaticamente ao salvar o documento
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    O número será atribuído automaticamente baseado no tipo e departamento
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="documentType">Tipo de Documento *</Label>
                <Select value={documentType} onValueChange={setDocumentType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="policy">Política</SelectItem>
                    <SelectItem value="procedure">Procedimento</SelectItem>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="memo">Memorando</SelectItem>
                    <SelectItem value="report">Relatório</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="department">Departamento *</Label>
                <Select value={department} onValueChange={setDepartment}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o departamento" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockDepartments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.shortName}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="category">Categoria *</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="internal">Uso Interno</SelectItem>
                  <SelectItem value="external">Uso Externo</SelectItem>
                  <SelectItem value="confidential">Confidencial</SelectItem>
                  <SelectItem value="public">Público</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                placeholder="Breve descrição do documento..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
              <Input
                id="tags"
                placeholder="política, rh, procedimento..."
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
            </div>

            {documentType && department && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2 flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  Fluxo de Aprovação
                </h4>
                <div className="text-sm text-blue-700">
                  <p>Este documento seguirá o fluxo de aprovação padrão:</p>
                  <ol className="list-decimal list-inside mt-2 space-y-1">
                    {getApprovers(documentType, department).map((approver, index) => (
                      <li key={index}>
                        {approver} ({department})
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowMetadataModal(false)}>
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button onClick={handleSubmitForApproval}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Enviar para Aprovação
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
