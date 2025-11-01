"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Eye,
  EyeOff,
  Users,
  User,
  Shield,
  Building2,
  AlertTriangle,
  Info,
  Plus,
  X
} from "lucide-react"
import { useDepartments } from "@/hooks/use-departments"
import { useUserDepartments } from "@/hooks/use-user-departments"
import { useAuth } from '@/lib/hooks/use-auth-final'

export interface DocumentVisibilitySettings {
  visibility_type: 'public' | 'private' | 'restricted'
  allowed_departments: string[]
  allowed_users: string[]
  permission_types: ('read' | 'edit' | 'download' | 'sign')[]
}

interface DocumentVisibilityManagerProps {
  value: DocumentVisibilitySettings
  onChange: (settings: DocumentVisibilitySettings) => void
  disabled?: boolean
}

export default function DocumentVisibilityManager({
  value,
  onChange,
  disabled = false
}: DocumentVisibilityManagerProps) {
  const { user } = useAuth()
  const { departments, loading: departmentsLoading } = useDepartments()
  const { departments: userDepartments, isInDepartment } = useUserDepartments()
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>(value.allowed_departments || [])
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(value.permission_types || ['read'])

  // Atualizar estado interno quando value muda
  useEffect(() => {
    setSelectedDepartments(value.allowed_departments || [])
    setSelectedPermissions(value.permission_types || ['read'])
  }, [value])

  const handleVisibilityChange = (visibility_type: 'public' | 'private' | 'restricted') => {
    const newSettings: DocumentVisibilitySettings = {
      ...value,
      visibility_type,
      allowed_departments: visibility_type === 'restricted' ? selectedDepartments : [],
      allowed_users: visibility_type === 'restricted' ? value.allowed_users : [],
      permission_types: selectedPermissions as ('read' | 'edit' | 'download' | 'sign')[]
    }
    onChange(newSettings)
  }

  const handleDepartmentToggle = (departmentId: string, checked: boolean) => {
    const newDepartments = checked
      ? [...selectedDepartments, departmentId]
      : selectedDepartments.filter(id => id !== departmentId)
    
    setSelectedDepartments(newDepartments)
    
    const newSettings: DocumentVisibilitySettings = {
      ...value,
      allowed_departments: newDepartments,
      permission_types: selectedPermissions as ('read' | 'edit' | 'download' | 'sign')[]
    }
    onChange(newSettings)
  }

  const handlePermissionToggle = (permission: string, checked: boolean) => {
    let newPermissions: string[]
    
    if (permission === 'read') {
      // 'read' é obrigatório, não pode ser desmarcado
      newPermissions = selectedPermissions.includes('read') ? selectedPermissions : [...selectedPermissions, 'read']
    } else {
      newPermissions = checked
        ? [...selectedPermissions, permission]
        : selectedPermissions.filter(p => p !== permission)
    }
    
    // Garantir que 'read' sempre esteja incluído
    if (!newPermissions.includes('read')) {
      newPermissions.push('read')
    }
    
    setSelectedPermissions(newPermissions)
    
    const newSettings: DocumentVisibilitySettings = {
      ...value,
      permission_types: newPermissions as ('read' | 'edit' | 'download' | 'sign')[]
    }
    onChange(newSettings)
  }

  const visibilityOptions = [
    {
      value: 'public' as const,
      label: 'Público',
      description: 'Todos os usuários da organização podem ver este documento',
      icon: Eye,
      color: 'text-green-600 bg-green-50 border-green-200'
    },
    {
      value: 'private' as const,
      label: 'Privado',
      description: 'Apenas você pode ver este documento',
      icon: EyeOff,
      color: 'text-gray-600 bg-gray-50 border-gray-200'
    },
    {
      value: 'restricted' as const,
      label: 'Restrito',
      description: 'Apenas departamentos selecionados podem ver este documento',
      icon: Shield,
      color: 'text-blue-600 bg-blue-50 border-blue-200'
    }
  ]

  const permissionOptions = [
    {
      value: 'read',
      label: 'Visualizar',
      description: 'Pode ver o conteúdo do documento',
      required: true
    },
    {
      value: 'download',
      label: 'Baixar',
      description: 'Pode fazer download do documento'
    },
    {
      value: 'edit',
      label: 'Editar',
      description: 'Pode modificar o documento'
    },
    {
      value: 'sign',
      label: 'Assinar',
      description: 'Pode assinar digitalmente o documento'
    }
  ]

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Shield className="h-5 w-5" />
          <span>Controle de Visibilidade</span>
        </CardTitle>
        <CardDescription>
          Defina quem pode acessar este documento e quais ações podem realizar
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Tipo de Visibilidade */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Tipo de Visibilidade</Label>
          <div className="grid grid-cols-1 gap-3">
            {visibilityOptions.map((option) => {
              const Icon = option.icon
              const isSelected = value.visibility_type === option.value
              
              return (
                <div
                  key={option.value}
                  className={`
                    relative cursor-pointer rounded-lg border-2 p-4 transition-all
                    ${isSelected 
                      ? option.color + ' ring-2 ring-offset-2 ring-blue-500' 
                      : 'border-gray-200 hover:border-gray-300'
                    }
                    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                  onClick={() => !disabled && handleVisibilityChange(option.value)}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`
                      p-2 rounded-lg
                      ${isSelected ? option.color : 'bg-gray-100 text-gray-600'}
                    `}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium">{option.label}</h3>
                        {isSelected && (
                          <Badge variant="secondary" className="text-xs">
                            Selecionado
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {option.description}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Seleção de Departamentos (apenas para visibilidade restrita) */}
        {value.visibility_type === 'restricted' && (
          <>
            <Separator />
            <div className="space-y-3">
              <Label className="text-sm font-medium flex items-center space-x-2">
                <Building2 className="h-4 w-4" />
                <span>Departamentos Autorizados</span>
              </Label>
              
              {departmentsLoading ? (
                <div className="text-sm text-gray-500">Carregando departamentos...</div>
              ) : departments.length === 0 ? (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Nenhum departamento encontrado. Entre em contato com o administrador.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {departments.map((department) => {
                    const userBelongsToThisDept = isInDepartment(department.id)
                    return (
                      <div
                        key={department.id}
                        className={`flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 ${
                          userBelongsToThisDept ? 'bg-blue-50 border-blue-200' : ''
                        }`}
                      >
                        <Checkbox
                          id={`dept-${department.id}`}
                          checked={selectedDepartments.includes(department.id)}
                          onCheckedChange={(checked) => 
                            handleDepartmentToggle(department.id, checked as boolean)
                          }
                          disabled={disabled}
                        />
                        <Label
                          htmlFor={`dept-${department.id}`}
                          className="flex-1 cursor-pointer"
                        >
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{department.name}</span>
                            {userBelongsToThisDept && (
                              <Badge variant="secondary" className="text-xs">
                                Seu departamento
                              </Badge>
                            )}
                          </div>
                          {department.description && (
                            <div className="text-xs text-gray-500">{department.description}</div>
                          )}
                        </Label>
                      </div>
                    )
                  })}
                </div>
              )}

              {selectedDepartments.length === 0 && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Selecione pelo menos um departamento para visibilidade restrita.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </>
        )}

        {/* Permissões */}
        {value.visibility_type !== 'private' && (
          <>
            <Separator />
            <div className="space-y-3">
              <Label className="text-sm font-medium flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>Permissões</span>
              </Label>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {permissionOptions.map((permission) => (
                  <div
                    key={permission.value}
                    className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <Checkbox
                      id={`perm-${permission.value}`}
                      checked={selectedPermissions.includes(permission.value)}
                      onCheckedChange={(checked) => 
                        handlePermissionToggle(permission.value, checked as boolean)
                      }
                      disabled={disabled || permission.required}
                    />
                    <Label
                      htmlFor={`perm-${permission.value}`}
                      className="flex-1 cursor-pointer"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{permission.label}</span>
                        {permission.required && (
                          <Badge variant="secondary" className="text-xs">
                            Obrigatório
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">{permission.description}</div>
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Resumo das Configurações */}
        <Separator />
        <div className="space-y-2">
          <Label className="text-sm font-medium">Resumo das Configurações</Label>
          <div className="p-3 bg-gray-50 rounded-lg space-y-2">
            <div className="flex items-center space-x-2">
              <Badge variant="outline">
                {visibilityOptions.find(opt => opt.value === value.visibility_type)?.label}
              </Badge>
              {value.visibility_type === 'restricted' && selectedDepartments.length > 0 && (
                <Badge variant="secondary">
                  {selectedDepartments.length} departamento(s)
                </Badge>
              )}
            </div>
            
            {selectedPermissions.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {selectedPermissions.map(permission => (
                  <Badge key={permission} variant="outline" className="text-xs">
                    {permissionOptions.find(opt => opt.value === permission)?.label}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}