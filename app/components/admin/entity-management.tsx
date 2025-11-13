"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/hooks/use-auth-final'
import { createBrowserClient } from '@supabase/ssr'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Building2, 
  Plus, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Upload,
  X,
  Image as ImageIcon,
  Edit,
  Save,
  Users
} from 'lucide-react'
import EntityUserManagement from './entity-user-management'
import { useAuditLogger } from '@/hooks/use-audit-logger'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function EntityManagement() {
  const { user } = useAuth()
  const { logEntityUpdate, logSystemAction } = useAuditLogger()
  const [userProfile, setUserProfile] = useState<any>(null)
  const [userEntity, setUserEntity] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [activeTab, setActiveTab] = useState("info")
  
  const [entityForm, setEntityForm] = useState({
    name: "",
    legalName: "",
    cnpj: "",
    phone: "",
    description: ""
  })

  const [editForm, setEditForm] = useState({
    name: "",
    legalName: "",
    cnpj: "",
    phone: "",
    description: "",
    email: "",
    address: "",
    city: "",
    state: "",
    zipCode: ""
  })
  
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [uploadingLogo, setUploadingLogo] = useState(false)

  useEffect(() => {
    if (user) {
      loadUserData()
    }
  }, [user])

  const loadUserData = async () => {
    try {
      setIsLoading(true)
      
      // Buscar perfil do usuário
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single()

      if (profileError) {
        setError('Erro ao carregar perfil do usuário')
        return
      }

      setUserProfile(profile)

      // Se usuário tem entidade, buscar dados da entidade
      if (profile.entity_id) {
        const { data: entity, error: entityError } = await supabase
          .from('entities')
          .select('*')
          .eq('id', profile.entity_id)
          .single()

        if (!entityError) {
          setUserEntity(entity)
          // Preencher formulário de edição com dados atuais
          // Verificar se address é objeto ou string
          const addressValue = typeof entity.address === 'object' && entity.address !== null
            ? entity.address.street || ""
            : entity.address || ""
          
          const cityValue = typeof entity.address === 'object' && entity.address !== null
            ? entity.address.city || entity.city || ""
            : entity.city || ""
          
          const stateValue = typeof entity.address === 'object' && entity.address !== null
            ? entity.address.state || entity.state || ""
            : entity.state || ""
          
          const zipCodeValue = typeof entity.address === 'object' && entity.address !== null
            ? entity.address.zip_code || entity.zip_code || ""
            : entity.zip_code || ""

          setEditForm({
            name: entity.name || "",
            legalName: entity.legal_name || "",
            cnpj: entity.cnpj || "",
            phone: entity.phone || "",
            description: entity.description || "",
            email: entity.email || "",
            address: addressValue,
            city: cityValue,
            state: stateValue,
            zipCode: zipCodeValue
          })
        }
      }

    } catch (err) {
      console.error('Erro ao carregar dados:', err)
      setError('Erro ao carregar dados do usuário')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        setError('Por favor, selecione uma imagem válida')
        return
      }
      
      // Validar tamanho (máx 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setError('A imagem deve ter no máximo 2MB')
        return
      }
      
      setLogoFile(file)
      
      // Criar preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeLogo = () => {
    setLogoFile(null)
    setLogoPreview(null)
  }

  const uploadLogo = async (entityId: string): Promise<string | null> => {
    if (!logoFile) return null
    
    try {
      setUploadingLogo(true)
      
      // Gerar nome único para o arquivo
      const fileExt = logoFile.name.split('.').pop()
      const fileName = `${entityId}/logo-${Date.now()}.${fileExt}`
      
      // Upload para o Supabase Storage
      const { data, error } = await supabase.storage
        .from('entity-logos')
        .upload(fileName, logoFile, {
          cacheControl: '3600',
          upsert: true
        })
      
      if (error) {
        console.error('Erro ao fazer upload do logo:', error)
        return null
      }
      
      // Obter URL pública
      const { data: publicUrlData } = supabase.storage
        .from('entity-logos')
        .getPublicUrl(fileName)
      
      return publicUrlData.publicUrl
    } catch (error) {
      console.error('Erro ao fazer upload do logo:', error)
      return null
    } finally {
      setUploadingLogo(false)
    }
  }

  const handleCreateEntity = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!entityForm.name.trim()) {
      setError('Nome da entidade é obrigatório')
      return
    }

    setIsCreating(true)
    setError("")
    setSuccess("")

    try {
      // Buscar plano padrão
      const { data: plans } = await supabase
        .from('plans')
        .select('id')
        .eq('is_active', true)
        .order('price_monthly', { ascending: true })
        .limit(1)

      const planId = plans?.[0]?.id

      // Criar entidade primeiro sem logo
      const { data: newEntity, error: entityError } = await supabase
        .from('entities')
        .insert([{
          name: entityForm.name,
          legal_name: entityForm.legalName || entityForm.name,
          cnpj: entityForm.cnpj || null,
          email: user?.email,
          phone: entityForm.phone || null,
          description: entityForm.description || null,
          subscription_plan_id: planId,
          max_users: 10,
          admin_user_id: user?.id,
          status: 'active',
          type: 'company'
        }])
        .select()
        .single()

      if (entityError) {
        setError(`Erro ao criar entidade: ${entityError.message}`)
        return
      }

      // Upload do logo se houver
      let logoUrl = null
      if (logoFile) {
        logoUrl = await uploadLogo(newEntity.id)
        
        // Atualizar entidade com URL do logo
        if (logoUrl) {
          await supabase
            .from('entities')
            .update({ logo_url: logoUrl })
            .eq('id', newEntity.id)
        }
      }

      // Atualizar perfil do usuário
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          entity_id: newEntity.id,
          entity_role: 'admin',
          role: 'admin',
          registration_type: 'entity_admin',
          updated_at: new Date().toISOString()
        })
        .eq('id', user?.id)

      if (profileError) {
        setError(`Erro ao atualizar perfil: ${profileError.message}`)
        return
      }

      // Criar assinatura trial
      if (planId) {
        await supabase
          .from('entity_subscriptions')
          .insert([{
            entity_id: newEntity.id,
            plan_id: planId,
            status: 'active',
            is_trial: true,
            current_period_start: new Date().toISOString(),
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          }])
      }

      // Registrar log de criação da entidade
      logSystemAction(
        `Entidade criada: ${newEntity.name}`,
        'entity',
        newEntity.id,
        {
          entity_name: newEntity.name,
          legal_name: newEntity.legal_name,
          cnpj: newEntity.cnpj,
          admin_user: user?.email
        },
        'success'
      )

      setSuccess(`Entidade "${newEntity.name}" criada com sucesso! Você agora é o administrador.`)
      setShowCreateForm(false)
      setEntityForm({ name: "", legalName: "", cnpj: "", phone: "", description: "" })
      setLogoFile(null)
      setLogoPreview(null)
      
      // Recarregar dados
      await loadUserData()

    } catch (err) {
      console.error('Erro ao criar entidade:', err)
      setError('Erro interno do servidor. Tente novamente.')
    } finally {
      setIsCreating(false)
    }
  }

  const handleEditEntity = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!editForm.name.trim()) {
      setError('Nome da entidade é obrigatório')
      return
    }

    if (!userEntity?.id) {
      setError('Entidade não encontrada')
      return
    }

    setIsSaving(true)
    setError("")
    setSuccess("")

    try {
      // Montar objeto address como JSONB
      const addressObject = {
        street: editForm.address || null,
        city: editForm.city || null,
        state: editForm.state || null,
        zip_code: editForm.zipCode || null,
        country: 'Brasil'
      }

      // Upload do logo se houver
      let logoUrl = userEntity.logo_url
      if (logoFile) {
        const uploadedUrl = await uploadLogo(userEntity.id)
        if (uploadedUrl) {
          logoUrl = uploadedUrl
        }
      }

      const { error: updateError } = await supabase
        .from('entities')
        .update({
          name: editForm.name,
          legal_name: editForm.legalName || editForm.name,
          cnpj: editForm.cnpj || null,
          email: editForm.email || null,
          phone: editForm.phone || null,
          description: editForm.description || null,
          address: addressObject,
          logo_url: logoUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', userEntity.id)

      if (updateError) {
        setError(`Erro ao atualizar entidade: ${updateError.message}`)
        return
      }

      // Registrar log de atualização (não bloqueia se falhar)
      try {
        logEntityUpdate(
          editForm.name,
          userEntity.id,
          {
            name: editForm.name,
            legal_name: editForm.legalName,
            cnpj: editForm.cnpj,
            phone: editForm.phone,
            email: editForm.email,
            address: addressObject
          }
        )
      } catch (logError) {
        console.warn('Erro ao registrar log de auditoria:', logError)
      }

      setSuccess('Dados da entidade atualizados com sucesso!')
      setIsEditing(false)
      setLogoFile(null)
      setLogoPreview(null)
      
      // Recarregar dados
      await loadUserData()

    } catch (err) {
      console.error('Erro ao atualizar entidade:', err)
      setError('Erro interno do servidor. Tente novamente.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancelEdit = () => {
    // Restaurar dados originais
    if (userEntity) {
      // Verificar se address é objeto ou string
      const addressValue = typeof userEntity.address === 'object' && userEntity.address !== null
        ? userEntity.address.street || ""
        : userEntity.address || ""
      
      const cityValue = typeof userEntity.address === 'object' && userEntity.address !== null
        ? userEntity.address.city || userEntity.city || ""
        : userEntity.city || ""
      
      const stateValue = typeof userEntity.address === 'object' && userEntity.address !== null
        ? userEntity.address.state || userEntity.state || ""
        : userEntity.state || ""
      
      const zipCodeValue = typeof userEntity.address === 'object' && userEntity.address !== null
        ? userEntity.address.zip_code || userEntity.zip_code || ""
        : userEntity.zip_code || ""

      setEditForm({
        name: userEntity.name || "",
        legalName: userEntity.legal_name || "",
        cnpj: userEntity.cnpj || "",
        phone: userEntity.phone || "",
        description: userEntity.description || "",
        email: userEntity.email || "",
        address: addressValue,
        city: cityValue,
        state: stateValue,
        zipCode: zipCodeValue
      })
    }
    setIsEditing(false)
    setError("")
    setSuccess("")
    setLogoFile(null)
    setLogoPreview(null)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  // Se usuário já tem entidade, mostrar tabs com informações e usuários
  if (userEntity) {
    return (
      <div className="space-y-6">
        {/* Mensagens de feedback */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700">{success}</AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
            <TabsTrigger 
              value="info"
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-transparent hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none [&[data-state=active]]:!bg-blue-600 [&[data-state=active]]:!text-white [&[data-state=active]]:hover:!bg-blue-600 [&[data-state=active]]:focus:!bg-blue-600"
            >
              <Building2 className="h-4 w-4" />
              Informações da Entidade
            </TabsTrigger>
            <TabsTrigger 
              value="users"
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-transparent hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none [&[data-state=active]]:!bg-blue-600 [&[data-state=active]]:!text-white [&[data-state=active]]:hover:!bg-blue-600 [&[data-state=active]]:focus:!bg-blue-600"
            >
              <Users className="h-4 w-4" />
              Gerenciar Usuários
            </TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-4 animate-in fade-in-50 duration-300">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-green-600" />
                      Sua Entidade
                    </CardTitle>
                    <CardDescription>
                      Você é o administrador desta entidade
                    </CardDescription>
                  </div>
                  {!isEditing && (
                    <Button onClick={() => setIsEditing(true)} variant="outline">
                      <Edit className="h-4 w-4 mr-2" />
                      Editar Dados
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {!isEditing ? (
                  <>
                    {/* Logo da Entidade */}
                    {userEntity.logo_url && (
                      <div className="mb-6 pb-6 border-b">
                        <Label className="text-sm font-medium text-gray-500 mb-2 block">Logo da Entidade</Label>
                        <div className="flex items-center gap-4">
                          <div className="h-24 w-24 rounded-lg overflow-hidden border-2 border-gray-200 bg-white flex items-center justify-center">
                            <img
                              src={userEntity.logo_url}
                              alt={userEntity.name}
                              className="h-full w-full object-contain p-2"
                            />
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsEditing(true)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Alterar Logo
                          </Button>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Nome da Entidade</Label>
                          <p className="text-xl font-semibold">{userEntity.name}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Razão Social</Label>
                          <p className="text-lg">{userEntity.legal_name || 'Não informado'}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-500">CNPJ</Label>
                          <p className="text-lg">{userEntity.cnpj || 'Não informado'}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Email</Label>
                          <p className="text-lg">{userEntity.email || 'Não informado'}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Telefone</Label>
                          <p className="text-lg">{userEntity.phone || 'Não informado'}</p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Endereço</Label>
                          <p className="text-lg">
                            {typeof userEntity.address === 'object' && userEntity.address !== null
                              ? userEntity.address.street || 'Não informado'
                              : userEntity.address || 'Não informado'}
                          </p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Cidade</Label>
                          <p className="text-lg">
                            {typeof userEntity.address === 'object' && userEntity.address !== null
                              ? userEntity.address.city || userEntity.city || 'Não informado'
                              : userEntity.city || 'Não informado'}
                          </p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Estado</Label>
                          <p className="text-lg">
                            {typeof userEntity.address === 'object' && userEntity.address !== null
                              ? userEntity.address.state || userEntity.state || 'Não informado'
                              : userEntity.state || 'Não informado'}
                          </p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-500">CEP</Label>
                          <p className="text-lg">
                            {typeof userEntity.address === 'object' && userEntity.address !== null
                              ? userEntity.address.zip_code || userEntity.zip_code || 'Não informado'
                              : userEntity.zip_code || 'Não informado'}
                          </p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Status</Label>
                          <p className="text-lg">
                            <span className="inline-flex items-center gap-1 text-green-600">
                              <CheckCircle className="h-4 w-4" />
                              Ativa
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {userEntity.description && (
                      <div className="mt-4">
                        <Label className="text-sm font-medium text-gray-500">Descrição</Label>
                        <p className="text-lg mt-1">{userEntity.description}</p>
                      </div>
                    )}

                    <div className="mt-4">
                      <Label className="text-sm font-medium text-gray-500">Criada em</Label>
                      <p className="text-lg">
                        {new Date(userEntity.created_at).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </>
                ) : (
                  <form onSubmit={handleEditEntity} className="space-y-6">
                    {/* Upload de Logo */}
                    <div className="pb-6 border-b">
                      <Label>Logo da Entidade</Label>
                      <div className="mt-2">
                        {!logoPreview && !userEntity.logo_url ? (
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary transition-colors">
                            <input
                              type="file"
                              id="logo-upload"
                              className="hidden"
                              accept="image/*"
                              onChange={handleLogoChange}
                              disabled={isSaving}
                            />
                            <label
                              htmlFor="logo-upload"
                              className="cursor-pointer flex flex-col items-center gap-2"
                            >
                              <div className="p-3 bg-gray-100 rounded-full">
                                <ImageIcon className="h-6 w-6 text-gray-600" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-700">
                                  Clique para fazer upload do logo
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  PNG, JPG ou GIF (máx. 2MB)
                                </p>
                              </div>
                            </label>
                          </div>
                        ) : (
                          <div className="flex items-center gap-4">
                            <div className="relative inline-block">
                              <div className="border-2 border-gray-200 rounded-lg p-4 bg-white">
                                <img
                                  src={logoPreview || userEntity.logo_url}
                                  alt="Logo"
                                  className="h-24 w-24 object-contain"
                                />
                              </div>
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                                onClick={removeLogo}
                                disabled={isSaving}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                            {!logoPreview && (
                              <div>
                                <input
                                  type="file"
                                  id="logo-upload-change"
                                  className="hidden"
                                  accept="image/*"
                                  onChange={handleLogoChange}
                                  disabled={isSaving}
                                />
                                <label htmlFor="logo-upload-change">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => document.getElementById('logo-upload-change')?.click()}
                                    disabled={isSaving}
                                  >
                                    <Upload className="h-4 w-4 mr-2" />
                                    Alterar Logo
                                  </Button>
                                </label>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        O logo será exibido na biblioteca pública de documentos
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="edit-name">Nome da Entidade *</Label>
                        <Input
                          id="edit-name"
                          value={editForm.name}
                          onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Nome da entidade"
                          disabled={isSaving}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-legalName">Razão Social</Label>
                        <Input
                          id="edit-legalName"
                          value={editForm.legalName}
                          onChange={(e) => setEditForm(prev => ({ ...prev, legalName: e.target.value }))}
                          placeholder="Razão social completa"
                          disabled={isSaving}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="edit-cnpj">CNPJ</Label>
                        <Input
                          id="edit-cnpj"
                          value={editForm.cnpj}
                          onChange={(e) => setEditForm(prev => ({ ...prev, cnpj: e.target.value }))}
                          placeholder="00.000.000/0000-00"
                          disabled={isSaving}
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-phone">Telefone</Label>
                        <Input
                          id="edit-phone"
                          value={editForm.phone}
                          onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                          placeholder="(11) 99999-9999"
                          disabled={isSaving}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="edit-email">Email</Label>
                      <Input
                        id="edit-email"
                        type="email"
                        value={editForm.email}
                        onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="contato@empresa.com"
                        disabled={isSaving}
                      />
                    </div>

                    <div>
                      <Label htmlFor="edit-address">Endereço</Label>
                      <Input
                        id="edit-address"
                        value={editForm.address}
                        onChange={(e) => setEditForm(prev => ({ ...prev, address: e.target.value }))}
                        placeholder="Rua, número, complemento"
                        disabled={isSaving}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="edit-city">Cidade</Label>
                        <Input
                          id="edit-city"
                          value={editForm.city}
                          onChange={(e) => setEditForm(prev => ({ ...prev, city: e.target.value }))}
                          placeholder="São Paulo"
                          disabled={isSaving}
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-state">Estado</Label>
                        <Input
                          id="edit-state"
                          value={editForm.state}
                          onChange={(e) => setEditForm(prev => ({ ...prev, state: e.target.value }))}
                          placeholder="SP"
                          maxLength={2}
                          disabled={isSaving}
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-zipCode">CEP</Label>
                        <Input
                          id="edit-zipCode"
                          value={editForm.zipCode}
                          onChange={(e) => setEditForm(prev => ({ ...prev, zipCode: e.target.value }))}
                          placeholder="00000-000"
                          disabled={isSaving}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="edit-description">Descrição</Label>
                      <Textarea
                        id="edit-description"
                        value={editForm.description}
                        onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Breve descrição da entidade"
                        rows={3}
                        disabled={isSaving}
                      />
                    </div>

                    <div className="flex gap-3 pt-4 border-t">
                      <Button type="submit" disabled={isSaving}>
                        {isSaving ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Salvando...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Salvar Alterações
                          </>
                        )}
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={handleCancelEdit}
                        disabled={isSaving}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancelar
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="animate-in fade-in-50 duration-300">
            <EntityUserManagement />
          </TabsContent>
        </Tabs>
      </div>
    )
  }

  // Se usuário não tem entidade, mostrar interface de criação
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-end">
        <span className="text-base font-semibold text-foreground">Entidades</span>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Criar Nova Entidade
          </CardTitle>
          <CardDescription>
            Crie sua organização e torne-se o administrador
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!showCreateForm ? (
            <div className="text-center py-8">
              <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Você ainda não possui uma entidade
              </h3>
              <p className="text-gray-600 mb-6">
                Crie sua organização para gerenciar usuários, documentos e configurações de forma centralizada
              </p>
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Entidade
              </Button>
            </div>
          ) : (
            <form onSubmit={handleCreateEntity} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nome da Entidade *</Label>
                  <Input
                    id="name"
                    value={entityForm.name}
                    onChange={(e) => setEntityForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Minha Empresa Ltda"
                    disabled={isCreating}
                  />
                </div>
                <div>
                  <Label htmlFor="legalName">Razão Social</Label>
                  <Input
                    id="legalName"
                    value={entityForm.legalName}
                    onChange={(e) => setEntityForm(prev => ({ ...prev, legalName: e.target.value }))}
                    placeholder="Ex: Minha Empresa Limitada"
                    disabled={isCreating}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input
                    id="cnpj"
                    value={entityForm.cnpj}
                    onChange={(e) => setEntityForm(prev => ({ ...prev, cnpj: e.target.value }))}
                    placeholder="00.000.000/0000-00"
                    disabled={isCreating}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={entityForm.phone}
                    onChange={(e) => setEntityForm(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="(11) 99999-9999"
                    disabled={isCreating}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Descrição</Label>
                <Input
                  id="description"
                  value={entityForm.description}
                  onChange={(e) => setEntityForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Breve descrição da entidade"
                  disabled={isCreating}
                />
              </div>

              {/* Upload de Logo */}
              <div>
                <Label>Logo da Entidade</Label>
                <div className="mt-2">
                  {!logoPreview ? (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary transition-colors">
                      <input
                        type="file"
                        id="logo-upload"
                        className="hidden"
                        accept="image/*"
                        onChange={handleLogoChange}
                        disabled={isCreating}
                      />
                      <label
                        htmlFor="logo-upload"
                        className="cursor-pointer flex flex-col items-center gap-2"
                      >
                        <div className="p-3 bg-gray-100 rounded-full">
                          <ImageIcon className="h-6 w-6 text-gray-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">
                            Clique para fazer upload do logo
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            PNG, JPG ou GIF (máx. 2MB)
                          </p>
                        </div>
                      </label>
                    </div>
                  ) : (
                    <div className="relative inline-block">
                      <div className="border-2 border-gray-200 rounded-lg p-4 bg-white">
                        <img
                          src={logoPreview}
                          alt="Preview do logo"
                          className="h-32 w-32 object-contain"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                        onClick={removeLogo}
                        disabled={isCreating}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  O logo será exibido na biblioteca pública de documentos
                </p>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-700">{success}</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={isCreating}>
                  {isCreating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    <>
                      <Building2 className="h-4 w-4 mr-2" />
                      Criar Entidade
                    </>
                  )}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowCreateForm(false)}
                  disabled={isCreating}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}