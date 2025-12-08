"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import {
  Search,
  FileText,
  Users,
  CheckCircle,
  X,
  Eye,
  History,
  TrendingUp,
  Star,
} from "lucide-react"
import { useAuth } from '@/lib/hooks/use-auth-final'
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface FixedQuickSearchModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onDocumentSelect?: (documentId: string) => void
}

interface SearchResult {
  id: string
  type: 'document' | 'user' | 'approval'
  title: string
  subtitle: string
  status?: string
  avatar?: string
  badge?: string
}

const statusColors: Record<string, string> = {
  approved: "bg-green-100 text-green-800",
  pending: "bg-yellow-100 text-yellow-800",
  draft: "bg-gray-100 text-gray-800",
  rejected: "bg-red-100 text-red-800",
  active: "bg-green-100 text-green-800",
  inactive: "bg-red-100 text-red-800",
}

const statusLabels: Record<string, string> = {
  approved: "Aprovado",
  pending: "Em aprovação",
  pending_approval: "Em aprovação",
  draft: "Rascunho",
  rejected: "Rejeitado",
  active: "Ativo",
  inactive: "Inativo",
}

export default function FixedQuickSearchModal({ open, onOpenChange, onDocumentSelect }: FixedQuickSearchModalProps) {
  const { user, entity } = useAuth()
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Carregar buscas recentes apenas uma vez
  useEffect(() => {
    const saved = localStorage.getItem('trackdoc-recent-searches')
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved))
      } catch (error) {
        console.error('Erro ao carregar buscas recentes:', error)
      }
    }
  }, [])

  // Focar no input quando abrir
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }, [open])

  // Limpar quando fechar
  useEffect(() => {
    if (!open) {
      setSearchTerm("")
      setSearchResults([])
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
        searchTimeoutRef.current = null
      }
    }
  }, [open])

  // Função para criar termos de busca flexíveis
  const createSearchTerms = (term: string): string[] => {
    const cleanTerm = term.trim().toLowerCase()
    if (!cleanTerm) return []
    
    const terms = [cleanTerm]
    
    // Adicionar variações para busca mais flexível
    if (cleanTerm.length > 2) {
      // Adicionar termo sem acentos (básico)
      const withoutAccents = cleanTerm
        .replace(/[àáâãäå]/g, 'a')
        .replace(/[èéêë]/g, 'e')
        .replace(/[ìíîï]/g, 'i')
        .replace(/[òóôõö]/g, 'o')
        .replace(/[ùúûü]/g, 'u')
        .replace(/[ç]/g, 'c')
      
      if (withoutAccents !== cleanTerm) {
        terms.push(withoutAccents)
      }
      
      // Adicionar busca por palavras individuais se houver espaços
      if (cleanTerm.includes(' ')) {
        const words = cleanTerm.split(' ').filter(w => w.length > 1)
        terms.push(...words)
      }
    }
    
    return [...new Set(terms)] // Remove duplicatas
  }

  // Função de busca memoizada
  const performSearch = useCallback(async (term: string): Promise<SearchResult[]> => {
    const results: SearchResult[] = []

    if (!term.trim()) {
      return results
    }

    if (!user?.id) {
      return results
    }

    const searchTerms = createSearchTerms(term)
    
    try {
      // Buscar documentos com múltiplas condições (título, número, descrição)
      const documentConditions = searchTerms.map(searchTerm => 
        `title.ilike.%${searchTerm}%,document_number.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`
      ).join(',')
      
      // Construir query base
      let query = supabase
        .from('documents')
        .select(`
          id,
          title,
          document_number,
          status,
          description,
          author:profiles!documents_author_id_fkey(full_name)
        `)
        .or(documentConditions)
        .limit(10)

      // Se tem entidade, filtrar por entity_id, senão filtrar por author_id
      if (entity?.id) {
        query = query.eq('entity_id', entity.id)
      } else {
        query = query.eq('author_id', user.id)
      }
      
      const { data: documents, error: docError } = await query

      if (docError) {
        console.error('❌ [QUICK_SEARCH] Erro ao buscar documentos:', docError)
      } else if (documents) {
        // Ordenar resultados por relevância (títulos que começam com o termo primeiro)
        const sortedDocuments = documents.sort((a, b) => {
          const termLower = term.toLowerCase()
          const aStartsWith = a.title.toLowerCase().startsWith(termLower)
          const bStartsWith = b.title.toLowerCase().startsWith(termLower)
          
          if (aStartsWith && !bStartsWith) return -1
          if (!aStartsWith && bStartsWith) return 1
          
          // Se ambos começam ou não começam, ordenar por título
          return a.title.localeCompare(b.title)
        })

        sortedDocuments.forEach(doc => {
          const subtitleParts = [
            doc.document_number || 'Sem número',
            doc.author?.full_name || 'Desconhecido'
          ]
          
          results.push({
            id: doc.id,
            type: 'document',
            title: doc.title,
            subtitle: subtitleParts.join(' • '),
            status: doc.status,
            badge: statusLabels[doc.status] || doc.status
          })
        })
      }

      // Buscar usuários com múltiplas condições (nome, email, departamento)
      const userConditions = searchTerms.map(searchTerm => 
        `full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,department.ilike.%${searchTerm}%`
      ).join(',')
      
      // Construir query de usuários base
      let userQuery = supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          email,
          role,
          status,
          avatar_url,
          department
        `)
        .or(userConditions)
        .limit(8)

      // Se tem entidade, filtrar por entity_id, senão buscar apenas o usuário atual
      if (entity?.id) {
        userQuery = userQuery.eq('entity_id', entity.id)
      } else {
        userQuery = userQuery.eq('id', user.id)
      }
      
      const { data: users, error: userError } = await userQuery

      if (userError) {
        console.error('❌ [QUICK_SEARCH] Erro ao buscar usuários:', userError)
      } else if (users) {
        // Ordenar usuários por relevância
        const sortedUsers = users.sort((a, b) => {
          const termLower = term.toLowerCase()
          const aNameStartsWith = a.full_name?.toLowerCase().startsWith(termLower) || false
          const bNameStartsWith = b.full_name?.toLowerCase().startsWith(termLower) || false
          
          if (aNameStartsWith && !bNameStartsWith) return -1
          if (!aNameStartsWith && bNameStartsWith) return 1
          
          return (a.full_name || '').localeCompare(b.full_name || '')
        })

        sortedUsers.forEach(user => {
          results.push({
            id: user.id,
            type: 'user',
            title: user.full_name || 'Usuário sem nome',
            subtitle: `${user.email || ''} ${user.department ? `• ${user.department}` : ''}`,
            status: user.status,
            avatar: user.avatar_url,
            badge: statusLabels[user.status] || user.status
          })
        })
      }

    } catch (error) {
      console.error('❌ [QUICK_SEARCH] Erro geral na busca:', error)
    }

    return results.slice(0, 15) // Aumentar limite para mais resultados
  }, [user?.id])

  // Busca com debounce
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    if (!searchTerm.trim()) {
      setSearchResults([])
      setIsSearching(false)
      return
    }

    if (!user?.id) {
      return
    }

    setIsSearching(true)
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await performSearch(searchTerm)
        setSearchResults(results)
        
        // Salvar busca recente apenas se houver resultados
        if (results.length > 0) {
          const updated = [searchTerm, ...recentSearches.filter(s => s !== searchTerm)].slice(0, 5)
          setRecentSearches(updated)
          localStorage.setItem('trackdoc-recent-searches', JSON.stringify(updated))
        }
      } catch (error) {
        console.error('Erro na busca:', error)
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }, 300)

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [searchTerm, performSearch])

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'document':
        return <FileText className="h-4 w-4" />
      case 'user':
        return <Users className="h-4 w-4" />
      case 'approval':
        return <CheckCircle className="h-4 w-4" />
      default:
        return <Search className="h-4 w-4" />
    }
  }

  // Função para destacar termos encontrados
  const highlightTerm = (text: string, searchTerm: string) => {
    if (!searchTerm || !text) return text
    
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    const parts = text.split(regex)
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 px-1 rounded">
          {part}
        </mark>
      ) : part
    )
  }

  const handleSearch = (term: string) => {
    setSearchTerm(term)
  }

  const handleResultClick = (result: SearchResult) => {
    console.log('🖱️ [CLICK] Resultado clicado:', result)
    console.log('🖱️ [CLICK] Tipo:', result.type)
    console.log('🖱️ [CLICK] onDocumentSelect disponível:', !!onDocumentSelect)
    
    if (result.type === 'document') {
      if (onDocumentSelect) {
        console.log('🖱️ [CLICK] Chamando onDocumentSelect com ID:', result.id)
        onDocumentSelect(result.id)
      } else {
        console.log('🖱️ [CLICK] Navegando para página principal com documento')
        // Navegar para a página principal com o ID do documento (sem recarregar)
        router.push(`/?document=${result.id}`)
      }
      onOpenChange(false) // Fechar o modal
    } else {
      console.log('🖱️ [CLICK] Tipo não é documento:', result.type)
    }
  }

  const clearSearch = () => {
    setSearchTerm("")
    setSearchResults([])
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-2xl max-h-[80vh] overflow-hidden p-0"
        aria-describedby="search-description"
      >
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="flex items-center space-x-2">
            <Search className="h-5 w-5" />
            <span>Busca Rápida</span>
            {entity && (
              <Badge variant="outline" className="ml-2">
                {entity.name}
              </Badge>
            )}
          </DialogTitle>
          <div id="search-description" className="sr-only">
            Busque por documentos e usuários usando termos flexíveis em tempo real
          </div>
        </DialogHeader>

        <div className="flex flex-col h-full">
          {/* Search Input */}
          <div className="px-6 py-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                ref={inputRef}
                placeholder="Buscar por título, número, descrição, tags, nome, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-10 h-10"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSearch}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>

            {/* Sugestões quando não há busca */}
            {!searchTerm && (
              <div className="mt-4 space-y-3">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <History className="h-4 w-4 mr-2" />
                    Buscas Recentes
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.slice(0, 5).map((search, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => handleSearch(search)}
                        className="text-xs"
                      >
                        <Search className="h-3 w-3 mr-1" />
                        {search}
                      </Button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Sugestões Populares
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {["contrato", "relatório", "proposta", "manual", "usuário"].map((suggestion, index) => (
                      <Button
                        key={index}
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSearch(suggestion)}
                        className="text-xs"
                      >
                        <Star className="h-3 w-3 mr-1" />
                        {suggestion}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Results */}
          <div className="flex-1 overflow-hidden">
            {isSearching && (
              <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">Buscando...</p>
              </div>
            )}

            {!isSearching && searchTerm && searchResults.length === 0 && (
              <div className="p-4 text-center">
                <Search className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">Nenhum resultado encontrado</p>
              </div>
            )}

            {!isSearching && searchResults.length > 0 && (
              <div className="p-4">
                <div className="mb-3">
                  <p className="text-sm text-gray-600">
                    {searchResults.length} resultado{searchResults.length !== 1 ? 's' : ''} para "{searchTerm}"
                  </p>
                </div>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {searchResults.map((result) => (
                    <Card key={`${result.type}-${result.id}`} className="hover:bg-gray-50 cursor-pointer">
                      <CardContent className="p-3" onClick={() => handleResultClick(result)}>
                        <div className="flex items-start space-x-3">
                          {result.type === 'user' ? (
                            <Avatar className="h-8 w-8 flex-shrink-0">
                              <AvatarImage src={result.avatar} />
                              <AvatarFallback>{getInitials(result.title)}</AvatarFallback>
                            </Avatar>
                          ) : (
                            <div className="h-8 w-8 flex items-center justify-center bg-gray-100 rounded-full flex-shrink-0">
                              {getIcon(result.type)}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm truncate">
                              {highlightTerm(result.title, searchTerm)}
                            </h4>
                            <p className="text-xs text-gray-600 mt-1 truncate">
                              {highlightTerm(result.subtitle, searchTerm)}
                            </p>
                          </div>
                          {result.badge && (
                            <Badge className={`text-xs ${statusColors[result.status || ''] || 'bg-gray-100 text-gray-800'}`}>
                              {result.badge}
                            </Badge>
                          )}
                          <Button variant="ghost" size="sm" className="flex-shrink-0">
                            <Eye className="h-3 w-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {!searchTerm && (
              <div className="p-4 text-center">
                <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Digite algo para começar a buscar</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
