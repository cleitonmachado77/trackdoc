# 🔧 Correção: Erro Select com Valor Vazio

## 📋 Problema Identificado

Erro no componente Select do Radix UI:
```
A <Select.Item /> must have a value prop that is not an empty string.
```

## 🔍 Causa

O Radix UI Select não permite SelectItem com `value=""` (string vazia).

## ✅ Solução Implementada

### Valor Especial "no-manager"

**Antes:**
```tsx
<SelectItem value="">  // ❌ Erro
  Nenhum gerente (atribuir depois)
</SelectItem>
```

**Depois:**
```tsx
<SelectItem value="no-manager">  // ✅ Funciona
  Nenhum gerente (atribuir depois)
</SelectItem>
```

### Lógica de Conversão

```tsx
onValueChange={(value) => {
  const managerId = value === 'no-manager' ? '' : value
  handleInputChange('manager_id', managerId)
}}
```

### Estado do Select

```tsx
value={formData.manager_id || 'no-manager'}
```

## 🎯 Resultado

- ✅ Erro corrigido
- ✅ Funcionalidade mantida
- ✅ Interface intuitiva
- ✅ Gerente opcional funcional