'use client'

import { useAuth } from '@/lib/hooks/use-auth-final'
import { FeatureGate } from '@/components/subscription/FeatureGate'
import ElectronicSignature from './electronic-signature'

/**
 * Componente protegido de Assinatura Eletrônica
 */
export default function ElectronicSignatureProtected() {
  const { user } = useAuth()

  return (
    <FeatureGate 
      userId={user?.id} 
      feature="assinatura_eletronica_simples"
      customMessage="A Assinatura Eletrônica está disponível a partir do plano Profissional. Faça upgrade para ter acesso a esta funcionalidade."
    >
      <ElectronicSignature />
    </FeatureGate>
  )
}
