# Guia de Testes - Funcionalidade Office

## 🧪 Plano de Testes

Este documento descreve como testar a funcionalidade Office após a implementação.

## ✅ Checklist de Testes

### 1. Testes de Interface

#### 1.1 Menu e Navegação
- [ ] Item "Office" aparece no menu lateral
- [ ] Item está posicionado entre "Assinatura Eletrônica" e "Aprovações"
- [ ] Ícone correto (Edit/Lápis) é exibido
- [ ] Clique no item abre a página Office
- [ ] URL permanece consistente (view interna)

#### 1.2 Página Principal
- [ ] Título "Editor de Documentos" é exibido
- [ ] Subtítulo explicativo está presente
- [ ] Botão "Criar Novo Documento" está visível
- [ ] Botão "Enviar Documento" está visível
- [ ] Barra de busca está funcional
- [ ] Layout responsivo em mobile

### 2. Testes de Funcionalidade

#### 2.1 Upload de Documentos
- [ ] Clicar em "Enviar Documento" abre seletor de arquivo
- [ ] Aceita arquivos .docx
- [ ] Aceita arquivos .doc
- [ ] Aceita arquivos .odt
- [ ] Rejeita arquivos .pdf
- [ ] Rejeita arquivos .txt
- [ ] Rejeita arquivos .jpg
- [ ] Mostra loading durante upload
- [ ] Exibe toast de sucesso após upload
- [ ] Documento aparece na lista após upload
- [ ] Arquivo é salvo no Supabase Storage
- [ ] Registro é criado no banco de dados

#### 2.2 Listagem de Documentos
- [ ] Documentos são carregados ao abrir a página
- [ ] Loading spinner é exibido durante carregamento
- [ ] Cards de documentos mostram título
- [ ] Cards mostram data de atualização
- [ ] Cards mostram ícone de documento
- [ ] Botões de ação estão presentes (Editar, Download, Excluir)
- [ ] Mensagem "Nenhum documento" quando lista vazia
- [ ] Paginação funciona (se implementada)

#### 2.3 Busca de Documentos
- [ ] Digitar na busca filtra documentos
- [ ] Busca é case-insensitive
- [ ] Busca funciona em tempo real
- [ ] Limpar busca mostra todos documentos
- [ ] Mensagem apropriada quando nenhum resultado

#### 2.4 Download de Documentos
- [ ] Clicar em Download inicia download
- [ ] Arquivo baixado tem nome correto
- [ ] Arquivo baixado tem extensão correta
- [ ] Arquivo baixado pode ser aberto no Word
- [ ] Conteúdo do arquivo está correto

#### 2.5 Exclusão de Documentos
- [ ] Clicar em Excluir mostra confirmação
- [ ] Confirmar exclusão remove documento
- [ ] Cancelar exclusão mantém documento
- [ ] Toast de sucesso após exclusão
- [ ] Documento some da lista
- [ ] Registro é removido do banco
- [ ] Arquivo é removido do storage (opcional)

#### 2.6 Criação de Documentos
- [ ] Clicar em "Criar Novo" abre editor
- [ ] Campo de título está presente
- [ ] Placeholder do editor é exibido (sem OnlyOffice)
- [ ] Instruções de configuração são mostradas
- [ ] Botão "Voltar" retorna à lista
- [ ] Botão "Salvar" está presente

#### 2.7 Edição de Documentos
- [ ] Clicar em "Editar" abre editor
- [ ] Título do documento é carregado
- [ ] Campo de título é editável
- [ ] Placeholder do editor é exibido (sem OnlyOffice)
- [ ] Botão "Voltar" retorna à lista
- [ ] Botão "Salvar" atualiza documento

### 3. Testes de Segurança

#### 3.1 Autenticação
- [ ] Página requer login
- [ ] Usuário não autenticado é redirecionado
- [ ] Token de sessão é validado
- [ ] Logout limpa acesso

#### 3.2 Autorização
- [ ] Usuário só vê seus próprios documentos
- [ ] Usuário não pode acessar documentos de outros
- [ ] Tentativa de acesso direto é bloqueada
- [ ] RLS do Supabase está ativo

#### 3.3 Validações
- [ ] Upload valida tipo de arquivo
- [ ] Upload valida tamanho de arquivo
- [ ] Título não pode ser vazio
- [ ] Caracteres especiais são tratados
- [ ] SQL injection é prevenido
- [ ] XSS é prevenido

### 4. Testes de Performance

#### 4.1 Carregamento
- [ ] Página carrega em < 2 segundos
- [ ] Lista de documentos carrega em < 1 segundo
- [ ] Upload de 1MB completa em < 5 segundos
- [ ] Download inicia imediatamente

#### 4.2 Responsividade
- [ ] Interface funciona em mobile (< 768px)
- [ ] Interface funciona em tablet (768px - 1024px)
- [ ] Interface funciona em desktop (> 1024px)
- [ ] Botões são clicáveis em touch screens
- [ ] Texto é legível em todas as resoluções

### 5. Testes de Integração

#### 5.1 Supabase Storage
- [ ] Arquivos são salvos no bucket correto
- [ ] Path do arquivo segue padrão {user_id}/{timestamp}_{filename}
- [ ] URLs assinadas são geradas corretamente
- [ ] URLs assinadas expiram após tempo configurado

#### 5.2 Supabase Database
- [ ] Registros são criados na tabela office_documents
- [ ] user_id é preenchido corretamente
- [ ] entity_id é preenchido corretamente
- [ ] Timestamps são atualizados automaticamente
- [ ] Trigger de updated_at funciona

#### 5.3 OnlyOffice (quando configurado)
- [ ] Editor carrega corretamente
- [ ] Documento é exibido no editor
- [ ] Edições são salvas
- [ ] Formatação é preservada
- [ ] Callback funciona

### 6. Testes de Erro

#### 6.1 Erros de Rede
- [ ] Erro de upload mostra mensagem apropriada
- [ ] Erro de download mostra mensagem apropriada
- [ ] Erro de listagem mostra mensagem apropriada
- [ ] Retry é possível após erro

#### 6.2 Erros de Validação
- [ ] Arquivo inválido mostra erro claro
- [ ] Arquivo muito grande mostra erro claro
- [ ] Título vazio mostra erro claro

#### 6.3 Erros de Servidor
- [ ] Erro 500 é tratado graciosamente
- [ ] Erro 404 é tratado graciosamente
- [ ] Erro 403 é tratado graciosamente
- [ ] Mensagens de erro são user-friendly

## 🔍 Testes Manuais Detalhados

### Teste 1: Upload Completo

1. Faça login na plataforma
2. Navegue para Office
3. Clique em "Enviar Documento"
4. Selecione um arquivo .docx
5. Aguarde o upload
6. Verifique se o documento aparece na lista
7. Verifique no Supabase Storage se o arquivo foi salvo
8. Verifique no banco se o registro foi criado

**Resultado esperado:** Documento aparece na lista e está salvo no storage.

### Teste 2: Edição de Título

1. Na lista de documentos, clique em "Editar"
2. Altere o título do documento
3. Clique em "Salvar"
4. Volte para a lista
5. Verifique se o título foi atualizado

**Resultado esperado:** Título é atualizado na lista e no banco.

### Teste 3: Download e Verificação

1. Na lista, clique no botão de Download
2. Aguarde o download
3. Abra o arquivo no Word/LibreOffice
4. Verifique se o conteúdo está correto

**Resultado esperado:** Arquivo baixado abre corretamente.

### Teste 4: Exclusão

1. Na lista, clique no botão de Excluir
2. Confirme a exclusão
3. Verifique se o documento sumiu da lista
4. Verifique no banco se o registro foi removido

**Resultado esperado:** Documento é removido da lista e do banco.

### Teste 5: Busca

1. Digite parte do nome de um documento na busca
2. Verifique se apenas documentos correspondentes aparecem
3. Limpe a busca
4. Verifique se todos os documentos voltam

**Resultado esperado:** Busca filtra corretamente.

## 🤖 Testes Automatizados (Futuro)

### Unit Tests
```typescript
// Exemplo de teste
describe('OfficePage', () => {
  it('should load documents on mount', async () => {
    // Test implementation
  })
  
  it('should filter documents by search term', () => {
    // Test implementation
  })
})
```

### Integration Tests
```typescript
describe('Document Upload', () => {
  it('should upload and save document', async () => {
    // Test implementation
  })
})
```

### E2E Tests
```typescript
describe('Office Workflow', () => {
  it('should complete full document lifecycle', async () => {
    // Test implementation
  })
})
```

## 📊 Relatório de Testes

Após executar os testes, preencha:

### Resumo
- **Data:** ___/___/______
- **Testador:** _______________
- **Ambiente:** [ ] Dev [ ] Staging [ ] Prod
- **Navegador:** _______________
- **Versão:** _______________

### Resultados
- **Total de testes:** ___
- **Passou:** ___
- **Falhou:** ___
- **Bloqueado:** ___

### Bugs Encontrados
1. _______________
2. _______________
3. _______________

### Observações
_______________________________________________
_______________________________________________
_______________________________________________

## 🚀 Critérios de Aceitação

Para considerar a funcionalidade pronta para produção:

- [ ] Todos os testes de interface passam
- [ ] Todos os testes de funcionalidade passam
- [ ] Todos os testes de segurança passam
- [ ] Performance está dentro dos limites
- [ ] Nenhum bug crítico encontrado
- [ ] Documentação está completa
- [ ] Code review aprovado

## 📞 Reportar Problemas

Se encontrar bugs durante os testes:

1. Documente o problema claramente
2. Inclua passos para reproduzir
3. Adicione screenshots/vídeos
4. Informe ambiente e navegador
5. Reporte para a equipe de desenvolvimento

---

**Boa sorte com os testes! 🎉**
