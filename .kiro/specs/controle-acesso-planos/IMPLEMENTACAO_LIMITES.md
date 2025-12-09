# 🔢 IMPLEMENTAÇÃO DE CONTROLE DE LIMITES

## 🎯 Objetivo

Implementar controle de limites de usuários e armazenamento baseado nos planos.

---

## 📊 Limites por Plano

| Plano | Usuários | Armazenamento |
|-------|----------|---------------|
| **Básico** | 15 | 10 GB |
| **Profissional** | 50 | 50 GB |
| **Enterprise** | 70 | 120 GB |

---

## ✅ IMPLEMENTAÇÕES REALIZADAS

### 1. Controle de Limite de Usuários ✅

**Onde:** Página de Gerenciamento de Usuários da Entidade

**Arquivo:** `app/components/admin/entity-user-management.tsx`

**Implementações:**

#### A) Bloqueio do Botão "Cadastrar Usuário"
```tsx
<LimitGuard userId={user?.id} limitType="users" showAlert={false}>
  <Button onClick={() => setShowCreateModal(true)}>
    <Plus className="h-4 w-4 mr-2" />
    Cadastrar Usuário
  </Button>
</LimitGuard>
```

**Comportamento:**
- ✅ Se dentro do limite: Botão funciona normalmente
- ❌ Se atingiu o limite: Botão desabilitado + modal de alerta

#### B) Alerta Visual de Uso
```tsx
<LimitAlert userId={user?.id} limitType="users" showAt={[80, 90]} />
```

**Comportamento:**
- 🟢 0-79%: Sem alerta
- 🟡 80-89%: Alerta amarelo "Atenção: 80% dos usuários"
- 🔴 90-100%: Alerta vermelho "Alerta Crítico: 90% dos usuários"

**Exemplo de Alertas:**

**Alerta Amarelo (80%):**
```
⚠️ Atenção: 80% dos Usuários
Você está usando 12 usuários dos 15 disponíveis no seu plano.
Espaço restante: 3 usuários
```

**Alerta Vermelho (90%):**
```
🚨 Alerta Crítico: 93% dos Usuários
Você está usando 14 usuários dos 15 disponíveis no seu plano.
Espaço restante: 1 usuário
⚠️ O limite está próximo!
[Ver Planos]
```

---

### 2. Controle de Limite de Armazenamento ✅

**Onde:** Componente de Upload de Documentos

**Arquivo:** `app/components/document-upload-with-approval.tsx`

**Implementações:**

#### A) Verificação Antes do Upload
```tsx
// Verificar limite de armazenamento
if (subscription) {
  const totalSizeGB = uploadFiles.reduce((sum, f) => sum + f.file.size, 0) / (1024 * 1024 * 1024)
  const remainingStorage = getRemainingStorage()
  
  if (totalSizeGB > remainingStorage) {
    toast({
      title: "Limite de armazenamento excedido",
      description: `Você precisa de ${totalSizeGB.toFixed(2)} GB, mas tem apenas ${remainingStorage.toFixed(2)} GB disponíveis.`,
      variant: "destructive",
    })
    return
  }
}
```

**Comportamento:**
- ✅ Se há espaço suficiente: Upload prossegue
- ❌ Se não há espaço: Toast de erro + upload bloqueado

#### B) Alerta Visual de Uso
```tsx
<LimitAlert userId={user?.id} limitType="storage" showAt={[80, 90]} />
```

**Comportamento:**
- 🟢 0-79%: Sem alerta
- 🟡 80-89%: Alerta amarelo "Atenção: Armazenamento em 85%"
- 🔴 90-100%: Alerta vermelho "Alerta Crítico: Armazenamento em 95%"

**Exemplo de Alertas:**

**Alerta Amarelo (85%):**
```
⚠️ Atenção: Armazenamento em 85%
Você está usando 8.50 GB dos 10 GB disponíveis no seu plano.
Espaço restante: 1.50 GB
[Gerenciar Arquivos]
```

**Alerta Vermelho (95%):**
```
🚨 Alerta Crítico: Armazenamento em 95%
Você está usando 9.50 GB dos 10 GB disponíveis no seu plano.
Espaço restante: 0.50 GB
⚠️ O limite está próximo!
[Gerenciar Arquivos] [Ver Planos]
```

---

## 📁 Arquivos Modificados

### Controle de Usuários:
1. `app/components/admin/entity-user-management.tsx`
   - Adicionado `LimitGuard` no botão "Cadastrar Usuário"
   - Adicionado `LimitAlert` para avisos de uso

### Controle de Armazenamento:
1. `app/components/document-upload-with-approval.tsx`
   - Adicionado verificação de limite antes do upload
   - Adicionado `LimitAlert` para avisos de uso
   - Adicionado hook `useSubscription` para obter limites

---

## 🧪 Como Testar

### Teste 1: Limite de Usuários (Plano Básico - 15 usuários)

**Cenário 1: Dentro do Limite (< 80%)**
1. Login como admin com Plano Básico
2. Ter 10 usuários cadastrados (66%)
3. **Resultado esperado:**
   - ✅ Sem alertas
   - ✅ Botão "Cadastrar Usuário" habilitado

**Cenário 2: Próximo do Limite (80-89%)**
1. Ter 12 usuários cadastrados (80%)
2. **Resultado esperado:**
   - 🟡 Alerta amarelo: "Atenção: 80% dos usuários"
   - ✅ Botão "Cadastrar Usuário" habilitado

**Cenário 3: Crítico (90-99%)**
1. Ter 14 usuários cadastrados (93%)
2. **Resultado esperado:**
   - 🔴 Alerta vermelho: "Alerta Crítico: 93% dos usuários"
   - ✅ Botão "Cadastrar Usuário" habilitado (ainda tem 1 vaga)

**Cenário 4: Limite Atingido (100%)**
1. Ter 15 usuários cadastrados (100%)
2. **Resultado esperado:**
   - 🔴 Alerta vermelho: "Alerta Crítico: 100% dos usuários"
   - ❌ Botão "Cadastrar Usuário" desabilitado
   - ❌ Ao clicar: Modal "Limite de Usuários Atingido"

---

### Teste 2: Limite de Armazenamento (Plano Básico - 10 GB)

**Cenário 1: Dentro do Limite (< 80%)**
1. Login com Plano Básico
2. Ter 7 GB usados (70%)
3. Tentar fazer upload de 1 GB
4. **Resultado esperado:**
   - ✅ Sem alertas
   - ✅ Upload funciona normalmente

**Cenário 2: Próximo do Limite (80-89%)**
1. Ter 8.5 GB usados (85%)
2. **Resultado esperado:**
   - 🟡 Alerta amarelo: "Atenção: Armazenamento em 85%"
   - ✅ Upload de arquivos pequenos funciona

**Cenário 3: Crítico (90-99%)**
1. Ter 9.5 GB usados (95%)
2. **Resultado esperado:**
   - 🔴 Alerta vermelho: "Alerta Crítico: Armazenamento em 95%"
   - ✅ Upload de arquivos pequenos funciona

**Cenário 4: Tentativa de Exceder Limite**
1. Ter 9.5 GB usados
2. Tentar fazer upload de 1 GB (total seria 10.5 GB)
3. **Resultado esperado:**
   - ❌ Toast de erro: "Limite de armazenamento excedido"
   - ❌ Upload bloqueado
   - 💡 Mensagem: "Você precisa de 1.00 GB, mas tem apenas 0.50 GB disponíveis"

---

## 🎨 Componentes Utilizados

### LimitGuard
Bloqueia ações quando limites são atingidos:
- Desabilita botões
- Mostra modal de alerta
- Oferece botões de upgrade

### LimitAlert
Mostra alertas preventivos:
- Alerta amarelo em 80%
- Alerta vermelho em 90%
- Pode ser fechado pelo usuário
- Mostra espaço restante

### useSubscription
Hook para obter informações do plano:
- `getRemainingUsers()`: Usuários restantes
- `getRemainingStorage()`: GB restantes
- `getUsagePercentage()`: Percentual de uso

---

## 📊 Fluxo de Controle

### Fluxo de Cadastro de Usuário:
```
1. Admin clica em "Cadastrar Usuário"
2. LimitGuard verifica limite
3a. Se dentro do limite → Abre modal de cadastro
3b. Se atingiu limite → Mostra modal de bloqueio
4. Se cadastro bem-sucedido → Atualiza contador
5. Se próximo do limite → Mostra LimitAlert
```

### Fluxo de Upload de Arquivo:
```
1. Usuário seleciona arquivo(s)
2. Usuário clica em "Upload"
3. Sistema calcula tamanho total
4. Sistema verifica espaço disponível
5a. Se há espaço → Prossegue com upload
5b. Se não há espaço → Toast de erro + bloqueio
6. Se upload bem-sucedido → Atualiza contador
7. Se próximo do limite → Mostra LimitAlert
```

---

## 🔄 Atualização de Contadores

Os contadores são atualizados automaticamente:

**Usuários:**
- Incrementa ao criar usuário
- Decrementa ao excluir usuário
- Função: `increment_user_count()`, `decrement_user_count()`

**Armazenamento:**
- Incrementa ao fazer upload
- Decrementa ao excluir arquivo
- Função: `add_storage_usage()`, `remove_storage_usage()`

---

## 🚀 Próximas Melhorias (Opcional)

### Melhorias Futuras:
1. **Dashboard de Uso**
   - Gráfico de uso de usuários
   - Gráfico de uso de armazenamento
   - Histórico de uso mensal

2. **Notificações Proativas**
   - Email quando atingir 80%
   - Email quando atingir 90%
   - Email quando atingir 100%

3. **Compra de Recursos Extras**
   - Adicionar usuários extras (R$ 2,90/usuário)
   - Adicionar armazenamento extra (R$ 0,49/GB)

4. **Relatório de Uso**
   - Exportar relatório de uso
   - Ver histórico de uploads
   - Ver histórico de cadastros

---

## ✅ Checklist de Implementação

- [x] Controle de limite de usuários
- [x] Bloqueio de cadastro quando limite atingido
- [x] Alerta visual de uso de usuários (80%, 90%)
- [x] Controle de limite de armazenamento
- [x] Bloqueio de upload quando limite atingido
- [x] Alerta visual de uso de armazenamento (80%, 90%)
- [x] Verificação antes do upload
- [x] Toast de erro quando exceder limite
- [x] Integração com useSubscription
- [x] Documentação completa

---

**Última atualização:** 2024-12-09  
**Status:** 100% completo ✨  
**Implementações:** 6 de 6 (Bloqueios + Limites)
