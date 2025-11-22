"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Shield, Calendar, Building } from "lucide-react"
import Link from "next/link"

export default function PoliticaDePrivacidadePage() {
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
          <CardHeader className="border-b bg-gradient-to-r from-green-50 to-green-100">
            <div className="flex items-center gap-3 mb-2">
              <Shield className="h-8 w-8 text-green-600" />
              <CardTitle className="text-3xl font-bold text-gray-900">
                Política de Privacidade
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
            <p className="text-sm text-gray-600 mt-2">
              Base legal: LGPD, Marco Civil da Internet e legislação correlata
            </p>
          </CardHeader>

          <CardContent className="prose prose-gray max-w-none p-8">
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Dados Coletados</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                A Trackdoc coleta:
              </p>

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Dados de Conta</h3>
                  <p className="text-gray-700">Nome, e-mail, empresa, CNPJ, telefone</p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Dados de Uso e Segurança</h3>
                  <ul className="list-disc pl-6 space-y-1 text-gray-700">
                    <li>IP, dispositivo, logs de acesso, hash de arquivos</li>
                    <li>Trilhas de atividade em documentos</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Dados Financeiros</h3>
                  <ul className="list-disc pl-6 space-y-1 text-gray-700">
                    <li>Meio de pagamento</li>
                    <li>Cobrança recorrente</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Conteúdo Enviado</h3>
                  <ul className="list-disc pl-6 space-y-1 text-gray-700">
                    <li>Documentos, anexos, metadados</li>
                    <li>Assinaturas eletrônicas simples</li>
                  </ul>
                </div>
              </div>

              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-gray-700 leading-relaxed">
                  <strong>Importante:</strong> Conteúdos são sigilosos e não acessados pela Trackdoc, exceto:
                </p>
                <ul className="list-disc pl-6 mt-2 space-y-1 text-gray-700">
                  <li>Por ordem judicial</li>
                  <li>Quando autorizado pelo cliente para suporte técnico</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Finalidades do Tratamento</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                Usamos dados para:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Autenticação e controle de acesso</li>
                <li>Prestação do serviço contratado</li>
                <li>Segurança, auditoria e prevenção a fraudes</li>
                <li>Cobrança e gestão financeira</li>
                <li>Cumprimento legal</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-3 font-semibold">
                Dados não são vendidos.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Base Legal</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                Tratamento baseado em:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li><strong>Execução de contrato</strong></li>
                <li><strong>Legítimo interesse</strong></li>
                <li><strong>Obrigação legal</strong></li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-3">
                Para dados armazenados pelo cliente, este é o <strong>Controlador</strong>, e a Trackdoc é <strong>Operadora</strong>.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Compartilhamento de Dados</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                Compartilhamos dados apenas com:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Provedores de nuvem e infraestrutura</li>
                <li>Meios de pagamento</li>
                <li>Suporte e comunicação</li>
                <li>Autoridades mediante ordem legal</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-3 font-semibold">
                Nunca compartilhamos documentos para fins comerciais.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Retenção e Exclusão de Dados</h2>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Logs podem ser retidos entre 6 meses e 5 anos</li>
                <li>Documentos podem ser excluídos após cancelamento</li>
                <li>Backups podem existir temporariamente para segurança, não para uso comercial</li>
                <li>O Usuário pode solicitar exclusão de dados pessoais conforme LGPD</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Segurança da Informação</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                A plataforma utiliza:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Criptografia (HTTPS/TLS)</li>
                <li>Gestão de acessos e hashes</li>
                <li>Auditoria e logs detalhados</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-3 italic">
                Nenhuma plataforma é invulnerável; o Usuário reconhece riscos inerentes.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Direitos do Titular</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                O titular pode solicitar:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li><strong>Acesso</strong> aos seus dados pessoais</li>
                <li><strong>Correção</strong> de dados incompletos ou incorretos</li>
                <li><strong>Exclusão</strong> (quando aplicável)</li>
                <li><strong>Portabilidade</strong> dos dados</li>
                <li><strong>Oposição</strong> ao tratamento</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-3">
                Pedimos identificação para segurança antes de atender solicitações.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Contato do Encarregado (DPO)</h2>
              <p className="text-gray-700 leading-relaxed">
                O canal oficial será divulgado no painel da plataforma e canais institucionais.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Alterações</h2>
              <p className="text-gray-700 leading-relaxed">
                A Trackdoc pode alterar esta política mediante aviso prévio. O uso contínuo implica aceitação.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Foro</h2>
              <p className="text-gray-700 leading-relaxed">
                Foro da Comarca do Rio de Janeiro - RJ.
              </p>
            </section>

            <div className="mt-12 p-6 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Seus Direitos LGPD</h3>
              <p className="text-sm text-gray-700 mb-3">
                Você tem direito a acessar, corrigir, excluir ou portar seus dados pessoais a qualquer momento.
              </p>
              <p className="text-sm text-gray-700">
                Para exercer seus direitos ou esclarecer dúvidas sobre esta Política de Privacidade, entre em 
                contato através dos canais oficiais disponíveis na plataforma.
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
