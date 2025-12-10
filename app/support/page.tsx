"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  MessageCircle, 
  Clock, 
  Shield,
  AlertCircle,
  CheckCircle
} from "lucide-react"
import Link from "next/link"

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button variant="outline" asChild>
            <Link href="/" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Voltar ao Início
            </Link>
          </Button>
        </div>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Suporte e Contato
          </h1>
          <p className="text-xl text-gray-600">
            Estamos aqui para ajudar você
          </p>
        </div>

        {/* Alert para contatar administrador */}
        <Alert className="mb-8 border-blue-200 bg-blue-50 dark:bg-blue-950/20">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-900 dark:text-blue-100">
            <strong>Para questões sobre planos e assinaturas:</strong> Entre em contato com o administrador do seu sistema para ativação, alteração ou cancelamento de planos.
          </AlertDescription>
        </Alert>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {/* Contato Administrador */}
          <Card className="border-2 border-blue-200">
            <CardHeader className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-500 text-white mb-4 mx-auto">
                <Shield className="h-6 w-6" />
              </div>
              <CardTitle className="text-xl">Administrador do Sistema</CardTitle>
              <CardDescription>
                Para questões sobre planos, usuários e configurações
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Ativação de planos</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Gerenciamento de usuários</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Configurações do sistema</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Alteração de limites</span>
                </div>
              </div>
              
              <div className="pt-4">
                <Button className="w-full gap-2" asChild>
                  <a href="mailto:contato@trackdoc.com.br">
                    <Mail className="h-4 w-4" />
                    Contatar Administrador
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Suporte Técnico */}
          <Card>
            <CardHeader className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-500 text-white mb-4 mx-auto">
                <MessageCircle className="h-6 w-6" />
              </div>
              <CardTitle className="text-xl">Suporte Técnico</CardTitle>
              <CardDescription>
                Para problemas técnicos e dúvidas sobre o sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Problemas de acesso</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Dúvidas sobre funcionalidades</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Relatório de bugs</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Treinamento e tutoriais</span>
                </div>
              </div>

              <div className="space-y-2 pt-4">
                <Button variant="outline" className="w-full gap-2" asChild>
                  <a href="mailto:contato@trackdoc.com.br">
                    <Mail className="h-4 w-4" />
                    Email de Suporte
                  </a>
                </Button>
                <Button variant="outline" className="w-full gap-2" asChild>
                  <a href="https://wa.me/551151926440" target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="h-4 w-4" />
                    WhatsApp: (11) 5192-6440
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Horário de Atendimento */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Horário de Atendimento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">Suporte Técnico</h4>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>Segunda a Sexta: 8h às 18h</p>
                  <p>Sábado: 8h às 12h</p>
                  <p>Domingo: Fechado</p>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Administrador</h4>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>Segunda a Sexta: 9h às 17h</p>
                  <p>Resposta em até 24h úteis</p>
                  <p>Para urgências: suporte técnico</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* FAQ Rápido */}
        <Card>
          <CardHeader>
            <CardTitle>Perguntas Frequentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-1">Como ativo meu plano?</h4>
                <p className="text-sm text-gray-600">
                  Entre em contato com o administrador do sistema. Ele irá configurar seu plano e enviar as credenciais de acesso.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-1">Esqueci minha senha</h4>
                <p className="text-sm text-gray-600">
                  Use a opção "Esqueci minha senha" na tela de login ou entre em contato com o suporte técnico.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-1">Como adicionar mais usuários?</h4>
                <p className="text-sm text-gray-600">
                  Contate o administrador do sistema para verificar se seu plano permite mais usuários ou fazer upgrade.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-1">Posso fazer backup dos meus documentos?</h4>
                <p className="text-sm text-gray-600">
                  Sim! Entre em contato com o suporte técnico para orientações sobre backup e exportação de dados.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export const dynamic = 'force-dynamic'