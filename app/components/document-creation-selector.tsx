"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload } from "lucide-react"

interface DocumentCreationSelectorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectOption: (option: "upload") => void
}

export default function DocumentCreationSelector({
  open,
  onOpenChange,
  onSelectOption,
}: DocumentCreationSelectorProps) {
  const creationOptions = [
    {
      id: "upload",
      title: "Carregar Documento",
      description: "Faça upload de um arquivo existente e preencha os metadados",
      icon: Upload,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      features: ["Upload de arquivos", "Metadados completos", "Fluxo de aprovação"],
    },
  ]

  const handleOptionSelect = (optionId: "upload") => {
    onSelectOption(optionId)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">Carregar Novo Documento</DialogTitle>
        </DialogHeader>

        <div className="flex justify-center py-6">
          {creationOptions.map((option) => {
            const Icon = option.icon
            return (
              <Card
                key={option.id}
                className={`cursor-pointer transition-all hover:shadow-lg hover:scale-105 ${option.borderColor} w-80`}
                onClick={() => handleOptionSelect(option.id as "upload")}
              >
                <CardHeader className={`text-center ${option.bgColor}`}>
                  <div className="flex justify-center mb-3">
                    <Icon className={`h-12 w-12 ${option.color}`} />
                  </div>
                  <CardTitle className="text-lg">{option.title}</CardTitle>
                  <CardDescription className="text-sm">{option.description}</CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <ul className="space-y-2">
                    {option.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-sm text-gray-600">
                        <div className={`w-2 h-2 rounded-full ${option.color.replace("text-", "bg-")} mr-2`} />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={`w-full mt-4 ${option.color.replace("text-", "bg-")} hover:opacity-90`}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleOptionSelect(option.id as "upload" | "ai")
                    }}
                  >
                    Selecionar
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="flex justify-center pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
