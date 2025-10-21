"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Search, BookOpen, MessageCircle, Phone, Mail, Video, Clock, Send, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

export default function HelpCenter() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [ticketSubject, setTicketSubject] = useState("")
  const [ticketMessage, setTicketMessage] = useState("")

  const categories = [
    { id: "all", label: "Todos", count: 52 },
    { id: "getting-started", label: "Primeiros Passos", count: 8 },
    { id: "documents", label: "Documentos", count: 12 },
    { id: "workflows", label: "Workflows", count: 10 },
    { id: "signatures", label: "Assinaturas", count: 8 },
    { id: "approvals", label: "Aprovações", count: 6 },
    { id: "admin", label: "Administração", count: 5 },
    { id: "notifications", label: "Notificações", count: 3 },
  ]

  const faqItems = [
    {
      category: "getting-started",
      question: "Como faço para começar a usar o TrackDoc?",
      answer:
        "Para começar, faça login com suas credenciais e acesse o Dashboard. Lá você encontrará um tour guiado que o ajudará a conhecer as principais funcionalidades da plataforma. Use as 'Ações Rápidas' no sidebar para acessar funcionalidades principais.",
    },
    {
      category: "documents",
      question: "Como posso fazer upload de documentos?",
      answer:
        "Vá para a seção 'Documentos' e clique no botão 'Novo Documento' nas Ações Rápidas. Você pode fazer upload de arquivos PDF, DOC, DOCX e outros formatos suportados. O sistema automaticamente extrairá metadados e aplicará tags relevantes.",
    },
    {
      category: "workflows",
      question: "Como funciona o sistema de workflows?",
      answer:
        "O TrackDoc possui um sistema robusto de workflows que permite criar fluxos de aprovação personalizados. Você pode configurar etapas sequenciais, definir aprovadores por departamento e criar processos de assinatura múltipla. Acesse 'Gerenciamento de Processos' para criar e gerenciar workflows.",
    },
    {
      category: "signatures",
      question: "Como funciona a assinatura digital?",
      answer:
        "O sistema oferece assinatura digital individual e múltipla. Para assinatura individual, acesse 'Assinatura Digital' nas Ações Rápidas. Para assinatura múltipla, o sistema detecta automaticamente quando um departamento possui múltiplos usuários e cria um processo de aprovação coletiva.",
    },
    {
      category: "signatures",
      question: "O que é assinatura múltipla?",
      answer:
        "A assinatura múltipla é um processo onde todos os usuários de um departamento devem aprovar um documento antes que ele seja considerado assinado. O sistema detecta automaticamente departamentos com múltiplos usuários e cria solicitações de aprovação individuais para cada membro.",
    },
    {
      category: "approvals",
      question: "Como funciona o processo de aprovação?",
      answer:
        "Documentos podem ser enviados para aprovação através do workflow configurado. Os aprovadores receberão notificações em tempo real e poderão revisar, aprovar ou rejeitar documentos diretamente na plataforma. Use 'Revisar Aprovações' nas Ações Rápidas para acessar pendências.",
    },
    {
      category: "workflows",
      question: "Como criar um novo workflow?",
      answer:
        "Acesse 'Gerenciamento de Processos' e clique em 'Criar Processo'. Configure as etapas do workflow, defina os departamentos responsáveis e configure as regras de aprovação. O sistema suporta workflows complexos com múltiplas etapas e aprovações condicionais.",
    },
    {
      category: "admin",
      question: "Como gerenciar usuários e permissões?",
      answer:
        "Na seção 'Administração', você pode adicionar novos usuários, definir roles e permissões, gerenciar departamentos e configurar workflows de aprovação. O sistema possui controle granular de acesso baseado em departamentos e funções.",
    },
    {
      category: "documents",
      question: "Posso colaborar em documentos com outros usuários?",
      answer:
        "Sim! Você pode compartilhar documentos com outros usuários, definir permissões de visualização ou edição, e acompanhar todas as alterações através do histórico de versões. O sistema mantém um log completo de todas as ações realizadas.",
    },
    {
      category: "notifications",
      question: "Como funciona o sistema de notificações?",
      answer:
        "O sistema possui notificações em tempo real para aprovações pendentes, assinaturas solicitadas e atualizações de workflow. As notificações aparecem no sino de notificações no topo da interface e também são enviadas por email quando configurado.",
    },
    {
      category: "signatures",
      question: "Como verificar a autenticidade de uma assinatura?",
      answer:
        "Cada assinatura digital possui um código de verificação único e um hash criptográfico. Use a funcionalidade 'Verificar Assinatura' para validar a autenticidade de documentos assinados. O sistema também mantém um carimbo de tempo digital para cada assinatura.",
    },
    {
      category: "workflows",
      question: "Posso reverter uma etapa do workflow?",
      answer:
        "Sim, o sistema permite reverter etapas do workflow quando necessário. Acesse os detalhes do processo e use a opção 'Reverter Etapa' para voltar a uma etapa anterior. Esta funcionalidade é útil para correções e ajustes no processo.",
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
        "O sistema suporta os principais formatos: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, CSV, JPG, PNG e GIF. O tamanho máximo por arquivo é de 50MB. Novos formatos podem ser adicionados conforme necessidade.",
    },
    {
      category: "admin",
      question: "Como configurar departamentos e usuários?",
      answer:
        "Na seção Administração, acesse 'Gestão de Entidades' para criar departamentos e adicionar usuários. Você pode definir permissões específicas, atribuir roles e configurar workflows de aprovação por departamento. Cada usuário pode pertencer a múltiplos departamentos.",
    },
    {
      category: "signatures",
      question: "As assinaturas digitais têm validade jurídica?",
      answer:
        "Sim, as assinaturas digitais do Trackdoc seguem os padrões ICP-Brasil e possuem validade jurídica. Cada assinatura inclui certificado digital, carimbo de tempo e hash criptográfico, garantindo autenticidade, integridade e não-repúdio do documento.",
    },
    {
      category: "notifications",
      question: "Posso personalizar as notificações?",
      answer:
        "Sim, você pode configurar quais tipos de notificações deseja receber, definir horários de envio e escolher os canais (email, sistema). Acesse suas configurações de perfil para personalizar as preferências de notificação.",
    },
    {
      category: "approvals",
      question: "Como funciona a aprovação em lote?",
      answer:
        "O sistema permite aprovar múltiplos documentos simultaneamente. Selecione os documentos desejados na lista de aprovações pendentes e use a opção 'Aprovar Selecionados'. Esta funcionalidade agiliza o processo para documentos similares.",
    },
    {
      category: "admin",
      question: "Como fazer backup dos dados?",
      answer:
        "O sistema realiza backups automáticos diários. Administradores podem solicitar exportação de dados através da seção 'Logs do Sistema'. Para empresas, oferecemos opções de backup personalizado e recuperação de desastres.",
    },
  ]

  const tutorials = [
    {
      title: "Introdução ao TrackDoc",
      description: "Aprenda os conceitos básicos da plataforma e navegação",
      duration: "5 min",
      type: "video",
      difficulty: "Iniciante",
    },
    {
      title: "Gerenciamento de Documentos",
      description: "Como fazer upload, organizar e categorizar documentos",
      duration: "8 min",
      type: "video",
      difficulty: "Iniciante",
    },
    {
      title: "Criando Workflows de Aprovação",
      description: "Guia completo para configurar processos de aprovação personalizados",
      duration: "12 min",
      type: "video",
      difficulty: "Intermediário",
    },
    {
      title: "Assinatura Digital Individual",
      description: "Como assinar documentos digitalmente com segurança",
      duration: "6 min",
      type: "video",
      difficulty: "Iniciante",
    },
    {
      title: "Assinatura Múltipla por Departamento",
      description: "Configurando e executando assinaturas coletivas",
      duration: "10 min",
      type: "video",
      difficulty: "Intermediário",
    },
    {
      title: "Sistema de Notificações",
      description: "Entendendo e gerenciando notificações em tempo real",
      duration: "4 min",
      type: "video",
      difficulty: "Iniciante",
    },
    {
      title: "Verificação de Assinaturas",
      description: "Como verificar a autenticidade de documentos assinados",
      duration: "5 min",
      type: "video",
      difficulty: "Iniciante",
    },
    {
      title: "Administração de Usuários",
      description: "Gerenciando usuários, departamentos e permissões",
      duration: "8 min",
      type: "video",
      difficulty: "Avançado",
    },
  ]

  const supportTickets = [
    {
      id: "#TK-001",
      subject: "Configuração de assinatura múltipla",
      status: "Em andamento",
      priority: "Alta",
      created: "2024-01-15",
      agent: "Equipe Técnica",
    },
    {
      id: "#TK-002",
      subject: "Dúvida sobre workflows de aprovação",
      status: "Resolvido",
      priority: "Média",
      created: "2024-01-14",
      agent: "Suporte TrackDoc",
    },
    {
      id: "#TK-003",
      subject: "Problema com notificações",
      status: "Resolvido",
      priority: "Baixa",
      created: "2024-01-13",
      agent: "Suporte TrackDoc",
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
              <p className="text-sm text-gray-600">Upload, organização e categorização de documentos com metadados automáticos. Suporte para PDF, DOC, XLS, PPT e mais.</p>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
              <h4 className="font-semibold text-green-600 mb-2">🔄 Workflows de Aprovação</h4>
              <p className="text-sm text-gray-600">Criação de fluxos personalizados com etapas sequenciais, aprovações condicionais e controle granular de permissões.</p>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
              <h4 className="font-semibold text-purple-600 mb-2">✍️ Assinatura Digital</h4>
              <p className="text-sm text-gray-600">Assinatura individual e múltipla com verificação criptográfica, carimbo de tempo e certificação digital.</p>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
              <h4 className="font-semibold text-orange-600 mb-2">👥 Assinatura Múltipla</h4>
              <p className="text-sm text-gray-600">Processo de aprovação coletiva por departamento com detecção automática e controle de status individual.</p>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
              <h4 className="font-semibold text-red-600 mb-2">🔔 Notificações em Tempo Real</h4>
              <p className="text-sm text-gray-600">Sistema inteligente de notificações para aprovações, assinaturas, atualizações de workflow e lembretes automáticos.</p>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
              <h4 className="font-semibold text-indigo-600 mb-2">🔐 Verificação de Assinaturas</h4>
              <p className="text-sm text-gray-600">Validação de autenticidade com códigos de verificação únicos, hash criptográfico e auditoria completa.</p>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
              <h4 className="font-semibold text-teal-600 mb-2">📊 Dashboard Inteligente</h4>
              <p className="text-sm text-gray-600">Visão geral completa com métricas em tempo real, gráficos interativos e ações rápidas personalizáveis.</p>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
              <h4 className="font-semibold text-pink-600 mb-2">🏢 Gestão de Entidades</h4>
              <p className="text-sm text-gray-600">Administração completa de usuários, departamentos, permissões e configurações organizacionais.</p>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
              <h4 className="font-semibold text-amber-600 mb-2">📋 Auditoria e Logs</h4>
              <p className="text-sm text-gray-600">Sistema completo de auditoria com logs detalhados, rastreabilidade e relatórios de conformidade.</p>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
              <h4 className="font-semibold text-cyan-600 mb-2">🔍 Busca Avançada</h4>
              <p className="text-sm text-gray-600">Ferramenta de busca inteligente com filtros avançados, busca por conteúdo e indexação automática.</p>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
              <h4 className="font-semibold text-emerald-600 mb-2">📱 Interface Responsiva</h4>
              <p className="text-sm text-gray-600">Acesso completo via web com interface adaptável para desktop, tablet e dispositivos móveis.</p>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
              <h4 className="font-semibold text-violet-600 mb-2">🔒 Segurança Avançada</h4>
              <p className="text-sm text-gray-600">Criptografia de ponta a ponta, controle de acesso baseado em roles e conformidade com LGPD.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs defaultValue="faq" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="faq">FAQ</TabsTrigger>
          <TabsTrigger value="tutorials">Tutoriais</TabsTrigger>
          <TabsTrigger value="support">Suporte</TabsTrigger>
          <TabsTrigger value="contact">Contato</TabsTrigger>
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

        {/* Tutorials Tab */}
        <TabsContent value="tutorials" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tutoriais em Vídeo</CardTitle>
              <CardDescription>Aprenda a usar o TrackDoc com nossos tutoriais passo a passo</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tutorials.map((tutorial, index) => (
                  <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <div className="p-2 bg-red-100 rounded-lg flex-shrink-0">
                          <Video className="h-5 w-5 text-red-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm">{tutorial.title}</h4>
                          <p className="text-xs text-gray-600 mt-1">{tutorial.description}</p>
                          <div className="flex items-center space-x-4 mt-2">
                            <div className="flex items-center space-x-1">
                              <Clock className="h-3 w-3 text-gray-400" />
                              <span className="text-xs text-gray-500">{tutorial.duration}</span>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {tutorial.difficulty}
                            </Badge>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Support Tab */}
        <TabsContent value="support" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Create Ticket */}
            <Card>
              <CardHeader>
                <CardTitle>Abrir Chamado</CardTitle>
                <CardDescription>Descreva seu problema e nossa equipe entrará em contato</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Assunto</label>
                  <Input
                    placeholder="Descreva brevemente o problema"
                    value={ticketSubject}
                    onChange={(e) => setTicketSubject(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Descrição</label>
                  <textarea
                    className="w-full p-3 border border-gray-300 rounded-md resize-none"
                    rows={4}
                    placeholder="Descreva detalhadamente o problema ou dúvida"
                    value={ticketMessage}
                    onChange={(e) => setTicketMessage(e.target.value)}
                  />
                </div>
                <Button className="w-full">
                  <Send className="h-4 w-4 mr-2" />
                  Enviar Chamado
                </Button>
              </CardContent>
            </Card>

            {/* My Tickets */}
            <Card>
              <CardHeader>
                <CardTitle>Meus Chamados</CardTitle>
                <CardDescription>Acompanhe o status dos seus chamados de suporte</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {supportTickets.map((ticket) => (
                    <div key={ticket.id} className="p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{ticket.id}</span>
                        <Badge
                          variant={ticket.status === "Resolvido" ? "default" : "secondary"}
                          className={cn(
                            ticket.status === "Resolvido" && "bg-green-100 text-green-700",
                            ticket.status === "Em andamento" && "bg-yellow-100 text-yellow-700",
                          )}
                        >
                          {ticket.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{ticket.subject}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Agente: {ticket.agent}</span>
                        <span>{ticket.created}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Contact Tab */}
        <TabsContent value="contact" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="p-3 bg-blue-100 rounded-full w-fit mx-auto mb-4">
                  <Phone className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold mb-2">Telefone</h3>
                <p className="text-gray-600 text-sm mb-3">Suporte técnico das 8h às 18h</p>
                <p className="font-medium">+55 (11) 4002-8922</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <div className="p-3 bg-green-100 rounded-full w-fit mx-auto mb-4">
                  <Mail className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-semibold mb-2">Email</h3>
                <p className="text-gray-600 text-sm mb-3">Resposta em até 24 horas</p>
                <p className="font-medium">suporte@trackdoc.com.br</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <div className="p-3 bg-purple-100 rounded-full w-fit mx-auto mb-4">
                  <MessageCircle className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="font-semibold mb-2">Chat ao Vivo</h3>
                <p className="text-gray-600 text-sm mb-3">Suporte imediato online</p>
                <Button size="sm" className="w-full">
                  Iniciar Chat
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Business Hours */}
          <Card>
            <CardHeader>
              <CardTitle>Horário de Atendimento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Suporte Técnico</h4>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>Segunda a Sexta: 8h às 18h</p>
                    <p>Sábado: 9h às 13h</p>
                    <p>Domingo: Fechado</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Emergências</h4>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>24 horas por dia</p>
                    <p>7 dias por semana</p>
                    <p>Para clientes Premium</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
