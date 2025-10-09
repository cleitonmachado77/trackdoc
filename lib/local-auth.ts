/**
 * Sistema de autenticação local para contornar problemas de proxy/rede
 */

export interface LocalUser {
  id: string
  email: string
  full_name: string
  created_at: string
}

export interface LocalSession {
  user: LocalUser
  access_token: string
  expires_at: number
}

const STORAGE_KEY = 'trackdoc_local_auth'
const USERS_KEY = 'trackdoc_local_users'

// Usuários padrão para desenvolvimento
const DEFAULT_USERS = [
  {
    id: '1',
    email: 'admin@trackdoc.com',
    password: 'admin123',
    full_name: 'Administrador',
    created_at: new Date().toISOString()
  },
  {
    id: '2', 
    email: 'user@trackdoc.com',
    password: 'user123',
    full_name: 'Usuário Teste',
    created_at: new Date().toISOString()
  }
]

export class LocalAuth {
  private static instance: LocalAuth
  
  static getInstance(): LocalAuth {
    if (!LocalAuth.instance) {
      LocalAuth.instance = new LocalAuth()
    }
    return LocalAuth.instance
  }

  constructor() {
    this.initializeUsers()
  }

  private initializeUsers() {
    if (typeof window === 'undefined') return
    
    const existingUsers = localStorage.getItem(USERS_KEY)
    if (!existingUsers) {
      localStorage.setItem(USERS_KEY, JSON.stringify(DEFAULT_USERS))
    }
  }

  private getUsers() {
    if (typeof window === 'undefined') return DEFAULT_USERS
    
    const users = localStorage.getItem(USERS_KEY)
    return users ? JSON.parse(users) : DEFAULT_USERS
  }

  private saveUsers(users: any[]) {
    if (typeof window === 'undefined') return
    localStorage.setItem(USERS_KEY, JSON.stringify(users))
  }

  private generateToken(): string {
    return 'local_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36)
  }

  async signIn(email: string, password: string): Promise<{ session: LocalSession | null, error: any }> {
    try {
      const users = this.getUsers()
      const user = users.find((u: any) => u.email === email && u.password === password)
      
      if (!user) {
        return {
          session: null,
          error: { message: 'Email ou senha incorretos' }
        }
      }

      const session: LocalSession = {
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          created_at: user.created_at
        },
        access_token: this.generateToken(),
        expires_at: Date.now() + (24 * 60 * 60 * 1000) // 24 horas
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
      }

      return { session, error: null }
    } catch (error) {
      return {
        session: null,
        error: { message: 'Erro interno do servidor' }
      }
    }
  }

  async signUp(email: string, password: string, fullName: string): Promise<{ user: LocalUser | null, error: any }> {
    try {
      const users = this.getUsers()
      
      // Verificar se email já existe
      if (users.find((u: any) => u.email === email)) {
        return {
          user: null,
          error: { message: 'Email já está em uso' }
        }
      }

      const newUser = {
        id: (users.length + 1).toString(),
        email,
        password,
        full_name: fullName,
        created_at: new Date().toISOString()
      }

      users.push(newUser)
      this.saveUsers(users)

      return {
        user: {
          id: newUser.id,
          email: newUser.email,
          full_name: newUser.full_name,
          created_at: newUser.created_at
        },
        error: null
      }
    } catch (error) {
      return {
        user: null,
        error: { message: 'Erro interno do servidor' }
      }
    }
  }

  async getSession(): Promise<{ session: LocalSession | null, error: any }> {
    try {
      if (typeof window === 'undefined') {
        return { session: null, error: null }
      }

      const sessionData = localStorage.getItem(STORAGE_KEY)
      if (!sessionData) {
        return { session: null, error: null }
      }

      const session: LocalSession = JSON.parse(sessionData)
      
      // Verificar se a sessão expirou
      if (Date.now() > session.expires_at) {
        localStorage.removeItem(STORAGE_KEY)
        return { session: null, error: { message: 'Sessão expirada' } }
      }

      return { session, error: null }
    } catch (error) {
      return { session: null, error: { message: 'Erro ao recuperar sessão' } }
    }
  }

  async signOut(): Promise<{ error: any }> {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY)
      }
      return { error: null }
    } catch (error) {
      return { error: { message: 'Erro ao fazer logout' } }
    }
  }

  async resetPassword(email: string): Promise<{ error: any }> {
    // Simular reset de senha
    const users = this.getUsers()
    const user = users.find((u: any) => u.email === email)
    
    if (!user) {
      return { error: { message: 'Email não encontrado' } }
    }

    // Em um sistema real, enviaria email
    console.log(`Reset de senha solicitado para: ${email}`)
    return { error: null }
  }

  async updatePassword(newPassword: string): Promise<{ error: any }> {
    try {
      const { session } = await this.getSession()
      if (!session) {
        return { error: { message: 'Usuário não autenticado' } }
      }

      const users = this.getUsers()
      const userIndex = users.findIndex((u: any) => u.id === session.user.id)
      
      if (userIndex !== -1) {
        users[userIndex].password = newPassword
        this.saveUsers(users)
      }

      return { error: null }
    } catch (error) {
      return { error: { message: 'Erro ao atualizar senha' } }
    }
  }

  // Método para verificar se está usando autenticação local
  isLocalMode(): boolean {
    return true
  }
}