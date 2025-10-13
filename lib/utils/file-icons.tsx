import { 
  FileText, 
  File, 
  Image, 
  FileSpreadsheet,
  FileImage,
  FileVideo,
  FileAudio,
  Archive,
  Code
} from "lucide-react"

export interface FileTypeInfo {
  icon: React.ComponentType<{ className?: string }>
  color: string
  bgColor: string
  name: string
}

export function getFileTypeInfo(fileType: string, fileName?: string): FileTypeInfo {
  const type = (fileType || '').toLowerCase()
  const extension = fileName?.split('.').pop()?.toLowerCase() || ''

  // PDF - Vermelho
  if (type.includes('pdf') || extension === 'pdf') {
    return {
      icon: FileText,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      name: 'PDF'
    }
  }

  // Word Documents - Azul
  if (type.includes('word') || 
      type.includes('msword') || 
      type.includes('wordprocessingml') ||
      ['doc', 'docx'].includes(extension)) {
    return {
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      name: 'Word'
    }
  }

  // Excel/Spreadsheets - Verde
  if (type.includes('excel') || 
      type.includes('spreadsheet') ||
      type.includes('sheet') ||
      ['xls', 'xlsx', 'csv'].includes(extension)) {
    return {
      icon: FileSpreadsheet,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      name: 'Excel'
    }
  }

  // PowerPoint - Laranja
  if (type.includes('presentation') ||
      type.includes('powerpoint') ||
      ['ppt', 'pptx'].includes(extension)) {
    return {
      icon: FileText,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      name: 'PowerPoint'
    }
  }

  // Imagens - Roxo
  if (type.includes('image') || 
      ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'].includes(extension)) {
    return {
      icon: FileImage,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      name: 'Imagem'
    }
  }

  // Vídeos - Rosa
  if (type.includes('video') || 
      ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'].includes(extension)) {
    return {
      icon: FileVideo,
      color: 'text-pink-600',
      bgColor: 'bg-pink-100',
      name: 'Vídeo'
    }
  }

  // Áudio - Amarelo
  if (type.includes('audio') || 
      ['mp3', 'wav', 'flac', 'aac', 'ogg', 'wma'].includes(extension)) {
    return {
      icon: FileAudio,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      name: 'Áudio'
    }
  }

  // Arquivos compactados - Indigo
  if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2'].includes(extension)) {
    return {
      icon: Archive,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
      name: 'Arquivo'
    }
  }

  // Código - Teal
  if (['js', 'ts', 'jsx', 'tsx', 'html', 'css', 'scss', 'json', 'xml', 'sql', 'py', 'java', 'cpp', 'c', 'php', 'rb', 'go', 'rs'].includes(extension)) {
    return {
      icon: Code,
      color: 'text-teal-600',
      bgColor: 'bg-teal-100',
      name: 'Código'
    }
  }

  // Texto - Cinza (padrão)
  if (type.includes('text') || 
      ['txt', 'rtf', 'md'].includes(extension)) {
    return {
      icon: FileText,
      color: 'text-gray-600',
      bgColor: 'bg-gray-100',
      name: 'Texto'
    }
  }

  // Padrão - Cinza
  return {
    icon: File,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    name: 'Arquivo'
  }
}

// Função para obter apenas o ícone com cor (para compatibilidade)
export function getFileIcon(fileType: string, fileName?: string, className: string = "h-4 w-4") {
  const { icon: Icon, color } = getFileTypeInfo(fileType, fileName)
  return <Icon className={`${className} ${color}`} />
}

// Função para obter o ícone com background colorido
export function getFileIconWithBackground(
  fileType: string, 
  fileName?: string, 
  iconSize: string = "h-4 w-4",
  containerSize: string = "p-2"
) {
  const { icon: Icon, color, bgColor } = getFileTypeInfo(fileType, fileName)
  
  return (
    <div className={`${containerSize} ${bgColor} rounded-lg`}>
      <Icon className={`${iconSize} ${color}`} />
    </div>
  )
}