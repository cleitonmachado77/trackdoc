# TrackDoc - Sistema de Gestão Documental

Sistema completo de gestão de documentos com fluxo de aprovação, assinatura eletrônica, versionamento e muito mais.

## 🚀 Funcionalidades Principais

### 📄 Gestão de Documentos
- Upload e armazenamento seguro de documentos
- Versionamento automático com histórico completo
- Categorização e tags personalizadas
- Busca avançada e filtros
- Preview de documentos (PDF, imagens, etc.)
- Download seguro com controle de acesso

### ✅ Fluxo de Aprovação
- Criação de fluxos de aprovação customizados
- Múltiplos níveis de aprovação
- Notificações automáticas
- Comentários e feedback em cada etapa
- Histórico completo de aprovações

### ✍️ Assinatura Eletrônica
- Assinatura digital com certificado
- Assinatura múltipla (vários signatários)
- QR Code de verificação
- Histórico de assinaturas
- Documentos assinados com validade jurídica

### 💬 Sistema de Chat
- Mensagens diretas entre usuários
- Grupos de discussão
- Compartilhamento de arquivos
- Notificações em tempo real
- Histórico de conversas

### 🏢 Gestão de Entidades
- Multi-tenancy (múltiplas organizações)
- Departamentos e hierarquias
- Gestão de usuários e permissões
- Convites para novos membros
- Dashboard com estatísticas

### 🔔 Notificações
- Notificações em tempo real
- Email notifications
- Central de notificações
- Contador de não lidas
- Priorização de alertas

### 🔐 Segurança
- Autenticação com Supabase Auth
- Row Level Security (RLS)
- Controle granular de permissões
- Audit log completo
- Criptografia de dados sensíveis

## 🛠️ Tecnologias Utilizadas

### Frontend
- **Next.js 14** - Framework React com SSR
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização
- **Radix UI** - Componentes acessíveis
- **Lucide Icons** - Ícones modernos
- **React Hook Form** - Formulários
- **Zod** - Validação de dados

### Backend
- **Next.js API Routes** - APIs serverless
- **Supabase** - Backend as a Service
  - PostgreSQL Database
  - Authentication
  - Storage
  - Realtime
  - Row Level Security

### Bibliotecas Especializadas
- **pdf-lib** - Manipulação de PDFs
- **fabric.js** - Canvas para assinaturas
- **qrcode** - Geração de QR Codes
- **crypto-js** - Criptografia
- **date-fns** - Manipulação de datas

## 📦 Instalação

### Pré-requisitos
- Node.js 18+ 
- npm ou yarn
- Conta no Supabase

### Passo 1: Clone o repositório
```bash
git clone https://github.com/seu-usuario/trackdoc.git
cd trackdoc
```

### Passo 2: Instale as dependências
```bash
npm install
```

### Passo 3: Configure as variáveis de ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima
SUPABASE_SERVICE_ROLE_KEY=sua_chave_de_servico

# Next.js
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Passo 4: Configure o banco de dados

Execute os scripts SQL no Supabase SQL Editor na seguinte ordem:

1. `database/performance-indexes.sql` - Índices de performance
2. Outros scripts de configuração (se necessário)

### Passo 5: Execute em desenvolvimento
```bash
npm run dev
```

Acesse: http://localhost:3000

## 🚀 Deploy em Produção

### Vercel (Recomendado)

1. Faça push do código para GitHub
2. Conecte seu repositório no Vercel
3. Configure as variáveis de ambiente
4. Deploy automático!

```bash
npm run build
npm run start
```

### Outras Plataformas

O projeto é compatível com:
- Netlify
- AWS Amplify
- Digital Ocean App Platform
- Railway
- Render

## 📊 Performance

### Otimizações Implementadas

✅ **Queries Otimizadas**
- SELECT específico de campos
- Índices no banco de dados
- Redução de 70% no tráfego

✅ **Sistema de Cache**
- Cache em memória com TTL
- Invalidação inteligente
- Limpeza automática

✅ **Code Splitting**
- Chunks separados por funcionalidade
- Lazy loading de componentes
- Bundle otimizado (~280KB gzipped)

✅ **Assets Otimizados**
- Compressão automática
- Cache headers corretos
- CDN ready

Veja detalhes completos em: [OTIMIZACAO_PERFORMANCE.md](./OTIMIZACAO_PERFORMANCE.md)

## 📚 Documentação

### Estrutura do Projeto

```
trackdoc/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   ├── admin/             # Painel administrativo
│   ├── chat/              # Sistema de chat
│   ├── components/        # Componentes da app
│   └── ...                # Outras páginas
├── components/            # Componentes reutilizáveis
│   └── ui/               # Componentes de UI
├── hooks/                # Custom React Hooks
├── lib/                  # Utilitários e configurações
├── database/             # Scripts SQL
├── public/               # Assets estáticos
└── scripts/              # Scripts auxiliares
```

### Principais Hooks

- `useAuth()` - Autenticação e usuário atual
- `useDocuments()` - Gestão de documentos
- `useApprovals()` - Fluxo de aprovação
- `useChat()` - Sistema de chat
- `useNotifications()` - Notificações
- `useEntities()` - Gestão de entidades

### Principais APIs

- `/api/profile` - Perfil do usuário
- `/api/approvals` - Aprovações
- `/api/chat/*` - Chat e mensagens
- `/api/arsign` - Assinatura eletrônica
- `/api/signed-documents` - Documentos assinados

## 🔒 Segurança

### Práticas Implementadas

- ✅ Row Level Security (RLS) no Supabase
- ✅ Validação de inputs com Zod
- ✅ Sanitização de dados
- ✅ CORS configurado
- ✅ Rate limiting (considerar implementar)
- ✅ Audit log de ações críticas

### Permissões

O sistema possui 3 níveis de permissão:
- **User**: Acesso básico
- **Manager**: Gestão de departamento
- **Admin**: Acesso total

## 🧪 Testes

```bash
# Testes unitários (a implementar)
npm run test

# Verificação de tipos
npm run type-check

# Linting
npm run lint
npm run lint:fix
```

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👥 Autores

- **Seu Nome** - Desenvolvimento inicial

## 🙏 Agradecimentos

- Supabase pela excelente plataforma
- Next.js pela framework incrível
- Radix UI pelos componentes acessíveis
- Comunidade open source

## 📞 Suporte

Para suporte, envie um email para: suporte@trackdoc.com
Ou abra uma issue no GitHub.

## 🗺️ Roadmap

### Em Desenvolvimento
- [ ] Integração com cloud storage (S3, Google Drive)
- [ ] OCR para extração de texto de documentos
- [ ] Templates de documentos
- [ ] Workflows customizáveis
- [ ] API pública com documentação
- [ ] App mobile (React Native)

### Planejado
- [ ] Integração com e-signature providers (DocuSign, etc.)
- [ ] IA para classificação de documentos
- [ ] Relatórios avançados e analytics
- [ ] Integração com ERPs
- [ ] Modo offline
- [ ] Temas customizáveis

## 📸 Screenshots

[Adicione screenshots do sistema aqui]

## 🌟 Recursos Destacados

### Assinatura Múltipla
Sistema completo de assinatura com múltiplos signatários, ordem de assinatura, e validação via QR Code.

### Versionamento Inteligente
Cada documento mantém histórico completo de versões, permitindo comparação e restauração.

### Chat Integrado
Comunicação direta entre membros da equipe sem sair do sistema.

### Dashboard Completo
Visão geral com métricas, gráficos e atalhos rápidos.

---

Desenvolvido com ❤️ usando Next.js e Supabase
