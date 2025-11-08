"use client"

import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Plus, Loader2 } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"

interface InlineCreateSelectProps {
  value: string
  onValueChange: (value: string) => void
  options: Array<{ id: string; name: string; [key: string]: any }>
  placeholder: string
  label: string | React.ReactNode
  disabled?: boolean
  className?: string
  onCreate: (data: any) => Promise<any>
  createFields: Array<{
    name: string
    label: string
    type: 'text' | 'textarea' | 'select'
    required?: boolean
    placeholder?: string
    options?: Array<{ value: string; label: string }>
  }>
  createTitle: string
}

export function InlineCreateSelect({
  value,
  onValueChange,
  options,
  placeholder,
  label,
  disabled,
  className,
  onCreate,
  createFields,
  createTitle
}: InlineCreateSelectProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [formData, setFormData] = useState<Record<string, any>>({})

  const handleCreate = async () => {
    try {
      setIsCreating(true)
      
      // Validar campos obrigatórios
      const missingFields = createFields
        .filter(field => field.required && !formData[field.name])
        .map(field => field.label)
      
      if (missingFields.length > 0) {
        alert(`Preencha os campos obrigatórios: ${missingFields.join(', ')}`)
        return
      }

      const newItem = await onCreate(formData)
      
      if (newItem && newItem.id) {
        onValueChange(newItem.id)
        setShowCreateDialog(false)
        setFormData({})
      }
    } catch (error: any) {
      console.error('Erro ao criar:', error)
      
      // Tratamento específico para erro de duplicata
      if (error?.code === '23505' || error?.message?.includes('duplicate key')) {
        const fieldName = createFields[0]?.label || 'item'
        alert(`Já existe um ${fieldName.toLowerCase()} com este nome. Por favor, escolha outro nome.`)
      } else {
        alert(`Erro ao criar: ${error?.message || 'Tente novamente.'}`)
      }
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <>
      <div>
        <Label className="text-xs font-medium">{label}</Label>
        <div className="flex gap-2 mt-2">
          <Select value={value} onValueChange={onValueChange} disabled={disabled}>
            <SelectTrigger className={className}>
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {!disabled && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8 flex-shrink-0"
              onClick={() => setShowCreateDialog(true)}
              title={`Criar novo ${typeof label === 'string' ? label.toLowerCase() : 'item'}`}
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{createTitle}</DialogTitle>
            <DialogDescription>
              Preencha os campos abaixo para criar um novo item.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {createFields.map((field) => (
              <div key={field.name} className="space-y-2">
                <Label htmlFor={field.name}>
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </Label>
                
                {field.type === 'text' && (
                  <Input
                    id={field.name}
                    value={formData[field.name] || ''}
                    onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                    placeholder={field.placeholder}
                    required={field.required}
                  />
                )}
                
                {field.type === 'textarea' && (
                  <Textarea
                    id={field.name}
                    value={formData[field.name] || ''}
                    onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                    placeholder={field.placeholder}
                    required={field.required}
                    rows={3}
                  />
                )}
                
                {field.type === 'select' && field.options && (
                  <Select
                    value={formData[field.name] || ''}
                    onValueChange={(val) => setFormData({ ...formData, [field.name]: val })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={field.placeholder} />
                    </SelectTrigger>
                    <SelectContent>
                      {field.options.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            ))}
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateDialog(false)
                setFormData({})
              }}
              disabled={isCreating}
            >
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={isCreating}>
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                'Criar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
