# 📄 TrackDoc - Sistema de Gestão e Assinatura Digital de Documentos

Um sistema completo para gestão, assinatura digital e rastreamento de documentos, desenvolvido com Next.js e Supabase.

## 🚀 Funcionalidades

### 🔐 Sistema de Autenticação
- Login/logout seguro com Supabase Auth
- Registro de usuários individuais e empresariais
- Sistema de convites por email para entidades
- Gestão de perfis e permissões

### 🏢 Gestão de Entidades
- Criação e administração de empresas/organizações
- Sistema de convites com tokens únicos
- Controle de usuários por entidade
- Roles diferenciados (admin, manager, user, viewer)

### 📋 Gestão de Documentos
- Upload de documentos (PDF, imagens)
- Assinatura digital com canvas interativo
- Geração automática de QR codes
- Download de documentos assinados
- Histórico completo de assinaturas

### 💼 Sistema de Planos
- Planos individuais e empresariais
- Controle de limites por plano
- Gestão de assinaturas

## 🛠️ Tecnologias Utilizadas

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, Radix UI
- **Backend**: Supabase (Auth, Database, Storage)
- **Database**: PostgreSQL com Row Level Security
- **Deployment**: Vercel (recomendado)

## 📦 Instalação

### Pré-requisitos
- Node.js 18+ 
- npm ou yarn
- Conta no Supabase

### 1. Clone o repositório
```bash
git clone https://github.com/seu-usuario/trackdoc.git
cd trackdoc
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Configure as variáveis de ambiente
Copie o arquivo de exemplo e configure suas variáveis:
```bash
cp .env.production.example .env.local
```

Edite o `.env.local` com suas configurações do Supabase:
```env
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key
```

### 4. Configure o banco de dados
Execute as migrações SQL no Supabase Dashboard:
- Acesse o SQL Editor no seu projeto Supabase
- Execute os arquivos em `supabase/migrations/` em ordem cronológica

### 5. Execute o projeto
```bash
npm run dev
```

O projeto estará disponível em `http://localhost:3000`

## 🏗️ Estrutura do Projeto

```
trackdoc/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   ├── components/        # Componentes de página
│   └── (auth)/           # Rotas de autenticação
├── components/            # Componentes reutilizáveis
│   └── ui/               # Componentes base (Radix UI)
├── lib/                   # Utilitários e configurações
│   ├── contexts/         # Contextos React
│   └── utils/            # Funções utilitárias
├── supabase/             # Configurações Supabase
│   ├── functions/        # Edge Functions
│   └── migrations/       # Migrações SQL
├── scripts/              # Scripts de desenvolvimento
├── public/               # Arquivos estáticos
└── docs/                 # Documentação
```

## 🔧 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev                 # Servidor de desenvolvimento
npm run dev:windows        # Desenvolvimento otimizado para Windows
npm run dev:ultra-fast     # Desenvolvimento com otimizações máximas

# Produção
npm run build              # Build para produção
npm run start              # Servidor de produção
npm run prepare-production # Preparar para deploy

# Utilitários
npm run lint               # Verificar código
npm run type-check         # Verificar tipos TypeScript
npm run cleanup-auth       # Limpar dados de autenticação
```

## 🗄️ Banco de Dados

### Tabelas Principais
- `profiles` - Perfis de usuários
- `entities` - Empresas/organizações  
- `entity_invitations` - Convites para entidades
- `signed_documents` - Documentos assinados
- `plans` - Planos de assinatura

### Segurança
- Row Level Security (RLS) habilitado em todas as tabelas
- Políticas de acesso baseadas em roles
- Isolamento de dados por entidade
- Autenticação JWT via Supabase Auth

## 🚀 Deploy

### Vercel (Recomendado)
1. Conecte seu repositório ao Vercel
2. Configure as variáveis de ambiente
3. Deploy automático a cada push

### Outras Plataformas
O projeto é compatível com qualquer plataforma que suporte Next.js:
- Netlify
- Railway
- Render
- AWS Amplify

## 🔐 Configuração de Segurança

### Variáveis de Ambiente Obrigatórias
```env
NEXT_PUBLIC_SUPABASE_URL=          # URL do projeto Supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=     # Chave pública (anon)
SUPABASE_SERVICE_ROLE_KEY=         # Chave privada (service_role)
```

### Configurações Opcionais
```env
NEXT_PUBLIC_ENABLE_PROXY=auto      # Proxy para desenvolvimento
```

## 📚 Documentação Adicional

- [Configuração de Entidades](docs/SETUP_ENTITIES_SYSTEM.md)
- [Guia de Deploy](docs/DEPLOYMENT.md)
- [Desenvolvimento Local](docs/MODO-LOCAL.md)

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🆘 Suporte

Se você encontrar algum problema ou tiver dúvidas:

1. Verifique a [documentação](docs/)
2. Procure em [Issues existentes](https://github.com/seu-usuario/trackdoc/issues)
3. Crie uma nova [Issue](https://github.com/seu-usuario/trackdoc/issues/new)

## 🎯 Roadmap

- [ ] Integração com APIs de assinatura externa
- [ ] Notificações push
- [ ] App mobile
- [ ] Integração com sistemas ERP
- [ ] Assinatura em lote
- [ ] Templates de documentos

---

Desenvolvido com ❤️ usando Next.js e Supabase