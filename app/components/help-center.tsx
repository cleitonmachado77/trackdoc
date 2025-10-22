"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Search } from "lucide-react"
import { cn } from "@/lib/utils"

export default function HelpCenter() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")


  const categories = [
    { id: "all", label: "Todos", count: 10 },
    { id: "getting-started", label: "Primeiros Passos", count: 2 },
    { id: "documents", label: "Documentos", count: 2 },
    { id: "signatures", label: "Assinaturas", count: 2 },
    { id: "approvals", label: "Aprovações", count: 1 },
    { id: "admin", label: "Administração", count: 2 },
    { id: "notifications", label: "Notificações", count: 1 },
  ]

  const faqItems = [
    {
      category: "getting-started",
      question: "Como faço para começar a usar o Trackdoc?",
      answer:
        "Para começar, faça login com suas credenciais e acesse o Dashboard. Lá você encontrará as principais funcionalidades da plataforma. Use as 'Ações Rápidas' no dashboard para acessar rapidamente as funcionalidades principais como criar documentos e gerenciar aprovações.",
    },
    {
      category: "documents",
      question: "Como posso fazer upload de documentos?",
      answer:
        "Vá para a seção 'Documentos' ou clique no botão 'Novo Documento' nas Ações Rápidas do Dashboard. Você pode fazer upload de arquivos PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, CSV, JPG, PNG e GIF. O tamanho máximo por arquivo é de 50MB.",
    },
    {
      category: "approvals",
      question: "Como funciona o processo de aprovação?",
      answer:
        "Documentos podem ser enviados para aprovação durante o upload. Os aprovadores receberão notificações e poderão revisar, aprovar ou rejeitar documentos diretamente na plataforma. Acesse a seção 'Aprovações' para gerenciar suas pendências.",
    },
    {
      category: "signatures",
      question: "Como funciona a assinatura digital?",
      answer:
        "O sistema oferece assinatura digital através da seção 'Assinatura Eletrônica'. Você pode fazer upload de documentos para assinatura individual ou configurar assinaturas múltiplas por departamento.",
    },
    {
      category: "signatures",
      question: "Como verificar a autenticidade de uma assinatura?",
      answer:
        "Cada assinatura digital possui um código de verificação único. Use a funcionalidade 'Verificar Assinatura' na seção de assinaturas para validar a autenticidade de documentos assinados digitalmente.",
    },
    {
      category: "admin",
      question: "Como gerenciar usuários e departamentos?",
      answer:
        "Na seção 'Administração', você pode gerenciar entidades, criar departamentos, adicionar usuários e configurar permissões. O sistema permite controle granular de acesso baseado em departamentos e funções.",
    },
    {
      category: "notifications",
      question: "Como funciona o sistema de notificações?",
      answer:
        "O sistema possui notificações em tempo real para aprovações pendentes e assinaturas solicitadas. As notificações aparecem na seção 'Notificações' e também podem ser enviadas por email quando configurado.",
    },
    {
      category: "getting-started",
      question: "Quais são os requisitos do sistema?",
      answer:
        "O Trackdoc é uma aplicação web que funciona em qualquer navegador moderno (Chrome, Firefox, Safari, Edge). Recomendamos conexão de internet estável e resolução mínima de 1024x768. Não é necessário instalar nenhum software adicional.",
    },
    {
      category: "documents",
      question: "Quais formatos de arquivo são suportados?",
      answer:
        "O sistema suporta os principais formatos: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, CSV, JPG, PNG e GIF. O tamanho máximo por arquivo é de 50MB.",
    },
    {
      category: "admin",
      question: "Como acessar os logs do sistema?",
      answer:
        "Administradores podem acessar os logs completos do sistema através da seção 'Administração > Logs do Sistema'. Lá é possível visualizar todas as atividades, exportar relatórios e fazer auditoria das ações realizadas.",
    },
  ]



  const filteredFAQ = faqItems.filter(
    (item) =>
      (selectedCategory === "all" || item.category === selectedCategory) &&
      (searchQuery === "" ||
        item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.answer.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Central de Ajuda</h1>
          <p className="text-gray-600">Encontre respostas, tutoriais e suporte técnico</p>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar na central de ajuda..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Quick Actions - Temporariamente oculto */}
      {/* 
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold">Documentação</h3>
                <p className="text-sm text-gray-600">Guias detalhados</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <MessageCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold">Chat ao Vivo</h3>
                <p className="text-sm text-gray-600">Suporte imediato</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Video className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold">Tutoriais</h3>
                <p className="text-sm text-gray-600">Aprenda assistindo</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      */}

      {/* Funcionalidades Principais */}
      <Card>
        <CardHeader>
          <CardTitle>Funcionalidades principais da Trackdoc</CardTitle>
          <CardDescription>Conheça as principais funcionalidades disponíveis na plataforma</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
              <h4 className="font-semibold text-blue-600 mb-2">📄 Gerenciamento de Documentos</h4>
              <p className="text-sm text-gray-600">Upload, organização e categorização de documentos. Suporte para PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, CSV, JPG, PNG e GIF.</p>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
              <h4 className="font-semibold text-green-600 mb-2">✅ Sistema de Aprovações</h4>
              <p className="text-sm text-gray-600">Envio de documentos para aprovação com notificações automáticas. Aprovadores podem revisar, aprovar ou rejeitar documentos.</p>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
              <h4 className="font-semibold text-purple-600 mb-2">✍️ Assinatura Eletrônica</h4>
              <p className="text-sm text-gray-600">Assinatura digital individual e múltipla com verificação de autenticidade e códigos únicos de verificação.</p>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
              <h4 className="font-semibold text-teal-600 mb-2">📊 Dashboard Interativo</h4>
              <p className="text-sm text-gray-600">Visão geral com métricas em tempo real, gráficos de atividades e ações rápidas para principais funcionalidades.</p>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
              <h4 className="font-semibold text-pink-600 mb-2">🏢 Gestão de Entidades</h4>
              <p className="text-sm text-gray-600">Administração de usuários, departamentos, categorias e tipos de documentos com controle de permissões.</p>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
              <h4 className="font-semibold text-red-600 mb-2">🔔 Sistema de Notificações</h4>
              <p className="text-sm text-gray-600">Notificações em tempo real para aprovações pendentes, assinaturas solicitadas e atualizações do sistema.</p>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
              <h4 className="font-semibold text-amber-600 mb-2">📋 Logs e Auditoria</h4>
              <p className="text-sm text-gray-600">Sistema completo de logs com rastreabilidade de todas as ações realizadas no sistema para auditoria.</p>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
              <h4 className="font-semibold text-indigo-600 mb-2">👤 Gerenciamento de Perfil</h4>
              <p className="text-sm text-gray-600">Página de configurações pessoais para gerenciar informações do usuário, foto de perfil e configurações de segurança.</p>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
              <h4 className="font-semibold text-emerald-600 mb-2">📱 Interface Responsiva</h4>
              <p className="text-sm text-gray-600">Acesso completo via web com interface adaptável para desktop, tablet e dispositivos móveis.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs defaultValue="faq" className="space-y-6">
        <TabsList className="grid w-full grid-cols-1">
          <TabsTrigger value="faq">FAQ</TabsTrigger>
        </TabsList>

        {/* FAQ Tab */}
        <TabsContent value="faq" className="space-y-6">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                className="h-8"
              >
                {category.label}
                <Badge variant="secondary" className="ml-2">
                  {category.count}
                </Badge>
              </Button>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Perguntas Frequentes</CardTitle>
              <CardDescription>Encontre respostas para as dúvidas mais comuns</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {filteredFAQ.map((item, index) => (
                  <AccordionItem key={index} value={`item-${index}`}>
                    <AccordionTrigger className="text-left">{item.question}</AccordionTrigger>
                    <AccordionContent className="text-gray-600">{item.answer}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>


      </Tabs>
    </div>
  )
}
