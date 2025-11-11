# Guia de Teste - Assinatura Múltipla com Nova Página de Resumo

## Pré-requisitos

1. Sistema rodando localmente ou em produção
2. Pelo menos 2 usuários cadastrados na mesma entidade
3. Um documento PDF para teste

## Passo a Passo

### 1. Acessar a Página de Assinatura Eletrônica

```
URL: /assinatura-eletronica
ou através do menu lateral: "Assinatura Digital"
```

### 2. Selecionar a Aba "Assinatura Múltipla"

- Clique na aba "Assinatura Múltipla"
- Você verá o formulário de upload e seleção de usuários

### 3. Fazer Upload do Documento

- Clique em "Escolher Arquivo PDF" ou arraste um PDF
- Aguarde o arquivo ser selecionado

### 4. Selecionar Signatários

- No campo "Usuários para Assinatura", selecione 2 ou mais usuários
- Você pode selecionar quantos usuários desejar

### 5. Enviar para Assinatura

- Clique em "Enviar para Assinatura Múltipla"
- Aguarde a confirmação de sucesso
- Cada usuário selecionado receberá uma notificação

### 6. Aprovar como Cada Usuário

Para cada usuário selecionado:

1. **Fazer login** com o usuário
2. Acessar a página de **Assinatura Digital**
3. Na aba **"Assinatura Múltipla"**, verificar a seção **"Aprovações Pendentes"**
4. Clicar em **"Aprovar"** no documento
5. Confirmar a aprovação

### 7. Verificar Finalização Automática

- Após a última aprovação, o sistema automaticamente:
  - Gera o PDF final com todas as assinaturas
  - Adiciona a barra lateral em todas as páginas
  - **Cria a nova página de resumo no final**
  - Salva o documento no storage

### 8. Baixar e Verificar o Documento

1. Na aba **"Assinatura Múltipla"**, seção **"Histórico de Assinaturas Múltiplas"**
2. Localize o documento recém-assinado
3. Clique no ícone de **visualizar** (olho)
4. O PDF será aberto em nova aba

### 9. Verificar as Melhorias Implementadas

#### Na Barra Lateral (todas as páginas):
- ✅ Título "ASSINATURAS"
- ✅ Para cada assinatura:
  - Número + Código de verificação
  - Hash (primeiros 12 caracteres)
- ✅ **SEM nomes de usuários**

#### Na Última Página (Nova Página de Resumo):
- ✅ Logo "TrackDock" no topo
- ✅ Título "CERTIFICADO DE ASSINATURA MÚLTIPLA"
- ✅ Total de assinaturas
- ✅ Data e hora de geração
- ✅ Lista de signatários com:
  - Número sequencial
  - Nome completo
  - Email
  - Data/hora da assinatura
  - Código de verificação (em azul)
  - Hash da assinatura
  - Hash do documento
- ✅ Rodapé informativo
- ✅ Barra lateral com códigos e hashes

### 10. Testar Verificação de Assinatura

1. Copie um dos **códigos de verificação** da página de resumo
2. Acesse a aba **"Verificar Assinatura"**
3. Cole o código e clique em **"Verificar"**
4. Verifique se as informações são exibidas corretamente

## Cenários de Teste

### Teste 1: Assinatura com 2 Usuários
- Objetivo: Verificar funcionamento básico
- Resultado esperado: Página de resumo com 2 signatários

### Teste 2: Assinatura com 5+ Usuários
- Objetivo: Verificar paginação automática
- Resultado esperado: Se necessário, múltiplas páginas de resumo

### Teste 3: Comparar com Assinatura Simples
- Objetivo: Garantir que assinatura simples não foi afetada
- Resultado esperado: Assinatura simples continua funcionando normalmente

### Teste 4: Verificação de Códigos
- Objetivo: Validar que todos os códigos são únicos e verificáveis
- Resultado esperado: Cada código retorna informações corretas

## Problemas Conhecidos e Soluções

### Problema: Documento não finaliza automaticamente
**Solução**: Verificar se todos os usuários aprovaram. Pode ser necessário clicar em "Finalizar" manualmente.

### Problema: Página de resumo não aparece
**Solução**: Verificar se o documento foi criado após a implementação. Documentos antigos não terão a página de resumo.

### Problema: Barra lateral ainda mostra nomes
**Solução**: Limpar cache do navegador e recarregar o documento.

## Logs para Debug

Se houver problemas, verificar os logs no console do navegador e no servidor:

```javascript
// No navegador (F12 > Console)
// Procurar por:
- "Finalizando assinatura múltipla"
- "Assinatura múltipla finalizada"
- "Documento salvo"

// No servidor (terminal)
// Procurar por:
- "✅ Documento assinado gerado"
- "✅ Documento salvo no bucket"
- "✅ Assinatura múltipla finalizada"
```

## Checklist de Validação

- [ ] Upload de documento funciona
- [ ] Seleção de múltiplos usuários funciona
- [ ] Notificações são enviadas
- [ ] Aprovações são registradas
- [ ] Finalização automática ocorre
- [ ] Barra lateral não mostra nomes
- [ ] Barra lateral mostra códigos e hashes
- [ ] Nova página de resumo é criada
- [ ] Página de resumo contém todas as informações
- [ ] Layout da página de resumo está correto
- [ ] Códigos de verificação funcionam
- [ ] Download do documento funciona

## Suporte

Se encontrar problemas:
1. Verificar logs do servidor
2. Verificar console do navegador
3. Verificar se todas as tabelas do banco estão criadas
4. Verificar se o bucket de storage está configurado
5. Consultar o arquivo `MELHORIAS_ASSINATURA_MULTIPLA.md` para detalhes técnicos
