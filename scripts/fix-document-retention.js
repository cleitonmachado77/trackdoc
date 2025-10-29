#!/usr/bin/env node

/**
 * Script para corrigir o sistema de retenção de documentos
 * 
 * Problemas corrigidos:
 * 1. Documentos não são atualizados quando tipo de documento muda retenção
 * 2. Documentos sem tipo de documento ficam bloqueados para exclusão
 * 3. Documentos com retention_period = 0 ainda ficam bloqueados
 */

const { createClient } = require('@supabase/supabase-js')
const path = require('path')
const fs = require('fs')

// Carregar variáveis de ambiente
const envPath = path.join(__dirname, '..', '.env.local')
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath })
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function main() {
  console.log('🔧 Iniciando correção do sistema de retenção de documentos...\n')

  try {
    // 1. Verificar estado atual
    console.log('📊 Verificando estado atual dos documentos...')
    
    const { data: allDocs, error: allDocsError } = await supabase
      .from('documents')
      .select('id, document_type_id, retention_period, retention_end_date, created_at')
    
    if (allDocsError) {
      throw allDocsError
    }

    const totalDocs = allDocs.length
    const docsWithType = allDocs.filter(d => d.document_type_id).length
    const docsWithoutType = allDocs.filter(d => !d.document_type_id).length
    const docsWithRetention = allDocs.filter(d => d.retention_period > 0).length
    const docsWithoutRetention = allDocs.filter(d => !d.retention_period || d.retention_period === 0).length

    console.log(`   Total de documentos: ${totalDocs}`)
    console.log(`   Documentos com tipo: ${docsWithType}`)
    console.log(`   Documentos sem tipo: ${docsWithoutType}`)
    console.log(`   Documentos com retenção: ${docsWithRetention}`)
    console.log(`   Documentos sem retenção: ${docsWithoutRetention}\n`)

    // 2. Executar a migração
    console.log('🚀 Executando migração de correção...')
    
    const migrationSQL = `
      -- 1. Função para atualizar documentos quando um tipo de documento é alterado
      CREATE OR REPLACE FUNCTION update_documents_on_type_change()
      RETURNS TRIGGER AS $$
      BEGIN
        -- Atualizar documentos existentes deste tipo quando retention_period ou approval_required mudarem
        IF OLD.retention_period IS DISTINCT FROM NEW.retention_period OR 
           OLD.approval_required IS DISTINCT FROM NEW.approval_required THEN
          
          UPDATE public.documents 
          SET 
            retention_period = NEW.retention_period,
            approval_required = NEW.approval_required,
            -- Recalcular retention_end_date baseado no novo período
            retention_end_date = CASE 
              WHEN NEW.retention_period > 0 THEN 
                created_at + (NEW.retention_period || ' months')::INTERVAL
              ELSE 
                NULL 
            END,
            updated_at = NOW()
          WHERE document_type_id = NEW.id;
          
          RAISE NOTICE 'Atualizados documentos do tipo: % (ID: %)', NEW.name, NEW.id;
        END IF;
        
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      -- 2. Criar trigger para atualizar documentos quando tipo é alterado
      DROP TRIGGER IF EXISTS trigger_update_documents_on_type_change ON document_types;
      CREATE TRIGGER trigger_update_documents_on_type_change
        AFTER UPDATE ON document_types
        FOR EACH ROW
        EXECUTE FUNCTION update_documents_on_type_change();
    `

    const { error: migrationError } = await supabase.rpc('exec_sql', { sql: migrationSQL })
    
    if (migrationError) {
      throw migrationError
    }

    console.log('✅ Trigger criado com sucesso\n')

    // 3. Corrigir documentos sem tipo
    console.log('🔓 Liberando documentos sem tipo para exclusão...')
    
    const { data: fixResult, error: fixError } = await supabase.rpc('exec_sql', { 
      sql: `
        UPDATE public.documents 
        SET 
          retention_period = 0,
          retention_end_date = NULL,
          updated_at = NOW()
        WHERE document_type_id IS NULL 
          AND (retention_period IS NULL OR retention_period > 0);
        
        SELECT COUNT(*) as affected_count 
        FROM public.documents 
        WHERE document_type_id IS NULL AND retention_period = 0;
      `
    })
    
    if (fixError) {
      throw fixError
    }

    console.log('✅ Documentos sem tipo liberados para exclusão\n')

    // 4. Atualizar documentos existentes baseado nos tipos atuais
    console.log('🔄 Sincronizando documentos com seus tipos...')
    
    const { error: syncError } = await supabase.rpc('exec_sql', { 
      sql: `
        UPDATE public.documents 
        SET 
          retention_period = COALESCE(
            (SELECT dt.retention_period 
             FROM document_types dt 
             WHERE dt.id = documents.document_type_id), 
            CASE 
              WHEN document_type_id IS NULL THEN 0  -- Sem tipo = sem retenção
              ELSE 24  -- Padrão para tipos existentes
            END
          ),
          approval_required = COALESCE(
            (SELECT dt.approval_required 
             FROM document_types dt 
             WHERE dt.id = documents.document_type_id), 
            false
          ),
          -- Recalcular retention_end_date
          retention_end_date = CASE 
            WHEN document_type_id IS NULL THEN NULL  -- Sem tipo = sem data de retenção
            WHEN COALESCE(
              (SELECT dt.retention_period 
               FROM document_types dt 
               WHERE dt.id = documents.document_type_id), 
              24
            ) > 0 THEN 
              created_at + (COALESCE(
                (SELECT dt.retention_period 
                 FROM document_types dt 
                 WHERE dt.id = documents.document_type_id), 
                24
              ) || ' months')::INTERVAL
            ELSE 
              NULL 
          END
        WHERE retention_period IS NULL 
           OR approval_required IS NULL 
           OR retention_end_date IS NULL;
      `
    })
    
    if (syncError) {
      throw syncError
    }

    console.log('✅ Documentos sincronizados com seus tipos\n')

    // 5. Verificar resultado final
    console.log('📊 Verificando resultado final...')
    
    const { data: finalDocs, error: finalDocsError } = await supabase
      .from('documents')
      .select('id, document_type_id, retention_period, retention_end_date')
    
    if (finalDocsError) {
      throw finalDocsError
    }

    const finalDocsWithType = finalDocs.filter(d => d.document_type_id).length
    const finalDocsWithoutType = finalDocs.filter(d => !d.document_type_id).length
    const finalDocsWithRetention = finalDocs.filter(d => d.retention_period > 0).length
    const finalDocsWithoutRetention = finalDocs.filter(d => !d.retention_period || d.retention_period === 0).length
    const finalDocsWithoutTypeAndNoRetention = finalDocs.filter(d => !d.document_type_id && (!d.retention_period || d.retention_period === 0)).length

    console.log(`   Total de documentos: ${finalDocs.length}`)
    console.log(`   Documentos com tipo: ${finalDocsWithType}`)
    console.log(`   Documentos sem tipo: ${finalDocsWithoutType}`)
    console.log(`   Documentos com retenção: ${finalDocsWithRetention}`)
    console.log(`   Documentos sem retenção: ${finalDocsWithoutRetention}`)
    console.log(`   Documentos sem tipo E sem retenção: ${finalDocsWithoutTypeAndNoRetention}\n`)

    console.log('🎉 Correção do sistema de retenção concluída com sucesso!')
    console.log('\n📝 Resumo das correções aplicadas:')
    console.log('   ✅ Trigger criado para atualizar documentos quando tipo muda')
    console.log('   ✅ Documentos sem tipo liberados para exclusão')
    console.log('   ✅ Documentos sincronizados com configurações dos tipos')
    console.log('   ✅ Lógica de retenção corrigida no frontend')

  } catch (error) {
    console.error('❌ Erro durante a correção:', error)
    process.exit(1)
  }
}

main()