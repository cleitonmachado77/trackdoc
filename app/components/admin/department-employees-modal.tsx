'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Users, UserPlus, UserMinus, Crown, Mail, Star, Calendar } from 'lucide-react'
import { useDepartmentEmployees, DepartmentEmployee } from '@/hooks/use-department-employees'
import { useToast } from '@/hooks/use-toast'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface DepartmentEmployeesModalProps {
  departmentId: string
  departmentName: string
  trigger?: React.ReactNode
}

export function DepartmentEmployeesModal({ 
  departmentId, 
  departmentName, 
  trigger 
}: DepartmentEmployeesModalProps) {
  const [open, setOpen] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<string>('')
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false)
  const [employeeToRemove, setEmployeeToRemove] = useState<DepartmentEmployee | null>(null)
  const [showManagerConfirm, setShowManagerConfirm] = useState(false)
  const [employeeToMakeManager, setEmployeeToMakeManager] = useState<DepartmentEmployee | null>(null)
  const [isProcessing, setIsProcessing] = useState(false) // ✅ Estado de loading específico
  const { toast } = useToast()
  
  const {
    employees,
    availableEmployees,
    loading,
    error,
    addEmployeeToDepartment,
    removeEmployeeFromDepartment,
    assignManager
  } = useDepartmentEmployees(departmentId)

  const handleAddEmployee = async () => {
    if (!selectedEmployee) {
      toast({
        title: 'Erro',
        description: 'Selecione um funcionário para adicionar',
        variant: 'destructive'
      })
      return
    }

    try {
      setIsProcessing(true) // ✅ Ativar loading
      await addEmployeeToDepartment(selectedEmployee, 'member', false)
      setSelectedEmployee('')
      toast({
        title: 'Sucesso',
        description: 'Funcionário adicionado ao departamento'
      })
    } catch (err) {
      toast({
        title: 'Erro',
        description: 'Erro ao adicionar funcionário',
        variant: 'destructive'
      })
    } finally {
      setIsProcessing(false) // ✅ Sempre resetar loading
    }
  }

  const handleRemoveEmployee = async (employee: DepartmentEmployee) => {
    setEmployeeToRemove(employee)
    setShowRemoveConfirm(true)
  }

  const confirmRemoveEmployee = async () => {
    if (!employeeToRemove) return
    
    try {
      setIsProcessing(true) // ✅ Ativar loading
      await removeEmployeeFromDepartment(employeeToRemove.id)
      toast({
        title: 'Sucesso',
        description: `${employeeToRemove.full_name} foi removido do departamento`
      })
      setShowRemoveConfirm(false)
      setEmployeeToRemove(null)
    } catch (err) {
      toast({
        title: 'Erro',
        description: 'Erro ao remover funcionário',
        variant: 'destructive'
      })
    } finally {
      setIsProcessing(false) // ✅ Sempre resetar loading
    }
  }

  const handleAssignManager = async (employee: DepartmentEmployee) => {
    setEmployeeToMakeManager(employee)
    setShowManagerConfirm(true)
  }

  const confirmAssignManager = async () => {
    if (!employeeToMakeManager) return
    
    try {
      setIsProcessing(true) // ✅ Ativar loading
      await assignManager(employeeToMakeManager.id)
      toast({
        title: 'Sucesso',
        description: `${employeeToMakeManager.full_name} foi designado como gerente`
      })
      setShowManagerConfirm(false)
      setEmployeeToMakeManager(null)
    } catch (err) {
      toast({
        title: 'Erro',
        description: 'Erro ao designar gerente',
        variant: 'destructive'
      })
    } finally {
      setIsProcessing(false) // ✅ Sempre resetar loading
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const EmployeeCard = ({ employee, isManager }: { employee: DepartmentEmployee, isManager: boolean }) => (
    <div className="border rounded-lg p-3 mb-3 hover:bg-gray-50 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-2">
            <h4 className="font-medium text-sm truncate">{employee.full_name}</h4>
            {isManager && (
              <Badge variant="default" className="text-xs">
                <Crown className="h-3 w-3 mr-1" />
                Gerente
              </Badge>
            )}
            {employee.is_primary && (
              <Badge variant="secondary" className="text-xs">
                <Star className="h-3 w-3 mr-1" />
                Principal
              </Badge>
            )}
            {employee.role_in_department && employee.role_in_department !== 'manager' && (
              <Badge variant="outline" className="text-xs">
                {employee.role_in_department === 'admin' ? 'Administrador' :
                 employee.role_in_department === 'user' ? 'Usuário' :
                 employee.role_in_department === 'viewer' ? 'Visualizador' :
                 employee.role_in_department}
              </Badge>
            )}
          </div>
          
          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
            <div className="flex items-center space-x-1">
              <Mail className="h-3 w-3" />
              <span className="truncate">{employee.email}</span>
            </div>
            {employee.assigned_at && (
              <div className="flex items-center space-x-1">
                <Calendar className="h-3 w-3" />
                <span>Adicionado em {formatDate(employee.assigned_at)}</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2 ml-3">
          {!isManager && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAssignManager(employee)}
              className="h-8 px-2"
            >
              <Crown className="h-3 w-3" />
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleRemoveEmployee(employee)}
            className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <UserMinus className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Users className="h-4 w-4 mr-2" />
            Funcionários
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Funcionários - {departmentName}</span>
          </DialogTitle>
        </DialogHeader>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Funcionários do Departamento */}
          <div className="min-w-0">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-4 w-4" />
                  <span>Funcionários ({employees.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground">Carregando...</p>
                  </div>
                ) : employees.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">Nenhum funcionário no departamento</p>
                  </div>
                ) : (
                  <div className="max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                    {employees.map((employee) => (
                      <EmployeeCard 
                        key={employee.id} 
                        employee={employee}
                        isManager={employee.is_manager || false}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Adicionar Funcionários */}
          <div className="min-w-0">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <UserPlus className="h-4 w-4" />
                  <span>Adicionar Funcionários</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Funcionários Disponíveis ({availableEmployees.length})
                    </label>
                    {availableEmployees.length > 0 ? (
                      <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um funcionário" />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                          {availableEmployees.map((employee) => (
                            <SelectItem key={employee.id} value={employee.id}>
                              <div className="flex flex-col">
                                <span className="truncate">{employee.full_name}</span>
                                <span className="text-xs text-muted-foreground truncate">{employee.email}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="p-3 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 text-center">
                        <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">Todos os funcionários já estão alocados</p>
                      </div>
                    )}
                  </div>

                  <Button 
                    onClick={handleAddEmployee}
                    disabled={!selectedEmployee || loading || isProcessing || availableEmployees.length === 0}
                    className="w-full"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    {isProcessing ? 'Adicionando...' : 'Adicionar ao Departamento'}
                  </Button>

                  <Separator />

                  <div>
                    <h4 className="font-medium mb-2">Funcionários Disponíveis</h4>
                    {availableEmployees.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        Todos os funcionários já estão alocados em departamentos
                      </p>
                    ) : (
                      <div className="space-y-2 max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                        {availableEmployees.map((employee) => (
                          <div key={employee.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 border rounded gap-2">
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-sm truncate">{employee.full_name}</p>
                              <p className="text-xs text-muted-foreground truncate">{employee.email}</p>
                            </div>
                            <Badge variant="outline" className="text-xs flex-shrink-0">
                              {employee.role === 'manager' ? 'Gerente' : 
                               employee.role === 'admin' ? 'Administrador' :
                               employee.role === 'user' ? 'Usuário' :
                               employee.role === 'viewer' ? 'Visualizador' :
                               employee.role}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>

      {/* Dialog de confirmação para remover funcionário */}
      <AlertDialog 
        open={showRemoveConfirm} 
        onOpenChange={(open) => {
          setShowRemoveConfirm(open)
          if (!open) {
            setEmployeeToRemove(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover funcionário do departamento?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover <span className="font-semibold">{employeeToRemove?.full_name}</span> do departamento <span className="font-semibold">{departmentName}</span>?
              <br /><br />
              Esta ação não pode ser desfeita. O funcionário ficará sem departamento atribuído.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmRemoveEmployee} 
              disabled={isProcessing}
              className="bg-red-600 hover:bg-red-700"
            >
              {isProcessing ? 'Removendo...' : 'Remover'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de confirmação para atribuir gerente */}
      <AlertDialog 
        open={showManagerConfirm} 
        onOpenChange={(open) => {
          setShowManagerConfirm(open)
          if (!open) {
            setEmployeeToMakeManager(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Designar novo gerente?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja designar <span className="font-semibold">{employeeToMakeManager?.full_name}</span> como gerente do departamento <span className="font-semibold">{departmentName}</span>?
              <br /><br />
              Se já existir um gerente, ele será substituído.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmAssignManager} 
              disabled={isProcessing}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isProcessing ? 'Designando...' : 'Designar Gerente'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  )
}
