"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, FileText, Calendar, Building } from "lucide-react"
import Link from "next/link"

export default function TermosDeUsoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/register">
              <Button variant="ghost" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
            </Link>
            <img 
              src="/logo-vertical-preto.png" 
              alt="TrackDoc Logo" 
              className="h-8 w-auto object-contain"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card className="shadow-lg">
          <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-blue-100">
            <div className="flex items-center gap-3 mb-2">
              <FileText className="h-8 w-8 text-blue-600" />
              <CardTitle className="text-3xl font-bold text-gray-900">
                Termos de Uso
              </CardTitle>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>Última atualização: 21/11/2025</span>
              </div>
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                <span>Trackdoc Tecnologia Ltda.</span>
              </div>
              <div className="flex items-center gap-2">
                <span>CNPJ: 63.731.881/0001-30</span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="prose prose-gray max-w-none p-8">
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Aceitação dos Termos</h2>
              <p className="text-gray-700 leading-relaxed">
                Ao acessar ou utilizar a plataforma Trackdoc, o Usuário declara que leu, compreendeu e concorda 
                integralmente com estes Termos de Uso e com a Política de Privacidade. Caso utilize a plataforma 
                em nome de uma empresa, declara possuir poderes para tal representação.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Objeto</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                A Trackdoc disponibiliza plataforma SaaS de gestão documental corporativa, incluindo funcionalidades de:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Upload, armazenamento e organização de arquivos</li>
                <li>Assinatura eletrônica simples</li>
                <li>Trilhas de auditoria e registros de atividade</li>
                <li>Controle de permissões e usuários</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-3">
                A Trackdoc não presta consultoria jurídica ou validação legal dos documentos enviados.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Assinatura Eletrônica Simples</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                A plataforma utiliza Assinatura Eletrônica Simples, nos termos da MP 2.200-2/2001, baseada em:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Comprovante de aceite eletrônico</li>
                <li>Registro de IP, data e horário</li>
                <li>Identificação via e-mail e login</li>
                <li>Hash criptográfico do documento</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-3">
                Não se trata de assinatura avançada ou qualificada (ICP-Brasil), salvo futura implementação.
              </p>
              <p className="text-gray-700 leading-relaxed font-semibold">
                Cabe ao Usuário avaliar se a assinatura simples é adequada ao uso pretendido.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Responsabilidade pelo Conteúdo</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                A Trackdoc armazena documentos do Usuário, mas:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Não monitora, audita ou valida conteúdo</li>
                <li>Não se responsabiliza por dados ilegais, confidenciais ou que violem direitos</li>
                <li>Não garante adequação jurídica dos documentos enviados</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-3 font-semibold">
                O Usuário é integralmente responsável por legalidade, titularidade, consentimentos, direitos de uso 
                e dados pessoais nos documentos.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Privacidade e LGPD</h2>
              <p className="text-gray-700 leading-relaxed">
                A Trackdoc atua como <strong>Operadora</strong> dos dados inseridos pelo cliente na plataforma e como 
                <strong> Controladora</strong> dos dados necessários à autenticação, cobrança e segurança.
              </p>
              <p className="text-gray-700 leading-relaxed mt-3">
                O tratamento segue a LGPD (Lei 13.709/2018).
              </p>
              <p className="text-gray-700 leading-relaxed mt-3">
                Mais detalhes constam na <Link href="/politica-de-privacidade" className="text-blue-600 hover:underline">Política de Privacidade</Link>.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Planos e Pagamentos</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                O serviço é contratado por assinatura mensal recorrente, renovada automaticamente até cancelamento pelo Usuário.
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Atrasos podem suspender o acesso</li>
                <li>Preços podem ser reajustados mediante aviso prévio de 30 dias</li>
                <li>Cancelamento não implica devolução de valores já pagos</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Propriedade Intelectual</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                O software, marca, interface, código e tecnologia pertencem à Trackdoc. O Usuário fica proibido de:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Sublicenciar, revender ou redistribuir</li>
                <li>Aplicar engenharia reversa</li>
                <li>Copiar a plataforma ou criar serviços concorrentes usando código derivado</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-3 font-semibold">
                Os documentos enviados são propriedade do Usuário.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Disponibilidade do Serviço</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                A Trackdoc busca garantir disponibilidade contínua, mas não garante serviço ininterrupto, isento de 
                falhas ou erros. Indisponibilidades podem ocorrer por manutenção, falhas técnicas ou terceiros.
              </p>
              <p className="text-gray-700 leading-relaxed mb-3">
                A Trackdoc não se responsabiliza por:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Perdas indiretas ou lucros cessantes</li>
                <li>Indisponibilidade causada por infraestrutura de terceiros</li>
                <li>Falhas no dispositivo, rede ou navegação do Usuário</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Cancelamento e Exclusão de Conta</h2>
              <p className="text-gray-700 leading-relaxed">
                O Usuário pode solicitar cancelamento a qualquer momento. Após cancelamento, dados e documentos podem 
                ser removidos conforme a Política de Retenção.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Política de Retenção de Documentos</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                A Trackdoc armazena documentos enquanto a assinatura estiver ativa. Após cancelamento, poderão ser 
                excluídos conforme os critérios:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>O Usuário pode solicitar exclusão imediata de documentos específicos</li>
                <li>A Trackdoc pode excluir documentos após 30 dias do encerramento do contrato, sem obrigação de manter cópias</li>
                <li>Backups poderão ser mantidos temporariamente para:
                  <ul className="list-circle pl-6 mt-2 space-y-1">
                    <li>Contingência e recuperação técnica</li>
                    <li>Prevenção a fraudes</li>
                    <li>Obrigações legais e auditorias</li>
                  </ul>
                </li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-3 font-semibold">
                A Trackdoc não se responsabiliza pela perda de documentos após cancelamento, cabendo ao Usuário 
                exportar previamente seus arquivos.
              </p>
              <p className="text-gray-700 leading-relaxed mt-3">
                Nenhum documento será mantido além do período legal permitido.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Foro</h2>
              <p className="text-gray-700 leading-relaxed">
                Fica eleito o foro da Comarca do Rio de Janeiro - RJ, Brasil.
              </p>
            </section>

            <div className="mt-12 p-6 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-gray-700">
                <strong>Jurisdição aplicável:</strong> Brasil
              </p>
              <p className="text-sm text-gray-700 mt-2">
                Para dúvidas ou solicitações relacionadas a estes Termos de Uso, entre em contato através dos 
                canais oficiais disponíveis na plataforma.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>© 2024 TrackDoc. Todos os direitos reservados.</p>
        </div>
      </div>
    </div>
  )
}

export const dynamic = 'force-dynamic'
