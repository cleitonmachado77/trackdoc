# Guia Rápido - Página Office

## 🚀 Início Rápido (5 minutos)

### Passo 1: Acessar a Página Office
1. Faça login na plataforma
2. No menu lateral, clique em **Office** (ícone de lápis)

### Passo 2: Usar sem OnlyOffice (Modo Básico)
Você pode usar a funcionalidade básica sem configurar o OnlyOffice:
- ✅ Upload de documentos Word
- ✅ Download de documentos
- ✅ Gerenciamento de documentos
- ✅ Busca e organização
- ❌ Edição online (requer OnlyOffice)

### Passo 3: Configurar OnlyOffice (Opcional - Para Edição)

#### Opção A: Docker (Recomendado)
```bash
# 1. Instalar Docker (se não tiver)
# Windows/Mac: https://www.docker.com/products/docker-desktop

# 2. Executar OnlyOffice
docker run -i -t -d -p 80:80 -e JWT_ENABLED=false onlyoffice/documentserver

# 3. Adicionar ao .env.local
echo "NEXT_PUBLIC_ONLYOFFICE_URL=http://localhost" >> .env.local

# 4. Reiniciar a aplicação
npm run dev
```

#### Opção B: OnlyOffice Cloud (Pago)
1. Crie uma conta em [OnlyOffice Cloud](https://www.onlyoffice.com/pt/office-for-saas.aspx)
2. Obtenha a URL do seu servidor
3. Configure no `.env.local`:
```env
NEXT_PUBLIC_ONLYOFFICE_URL=https://seu-servidor.onlyoffice.com
```

## 📝 Como Usar

### Criar Novo Documento
1. Clique em **"Criar Novo Documento"**
2. Digite o nome do documento
3. Comece a editar (requer OnlyOffice configurado)
4. Clique em **"Salvar"**

### Enviar Documento Existente
1. Clique em **"Enviar Documento"**
2. Selecione um arquivo Word (.doc, .docx, .odt)
3. O documento será enviado e ficará disponível para edição

### Editar Documento
1. Na lista de documentos, clique em **"Editar"**
2. O editor será aberto (requer OnlyOffice configurado)
3. Faça suas alterações
4. Clique em **"Salvar"**

### Baixar Documento
1. Na lista de documentos, clique no ícone de **Download**
2. O arquivo será baixado para seu computador

### Excluir Documento
1. Na lista de documentos, clique no ícone de **Lixeira**
2. Confirme a exclusão

## 🔍 Buscar Documentos
Use a barra de busca para encontrar documentos por nome.

## ⚠️ Limitações Atuais

### Sem OnlyOffice Configurado:
- Não é possível editar documentos online
- Não é possível criar documentos do zero
- Upload e download funcionam normalmente

### Com OnlyOffice Configurado:
- ✅ Todas as funcionalidades disponíveis
- ✅ Edição completa de documentos
- ✅ Formatação avançada
- ✅ Inserir tabelas, imagens, etc.

## 🆘 Problemas Comuns

### "Editor não disponível"
**Solução:** Configure o OnlyOffice Document Server seguindo o Passo 3 acima.

### "Erro ao fazer upload"
**Possíveis causas:**
- Arquivo muito grande (limite: 50MB)
- Tipo de arquivo não suportado (use .doc, .docx ou .odt)
- Problemas de conexão

**Solução:** Verifique o tamanho e tipo do arquivo.

### "Documento não salva"
**Possíveis causas:**
- OnlyOffice não configurado corretamente
- Problemas de conexão com o banco de dados

**Solução:** 
1. Verifique se o OnlyOffice está rodando: `docker ps`
2. Verifique a variável de ambiente
3. Verifique o console do navegador para erros

## 📚 Documentação Completa

Para configuração avançada e troubleshooting, consulte:
- [Configuração Completa do OnlyOffice](./ONLYOFFICE_SETUP.md)
- [README da Página Office](../app/office/README.md)

## 💡 Dicas

1. **Salve frequentemente**: Embora o OnlyOffice tenha salvamento automático, é bom salvar manualmente
2. **Nomes descritivos**: Use nomes claros para seus documentos
3. **Organize**: Use a busca para encontrar documentos rapidamente
4. **Backup**: Faça download de documentos importantes regularmente

## 🎯 Próximos Passos

Depois de dominar o básico:
1. Explore as opções de formatação do editor
2. Experimente inserir tabelas e imagens
3. Configure o OnlyOffice para produção com JWT
4. Integre com workflows de aprovação

## 📞 Suporte

Precisa de ajuda? Entre em contato com a equipe de desenvolvimento.
