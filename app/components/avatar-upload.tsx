"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { useAvatarBase64 as useAvatarUpload } from "@/hooks/use-avatar-base64"
import { useToast } from "@/hooks/use-toast"
import { 
  Camera, 
  Upload, 
  X, 
  Loader2,
  User,
  Trash2
} from "lucide-react"

interface AvatarUploadProps {
  currentAvatarUrl?: string | null
  userName?: string
  onAvatarChange?: (newAvatarUrl: string | null) => void
  size?: "sm" | "md" | "lg" | "xl"
  showUploadButton?: boolean
}

export default function AvatarUpload({ 
  currentAvatarUrl, 
  userName, 
  onAvatarChange,
  size = "lg",
  showUploadButton = true 
}: AvatarUploadProps) {
  const { uploadAvatar, deleteAvatar, isUploading } = useAvatarUpload()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const sizeClasses = {
    sm: "h-16 w-16",
    md: "h-20 w-20", 
    lg: "h-24 w-24",
    xl: "h-32 w-32"
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Criar preview da imagem
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    // Fazer upload
    handleUpload(file)
  }

  const handleUpload = async (file: File) => {
    const newAvatarUrl = await uploadAvatar(file)
    if (newAvatarUrl && onAvatarChange) {
      onAvatarChange(newAvatarUrl)
      setPreviewUrl(null)
    }
  }

  const handleRemove = async () => {
    const success = await deleteAvatar()
    if (success && onAvatarChange) {
      onAvatarChange(null)
      setPreviewUrl(null)
    }
  }

  const handleButtonClick = () => {
    fileInputRef.current?.click()
  }

  const displayAvatarUrl = previewUrl || currentAvatarUrl

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Avatar */}
      <div className="relative group">
        <Avatar className={`${sizeClasses[size]} border-4 border-white shadow-lg`}>
          <AvatarImage src={displayAvatarUrl || undefined} />
          <AvatarFallback className="text-lg font-semibold bg-gradient-to-br from-blue-500 to-purple-600 text-white">
            {userName?.charAt(0)?.toUpperCase() || <User className="h-8 w-8" />}
          </AvatarFallback>
        </Avatar>

        {/* Overlay de loading */}
        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
            <Loader2 className="h-6 w-6 animate-spin text-white" />
          </div>
        )}

        {/* Botão de upload flutuante */}
        {showUploadButton && (
          <Button
            size="sm"
            onClick={handleButtonClick}
            disabled={isUploading}
            className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0 shadow-lg"
          >
            <Camera className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Input de arquivo oculto */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Botões de ação */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleButtonClick}
          disabled={isUploading}
          className="flex items-center gap-2"
        >
          {isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          {isUploading ? "Enviando..." : "Alterar Foto"}
        </Button>

        {currentAvatarUrl && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleRemove}
            disabled={isUploading}
            className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
            Remover
          </Button>
        )}
      </div>

      {/* Informações de ajuda */}
      <div className="text-center text-xs text-gray-500 max-w-xs">
        <p>Formatos aceitos: JPG, PNG, WebP</p>
        <p>Tamanho máximo: 2MB</p>
      </div>
    </div>
  )
}
