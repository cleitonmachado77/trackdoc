'use client'

import { useAuth } from '@/lib/hooks/use-auth-final'
import { FeatureGate } from '@/components/subscription/FeatureGate'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import ElectronicSignature from './electronic-signature'
import { useFeatureAccess } from '@/lib/hooks/useFeatureAccess'

/**
 * Componente protegido de Assinatura Eletrônica
 * Controla acesso baseado no plano do usuário:
 * - Plano Básico: SEM acesso
 * - Plano Profissional: Assinatura SIMPLES apenas
 * - Plano Enterprise: Assinatura SIMPLES e MÚLTIPLA
 */
export default function ElectronicSignatureProtected() {
  const { user } = useAuth()
  const { hasAccess: hasSimpleAccess } = useFeatureAccess(user?.id, 'assinatura_eletronica_simples')
  const { hasAccess: hasMultipleAccess } = useFeatureAccess(user?.id, 'assinatura_eletronica_multipla')

  return (
    <FeatureGate 
      userId={user?.id} 
      feature="assinatura_eletronica_simples"
      customMessage="A Assinatura Eletrônica está disponível a partir do plano Profissional. Faça upgrade para ter acesso a esta funcionalidade."
    >
      <div className="space-y-4">
        {/* Se tem acesso apenas à assinatura simples */}
        {hasSimpleAccess && !hasMultipleAccess && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-800">
              <strong>Plano Profissional:</strong> Você tem acesso à Assinatura Eletrônica Simples. 
              Para ter acesso à Assinatura Múltipla, faça upgrade para o plano Enterprise.
            </p>
          </div>
        )}

        {/* Se tem acesso completo */}
        {hasMultipleAccess && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-green-800">
              <strong>Plano Enterprise:</strong> Você tem acesso completo à Assinatura Eletrônica Simples e Múltipla.
            </p>
          </div>
        )}

        {/* Componente de assinatura com controle de abas */}
        <Tabs defaultValue="simple" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="simple">
              Assinatura Simples
            </TabsTrigger>
            <TabsTrigger 
              value="multiple" 
              disabled={!hasMultipleAccess}
              className={!hasMultipleAccess ? 'opacity-50 cursor-not-allowed' : ''}
            >
              Assinatura Múltipla
              {!hasMultipleAccess && (
                <span className="ml-2 text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                  Enterprise
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="simple">
            <ElectronicSignature />
          </TabsContent>

          <TabsContent value="multiple">
            {hasMultipleAccess ? (
              <ElectronicSignature />
            ) : (
              <div className="text-center p-8 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-amber-800">
                  A Assinatura Múltipla está disponível apenas no plano Enterprise.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </FeatureGate>
  )
}
