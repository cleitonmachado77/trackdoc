// ========================================
// PATCH FINAL PARA CORREÇÃO COMPLETA DA INTERFACE DE REPROVAÇÃO
// ========================================
// Aplique estas correções no arquivo: app/components/process-details-modal.tsx

// 1. ADICIONAR ESTADOS PARA VALIDAÇÃO VISUAL (próximo aos outros useState)
const [rejectCommentError, setRejectCommentError] = useState(false)
const [showRejectWarning, setShowRejectWarning] = useState(false)

// 2. FUNÇÃO handleReject CORRIGIDA - Substitua toda a função existente
const handleReject = async () => {
  console.log('=== INÍCIO handleReject ===')
  
  // Prevenir cliques duplos
  if (!preventDoubleClick() || isProcessingAction) {
    console.log('🚫 Ação bloqueada - duplo clique ou já processando')
    return
  }

  if (!currentExecution) {
    toast({
      title: "Erro",
      description: "Nenhuma execução pendente encontrada",
      variant: "destructive",
    })
    return
  }

  // ✅ VALIDAÇÃO DE COMENTÁRIOS - Com aviso visual
  if (requiresComments('reject') && !actionComments.trim()) {
    console.log('❌ Comentários obrigatórios não preenchidos')
    
    // Mostrar aviso vermelho abaixo do botão
    setShowRejectWarning(true)
    setRejectCommentError(true)
    
    // Toast para feedback adicional
    toast({
      title: "Comentários obrigatórios", 
      description: "É necessário adicionar comentários ao reprovar o processo",
      variant: "destructive",
      duration: 3000,
    })
    
    // Focar no campo de comentários
    const commentsField = document.getElementById('action-comments')
    if (commentsField) {
      commentsField.focus()
      commentsField.scrollIntoView({ behavior: 'smooth' })
    }
    
    return
  }

  // Limpar avisos se comentários estão ok
  setShowRejectWarning(false)
  setRejectCommentError(false)

  setIsProcessingAction(true)
  
  try {
    console.log('📤 Executando reprovação...')
    
    const result = await advanceStep(
      currentExecution.process_id,
      currentExecution.id,
      'reject',
      actionComments
    )

    console.log('✅ Resultado da reprovação:', result)

    // ✅ FEEDBACK DE SUCESSO
    if (result?.executionId) {
      toast({
        title: "✅ Processo reprovado",
        description: "O processo foi reprovado e retornado ao usuário anterior.",
        duration: 3000,
      })
    } else {
      toast({
        title: "⚠️ Processo finalizado",
        description: "O processo foi reprovado e finalizado.",
      })
    }

    // ✅ LIMPAR INTERFACE
    setActionComments("")
    setShowRejectWarning(false)
    setRejectCommentError(false)
    
    // ✅ RECARREGAR DADOS PARA ATUALIZAR BOTÕES
    await reloadProcessData()
    
    // ✅ AGUARDAR PROCESSAMENTO PARA GARANTIR ATUALIZAÇÃO
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    console.log('✅ Reprovação concluída - interface atualizada')
    
  } catch (error) {
    console.error('❌ Erro ao reprovar processo:', error)
    
    toast({
      title: "Erro ao reprovar",
      description: "Não foi possível reprovar o processo. Tente novamente.",
      variant: "destructive",
    })
  } finally {
    setIsProcessingAction(false)
    console.log('=== FIM handleReject ===')
  }
}

// 3. LIMPAR AVISO QUANDO COMENTÁRIOS FOREM ALTERADOS
// Adicione esta função depois da função handleReject
const handleCommentsChange = (e) => {
  const value = e.target.value
  setActionComments(value)
  
  // Limpar avisos quando usuário começar a digitar
  if (value.trim() && showRejectWarning) {
    setShowRejectWarning(false)
    setRejectCommentError(false)
  }
}

// 4. SUBSTITUIR O CAMPO DE COMENTÁRIOS - Localizar e substituir toda a div
<div>
  <Label htmlFor="action-comments" className="flex items-center gap-2">
    Comentários 
    {requiresComments('reject') && (
      <Badge variant="destructive" className="text-xs px-2 py-1">
        Obrigatório para reprovação
      </Badge>
    )}
    {!requiresComments('reject') && <span className="text-gray-500">(opcional)</span>}
  </Label>
  
  <Textarea
    id="action-comments"
    placeholder={
      requiresComments('reject') 
        ? "Explique o motivo da reprovação..."
        : "Adicione comentários sobre a ação..."
    }
    value={actionComments}
    onChange={handleCommentsChange} // ✅ USAR NOVA FUNÇÃO
    rows={3}
    className={`mt-1 transition-colors ${
      rejectCommentError 
        ? 'border-red-500 focus:border-red-600 bg-red-50' 
        : ''
    }`}
  />
  
  {/* ✅ AVISO VERMELHO ABAIXO DO CAMPO */}
  {requiresComments('reject') && !actionComments.trim() && rejectCommentError && (
    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700 flex items-center gap-2">
      <AlertTriangle className="h-4 w-4" />
      É necessário inserir comentários para reprovar este processo
    </div>
  )}
  
  {/* Indicador positivo quando comentários preenchidos */}
  {actionComments.trim() && requiresComments('reject') && (
    <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
      <CheckCircle className="h-4 w-4" />
      Comentários preenchidos ✓
    </p>
  )}
</div>

// 5. ADICIONAR AVISO VERMELHO ABAIXO DOS BOTÕES
// Localizar a div que contém os botões e adicionar após ela:

{/* ✅ AVISO VERMELHO ABAIXO DOS BOTÕES */}
{showRejectWarning && (
  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
    <div className="flex items-center gap-2 text-red-700">
      <AlertTriangle className="h-5 w-5" />
      <span className="font-medium">Comentários obrigatórios</span>
    </div>
    <p className="text-sm text-red-600 mt-1">
      É necessário inserir comentários no campo acima para reprovar este processo.
    </p>
  </div>
)}

// 6. MELHORAR A FUNÇÃO getAvailableActions (opcional, para garantir que botões sumam)
// Localizar a função getAvailableActions e verificar se ela está considerando o status correto
// Se necessário, pode adicionar esta verificação adicional:

const getAvailableActions = () => {
  if (!currentExecution?.step || !currentProcess) return []
  
  // ✅ Se a execução atual está completed, não mostrar ações
  if (currentExecution?.status === 'completed') {
    console.log('Execução atual concluída - não há ações disponíveis')
    return []
  }
  
  const currentStep = currentExecution.step
  const actions = []
  
  // Resto da função permanece igual...
  // ... código existente ...
}

// ========================================
// IMPORTS NECESSÁRIOS - Adicionar no topo do arquivo se não existirem
// ========================================
import { AlertTriangle, CheckCircle, XCircle, ArrowRight, Signature } from "lucide-react"
import { Badge } from "@/components/ui/badge"

// ========================================
// RESUMO DAS ALTERAÇÕES
// ========================================
/*
✅ Estados adicionados: rejectCommentError, showRejectWarning
✅ handleReject corrigido: validação visual + limpeza de interface
✅ handleCommentsChange: limpa avisos quando usuário digita
✅ Campo de comentários: visual melhorado com validação
✅ Aviso vermelho: aparece abaixo dos botões quando necessário
✅ getAvailableActions: verifica status completed para ocultar botões
*/

