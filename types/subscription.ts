// Tipos e constantes para o sistema de planos

export type PlanType = 'basico' | 'profissional' | 'enterprise'
export type SubscriptionStatus = 'active' | 'trial' | 'canceled' | 'expired' | 'past_due'

export interface Plan {
  id: string
  name: string
  type: PlanType
  price: number
  interval: 'monthly' | 'yearly'
  features: PlanFeatures
  limits: PlanLimits
  created_at: string
  updated_at: string
}

export interface PlanFeatures {
  // Funcionalidades básicas
  dashboard_gerencial: boolean
  upload_documentos: boolean
  solicitacao_aprovacoes: boolean
  suporte_email: boolean
  
  // Funcionalidades avançadas
  biblioteca_publica: boolean
  assinatura_eletronica_simples: boolean
  assinatura_eletronica_multipla: boolean
  chat_nativo: boolean
  auditoria_completa: boolean
  backup_automatico_diario: boolean
  suporte_tecnico_dedicado: boolean
}

export interface PlanLimits {
  max_usuarios: number
  armazenamento_gb: number
  usuario_adicional_preco?: number // R$ por usuário adicional
  armazenamento_extra_preco?: number // R$ por GB adicional
}

export interface Subscription {
  id: string
  user_id: string
  entity_id?: string
  plan_id: string
  status: SubscriptionStatus
  
  // Datas
  start_date: string
  end_date?: string
  trial_start_date?: string
  trial_end_date?: string
  canceled_at?: string
  
  // Uso
  current_users: number
  current_storage_gb: number
  
  created_at: string
  updated_at: string
  
  // Relacionamentos
  plan?: Plan
}

// Constantes dos planos - CONFIGURAÇÃO OFICIAL
export const PLAN_CONFIGS: Record<PlanType, Omit<Plan, 'id' | 'created_at' | 'updated_at'>> = {
  basico: {
    name: 'Básico',
    type: 'basico',
    price: 149,
    interval: 'monthly',
    features: {
      dashboard_gerencial: true,
      upload_documentos: true,
      solicitacao_aprovacoes: true,
      suporte_email: true,
      biblioteca_publica: true, // ✅ HABILITADO no Básico
      assinatura_eletronica_simples: false, // ❌ Apenas Profissional+
      assinatura_eletronica_multipla: false, // ❌ Apenas Enterprise
      chat_nativo: false, // ❌ Apenas Enterprise
      auditoria_completa: false, // ❌ Apenas Enterprise
      backup_automatico_diario: false, // ❌ Apenas Enterprise
      suporte_tecnico_dedicado: false, // ❌ Apenas Enterprise
    },
    limits: {
      max_usuarios: 15,
      armazenamento_gb: 10,
      usuario_adicional_preco: 2.90,
      armazenamento_extra_preco: 0.49,
    },
  },
  profissional: {
    name: 'Profissional',
    type: 'profissional',
    price: 349,
    interval: 'monthly',
    features: {
      dashboard_gerencial: true,
      upload_documentos: true,
      solicitacao_aprovacoes: true,
      suporte_email: true,
      biblioteca_publica: true,
      assinatura_eletronica_simples: true, // ✅ HABILITADO no Profissional
      assinatura_eletronica_multipla: false, // ❌ Apenas Enterprise
      chat_nativo: false, // ❌ Apenas Enterprise
      auditoria_completa: false, // ❌ Apenas Enterprise
      backup_automatico_diario: false, // ❌ Apenas Enterprise
      suporte_tecnico_dedicado: false, // ❌ Apenas Enterprise
    },
    limits: {
      max_usuarios: 50,
      armazenamento_gb: 50,
    },
  },
  enterprise: {
    name: 'Enterprise',
    type: 'enterprise',
    price: 599,
    interval: 'monthly',
    features: {
      dashboard_gerencial: true,
      upload_documentos: true,
      solicitacao_aprovacoes: true,
      suporte_email: true,
      biblioteca_publica: true,
      assinatura_eletronica_simples: true,
      assinatura_eletronica_multipla: true, // ✅ Exclusivo Enterprise
      chat_nativo: true, // ✅ Exclusivo Enterprise
      auditoria_completa: true, // ✅ Exclusivo Enterprise
      backup_automatico_diario: true, // ✅ Exclusivo Enterprise
      suporte_tecnico_dedicado: true, // ✅ Exclusivo Enterprise
    },
    limits: {
      max_usuarios: 70,
      armazenamento_gb: 120,
    },
  },
}

// Período de trial em dias
export const TRIAL_PERIOD_DAYS = 14

// Mapeamento de funcionalidades para nomes amigáveis
export const FEATURE_LABELS: Record<keyof PlanFeatures, string> = {
  dashboard_gerencial: 'Dashboard gerencial',
  upload_documentos: 'Upload de documentos',
  solicitacao_aprovacoes: 'Solicitação de aprovações',
  suporte_email: 'Suporte por e-mail',
  biblioteca_publica: 'Biblioteca Pública',
  assinatura_eletronica_simples: 'Assinatura eletrônica simples',
  assinatura_eletronica_multipla: 'Assinatura eletrônica múltipla',
  chat_nativo: 'Chat nativo',
  auditoria_completa: 'Auditoria completa',
  backup_automatico_diario: 'Backup automático diário',
  suporte_tecnico_dedicado: 'Suporte técnico dedicado',
}
