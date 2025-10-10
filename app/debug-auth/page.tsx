import { AuthDebug } from '@/app/components/auth-debug'

export default function DebugAuthPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-center mb-8">Debug de Autenticação</h1>
        <AuthDebug />
      </div>
    </div>
  )
}