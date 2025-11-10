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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Shield,
  Building2,
  User,
  Plus,
  Trash2,
  Eye,
  Edit,
  Download,
  PenTool,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2
} from "lucide-react"
import { useDepartments } from "@/hooks/use-departments"
import { useUsers } from "@/hooks/use-users"
import { useDocumentPermissions } from "@/hooks/use-document-permissions"
import { useAuth } from '@/lib/hooks/use-auth-final'
import { useToast } from "@/hooks/use-toast"
import { Document } from "@/hooks/use-documents"

interface DocumentPermissionsModalProps {
  document: Document
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function DocumentPermissionsModal({
  document,
  open,
  onOpenChange
}: DocumentPermissionsModalProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const { departments } = useDepartments()
  const { users } = useUsers()
  const { 
    fetchDocumentPermissions, 
    grantPermission, 
    revokePermission 
  } = useDocumentPermissions()

  const [permissions, setPermissions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [granting, setGranting] = useState(false)
  const [selectedDepartment, setSelectedDepartment] = useState<string>("")
  const [selectedUser, setSelectedUser] = useState<string>("")
  const [selectedPermissionType, setSelectedPermissionType] = useState<string>("read")
  const [grantType, setGrantType] = useState<'department' | 'user'>('department')

  const permissionTypes = [
    { value: 'read', label: 'Visualizar', icon: Eye, description: 'Pode ver o conteúdo do documento' },
    { value: 'delete', label: 'Excluir', icon: Trash2, description: 'Pode excluir o documento' }
  ]

  useEffect(() => {
    if (open && document.id) {
      loadPermissions()
    }
  }, [open, document.id])

  const loadPermissions = async () => {
    try {
      setLoading(true)
      const data = await fetchDocumentPermissions(document.id)
      setPermissions(data)
    } catch (error) {
      console.error('Erro ao carregar permissões:', error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar as permissões do documento.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleGrantPermission = async () => {
    if (!selectedPermissionType) {
      toast({
        title: "Erro",
        description: "Selecione um tipo de permissão.",
        variant: "destructive",
      })
      return
    }

    if (grantType === 'department' && !selectedDepartment) {
      toast({
        title: "Erro",
        description: "Selecione um departamento.",
        variant: "destructive",
      })
      return
    }

    if (grantType === 'user' && !selectedUser) {
      toast({
        title: "Erro",
        description: "Selecione um usuário.",
        variant: "destructive",
      })
      return
    }

    try {
      setGranting(true)
      
      await grantPermission({
        document_id: document.id,
        department_id: grantType === 'department' ? selectedDepartment : undefined,
        user_id: grantType === 'user' ? selectedUser : undefined,
        permission_type: selectedPermissionType as any
      })

      // Recarregar permissões
      await loadPermissions()

      // Limpar seleções
      setSelectedDepartment("")
      setSelectedUser("")
      setSelectedPermissionType("read")

      toast({
        title: "Sucesso",
        description: "Permissão concedida com sucesso.",
      })

    } catch (error) {
      console.error('Erro ao conceder permissão:', error)
      toast({
        title: "Erro",
        description: "Não foi possível conceder a permissão.",
        variant: "destructive",
      })
    } finally {
      setGranting(false)
    }
  }

  const handleRevokePermission = async (permissionId: string) => {
    try {
      await revokePermission(permissionId)
      await loadPermissions()
      
      toast({
        title: "Sucesso",
        description: "Permissão revogada com sucesso.",
      })
    } catch (error) {
      console.error('Erro ao revogar permissão:', error)
      toast({
        title: "Erro",
        description: "Não foi possível revogar a permissão.",
        variant: "destructive",
      })
    }
  }

  const getPermissionIcon = (type: string) => {
    const permission = permissionTypes.find(p => p.value === type)
    return permission ? permission.icon : Eye
  }

  const getPermissionLabel = (type: string) => {
    const permission = permissionTypes.find(p => p.value === type)
    return permission ? permission.label : type
  }

  // Verificar se o usuário pode gerenciar permissões (autor ou admin)
  const canManagePermissions = document.author_id === user?.id || 
    (user?.user_metadata?.role && ['admin', 'entity_admin'].includes(user.user_metadata.role))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Gerenciar Permissões</span>
          </DialogTitle>
          <DialogDescription>
            Gerencie quem pode acessar o documento "{document.title}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status do Documento */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Status Atual</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Badge variant={document.is_public ? "secondary" : "outline"}>
                  {document.is_public ? "Público" : "Privado/Restrito"}
                </Badge>
                {permissions.length > 0 && (
                  <Badge variant="outline">
                    {permissions.length} permissão(ões) específica(s)
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Conceder Nova Permissão */}
          {canManagePermissions && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center space-x-2">
                  <Plus className="h-4 w-4" />
                  <span>Conceder Nova Permissão</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Tipo de Concessão */}
                <div className="flex space-x-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="grant-department"
                      checked={grantType === 'department'}
                      onCheckedChange={() => setGrantType('department')}
                    />
                    <Label htmlFor="grant-department" className="flex items-center space-x-1">
                      <Building2 className="h-4 w-4" />
                      <span>Departamento</span>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="grant-user"
                      checked={grantType === 'user'}
                      onCheckedChange={() => setGrantType('user')}
                    />
                    <Label htmlFor="grant-user" className="flex items-center space-x-1">
                      <User className="h-4 w-4" />
                      <span>Usuário</span>
                    </Label>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Seleção de Departamento/Usuário */}
                  {grantType === 'department' ? (
                    <div>
                      <Label className="text-sm">Departamento</Label>
                      <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
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
                  ) : (
                    <div>
                      <Label className="text-sm">Usuário</Label>
                      <Select value={selectedUser} onValueChange={setSelectedUser}>
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

                  {/* Tipo de Permissão */}
                  <div>
                    <Label className="text-sm">Tipo de Permissão</Label>
                    <Select value={selectedPermissionType} onValueChange={setSelectedPermissionType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma permissão" />
                      </SelectTrigger>
                      <SelectContent>
                        {permissionTypes.map((perm) => {
                          const Icon = perm.icon
                          return (
                            <SelectItem key={perm.value} value={perm.value}>
                              <div className="flex items-center space-x-2">
                                <Icon className="h-4 w-4" />
                                <span>{perm.label}</span>
                              </div>
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Botão Conceder */}
                  <div className="flex items-end">
                    <Button 
                      onClick={handleGrantPermission}
                      disabled={granting}
                      className="w-full"
                    >
                      {granting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Concedendo...
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          Conceder
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Lista de Permissões Existentes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Permissões Existentes</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Carregando permissões...</span>
                </div>
              ) : permissions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma permissão específica definida</p>
                  <p className="text-sm">
                    {document.is_public 
                      ? "Este documento é público para toda a organização" 
                      : "Este documento é privado do autor"}
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Destinatário</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Permissão</TableHead>
                      <TableHead>Concedido por</TableHead>
                      <TableHead>Data</TableHead>
                      {canManagePermissions && <TableHead>Ações</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {permissions.map((permission) => {
                      const Icon = getPermissionIcon(permission.permission_type)
                      return (
                        <TableRow key={permission.id}>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              {permission.department_id ? (
                                <>
                                  <Building2 className="h-4 w-4 text-blue-600" />
                                  <span>{permission.department?.name}</span>
                                </>
                              ) : (
                                <>
                                  <User className="h-4 w-4 text-green-600" />
                                  <span>{permission.user?.full_name}</span>
                                </>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {permission.department_id ? 'Departamento' : 'Usuário'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Icon className="h-4 w-4" />
                              <span>{getPermissionLabel(permission.permission_type)}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {permission.granted_by_user?.full_name}
                          </TableCell>
                          <TableCell>
                            {new Date(permission.granted_at).toLocaleDateString('pt-BR')}
                          </TableCell>
                          {canManagePermissions && (
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRevokePermission(permission.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          )}
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {!canManagePermissions && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Você não tem permissão para gerenciar as permissões deste documento.
                Apenas o autor ou administradores podem fazer alterações.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}