"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { useDocumentPermissions } from "@/hooks/use-document-permissions"
import { useDepartments } from "@/hooks/use-departments"
import { useUsers } from "@/hooks/use-users"
import {
  Users,
  User,
  Shield,
  Plus,
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Edit,
  Upload,
  PenTool,
  Download,
  CheckSquare,
  XSquare
} from "lucide-react"

interface DocumentPermissionsManagerProps {
  documentId: string
  documentTitle: string
  onClose: () => void
}

const permissionTypes = [
  { value: 'read', label: 'Ler', icon: Eye, color: 'bg-blue-500' },
  { value: 'edit', label: 'Editar', icon: Edit, color: 'bg-green-500' },
  { value: 'upload', label: 'Upload', icon: Upload, color: 'bg-purple-500' },
  { value: 'sign', label: 'Assinar', icon: PenTool, color: 'bg-orange-500' },
  { value: 'download', label: 'Baixar', icon: Download, color: 'bg-indigo-500' },
  { value: 'approve', label: 'Aprovar', icon: CheckSquare, color: 'bg-emerald-500' },
  { value: 'reject', label: 'Rejeitar', icon: XSquare, color: 'bg-red-500' },
]

export default function DocumentPermissionsManager({ 
  documentId, 
  documentTitle, 
  onClose 
}: DocumentPermissionsManagerProps) {
  const { toast } = useToast()
  const [showGrantDialog, setShowGrantDialog] = useState(false)
  const [selectedPermissionType, setSelectedPermissionType] = useState<string>('')
  const [selectedTargetType, setSelectedTargetType] = useState<'user' | 'department'>('user')
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>('')
  const [expiresAt, setExpiresAt] = useState<string>('')
  const [isGranting, setIsGranting] = useState(false)

  const { 
    permissions, 
    loading, 
    fetchDocumentPermissions, 
    grantPermission, 
    revokePermission 
  } = useDocumentPermissions()
  
  const { departments } = useDepartments()
  const { users } = useUsers()

  // Carregar permissões do documento
  useEffect(() => {
    if (documentId) {
      fetchDocumentPermissions(documentId)
    }
  }, [documentId, fetchDocumentPermissions])

  // Conceder permissão
  const handleGrantPermission = async () => {
    if (!selectedPermissionType || (!selectedUserId && !selectedDepartmentId)) {
      toast({
        title: "Erro",
        description: "Selecione o tipo de permissão e o destinatário.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsGranting(true)
      
      await grantPermission({
        document_id: documentId,
        user_id: selectedTargetType === 'user' ? selectedUserId : undefined,
        department_id: selectedTargetType === 'department' ? selectedDepartmentId : undefined,
        permission_type: selectedPermissionType as any,
        expires_at: expiresAt || undefined
      })

      setShowGrantDialog(false)
      setSelectedPermissionType('')
      setSelectedUserId('')
      setSelectedDepartmentId('')
      setExpiresAt('')
      
      toast({
        title: "Permissão concedida!",
        description: "A permissão foi concedida com sucesso.",
      })
    } catch (error) {
      toast({
        title: "Erro ao conceder permissão",
        description: "Ocorreu um erro ao conceder a permissão. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsGranting(false)
    }
  }

  // Revogar permissão
  const handleRevokePermission = async (permissionId: string) => {
    try {
      await revokePermission(permissionId)
      toast({
        title: "Permissão revogada!",
        description: "A permissão foi revogada com sucesso.",
      })
    } catch (error) {
      toast({
        title: "Erro ao revogar permissão",
        description: "Ocorreu um erro ao revogar a permissão. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  const getPermissionIcon = (permissionType: string) => {
    const permission = permissionTypes.find(p => p.value === permissionType)
    return permission?.icon || Shield
  }

  const getPermissionColor = (permissionType: string) => {
    const permission = permissionTypes.find(p => p.value === permissionType)
    return permission?.color || 'bg-gray-500'
  }

  const isExpired = (expiresAt?: string) => {
    if (!expiresAt) return false
    return new Date(expiresAt) < new Date()
  }

  const isExpiringSoon = (expiresAt?: string) => {
    if (!expiresAt) return false
    const expirationDate = new Date(expiresAt)
    const now = new Date()
    const daysUntilExpiration = (expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    return daysUntilExpiration <= 7 && daysUntilExpiration > 0
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Permissões do Documento</h2>
          <p className="text-sm text-gray-500">{documentTitle}</p>
        </div>
        <Button onClick={() => setShowGrantDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Conceder Permissão
        </Button>
      </div>

      {/* Lista de Permissões */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                  </div>
                  <div className="h-6 bg-gray-200 rounded w-16"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {permissions.length === 0 ? (
            <Card className="text-center py-8">
              <CardContent>
                <Shield className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhuma permissão concedida</h3>
                <p className="text-gray-500 mb-4">
                  Este documento ainda não possui permissões específicas.
                </p>
                <Button onClick={() => setShowGrantDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Conceder Primeira Permissão
                </Button>
              </CardContent>
            </Card>
          ) : (
            permissions.map((permission) => {
              const Icon = getPermissionIcon(permission.permission_type)
              const isExpiredPermission = isExpired(permission.expires_at)
              const isExpiringSoonPermission = isExpiringSoon(permission.expires_at)
              
              return (
                <Card key={permission.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${getPermissionColor(permission.permission_type)} text-white`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">
                              {permissionTypes.find(p => p.value === permission.permission_type)?.label}
                            </h3>
                            {isExpiredPermission && (
                              <Badge variant="destructive" className="text-xs">
                                <XCircle className="h-3 w-3 mr-1" />
                                Expirado
                              </Badge>
                            )}
                            {isExpiringSoonPermission && !isExpiredPermission && (
                              <Badge variant="outline" className="text-xs text-orange-600">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Expira em breve
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">
                            {permission.department ? (
                              <div className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                <span>{permission.department.name}</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                <span>{permission.user?.full_name}</span>
                              </div>
                            )}
                          </div>
                          <div className="text-xs text-gray-400">
                            Concedido por {permission.granted_by_user?.full_name} em{' '}
                            {new Date(permission.granted_at).toLocaleDateString('pt-BR')}
                            {permission.expires_at && (
                              <span>
                                {' • Expira em '}
                                {new Date(permission.expires_at).toLocaleDateString('pt-BR')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRevokePermission(permission.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      )}

      {/* Modal: Conceder Permissão */}
      <Dialog open={showGrantDialog} onOpenChange={setShowGrantDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Conceder Permissão</DialogTitle>
            <DialogDescription>
              Conceda uma nova permissão para este documento.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="permission-type">Tipo de Permissão</Label>
              <Select value={selectedPermissionType} onValueChange={setSelectedPermissionType}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo de permissão" />
                </SelectTrigger>
                <SelectContent>
                  {permissionTypes.map((permission) => {
                    const Icon = permission.icon
                    return (
                      <SelectItem key={permission.value} value={permission.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          <span>{permission.label}</span>
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Destinatário</Label>
              <div className="flex gap-2 mt-2">
                <Button
                  variant={selectedTargetType === 'user' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedTargetType('user')}
                >
                  <User className="h-4 w-4 mr-2" />
                  Usuário
                </Button>
                <Button
                  variant={selectedTargetType === 'department' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedTargetType('department')}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Departamento
                </Button>
              </div>
            </div>

            {selectedTargetType === 'user' && (
              <div>
                <Label htmlFor="user">Usuário</Label>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um usuário" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.full_name} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {selectedTargetType === 'department' && (
              <div>
                <Label htmlFor="department">Departamento</Label>
                <Select value={selectedDepartmentId} onValueChange={setSelectedDepartmentId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um departamento" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label htmlFor="expires-at">Expira em (opcional)</Label>
              <Input
                id="expires-at"
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">
                Deixe em branco para permissão permanente
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowGrantDialog(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleGrantPermission} 
                disabled={isGranting || !selectedPermissionType || (!selectedUserId && !selectedDepartmentId)}
              >
                {isGranting ? 'Concedendo...' : 'Conceder Permissão'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
