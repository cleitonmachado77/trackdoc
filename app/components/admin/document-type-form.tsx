"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  retentionPeriod: number
  status: Status
  template: string | null
  documentsCount: number
}

/* ---------- CONSTANTES ---------- */
const colorOptions = [
  { value: "blue", label: "Azul", class: "bg-blue-100 text-blue-800" },
  { value: "green", label: "Verde", class: "bg-green-100 text-green-800" },
  { value: "yellow", label: "Amarelo", class: "bg-yellow-100 text-yellow-800" },
  { value: "purple", label: "Roxo", class: "bg-purple-100 text-purple-800" },
  { value: "red", label: "Vermelho", class: "bg-red-100 text-red-800" },
  { value: "gray", label: "Cinza", class: "bg-gray-100 text-gray-800" },
  { value: "orange", label: "Laranja", class: "bg-orange-100 text-orange-800" },
  { value: "teal", label: "Verde-azulado", class: "bg-teal-100 text-teal-800" },
  { value: "cyan", label: "Ciano", class: "bg-cyan-100 text-cyan-800" },
  { value: "lime", label: "Verde-limão", class: "bg-lime-100 text-lime-800" },
]

/* ---------- PROPS ---------- */
interface DocumentTypeFormProps {
  documentType: DocumentType | null
  onSave: (data: Partial<DocumentType>) => void
}

/* ---------- COMPONENTE ---------- */
export default function DocumentTypeForm({ documentType, onSave }: DocumentTypeFormProps) {
  const [formData, setFormData] = useState<Partial<DocumentType>>({
    name: documentType?.name || "",
    prefix: documentType?.prefix || "",
    color: documentType?.color || "blue",
    requiredFields: documentType?.requiredFields || ["title", "author", "version", "sector", "category"],
    approvalRequired: documentType?.approvalRequired || false,
    retentionPeriod: documentType?.retentionPeriod || 24,
    status: documentType?.status || "active",
    template: documentType?.template || null,
    ...(documentType && { id: documentType.id }),
  })

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

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="color">Cor</Label>
          <Select
            value={formData.color || "blue"}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, color: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {colorOptions.map((color) => (
                <SelectItem key={color.value} value={color.value}>
                  <div className="flex items-center space-x-2">
                    <div className={`w-4 h-4 rounded ${color.class}`}></div>
                    <span>{color.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="retention">Período de Retenção (meses)</Label>
          <Input
            id="retention"
            type="number"
            value={formData.retentionPeriod || 0}
            onChange={(e) => setFormData((prev) => ({ ...prev, retentionPeriod: Number.parseInt(e.target.value) }))}
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          checked={formData.approvalRequired || false}
          onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, approvalRequired: checked }))}
        />
        <Label>Aprovação obrigatória</Label>
      </div>

      <div className="flex justify-end space-x-2 pt-4 border-t">
        <Button variant="outline" onClick={() => onSave({})}>
          Cancelar
        </Button>
        <Button onClick={() => onSave(formData)}>Salvar Tipo</Button>
      </div>
    </div>
  )
}
