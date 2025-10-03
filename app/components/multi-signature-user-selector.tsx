'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Users, UserCheck, X, Search } from 'lucide-react'
import { useUsers } from '@/hooks/use-users'

interface User {
  id: string
  full_name: string
  email: string
  role: string
}

interface MultiSignatureUserSelectorProps {
  selectedUsers: User[]
  onUsersChange: (users: User[]) => void
  disabled?: boolean
}

export default function MultiSignatureUserSelector({
  selectedUsers,
  onUsersChange,
  disabled = false
}: MultiSignatureUserSelectorProps) {
  // Sempre chamar todos os hooks na mesma ordem
  const { users, loading: usersLoading } = useUsers()
  
  const [searchTerm, setSearchTerm] = useState('')

  // Filtrar usuários baseado na busca
  const filteredUsers = users.filter(user => 
    user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Usuários para exibir (todos os usuários filtrados)
  const displayUsers = filteredUsers

  const handleUserToggle = (user: User) => {
    const isSelected = selectedUsers.some(selected => selected.id === user.id)
    
    if (isSelected) {
      // Remover usuário
      onUsersChange(selectedUsers.filter(selected => selected.id !== user.id))
    } else {
      // Adicionar usuário
      onUsersChange([...selectedUsers, user])
    }
  }

  const handleSelectAll = () => {
    if (selectedUsers.length === displayUsers.length) {
      // Desmarcar todos
      const displayUserIds = displayUsers.map(u => u.id)
      onUsersChange(selectedUsers.filter(user => !displayUserIds.includes(user.id)))
    } else {
      // Marcar todos
      const newUsers = [...selectedUsers]
      displayUsers.forEach(user => {
        if (!newUsers.some(selected => selected.id === user.id)) {
          newUsers.push(user)
        }
      })
      onUsersChange(newUsers)
    }
  }

  const removeUser = (userId: string) => {
    onUsersChange(selectedUsers.filter(user => user.id !== userId))
  }

  const clearAll = () => {
    onUsersChange([])
  }

  const isAllSelected = displayUsers.length > 0 && 
    displayUsers.every(user => selectedUsers.some(selected => selected.id === user.id))

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Selecionar Usuários para Assinatura
        </CardTitle>
        <CardDescription>
          Selecione os usuários que devem assinar o documento. Todos os usuários selecionados precisarão confirmar suas assinaturas.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filtros */}
        <div className="space-y-4">
          {/* Busca por nome/email */}
          <div className="space-y-2">
            <Label htmlFor="search">Buscar usuário</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                id="search"
                type="text"
                placeholder="Nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                disabled={disabled}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Ações rápidas */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSelectAll}
            disabled={disabled || displayUsers.length === 0}
          >
            <UserCheck className="h-4 w-4 mr-2" />
            {isAllSelected ? 'Desmarcar Todos' : 'Marcar Todos'}
          </Button>
          
          {selectedUsers.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearAll}
              disabled={disabled}
            >
              <X className="h-4 w-4 mr-2" />
              Limpar Seleção
            </Button>
          )}
        </div>

        {/* Lista de usuários selecionados */}
        {selectedUsers.length > 0 && (
          <div className="space-y-2">
            <Label>Usuários Selecionados ({selectedUsers.length})</Label>
            <div className="flex flex-wrap gap-2">
              {selectedUsers.map((user) => (
                <Badge key={user.id} variant="secondary" className="flex items-center gap-1">
                  {user.full_name}
                  <button
                    onClick={() => removeUser(user.id)}
                    disabled={disabled}
                    className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        )}

        <Separator />

        {/* Lista de usuários disponíveis */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Usuários Disponíveis</Label>
            <span className="text-sm text-gray-500">
              {displayUsers.length} usuário(s)
            </span>
          </div>

          {usersLoading ? (
            <div className="text-center py-4 text-gray-500">
              Carregando usuários...
            </div>
          ) : displayUsers.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              Nenhum usuário encontrado.
            </div>
          ) : (
            <div className="max-h-60 overflow-y-auto space-y-2 border rounded-md p-3">
              {displayUsers.map((user) => {
                const isSelected = selectedUsers.some(selected => selected.id === user.id)
                return (
                  <div key={user.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded">
                    <Checkbox
                      id={`user-${user.id}`}
                      checked={isSelected}
                      onCheckedChange={() => handleUserToggle(user)}
                      disabled={disabled}
                    />
                    <div className="flex-1 min-w-0">
                      <Label 
                        htmlFor={`user-${user.id}`} 
                        className="text-sm font-medium cursor-pointer"
                      >
                        {user.full_name}
                      </Label>
                      <p className="text-xs text-gray-500 truncate">
                        {user.email}
                      </p>
                      <p className="text-xs text-gray-400">
                        {user.role}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Informações sobre assinatura múltipla */}
        {selectedUsers.length > 1 && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <div className="flex items-start space-x-2">
              <UserCheck className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium">Assinatura Múltipla</p>
                <p className="mt-1">
                  Este documento será enviado para {selectedUsers.length} usuário(s). 
                  Todos precisarão confirmar suas assinaturas antes que o documento seja finalizado.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
