# 🌐 INSTRUÇÕES PARA IMPLEMENTAÇÃO NO SITE trackdoc.com.br

## 📋 CONTEXTO

O site trackdoc.com.br possui uma página de preços com 4 planos.
Atualmente os botões levam direto para `/register/`, mas precisam ser alterados para usar os Payment Links do Stripe.

---

## 🎯 OBJETIVO

Fazer os botões dos planos redirecionarem para os Payment Links do Stripe, que após o pagamento, redirecionarão automaticamente para a página de registro com o pagamento confirmado.

---

## 🔗 PAYMENT LINKS DO STRIPE

Use estes links nos botões:

```
Plano Básico (R$ 149/mês):
https://buy.stripe.com/test_9B6eV7fjU39mbsrg9R73G03

Plano Profissional (R$ 349/mês):
https://buy.stripe.com/test_4gM8wJ5Jk11ecwvf5N73G02

Plano Enterprise (R$ 649/mês):
https://buy.stripe.com/test_5kQ00d9ZAbFScwv0aT73G01

Plano Gratuito (R$ 0/mês):
https://buy.stripe.com/test_00wcMZ3Bc4dq7cb5vd73G00
```

---

## 📝 IMPLEMENTAÇÃO

### OPÇÃO 1: Links Diretos (Mais Simples)

Substitua os botões atuais por:

```html
<!-- Plano Básico -->
<a href="https://buy.stripe.com/test_9B6eV7fjU39mbsrg9R73G03" target="_blank">
  <button class="btn-primary">
    Começar agora
  </button>
</a>

<!-- Plano Profissional -->
<a href="https://buy.stripe.com/test_4gM8wJ5Jk11ecwvf5N73G02" target="_blank">
  <button class="btn-primary">
    Começar teste grátis
  </button>
</a>

<!-- Plano Enterprise -->
<a href="https://buy.stripe.com/test_5kQ00d9ZAbFScwv0aT73G01" target="_blank">
  <button class="btn-primary">
    Começar agora
  </button>
</a>

<!-- Plano Gratuito (se houver botão) -->
<a href="https://buy.stripe.com/test_00wcMZ3Bc4dq7cb5vd73G00" target="_blank">
  <button class="btn-primary">
    Começar grátis
  </button>
</a>
```

---

### OPÇÃO 2: Com JavaScript (Mais Controle)

Se quiser adicionar loading ou tracking, use JavaScript:

```html
<!-- Adicionar ANTES do </body> -->
<script>
// Payment Links do Stripe
const PAYMENT_LINKS = {
  'basico': 'https://buy.stripe.com/test_9B6eV7fjU39mbsrg9R73G03',
  'profissional': 'https://buy.stripe.com/test_4gM8wJ5Jk11ecwvf5N73G02',
  'enterprise': 'https://buy.stripe.com/test_5kQ00d9ZAbFScwv0aT73G01',
  'gratuito': 'https://buy.stripe.com/test_00wcMZ3Bc4dq7cb5vd73G00'
};

function iniciarCheckout(planType, botao) {
  // Desabilitar botão
  botao.disabled = true;
  botao.textContent = 'Redirecionando...';
  
  // Opcional: Tracking/Analytics
  if (typeof gtag !== 'undefined') {
    gtag('event', 'checkout_iniciado', {
      'plano': planType
    });
  }
  
  // Redirecionar para Stripe
  window.location.href = PAYMENT_LINKS[planType];
}
</script>

<!-- Nos botões -->
<button onclick="iniciarCheckout('basico', this)" class="btn-primary">
  Começar agora
</button>

<button onclick="iniciarCheckout('profissional', this)" class="btn-primary">
  Começar teste grátis
</button>

<button onclick="iniciarCheckout('enterprise', this)" class="btn-primary">
  Começar agora
</button>
```

---

## 🔄 FLUXO COMPLETO

```
1. Usuário em: trackdoc.com.br/#precos
   ↓
2. Clica: "Começar agora"
   ↓
3. Redireciona para: buy.stripe.com/test_...
   ↓
4. Usuário preenche dados e paga
   ↓
5. Stripe redireciona para: trackdoc.app.br/register/?session_id=xxx
   ↓
6. Usuário cria conta com pagamento confirmado
```

---

## ⚙️ CONFIGURAÇÃO DOS PAYMENT LINKS (Já Feito)

Os Payment Links já estão configurados no Stripe para:
- ✅ Trial de 14 dias
- ✅ Redirecionar para trackdoc.app.br/register após pagamento
- ✅ Preços corretos (R$ 149, R$ 349, R$ 649, R$ 0)

**Não precisa configurar nada no Stripe!**

---

## 🎨 EXEMPLO VISUAL

### Antes (Atual):
```html
<a href="https://www.trackdoc.app.br/register/">
  <button>Começar agora</button>
</a>
```

### Depois (Novo):
```html
<a href="https://buy.stripe.com/test_9B6eV7fjU39mbsrg9R73G03">
  <button>Começar agora</button>
</a>
```

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

- [ ] Localizar os 3 ou 4 botões dos planos na página
- [ ] Substituir os links atuais pelos Payment Links do Stripe
- [ ] Adicionar `target="_blank"` (opcional, mas recomendado)
- [ ] Testar cada botão
- [ ] Verificar se redireciona para Stripe
- [ ] Testar pagamento completo (cartão: 4242 4242 4242 4242)

---

## 🧪 TESTE

1. Clique no botão "Começar agora" do Plano Básico
2. Deve abrir: `buy.stripe.com/test_9B6eV7fjU39mbsrg9R73G03`
3. Preencha:
   - Email: teste@email.com
   - Cartão: 4242 4242 4242 4242
   - Data: 12/34
   - CVC: 123
4. Clique em "Assinar"
5. Deve redirecionar para: `trackdoc.app.br/register/?session_id=xxx`

---

## 💡 OBSERVAÇÕES IMPORTANTES

### 1. Target Blank
Recomendo usar `target="_blank"` para abrir em nova aba:
```html
<a href="..." target="_blank">
```

### 2. Manter Estilo dos Botões
Mantenha as classes CSS atuais dos botões:
```html
<a href="...">
  <button class="btn-primary">Começar agora</button>
</a>
```

### 3. Texto dos Botões
Sugestões de texto:
- Básico: "Começar agora"
- Profissional: "Começar teste grátis" ou "14 dias grátis"
- Enterprise: "Começar agora" ou "Falar com vendas"
- Gratuito: "Começar grátis"

---

## 🔒 SEGURANÇA

Os Payment Links são seguros porque:
- ✅ Hospedados pelo Stripe (PCI Compliant)
- ✅ HTTPS obrigatório
- ✅ Não expõem dados sensíveis
- ✅ Validação automática de pagamento

---

## 📊 COMPARAÇÃO: Payment Links vs API

### Payment Links (Escolhido):
- ✅ Mais simples de implementar
- ✅ Não precisa de API
- ✅ Stripe gerencia tudo
- ✅ Funciona imediatamente

### API (Alternativa):
- ⚠️ Mais complexo
- ⚠️ Precisa de JavaScript
- ⚠️ Precisa de backend
- ✅ Mais controle

**Conclusão**: Payment Links são perfeitos para este caso!

---

## 🎯 CÓDIGO FINAL RECOMENDADO

```html
<!-- Página de Preços - trackdoc.com.br/#precos -->

<!-- Plano Básico -->
<div class="plan-card">
  <h3>Básico</h3>
  <p class="price">R$ 149<span>/mês</span></p>
  <!-- ... features ... -->
  <a href="https://buy.stripe.com/test_9B6eV7fjU39mbsrg9R73G03" target="_blank">
    <button class="btn-primary">Começar agora</button>
  </a>
</div>

<!-- Plano Profissional -->
<div class="plan-card popular">
  <h3>Profissional</h3>
  <p class="price">R$ 349<span>/mês</span></p>
  <!-- ... features ... -->
  <a href="https://buy.stripe.com/test_4gM8wJ5Jk11ecwvf5N73G02" target="_blank">
    <button class="btn-primary">Começar teste grátis</button>
  </a>
  <p class="trial-info">14 dias grátis</p>
</div>

<!-- Plano Enterprise -->
<div class="plan-card">
  <h3>Enterprise</h3>
  <p class="price">R$ 649<span>/mês</span></p>
  <!-- ... features ... -->
  <a href="https://buy.stripe.com/test_5kQ00d9ZAbFScwv0aT73G01" target="_blank">
    <button class="btn-primary">Começar agora</button>
  </a>
</div>
```

---

## ⏱️ TEMPO ESTIMADO

- Localizar botões: 2 min
- Substituir links: 3 min
- Testar: 5 min
- **Total: 10 minutos**

---

## ✅ RESULTADO FINAL

Após implementação:
- ✅ Botões redirecionam para Stripe
- ✅ Usuário paga antes de criar conta
- ✅ Registro automático após pagamento
- ✅ Trial de 14 dias incluído
- ✅ Sistema completo funcionando

---

## 📞 SUPORTE

Se tiver dúvidas ou problemas:
1. Verifique se os links estão corretos
2. Teste com cartão: 4242 4242 4242 4242
3. Verifique console do navegador (F12)

---

**FIM DAS INSTRUÇÕES**

Copie este arquivo e passe para a IA que edita o trackdoc.com.br
