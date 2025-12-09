# 🔐 Acesso ao Painel de Administração

## 📍 Link de Acesso

```
https://seu-dominio.com.br/super-admin
```

**Importante:** Esta página não possui links de navegação em nenhum local do sistema. O acesso é feito diretamente pela URL.

## 🔑 Requisitos de Acesso

Para acessar o painel de administração, o usuário deve:

1. Estar autenticado no sistema
2. Ter `role = 'super_admin'` na tabela `profiles`

## 🛠️ Como Criar um Super Admin

Execute o seguinte SQL no Supabase SQL Editor:

```sql
-- Atualizar um usuário existente para super_admin
UPDATE profiles 
SET role = 'super_admin'
WHERE email = 'seu-email@dominio.com';

-- Verificar
SELECT id, email, full_name, role 
FROM profiles 
WHERE role = 'super_admin';
```

## 📋 Funcionalidades do Painel

### 1. Visão Geral
- Total de usuários no sistema
- Usuários ativos
- Total de entidades
- Total de documentos
- Gráficos de distribuição por plano

### 2. Gerenciamento de Usuários
- **Criar novo usuário** com seleção de plano
- **Alterar plano** de usuários existentes
- **Alterar status** (ativo, inativo, suspenso)
- **Visualizar estatísticas de uso**:
  - Quantidade de documentos
  - Armazenamento usado
  - Percentual de uso do plano

### 3. Visualização de Entidades
- Lista de todas as empresas cadastradas
- Status de cada entidade
- Informações de CNPJ

### 4. Gerenciamento de Planos
- Visualização dos 3 planos disponíveis
- Limites de cada plano
- Quantidade de usuários por plano

## 👤 Criação de Usuários

### Campos Obrigatórios
- Email
- Nome Completo
- Senha (mínimo 6 caracteres)
- Plano

### Campos Opcionais
- Telefone
- Empresa
- Função (user, admin, manager)

### Processo
1. Acesse `/super-admin`
2. Vá para aba "Usuários"
3. Clique em "Novo Usuário"
4. Preencha os dados
5. Selecione o plano (mostra funcionalidades incluídas)
6. Clique em "Criar Usuário"

O sistema automaticamente:
- Cria a conta no Supabase Auth
- Cria o perfil na tabela `profiles`
- Cria a subscription com o plano selecionado
- Define validade de 1 ano

## 📊 Estatísticas de Uso

Para cada usuário, o painel mostra:
- **Documentos**: Quantidade total de documentos criados
- **Armazenamento**: GB usado e percentual do limite
- **Alertas**: Badge vermelho quando uso > 80%

## 🔒 Segurança

- Apenas super_admins podem acessar
- Tentativas de acesso não autorizado são bloqueadas
- Todas as operações são registradas no banco
- Senhas são hasheadas automaticamente

## 🚫 Página de Registro Removida

A página `/register` foi **removida** do sistema. Agora:
- Apenas administradores criam contas
- Não há registro público
- Apenas a página `/login` está disponível publicamente

## 📞 Fluxo de Contratação

1. Cliente entra em contato (email/WhatsApp)
2. Administrador acessa `/super-admin`
3. Cria conta com plano escolhido
4. Cliente recebe credenciais por email
5. Faturamento separado (boleto/PIX/transferência)

## 🎯 Controle de Acesso por Planos

O sistema implementa controle automático de:

### Funcionalidades
- Dashboard gerencial
- Upload de documentos
- Biblioteca pública
- Assinatura eletrônica (simples/múltipla)
- Chat nativo
- Auditoria completa
- Backup automático
- Suporte dedicado

### Limites
- Quantidade de usuários
- Armazenamento (GB)
- Quantidade de documentos

Veja documentação completa em: `docs/CONTROLE_ACESSO_PLANOS.md`

## 🔄 Alteração de Planos

Para alterar o plano de um usuário:
1. Localize o usuário na lista
2. Clique no seletor de plano
3. Escolha o novo plano
4. Alteração é aplicada imediatamente

O sistema automaticamente:
- Atualiza a subscription
- Aplica novos limites
- Habilita/desabilita funcionalidades

## 📝 Notas Importantes

- O painel é **responsivo** e funciona em mobile
- Use os **filtros** para encontrar usuários rapidamente
- O botão **Atualizar** recarrega todos os dados
- Estatísticas são calculadas em tempo real

## 🆘 Troubleshooting

### Não consigo acessar o painel
- Verifique se está autenticado
- Confirme que seu `role` é `super_admin`
- Limpe o cache do navegador

### Erro ao criar usuário
- Verifique se o email já não está cadastrado
- Confirme que a senha tem pelo menos 6 caracteres
- Verifique se selecionou um plano

### Estatísticas não aparecem
- Clique no botão "Atualizar"
- Verifique se há documentos no sistema
- Aguarde alguns segundos para o carregamento

## 📚 Documentação Relacionada

- Sistema de Administração: `docs/SISTEMA_ADMINISTRACAO.md`
- Controle de Acesso: `docs/CONTROLE_ACESSO_PLANOS.md`
- Migração do Banco: `migrations/remove_stripe_columns.sql`
