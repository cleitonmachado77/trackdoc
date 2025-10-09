/**
 * Dados mock para desenvolvimento local sem APIs externas
 */

  {
    id: '1',
    name: 'Aprovação de Documento',
    status: 'active',
    created_at: '2024-01-15T10:00:00Z',
    steps: [
      {
        id: '1',
        name: 'Revisão Inicial',
        type: 'approval',
        assignee: 'admin@trackdoc.com',
        status: 'pending'
      },
      {
        id: '2', 
        name: 'Aprovação Final',
        type: 'approval',
        assignee: 'user@trackdoc.com',
        status: 'waiting'
      }
    ]
  },
  {
    id: '2',
    name: 'Assinatura Digital',
    description: 'Processo de assinatura digital de contratos',
    status: 'active',
    created_at: '2024-01-20T14:30:00Z',
    steps: [
      {
        id: '3',
        name: 'Preparação do Documento',
        type: 'preparation',
        assignee: 'admin@trackdoc.com',
        status: 'completed'
      },
      {
        id: '4',
        name: 'Assinatura Cliente',
        type: 'signature',
        assignee: 'cliente@empresa.com',
        status: 'pending'
      }
    ]
  }
]

export const mockProfile = {
  id: '1',
  email: 'admin@trackdoc.com',
  full_name: 'Administrador',
  avatar_url: null,
  department: 'TI',
  role: 'admin',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-15T10:00:00Z'
}

export const mockDocuments = [
  {
    id: '1',
    name: 'Contrato de Prestação de Serviços',
    type: 'contract',
    status: 'pending_signature',
    created_at: '2024-01-15T10:00:00Z',
    size: 245760,
  },
  {
    id: '2',
    name: 'Política de Privacidade',
    type: 'policy',
    status: 'approved',
    created_at: '2024-01-10T15:30:00Z',
    size: 156432,
  }
]

export const mockPlans = [
  {
    id: 'basic',
    name: 'Básico',
    description: 'Plano básico para pequenas equipes',
    price: 0,
    interval: 'month',
    features: [
      'Até 5 usuários',
      'Armazenamento de 1GB',
      'Suporte por email'
    ]
  },
  {
    id: 'pro',
    name: 'Profissional',
    description: 'Plano profissional para empresas',
    price: 29.90,
    interval: 'month',
    features: [
      'Até 50 usuários',
      'Armazenamento de 100GB',
      'Assinatura digital',
      'Suporte prioritário'
    ]
  },
  {
    id: 'enterprise',
    name: 'Empresarial',
    description: 'Plano empresarial para grandes organizações',
    price: 99.90,
    interval: 'month',
    features: [
      'Usuários ilimitados',
      'Armazenamento ilimitado',
      'API completa',
      'Suporte 24/7'
    ]
  }
]

export class MockAPI {
  private static instance: MockAPI
  
  static getInstance(): MockAPI {
    if (!MockAPI.instance) {
      MockAPI.instance = new MockAPI()
    }
    return MockAPI.instance
  }

  // Simular delay de rede
  private async delay(ms: number = 500) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

    await this.delay()
    
    if (scope === 'assigned') {
      return {
        error: null
      }
    }
    
    return {
      error: null
    }
  }

  async getProfile() {
    await this.delay()
    return {
      data: mockProfile,
      error: null
    }
  }

  async getDocuments() {
    await this.delay()
    return {
      data: mockDocuments,
      error: null
    }
  }

  async getPlans() {
    await this.delay()
    return {
      data: mockPlans,
      error: null
    }
  }

    await this.delay()
    
      created_at: new Date().toISOString(),
      status: 'active'
    }
    
    
    return {
      error: null
    }
  }

    await this.delay()
    
    if (index === -1) {
      return {
        data: null,
      }
    }
    
    
    return {
      error: null
    }
  }

    await this.delay()
    
    if (index === -1) {
      return {
        data: null,
      }
    }
    
    
    return {
      data: { success: true },
      error: null
    }
  }
}
