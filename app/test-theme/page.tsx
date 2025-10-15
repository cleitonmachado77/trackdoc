'use client'

import { SimpleThemeToggle } from "@/components/ui/theme-toggle"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function TestTheme() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground">Teste do Tema Escuro</h1>
            <p className="text-muted-foreground mt-2">
              Verificação do sistema de cores azul escuro
            </p>
          </div>
          <SimpleThemeToggle />
        </div>

        {/* Cards de Teste */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Card de Teste 1</CardTitle>
              <CardDescription>
                Este card deve ter fundo azul escuro no modo dark
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-foreground">
                Este texto deve ser azul claro no modo escuro.
              </p>
              <Button className="mt-4">Botão Primário</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Card de Teste 2</CardTitle>
              <CardDescription>
                Outro card para testar as cores
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Este texto deve ser azul médio no modo escuro.
              </p>
              <div className="flex space-x-2 mt-4">
                <Button variant="secondary">Secundário</Button>
                <Button variant="outline">Outline</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Paleta de Cores */}
        <Card>
          <CardHeader>
            <CardTitle>Paleta de Cores</CardTitle>
            <CardDescription>
              Visualização das cores do tema azul escuro
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <div className="h-16 bg-background rounded-lg border"></div>
                <p className="text-sm font-medium">Background</p>
                <p className="text-xs text-muted-foreground">Fundo principal</p>
              </div>
              <div className="space-y-2">
                <div className="h-16 bg-card rounded-lg border"></div>
                <p className="text-sm font-medium">Card</p>
                <p className="text-xs text-muted-foreground">Fundo dos cards</p>
              </div>
              <div className="space-y-2">
                <div className="h-16 bg-primary rounded-lg"></div>
                <p className="text-sm font-medium">Primary</p>
                <p className="text-xs text-muted-foreground">Cor primária</p>
              </div>
              <div className="space-y-2">
                <div className="h-16 bg-secondary rounded-lg"></div>
                <p className="text-sm font-medium">Secondary</p>
                <p className="text-xs text-muted-foreground">Cor secundária</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Teste de Texto */}
        <Card>
          <CardHeader>
            <CardTitle>Teste de Tipografia</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-foreground">
              Este é um texto normal que deve ser azul claro no modo escuro.
            </p>
            <p className="text-muted-foreground">
              Este é um texto secundário que deve ser azul médio no modo escuro.
            </p>
            <p className="text-primary">
              Este é um texto com cor primária (azul vibrante).
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}