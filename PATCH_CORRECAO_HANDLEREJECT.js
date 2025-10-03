// ========================================
// PATCH PARA CORRIGIR FUNÇÃO handleReject
// ========================================
// Cole este código no lugar da função handleReject atual
// no arquivo: app/components/process-details-modal.tsx

// VERSÃO CORRIGIDA DO handleReject
const handleReject = async () => {
  console.log('=== INÍCIO handleReject ===')
  console.log('isProcessingAction:', isProcessingAction)
  console.log('currentExecution:', currentExecution)
  console.log('actionComments:', actionComments)
  
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

  // ✅ VALIDAÇÃO DE COMENTÁRIOS - Com destaque visual melhorado
  if (requiresComments('reject') && !actionComments.trim()) {
    console.log('❌ Comentários obrigatórios não preenchidos')
    
    toast({
      title: "Comentários obrigatórios", 
      description: "É necessário adicionar comentários ao reprovar o processo",
      variant: "destructive",
      duration: 5000, // Mais tempo para ler
    })
    
    // Focar no campo de comentários para chamar atenção
    const commentsField = document.getElementById('action-comments')
    if (commentsField) {
      commentsField.focus()
      commentsField.scrollIntoView({ behavior: 'smooth' })
      // Adicionar classe visual temporária de erro
      commentsField.classList.add('border-red-500', 'ring-2', 'ring-red-200')
      
      // Remover classe após alguns segundos
      setTimeout(() => {
        commentsField.classList.remove('border-red-500', 'ring-2', 'ring-red-200')
      }, 3000)
    }
    
    return
  }

  setIsProcessingAction(true)
  
  try {
    console.log('📤 Chamando advanceStep para rejeição...')
    console.log('Parâmetros:', {
      processId: currentExecution.process_id,
      executionId: currentExecution.id,
      action: 'reject',
      comments: actionComments
    })
    
    const result = await advanceStep(
      currentExecution.process_id,
      currentExecution.id,
      'reject', // ação de rejeição
      actionComments
    )

    console.log('✅ Resultado da rejeição:', result)

    // ✅ FEEDBACK DE SUCESSO - Melhorado
    if (result?.executionId) {
      // Processo retornou ao usuário anterior
      toast({
        title: "✅ Processo reprovado com sucesso",
        description: "O processo foi reprovado e retornado ao usuário anterior com seus comentários.",
        duration: 4000, // Mais tempo para ler
        className: "border-orange-200 bg-orange-50",
      })
      
      console.log('🔄 Processo retornado ao usuário anterior')
    } else {
      // Processo foi cancelado (não havia etapa anterior)
      toast({
        title: "⚠️ Processo cancelado",
        description: "O processo foi reprovado e cancelado (não havia etapa anterior).",
        className: "border-red-200 bg-red-50",
      })
      
      console.log('🚫 Processo cancelado - sem etapa anterior')
    }

    // ✅ LIMPAR INTERFACE
    console.log('🧹 Limpando comentários...')
    setActionComments("")
    
    // ✅ RECARREGAR DADOS - Como handleRequestApproval
    console.log('🔄 Recarregando dados do processo...')
    await reloadProcessData()
    
    // ✅ COMPORTAMENTO SIMILAR AO handleRequestApproval
    // Aguardar processamento e deixar modal aberto para feedback
    console.log('⏳ Aguardando processamento da atualização...')
    await new Promise(resolve => setTimeout(resolve, 1500))
    console.log('✅ Processo reprovado - Modal permanece aberto para revisão')
    
    // Modal permanece aberto para que usuário veja o resultado
    
  } catch (error) {
    console.error('❌ Erro ao reprovar processo:', error)
    
    // Melhor tratamento de erro
    let errorMessage = "Não foi possível reprovar o processo. Tente novamente."
    
    if (error instanceof Error) {
      if (error.message.includes('anterior')) {
        errorMessage = "Não foi possível reprovar: não há etapa anterior disponível."
      } else if (error.message.includes('permission')) {
        errorMessage = "Você não tem permissão para reprovar este processo."
      }
    }
    
    toast({
      title: "Erro ao reprovar",
      description: errorMessage,
      variant: "destructive",
      duration: 5000,
    })
  } finally {
    console.log('🏁 Finalizando processamento da reprovação')
    setIsProcessingAction(false)
    console.log('=== FIM handleReject ===')
  }
}

// ========================================
// PATCH PARA MELHORAR CAMPO DE COMENTÁRIOS
// ========================================
// Substitua a div do campo de comentários por esta versão melhorada:

/*
<div>
  <Label htmlFor="action-comments" className="flex items-center gap-2">
    Comentários 
    {requiresComments('reject') && (
      <Badge variant="destructive" className="text-xs px-2 py-1">
        ⚠️ Obrigatório para reprovação
      </Badge>
    )}
    {requiresComments('reject') || '(opcional)'}
  </Label>
  
  <Textarea
    id="action-comments"
    placeholder={
      requiresComments('reject') 
        ? "⚠️ Comentários são obrigatórios para reprovação. Explique o motivo da rejeição..."
        : "Adicione comentários sobre a ação..."
    }
    value={actionComments}
    onChange={(e) => setActionComments(e.target.value)}
    rows={3}
    className={`mt-1 transition-colors ${
      requiresComments('reject') && !actionComments.trim() 
        ? 'border-red-300 focus:border-red-500 bg-red-50' 
        : ''
    }`}
  />
  
  {requiresComments('reject') && !actionComments.trim() && (
    <Alert className="mt-2 border-red-200 bg-red-50">
      <AlertTriangle className="h-4 w-4 text-red-600" />
      <AlertDescription className="text-red-700">
        ⚠️ Comentários são necessários para reprovar o processo
      </AlertDescription>
    </Alert>
  )}
  
  {actionComments.trim() && requiresComments('reject') && (
    <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
      <CheckCircle className="h-4 w-4" />
      Comentários preenchidos ✓
    </p>
  )}
</div>
*/

