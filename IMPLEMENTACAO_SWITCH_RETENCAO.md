# Implementação do Switch de Retenção

## 🎯 Objetivo

Criar uma interface mais intuitiva para definir se um tipo de documento tem ou não período de retenção, usando um switch (liga/desliga) em vez de permitir valores numéricos confusos.

## 🐛 Problema Anterior

O usuário tentava inserir `0` para indicar "sem retenção", mas o valor voltava automaticamente para `24`. Isso acontecia porque:

1. O campo numérico aceitava `0`, mas a lógica de fallback usava `??` que não tratava `0` adequadamente
2. A interface não deixava claro quando o documento tinha ou não retenção
3. Valores como `0`, `null` e `undefined` eram confusos

## ✅ Solução Implementada

### Interface com Switch

Agora o formulário tem um **switch dedicado** para habilitar/desabilitar a retenção:

```typescript
<div className="space-y-4 p-4 border rounded-lg bg-gray-50">
  <div className="flex items-center justify-between">
    <div className="space-y-1">
      <Label className="text-base font-medium">Período de Retenção</Label>
      <p className="text-sm text-gray-500">
        Define por quanto tempo o documento deve ser mantido
      </p>
    </div>
    <Switch
      checked={retentionEnabled}
      onCheckedChange={(checked) => {
        setRetentionEnabled(checked)
        if (!checked) {
          setFormData((prev) => ({ ...prev, retentionPeriod: null }))
        } else {
          setFormData((prev) => ({ ...prev, retentionPeriod: 24 }))
        }
      }}
    />
  </div>
  
  {retentionEnabled && (
    <div className="space-y-2">
      <Label htmlFor="retention">Período (meses)</Label>
      <Input
        id="retention"
        type="number"
        min="1"
        value={formData.retentionPeriod || 24}
        onChange={(e) => {
          const value = Number.parseInt(e.target.value, 10)
          if (!isNaN(value) && value >= 1) {
            setFormData((prev) => ({ ...prev, retentionPeriod: value }))
          }
        }}
      />
    </div>
  )}
  
  {!retentionEnabled && (
    <p className="text-sm text-gray-600 italic">
      Este tipo de documento não terá período de retenção definido
    </p>
  )}
</div>
```

### Lógica de Estado

**Estado do Switch:**
```typescript
// Determinar se a retenção está habilitada
const hasRetention = documentType?.retentionPeriod != null && documentType.retentionPeriod > 0

// Estado para controlar o switch
const [retentionEnabled, setRetentionEnabled] = useState(hasRetention)
```

**Comportamento:**

1. **Switch DESLIGADO** (retentionEnabled = false):
   - `retentionPeriod = null`
   - Campo de input fica oculto
   - Mostra mensagem: "Este tipo de documento não terá período de retenção definido"

2. **Switch LIGADO** (retentionEnabled = true):
   - `retentionPeriod = 24` (valor padrão)
   - Campo de input aparece
   - Usuário pode inserir qualquer valor >= 1

### Validação

```typescript
// Apenas aceita valores >= 1 quando habilitado
if (!isNaN(value) && value >= 1) {
  setFormData((prev) => ({ ...prev, retentionPeriod: value }))
}
```

### Exibição na Lista

Mantida a lógica de exibição inteligente:

```typescript
{type.retentionPeriod === 0 || type.retentionPeriod === null || type.retentionPeriod === undefined
  ? "Sem retenção"
  : `${type.retentionPeriod} meses`}
```

## 🎨 Design da Interface

### Visual do Switch

```
┌─────────────────────────────────────────────────────┐
│  Período de Retenção                    [●─────]    │
│  Define por quanto tempo o documento                │
│  deve ser mantido                                   │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │ Período (meses)                             │   │
│  │ [    24    ]                                │   │
│  │ Número de meses que o documento deve ser    │   │
│  │ mantido                                     │   │
│  └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

### Visual Desabilitado

```
┌─────────────────────────────────────────────────────┐
│  Período de Retenção                    [─────●]    │
│  Define por quanto tempo o documento                │
│  deve ser mantido                                   │
│                                                     │
│  Este tipo de documento não terá período de         │
│  retenção definido                                  │
└─────────────────────────────────────────────────────┘
```

## 📊 Fluxo de Dados

### Criação de Novo Tipo

1. Usuário abre modal de criação
2. Switch de retenção está **DESLIGADO** por padrão
3. Se usuário ligar o switch:
   - Campo aparece com valor padrão 24
   - Usuário pode alterar para qualquer valor >= 1
4. Se usuário deixar desligado:
   - `retentionPeriod = null`
   - Tipo criado sem retenção

### Edição de Tipo Existente

1. Usuário abre modal de edição
2. Switch reflete estado atual:
   - **LIGADO** se `retentionPeriod > 0`
   - **DESLIGADO** se `retentionPeriod` é `null`, `undefined` ou `0`
3. Usuário pode alterar o switch:
   - Ligar: define valor padrão 24
   - Desligar: define `null`

## 🔄 Valores Possíveis

| Estado do Switch | Valor de retentionPeriod | Exibição na Lista |
|-----------------|-------------------------|-------------------|
| DESLIGADO       | `null`                  | "Sem retenção"    |
| LIGADO          | `1` a `999`             | "X meses"         |

## ✅ Benefícios

1. **Interface Clara**: Switch visual indica claramente se há ou não retenção
2. **Sem Confusão**: Não há mais ambiguidade entre `0`, `null` e `undefined`
3. **Validação Simples**: Quando habilitado, apenas valores >= 1 são aceitos
4. **UX Melhorada**: Usuário entende imediatamente o estado do documento
5. **Feedback Visual**: Mensagem explicativa quando desabilitado

## 🧪 Casos de Teste

### Teste 1: Criar Tipo Sem Retenção
1. Abrir modal de criação
2. Deixar switch de retenção DESLIGADO
3. Preencher outros campos
4. Salvar
5. ✅ Verificar que mostra "Sem retenção" na lista

### Teste 2: Criar Tipo Com Retenção
1. Abrir modal de criação
2. LIGAR switch de retenção
3. Alterar valor para 12 meses
4. Salvar
5. ✅ Verificar que mostra "12 meses" na lista

### Teste 3: Editar Tipo - Adicionar Retenção
1. Editar tipo sem retenção
2. LIGAR switch de retenção
3. Definir 24 meses
4. Salvar
5. ✅ Verificar que mostra "24 meses" na lista

### Teste 4: Editar Tipo - Remover Retenção
1. Editar tipo com retenção de 24 meses
2. DESLIGAR switch de retenção
3. Salvar
4. ✅ Verificar que mostra "Sem retenção" na lista

### Teste 5: Validação de Valores
1. LIGAR switch de retenção
2. Tentar inserir 0 → ❌ Não aceita
3. Tentar inserir -5 → ❌ Não aceita
4. Inserir 1 → ✅ Aceita
5. Inserir 999 → ✅ Aceita

## 📝 Notas Técnicas

### Estado Inicial do Switch

```typescript
const hasRetention = documentType?.retentionPeriod != null && documentType.retentionPeriod > 0
const [retentionEnabled, setRetentionEnabled] = useState(hasRetention)
```

- Verifica se há valor numérico > 0
- `null`, `undefined` ou `0` → switch DESLIGADO
- Qualquer valor >= 1 → switch LIGADO

### Sincronização de Estado

```typescript
onCheckedChange={(checked) => {
  setRetentionEnabled(checked)
  if (!checked) {
    setFormData((prev) => ({ ...prev, retentionPeriod: null }))
  } else {
    setFormData((prev) => ({ ...prev, retentionPeriod: 24 }))
  }
}}
```

- Atualiza tanto o estado do switch quanto o valor do formulário
- Garante consistência entre UI e dados

## ✅ Conclusão

A implementação do switch de retenção resolve completamente o problema de valores confusos e fornece uma interface intuitiva e clara para o usuário. Agora é impossível ter ambiguidade sobre se um tipo de documento tem ou não período de retenção definido.
