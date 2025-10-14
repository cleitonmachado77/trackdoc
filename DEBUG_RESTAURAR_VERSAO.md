# 🔍 DEBUG - Problema com Restaurar Versão

## ❌ PROBLEMA RELATADO

### **Descrição:**
O botão "Restaurar Versão" não está funcionando corretamente. Quando o usuário seleciona uma versão anterior para restaurar, a versão selecionada não está sendo restaurada para a versão atual vigente.

### **Comportamento Esperado:**
1. Usuário clica em "Restaurar" em uma versão anterior (ex: V1)
2. Sistema cria nova versão (ex: V3) com conteúdo da V1
3. Documento principal atualiza para mostrar V3 como atual
4. Interface reflete as mudanças imediatamente

### **Comportamento Atual:**
- Função é chamada mas versão não é restaurada
- Interface não atualiza
- Documento permanece na versão anterior

## 🔧 INVESTIGAÇÃO APLICADA

### **1. Logs de Debug Adicionados**

#### **Hook `use-document-versions.ts`:**
```typescript
// Logs detalhados em cada etapa do processo:
console.log('🔄 [RESTORE_VERSION] Iniciando restauração da versão:', versionId)
console.log('📋 [RESTORE_VERSION] Buscando dados da versão...')
console.log('✅ [RESTORE_VERSION] Versão encontrada:', versionData)
console.log('📄 [RESTORE_VERSION] Buscando documento atual...')
console.log('✅ [RESTORE_VERSION] Documento atual:', currentDoc)
console.log('🔢 [RESTORE_VERSION] Nova versão será:', newVersionNumber)
// ... e mais logs em cada etapa
```

#### **Componente `DocumentVersionManager`:**
```typescript
// Logs para rastrear chamadas e resultados:
console.log('🔄 [COMPONENT] Iniciando restauração da versão:', version)
console.log('📞 [COMPONENT] Chamando função restoreVersion...')
console.log('📋 [COMPONENT] Resultado da restauração:', result)
console.log('✅ [COMPONENT] Restauração bem-sucedida')
```

### **2. Pontos de Verificação**

Os logs irão mostrar exatamente onde o processo está falhando:

1. **Busca da versão a ser restaurada**
2. **Busca do documento atual**
3. **Criação do backup da versão atual**
4. **Download do arquivo da versão anterior**
5. **Upload do arquivo para novo local**
6. **Atualização do documento principal**
7. **Criação do registro da nova versão**
8. **Atualização da lista de versões**

### **3. Possíveis Causas Identificadas**

#### **A. Problemas de Permissão:**
- Usuário não tem permissão para acessar arquivo no storage
- Política RLS bloqueando operações

#### **B. Problemas de Storage:**
- Arquivo da versão anterior não existe mais
- Erro no download/upload do arquivo

#### **C. Problemas de Banco de Dados:**
- Constraint violada na atualização
- Foreign key inválida
- Trigger interferindo na operação

#### **D. Problemas de Interface:**
- Callback `onVersionUpdated` não está funcionando
- Lista não está sendo atualizada
- Modal não está fechando corretamente

## 🧪 COMO TESTAR COM DEBUG

### **1. Abrir Console do Navegador**
- Pressionar F12
- Ir para aba "Console"

### **2. Tentar Restaurar Versão**
- Abrir gerenciador de versões
- Clicar em "Restaurar" em qualquer versão
- Confirmar a operação

### **3. Analisar Logs**
Os logs aparecerão no console seguindo este padrão:

```
🔄 [COMPONENT] Iniciando restauração da versão: {versionId: "...", versionNumber: 1, fileName: "..."}
📞 [COMPONENT] Chamando função restoreVersion...
🔄 [RESTORE_VERSION] Iniciando restauração da versão: abc123...
📋 [RESTORE_VERSION] Buscando dados da versão...
✅ [RESTORE_VERSION] Versão encontrada: {version_number: 1, file_name: "...", document_id: "..."}
📄 [RESTORE_VERSION] Buscando documento atual...
✅ [RESTORE_VERSION] Documento atual: {current_version: 2, current_title: "...", current_file_name: "..."}
🔢 [RESTORE_VERSION] Nova versão será: 3
💾 [RESTORE_VERSION] Salvando backup da versão atual...
✅ [RESTORE_VERSION] Backup criado com sucesso
📁 [RESTORE_VERSION] Baixando arquivo da versão: documents/user123/file.pdf
✅ [RESTORE_VERSION] Arquivo baixado, tamanho: 12345
📤 [RESTORE_VERSION] Fazendo upload para: documents/user123/new-file.pdf
✅ [RESTORE_VERSION] Upload concluído
📝 [RESTORE_VERSION] Atualizando documento principal: {newVersion: 3, newTitle: "...", ...}
✅ [RESTORE_VERSION] Documento atualizado: {id: "...", version: 3, title: "...", file_name: "..."}
📋 [RESTORE_VERSION] Criando registro da versão restaurada...
✅ [RESTORE_VERSION] Registro da versão criado
🔄 [RESTORE_VERSION] Atualizando lista de versões...
🎉 [RESTORE_VERSION] Restauração concluída com sucesso!
📋 [COMPONENT] Resultado da restauração: {success: true, updatedDocument: {...}, newVersion: 3}
✅ [COMPONENT] Restauração bem-sucedida
🔄 [COMPONENT] Notificando componente pai...
🚪 [COMPONENT] Fechando modal...
```

### **4. Identificar Onde Para**
Se o processo falhar, os logs mostrarão exatamente onde:

- **Para em "Buscando dados da versão"** → Problema na consulta da versão
- **Para em "Baixando arquivo"** → Problema de storage/permissão
- **Para em "Atualizando documento"** → Problema de banco de dados
- **Para em "Notificando componente pai"** → Problema de interface

## 🎯 PRÓXIMOS PASSOS

### **1. Executar Teste com Debug**
- Testar restauração com console aberto
- Capturar logs completos
- Identificar ponto de falha

### **2. Aplicar Correção Específica**
Baseado nos logs, aplicar correção direcionada:

- **Se problema de storage:** Verificar permissões e políticas
- **Se problema de BD:** Verificar constraints e triggers
- **Se problema de interface:** Corrigir callbacks e atualizações

### **3. Remover Logs de Debug**
Após identificar e corrigir o problema, remover os logs de debug para produção.

---

## 📝 STATUS ATUAL

- ✅ **Logs de debug adicionados**
- ⏳ **Aguardando teste do usuário**
- ⏳ **Identificação do ponto de falha**
- ⏳ **Aplicação da correção específica**

**Próxima ação:** Executar teste com console aberto para capturar logs e identificar onde o processo está falhando.