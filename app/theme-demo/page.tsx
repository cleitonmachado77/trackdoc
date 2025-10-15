'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { SimpleThemeToggle } from "@/components/ui/theme-toggle"
import { 
  FileText, 
  CheckCircle, 
  Clock, 
  Users, 
  Settings,
  Bell,
  Search,
  Download,
  Edit,
  Trash2,
  Plus
} from "lucide-react"

export default function ThemeDemo() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground">Demonstração do Tema</h1>
            <p className="text-muted-foreground mt-2">
              Teste completo do sistema de tema claro/escuro do TrackDoc
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <SimpleThemeToggle />
          </div>
        </div>

        {/* Color Palette */}
        <Card>
          <CardHeader>
            <CardTitle>Paleta de Cores</CardTitle>
            <CardDescription>
              Cores principais do sistema adaptadas para ambos os temas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <div className="h-16 bg-primary rounded-lg"></div>
                <p className="text-sm font-medium">Primary</p>
                <p className="text-xs text-muted-foreground">Azul principal</p>
              </div>
              <div className="space-y-2">
                <div className="h-16 bg-secondary rounded-lg"></div>
                <p className="text-sm font-medium">Secondary</p>
                <p className="text-xs text-muted-foreground">Cinza secundário</p>
              </div>
              <div className="space-y-2">
                <div className="h-16 bg-accent rounded-lg"></div>
                <p className="text-sm font-medium">Accent</p>
                <p className="text-xs text-muted-foreground">Cor de destaque</p>
              </div>
              <div className="space-y-2">
                <div className="h-16 bg-muted rounded-lg"></div>
                <p className="text-sm font-medium">Muted</p>
                <p className="text-xs text-muted-foreground">Cor suave</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Components Demo */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Buttons */}
          <Card>
            <CardHeader>
              <CardTitle>Botões</CardTitle>
              <CardDescription>Diferentes variações de botões</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Button>Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="destructive">Destructive</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm">Small</Button>
                <Button>Default</Button>
                <Button size="lg">Large</Button>
                <Button size="icon"><Plus className="h-4 w-4" /></Button>
              </div>
            </CardContent>
          </Card>

          {/* Form Elements */}
          <Card>
            <CardHeader>
              <CardTitle>Formulários</CardTitle>
              <CardDescription>Inputs e elementos de formulário</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input placeholder="Digite algo aqui..." />
              <Input type="email" placeholder="email@exemplo.com" />
              <Input type="password" placeholder="Senha" />
              <div className="flex space-x-2">
                <Input placeholder="Buscar..." className="flex-1" />
                <Button size="icon">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cards Demo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <FileText className="h-8 w-8 text-primary" />
                <Badge>Novo</Badge>
              </div>
              <CardTitle>Documentos</CardTitle>
              <CardDescription>Gerencie seus documentos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">1,234</div>
              <p className="text-muted-foreground text-sm">Total de documentos</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <Badge variant="secondary">Ativo</Badge>
              </div>
              <CardTitle>Aprovações</CardTitle>
              <CardDescription>Status das aprovações</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">89</div>
              <p className="text-muted-foreground text-sm">Pendentes</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <Users className="h-8 w-8 text-purple-600" />
                <Badge variant="outline">Online</Badge>
              </div>
              <CardTitle>Usuários</CardTitle>
              <CardDescription>Usuários ativos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">456</div>
              <p className="text-muted-foreground text-sm">Usuários ativos</p>
            </CardContent>
          </Card>
        </div>

        {/* Status Colors */}
        <Card>
          <CardHeader>
            <CardTitle>Cores de Status</CardTitle>
            <CardDescription>
              Cores utilizadas para diferentes estados do sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <div className="h-12 bg-green-500 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
                <p className="text-sm font-medium">Sucesso</p>
              </div>
              <div className="space-y-2">
                <div className="h-12 bg-yellow-500 rounded-lg flex items-center justify-center">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <p className="text-sm font-medium">Aviso</p>
              </div>
              <div className="space-y-2">
                <div className="h-12 bg-red-500 rounded-lg flex items-center justify-center">
                  <Trash2 className="h-6 w-6 text-white" />
                </div>
                <p className="text-sm font-medium">Erro</p>
              </div>
              <div className="space-y-2">
                <div className="h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                  <Bell className="h-6 w-6 text-white" />
                </div>
                <p className="text-sm font-medium">Informação</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <Card>
          <CardHeader>
            <CardTitle>Ações Comuns</CardTitle>
            <CardDescription>
              Botões para ações frequentes no sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button className="flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>Novo Documento</span>
              </Button>
              <Button variant="outline" className="flex items-center space-x-2">
                <Edit className="h-4 w-4" />
                <span>Editar</span>
              </Button>
              <Button variant="outline" className="flex items-center space-x-2">
                <Download className="h-4 w-4" />
                <span>Download</span>
              </Button>
              <Button variant="ghost" className="flex items-center space-x-2">
                <Settings className="h-4 w-4" />
                <span>Configurações</span>
              </Button>
              <Button variant="destructive" className="flex items-center space-x-2">
                <Trash2 className="h-4 w-4" />
                <span>Excluir</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* TrackDoc Specific Colors */}
        <Card>
          <CardHeader>
            <CardTitle>Cores Específicas do TrackDoc</CardTitle>
            <CardDescription>
              Cores personalizadas baseadas na identidade visual
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="h-16 bg-trackdoc-blue rounded-lg"></div>
                <p className="text-sm font-medium">TrackDoc Blue</p>
                <p className="text-xs text-muted-foreground">Azul principal da marca</p>
              </div>
              <div className="space-y-2">
                <div className="h-16 bg-trackdoc-blue-light rounded-lg"></div>
                <p className="text-sm font-medium">TrackDoc Blue Light</p>
                <p className="text-xs text-muted-foreground">Azul claro</p>
              </div>
              <div className="space-y-2">
                <div className="h-16 bg-trackdoc-blue-dark rounded-lg"></div>
                <p className="text-sm font-medium">TrackDoc Blue Dark</p>
                <p className="text-xs text-muted-foreground">Azul escuro</p>
              </div>
              <div className="space-y-2">
                <div className="h-16 bg-trackdoc-black rounded-lg"></div>
                <p className="text-sm font-medium">TrackDoc Black</p>
                <p className="text-xs text-muted-foreground">Preto da marca</p>
              </div>
              <div className="space-y-2">
                <div className="h-16 bg-trackdoc-gray rounded-lg"></div>
                <p className="text-sm font-medium">TrackDoc Gray</p>
                <p className="text-xs text-muted-foreground">Cinza neutro</p>
              </div>
              <div className="space-y-2">
                <div className="h-16 bg-trackdoc-gray-light rounded-lg"></div>
                <p className="text-sm font-medium">TrackDoc Gray Light</p>
                <p className="text-xs text-muted-foreground">Cinza claro</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}