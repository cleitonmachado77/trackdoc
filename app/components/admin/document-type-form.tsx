"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { Switch } from "@/components/ui/switch"

/* ---------- TIPOS ---------- */
type Status = "active" | "inactive"

interface DocumentType {
  id: string
  name: string
  prefix: string
  color: string
  requiredFields: string[]
  approvalRequired: boolean
  retentionPeriod: number | null | undefined
  status: Status
  template: string | null
  documentsCount: number
}

/* ---------- CONSTANTES ---------- */
const DEFAULT_COLOR = "blue"

/* ---------- PROPS ---------- */
interface DocumentTypeFormProps {
  documentType: DocumentType | null
  onSave: (data: Partial<DocumentType>) => void
  isLoading?: boolean
}

/* ---------- COMPONENTE ---------- */
export default function DocumentTypeForm({ documentType, onSave, isLoading = false }: DocumentTypeFormProps) {
  // Memoizar hasRetention para evitar recálculo
  const initialHasRetention = useMemo(() => {
    return documentType?.retentionPeriod != null && documentType.retentionPeriod > 0
  }, [documentType?.retentionPeriod])
  
  const [formData, setFormData] = useState<Partial<DocumentType>>({
    name: "",
    prefix: "",
    requiredFields: ["title", "author", "version", "sector", "category"],
    approvalRequired: false,
    retentionPeriod: null,
    status: "active",
    template: null,
  })
  
  const [retentionEnabled, setRetentionEnabled] = useState(false)

  // Sincronizar com documentType quando mudar
  useEffect(() => {
    if (documentType) {
      const hasRet = documentType.retentionPeriod != null && documentType.retentionPeriod > 0
      setFormData({
        name: documentType.name || "",
        prefix: documentType.prefix || "",
        requiredFields: documentType.requiredFields || ["title", "author", "version", "sector", "category"],
        approvalRequired: documentType.approvalRequired ?? false,
        retentionPeriod: hasRet ? documentType.retentionPeriod : null,
        status: documentType.status || "active",
        template: documentType.template || null,
        id: documentType.id,
      })
      setRetentionEnabled(hasRet)
    } else {
      // Reset para novo tipo
      setFormData({
        name: "",
        prefix: "",
        requiredFields: ["title", "author", "version", "sector", "category"],
        approvalRequired: false,
        retentionPeriod: null,
        status: "active",
        template: null,
      })
      setRetentionEnabled(false)
    }
  }, [documentType])

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nome do Tipo</Label>
          <Input
            id="name"
            value={formData.name || ""}
            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="Ex: Política"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="prefix">Prefixo</Label>
          <Input
            id="prefix"
            value={formData.prefix || ""}
            onChange={(e) => setFormData((prev) => ({ ...prev, prefix: e.target.value.toUpperCase() }))}
            placeholder="Ex: POL"
          />
        </div>
      </div>



      {/* Switch para habilitar/desabilitar retenção */}
      <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label className="text-base font-medium">Período de Retenção</Label>
            <p className="text-sm text-gray-500">
              Define por quanto tempo o documento deve ser mantido
            </p>
          </div>
          <Switch
            checked={retentionEnabled}
            onCheckedChange={(checked) => {
              // Remover foco do switch
              if (document.activeElement instanceof HTMLElement) {
                document.activeElement.blur()
              }
              setRetentionEnabled(checked)
              if (!checked) {
                setFormData((prev) => ({ ...prev, retentionPeriod: null }))
              } else {
                setFormData((prev) => ({ ...prev, retentionPeriod: 0 }))
              }
            }}
          />
        </div>
        
        {retentionEnabled && (
          <div className="space-y-2">
            <Label htmlFor="retention">Período (meses)</Label>
            <Input
              id="retention"
              type="number"
              min="0"
              placeholder="Ex: 0"
              value={formData.retentionPeriod ?? 0}
              onChange={(e) => {
                const value = Number.parseInt(e.target.value, 10)
                if (!isNaN(value) && value >= 0) {
                  setFormData((prev) => ({ ...prev, retentionPeriod: value }))
                }
              }}
            />
            <p className="text-xs text-gray-500">
              Número de meses que o documento deve ser mantido
            </p>
          </div>
        )}
        
        {!retentionEnabled && (
          <p className="text-sm text-gray-600 italic">
            Este tipo de documento não terá período de retenção definido
          </p>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          checked={formData.approvalRequired || false}
          onCheckedChange={(checked) => {
            // Remover foco do switch
            if (document.activeElement instanceof HTMLElement) {
              document.activeElement.blur()
            }
            setFormData((prev) => ({ ...prev, approvalRequired: checked }))
          }}
        />
        <Label>Aprovação obrigatória</Label>
      </div>

      <div className="flex justify-end space-x-2 pt-4 border-t">
        <Button variant="outline" onClick={() => onSave({})} disabled={isLoading}>
          Cancelar
        </Button>
        <Button onClick={() => onSave({...formData, color: DEFAULT_COLOR})} disabled={isLoading}>
          {isLoading ? "Salvando..." : "Salvar Tipo"}
        </Button>
      </div>
    </div>
  )
}
