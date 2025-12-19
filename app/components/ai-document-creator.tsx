"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PageTitle } from "@/components/ui/page-title"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Sparkles,
  FileText,
  Download,
  Copy,
  RefreshCw,
  Wand2,
  BookOpen,
  FileCheck,
  Users,
  Building,
  Lightbulb,
  Clock,
  Send,
  CheckCircle,
  ArrowRight,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function AIDocumentCreator() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [generatedContent, setGeneratedContent] = useState("")
  const [documentTitle, setDocumentTitle] = useState("")
  const [documentType, setDocumentType] = useState("")
  const [prompt, setPrompt] = useState("")
  const [tone, setTone] = useState("")
  const [length, setLength] = useState("")
  const [showMetadataModal, setShowMetadataModal] = useState(false)
  const [documentMetadata, setDocumentMetadata] = useState({
    title: "",
    documentType: "",
    department: "",
    category: "",
    description: "",
    tags: "",
  })
  const { toast } = useToast()

  interface Template {
    title: string
    type: string
    description: string
    prompt: string
  }

  const documentTypes = [
    { value: "policy", label: "Política Empresarial", icon: Building },
    { value: "procedure", label: "Procedimento Operacional", icon: FileCheck },
    { value: "manual", label: "Manual de Instruções", icon: BookOpen },
    { value: "report", label: "Relatório", icon: FileText },
    { value: "memo", label: "Memorando", icon: Users },
    { value: "proposal", label: "Proposta", icon: Lightbulb },
  ]

  const toneOptions = [
    { value: "formal", label: "Formal" },
    { value: "professional", label: "Profissional" },
    { value: "friendly", label: "Amigável" },
    { value: "technical", label: "Técnico" },
    { value: "casual", label: "Casual" },
  ]

  const lengthOptions = [
    { value: "short", label: "Curto (1-2 páginas)" },
    { value: "medium", label: "Médio (3-5 páginas)" },
    { value: "long", label: "Longo (6+ páginas)" },
  ]

  const templates = [
    {
      title: "Política de Trabalho Remoto",
      type: "policy",
      description: "Diretrizes para trabalho híbrido e remoto",
      prompt: "Criar uma política de trabalho remoto que inclua diretrizes de produtividade, comunicação e segurança",
    },
    {
      title: "Manual de Onboarding",
      type: "manual",
      description: "Guia para integração de novos funcionários",
      prompt: "Desenvolver um manual completo de onboarding para novos colaboradores",
    },
    {
      title: "Procedimento de Segurança",
      type: "procedure",
      description: "Protocolos de segurança no ambiente de trabalho",
      prompt: "Criar procedimentos de segurança para prevenção de acidentes e emergências",
    },
    {
      title: "Relatório de Performance",
      type: "report",
      description: "Template para avaliação de desempenho",
      prompt: "Gerar um template de relatório para avaliação de performance trimestral",
    },
  ]

  const departments = [
    { value: "ti", label: "Tecnologia da Informação" },
    { value: "rh", label: "Recursos Humanos" },
    { value: "financeiro", label: "Financeiro" },
    { value: "operacoes", label: "Operações" },
    { value: "juridico", label: "Jurídico" },
    { value: "marketing", label: "Marketing" },
  ]

  const categories = [
    { value: "politicas", label: "Políticas" },
    { value: "procedimentos", label: "Procedimentos" },
    { value: "manuais", label: "Manuais" },
    { value: "relatorios", label: "Relatórios" },
    { value: "formularios", label: "Formulários" },
  ]

  const mockApprovalWorkflow = [
    { name: "Gerente de Setor", role: "Supervisor direto" },
    { name: "Diretoria", role: "Aprovação executiva" },
    { name: "Compliance", role: "Revisão final" },
  ]

  const handleGenerate = async () => {
    if (!documentTitle || !documentType || !prompt) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o título, tipo de documento e descrição.",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)
    setGenerationProgress(0)

    const progressInterval = setInterval(() => {
      setGenerationProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return 90
        }
        return prev + 10
      })
    }, 200)

    setTimeout(() => {
      clearInterval(progressInterval)
      setGenerationProgress(100)

      const mockContent = `# ${documentTitle}

## Introdução
Este documento foi gerado automaticamente usando inteligência artificial para atender às necessidades específicas da organização.

## Objetivo
O objetivo deste ${documentTypes.find((t) => t.value === documentType)?.label.toLowerCase()} é estabelecer diretrizes claras e práticas para...

## Escopo
Este documento se aplica a todos os colaboradores e departamentos da organização, abrangendo...

## Diretrizes Principais

### 1. Definições e Conceitos
- **Conceito A**: Definição detalhada do primeiro conceito relevante
- **Conceito B**: Explicação do segundo conceito importante
- **Conceito C**: Descrição do terceiro elemento fundamental

### 2. Procedimentos
1. **Primeiro Passo**: Descrição detalhada da primeira etapa do processo
2. **Segundo Passo**: Explicação da segunda fase de implementação
3. **Terceiro Passo**: Detalhamento da etapa final

### 3. Responsabilidades
- **Gestores**: Responsáveis por supervisionar e garantir o cumprimento
- **Colaboradores**: Devem seguir as diretrizes estabelecidas
- **RH**: Responsável pelo treinamento e acompanhamento

## Implementação
A implementação deste documento deve seguir um cronograma estruturado...

## Monitoramento e Avaliação
O cumprimento das diretrizes será monitorado através de...

## Considerações Finais
Este documento será revisado periodicamente para garantir sua relevância e eficácia.

---
*Documento gerado automaticamente em ${new Date().toLocaleDateString("pt-BR")}*`

      setGeneratedContent(mockContent)
      setIsGenerating(false)

      toast({
        title: "Documento gerado com sucesso!",
        description: "Seu documento foi criado usando IA. Você pode editá-lo antes de salvar.",
      })
    }, 2000)
  }

  const handleCopyContent = () => {
    navigator.clipboard.writeText(generatedContent)
    toast({
      title: "Conteúdo copiado!",
      description: "O conteúdo foi copiado para a área de transferência.",
    })
  }

  const handleSaveDocument = () => {
    if (!generatedContent) {
      toast({
        title: "Nenhum conteúdo gerado",
        description: "Gere um documento primeiro antes de salvar.",
        variant: "destructive",
      })
      return
    }

    setDocumentMetadata({
      title: documentTitle,
      documentType: documentType,
      department: "",
      category: "",
      description: "",
      tags: "",
    })
    setShowMetadataModal(true)
  }

  const handleSubmitForApproval = () => {
    if (!documentMetadata.title || !documentMetadata.documentType || !documentMetadata.department) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha título, tipo de documento e departamento.",
        variant: "destructive",
      })
      return
    }

    toast({
      title: "Documento enviado para aprovação!",
      description: "O documento foi salvo e enviado para o fluxo de aprovação.",
    })

    setShowMetadataModal(false)
    setGeneratedContent("")
    setDocumentTitle("")
    setDocumentType("")
    setPrompt("")
    setDocumentMetadata({
      title: "",
      documentType: "",
      department: "",
      category: "",
      description: "",
      tags: "",
    })
  }

  const applyTemplate = (template: Template) => {
    setDocumentTitle(template.title)
    setDocumentType(template.type)
    setPrompt(template.prompt)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
          <Sparkles className="h-6 w-6 text-white" />
        </div>
        <PageTitle
          title="Crie documentos com IA"
          subtitle="Gere documentos profissionais usando inteligência artificial"
        />
      </div>

      <Tabs defaultValue="create" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="create">Criar Documento</TabsTrigger>
          <TabsTrigger value="templates">Templates Rápidos</TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Wand2 className="h-5 w-5" />
                  <span>Configuração do Documento</span>
                </CardTitle>
                <CardDescription>Configure os parâmetros para gerar seu documento</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título do Documento</Label>
                  <Input
                    id="title"
                    placeholder="Ex: Política de Trabalho Remoto"
                    value={documentTitle}
                    onChange={(e) => setDocumentTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Tipo de Documento</Label>
                  <Select value={documentType} onValueChange={setDocumentType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {documentTypes.map((type) => {
                        const Icon = type.icon
                        return (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center space-x-2">
                              <Icon className="h-4 w-4" />
                              <span>{type.label}</span>
                            </div>
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tone">Tom</Label>
                    <Select value={tone} onValueChange={setTone}>
                      <SelectTrigger>
                        <SelectValue placeholder="Tom" />
                      </SelectTrigger>
                      <SelectContent>
                        {toneOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="length">Extensão</Label>
                    <Select value={length} onValueChange={setLength}>
                      <SelectTrigger>
                        <SelectValue placeholder="Tamanho" />
                      </SelectTrigger>
                      <SelectContent>
                        {lengthOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="prompt">Descrição e Requisitos</Label>
                  <Textarea
                    id="prompt"
                    placeholder="Descreva o que você precisa no documento. Seja específico sobre requisitos, seções necessárias, público-alvo, etc."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={4}
                  />
                </div>

                <Button onClick={handleGenerate} disabled={isGenerating} className="w-full">
                  {isGenerating ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Gerando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Gerar Documento
                    </>
                  )}
                </Button>

                {isGenerating && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Progresso da geração</span>
                      <span>{generationProgress}%</span>
                    </div>
                    <Progress value={generationProgress} className="w-full" />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-5 w-5" />
                    <span>Prévia do Documento</span>
                  </div>
                  {generatedContent && (
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={handleCopyContent}>
                        <Copy className="h-4 w-4 mr-1" />
                        Copiar
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-1" />
                        Baixar
                      </Button>
                      <Button size="sm" onClick={handleSaveDocument}>
                        <Send className="h-4 w-4 mr-1" />
                        Salvar e Enviar para Aprovação
                      </Button>
                    </div>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {generatedContent ? (
                  <div className="space-y-4">
                    <Textarea
                      value={generatedContent}
                      onChange={(e) => setGeneratedContent(e.target.value)}
                      rows={20}
                      className="font-mono text-sm"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-96 text-gray-500">
                    <FileText className="h-16 w-16 mb-4 text-gray-300" />
                    <p className="text-center">
                      Configure os parâmetros e clique em "Gerar Documento" para ver a prévia
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map((template, index) => {
              const TypeIcon = documentTypes.find((t) => t.value === template.type)?.icon || FileText
              return (
                <Card
                  key={index}
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => applyTemplate(template)}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-lg">
                      <TypeIcon className="h-5 w-5 text-blue-600" />
                      <span>{template.title}</span>
                    </CardTitle>
                    <CardDescription>{template.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary">{documentTypes.find((t) => t.value === template.type)?.label}</Badge>
                      <Button variant="outline" size="sm">
                        <Clock className="h-4 w-4 mr-1" />
                        Usar Template
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={showMetadataModal} onOpenChange={setShowMetadataModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Finalizar Documento e Enviar para Aprovação</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Metadados do Documento</CardTitle>
                <CardDescription>Preencha as informações necessárias para criar o documento no sistema</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="meta-title">Título *</Label>
                    <Input
                      id="meta-title"
                      value={documentMetadata.title}
                      onChange={(e) => setDocumentMetadata((prev) => ({ ...prev, title: e.target.value }))}
                      placeholder="Título do documento"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="meta-type">Tipo de Documento *</Label>
                    <Select
                      value={documentMetadata.documentType}
                      onValueChange={(value) => setDocumentMetadata((prev) => ({ ...prev, documentType: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {documentTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="meta-department">Departamento *</Label>
                    <Select
                      value={documentMetadata.department}
                      onValueChange={(value) => setDocumentMetadata((prev) => ({ ...prev, department: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o departamento" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((dept) => (
                          <SelectItem key={dept.value} value={dept.value}>
                            {dept.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="meta-category">Categoria</Label>
                    <Select
                      value={documentMetadata.category}
                      onValueChange={(value) => setDocumentMetadata((prev) => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="meta-description">Descrição</Label>
                  <Textarea
                    id="meta-description"
                    value={documentMetadata.description}
                    onChange={(e) => setDocumentMetadata((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Breve descrição do documento"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="meta-tags">Tags</Label>
                  <Input
                    id="meta-tags"
                    value={documentMetadata.tags}
                    onChange={(e) => setDocumentMetadata((prev) => ({ ...prev, tags: e.target.value }))}
                    placeholder="Tags separadas por vírgula (ex: política, rh, trabalho remoto)"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Fluxo de Aprovação</CardTitle>
                <CardDescription>
                  Este documento seguirá o fluxo de aprovação baseado no tipo e departamento selecionados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockApprovalWorkflow.map((step, index) => (
                    <div key={index} className="flex items-center space-x-4">
                      <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{step.name}</p>
                        <p className="text-sm text-gray-500">{step.role}</p>
                      </div>
                      {index < mockApprovalWorkflow.length - 1 && <ArrowRight className="h-4 w-4 text-gray-400" />}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowMetadataModal(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSubmitForApproval}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Criar e Enviar para Aprovação
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
