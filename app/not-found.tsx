import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Home, Search } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <Search className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle className="text-xl font-semibold text-gray-900">
            Página não encontrada
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-gray-600">
            A página que você está procurando não existe ou foi movida.
          </p>
          
          <div className="flex justify-center">
            <Button asChild variant="default" className="flex items-center gap-2">
              <Link href="/">
                <Home className="h-4 w-4" />
                Página inicial
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
