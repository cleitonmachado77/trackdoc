-- =====================================================
-- MONITORAMENTO CONTÍNUO DO SISTEMA DE CADASTRO
-- =====================================================
-- Scripts para monitorar e manter a saúde do sistema

-- =====================================================
-- 1. DASHBOARD DE STATUS DO SISTEMA
-- =====================================================

CREATE OR REPLACE VIEW dashboard_cadastro_status AS
SELECT 
  -- Estatísticas gerais
  (SELECT COUNT(*) FROM profiles) as total_usuarios,
  (SELECT COUNT(*) FROM profiles WHERE status = 'active') as usuarios_ativos,
  (SELECT COUNT(*) FROM profiles WHERE status = 'inactive') as usuarios_inativos,
  (SELECT COUNT(*) FROM entity_invitations WHERE status = 'pending') as convites_pendentes,
  
  -- Problemas potenciais
  (SELECT COUNT(*) 
   FROM profiles p 
   JOIN auth.users au ON p.id = au.id 
   WHERE p.status = 'inactive' AND au.email_confirmed_at IS NOT NULL) as usuarios_confirmados_mas_inativos,
   
  (SELECT COUNT(*) 
   FROM entities e 
   WHERE e.current_users != (
     SELECT COUNT(*) FROM profiles p WHERE p.entity_id = e.id AND p.status = 'active'
   )) as entidades_contador_incorreto,
   
  -- Últimas atividades
  (SELECT MAX(created_at) FROM profiles) as ultimo_cadastro,
  (SELECT MAX(updated_at) FROM profiles WHERE status = 'active') as ultima_ativacao,
  
  -- Status geral
  CASE 
    WHEN (SELECT COUNT(*) FROM profiles p JOIN auth.users au ON p.id = au.id WHERE p.status = 'inactive' AND au.email_confirmed_at IS NOT NULL) = 0
         AND (SELECT COUNT(*) FROM entities e WHERE e.current_users != (SELECT COUNT(*) FROM profiles p WHERE p.entity_id = e.id AND p.status = 'active')) = 0
    THEN 'SAUDÁVEL'
    ELSE 'REQUER ATENÇÃO'
  END as status_sistema;

-- =====================================================
-- 2. FUNÇÃO DE MANUTENÇÃO AUTOMÁTICA
-- =====================================================

CREATE OR REPLACE FUNCTION manutencao_automatica_sistema()
RETURNS TABLE(
  operacao TEXT,
  registros_afetados INTEGER,
  status TEXT,
  detalhes TEXT
) AS $$
DECLARE
  usuarios_corrigidos INTEGER := 0;
  contadores_corrigidos INTEGER := 0;
  convites_sincronizados INTEGER := 0;
BEGIN
  -- 1. Corrigir usuários com status inconsistente
  UPDATE profiles 
  SET 
    status = 'active',
    registration_completed = true,
    permissions = COALESCE(permissions, '["read", "write"]'::jsonb),
    updated_at = NOW()
  FROM auth.users au
  WHERE profiles.id = au.id
    AND profiles.status = 'inactive'
    AND au.email_confirmed_at IS NOT NULL;
  
  GET DIAGNOSTICS usuarios_corrigidos = ROW_COUNT;
  
  RETURN QUERY SELECT 
    'Correção de Status' as operacao,
    usuarios_corrigidos as registros_afetados,
    CASE WHEN usuarios_corrigidos > 0 THEN 'CORRIGIDO' ELSE 'OK' END as status,
    format('Ativados %s usuários que confirmaram email', usuarios_corrigidos) as detalhes;
  
  -- 2. Sincronizar contadores de entidade
  UPDATE entities 
  SET 
    current_users = (
      SELECT COUNT(*) 
      FROM profiles 
      WHERE entity_id = entities.id AND status = 'active'
    ),
    updated_at = NOW()
  WHERE current_users != (
    SELECT COUNT(*) 
    FROM profiles 
    WHERE entity_id = entities.id AND status = 'active'
  );
  
  GET DIAGNOSTICS contadores_corrigidos = ROW_COUNT;
  
  RETURN QUERY SELECT 
    'Sincronização de Contadores' as operacao,
    contadores_corrigidos as registros_afetados,
    CASE WHEN contadores_corrigidos > 0 THEN 'CORRIGIDO' ELSE 'OK' END as status,
    format('Sincronizados %s contadores de entidade', contadores_corrigidos) as detalhes;
  
  -- 3. Sincronizar convites
  UPDATE entity_invitations 
  SET 
    status = 'accepted',
    accepted_at = NOW(),
    updated_at = NOW()
  FROM profiles p
  WHERE entity_invitations.email = p.email 
    AND entity_invitations.entity_id = p.entity_id
    AND entity_invitations.status = 'pending'
    AND p.status = 'active';
  
  GET DIAGNOSTICS convites_sincronizados = ROW_COUNT;
  
  RETURN QUERY SELECT 
    'Sincronização de Convites' as operacao,
    convites_sincronizados as registros_afetados,
    CASE WHEN convites_sincronizados > 0 THEN 'CORRIGIDO' ELSE 'OK' END as status,
    format('Sincronizados %s convites pendentes', convites_sincronizados) as detalhes;
  
  -- 4. Limpeza de convites expirados
  UPDATE entity_invitations 
  SET 
    status = 'expired',
    updated_at = NOW()
  WHERE status = 'pending' 
    AND expires_at < NOW();
  
  GET DIAGNOSTICS convites_sincronizados = ROW_COUNT;
  
  RETURN QUERY SELECT 
    'Limpeza de Convites Expirados' as operacao,
    convites_sincronizados as registros_afetados,
    CASE WHEN convites_sincronizados > 0 THEN 'LIMPO' ELSE 'OK' END as status,
    format('Marcados %s convites como expirados', convites_sincronizados) as detalhes;
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 3. RELATÓRIO DETALHADO DE USUÁRIOS
-- =====================================================

CREATE OR REPLACE VIEW relatorio_usuarios_detalhado AS
SELECT 
  p.id,
  p.full_name,
  p.email,
  p.status as profile_status,
  p.registration_completed,
  p.entity_role,
  e.name as entity_name,
  au.email_confirmed_at,
  au.confirmed_at,
  ei.status as invitation_status,
  ei.created_at as invitation_date,
  CASE 
    WHEN p.status = 'active' AND au.email_confirmed_at IS NOT NULL THEN 'OK'
    WHEN p.status = 'inactive' AND au.email_confirmed_at IS NOT NULL THEN 'PRECISA_ATIVACAO'
    WHEN p.status = 'inactive' AND au.email_confirmed_at IS NULL THEN 'AGUARDANDO_CONFIRMACAO'
    ELSE 'VERIFICAR'
  END as status_analise,
  p.created_at as profile_created,
  p.updated_at as profile_updated
FROM profiles p
LEFT JOIN auth.users au ON p.id = au.id
LEFT JOIN entities e ON p.entity_id = e.id
LEFT JOIN entity_invitations ei ON p.email = ei.email AND p.entity_id = ei.entity_id
ORDER BY p.created_at DESC;

-- =====================================================
-- 4. FUNÇÃO PARA AUDITORIA DE CADASTROS
-- =====================================================

CREATE OR REPLACE FUNCTION auditoria_cadastros(dias_atras INTEGER DEFAULT 7)
RETURNS TABLE(
  periodo TEXT,
  total_cadastros INTEGER,
  cadastros_ativados INTEGER,
  cadastros_pendentes INTEGER,
  taxa_ativacao NUMERIC,
  tempo_medio_ativacao INTERVAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    format('Últimos %s dias', dias_atras) as periodo,
    COUNT(*)::INTEGER as total_cadastros,
    COUNT(CASE WHEN p.status = 'active' THEN 1 END)::INTEGER as cadastros_ativados,
    COUNT(CASE WHEN p.status = 'inactive' THEN 1 END)::INTEGER as cadastros_pendentes,
    ROUND(
      (COUNT(CASE WHEN p.status = 'active' THEN 1 END)::NUMERIC / 
       NULLIF(COUNT(*)::NUMERIC, 0)) * 100, 2
    ) as taxa_ativacao,
    AVG(
      CASE 
        WHEN p.status = 'active' AND au.email_confirmed_at IS NOT NULL 
        THEN au.email_confirmed_at - p.created_at 
      END
    ) as tempo_medio_ativacao
  FROM profiles p
  LEFT JOIN auth.users au ON p.id = au.id
  WHERE p.created_at >= NOW() - (dias_atras || ' days')::INTERVAL
    AND p.registration_type IN ('entity_user', 'entity_admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. ALERTAS AUTOMÁTICOS
-- =====================================================

CREATE OR REPLACE FUNCTION verificar_alertas_sistema()
RETURNS TABLE(
  tipo_alerta TEXT,
  severidade TEXT,
  quantidade INTEGER,
  descricao TEXT,
  acao_recomendada TEXT
) AS $$
BEGIN
  -- Alerta: Usuários confirmados mas inativos
  RETURN QUERY
  SELECT 
    'USUARIOS_CONFIRMADOS_INATIVOS' as tipo_alerta,
    'ALTA' as severidade,
    COUNT(*)::INTEGER as quantidade,
    'Usuários que confirmaram email mas ainda estão com status inactive' as descricao,
    'Execute: SELECT * FROM manutencao_automatica_sistema();' as acao_recomendada
  FROM profiles p
  JOIN auth.users au ON p.id = au.id
  WHERE p.status = 'inactive' AND au.email_confirmed_at IS NOT NULL
  HAVING COUNT(*) > 0;
  
  -- Alerta: Contadores de entidade incorretos
  RETURN QUERY
  SELECT 
    'CONTADORES_ENTIDADE_INCORRETOS' as tipo_alerta,
    'MEDIA' as severidade,
    COUNT(*)::INTEGER as quantidade,
    'Entidades com contador de usuários incorreto' as descricao,
    'Execute: SELECT * FROM manutencao_automatica_sistema();' as acao_recomendada
  FROM entities e
  WHERE e.current_users != (
    SELECT COUNT(*) FROM profiles p WHERE p.entity_id = e.id AND p.status = 'active'
  )
  HAVING COUNT(*) > 0;
  
  -- Alerta: Muitos convites pendentes antigos
  RETURN QUERY
  SELECT 
    'CONVITES_PENDENTES_ANTIGOS' as tipo_alerta,
    'BAIXA' as severidade,
    COUNT(*)::INTEGER as quantidade,
    'Convites pendentes há mais de 7 dias' as descricao,
    'Verificar se emails estão sendo entregues' as acao_recomendada
  FROM entity_invitations
  WHERE status = 'pending' AND created_at < NOW() - INTERVAL '7 days'
  HAVING COUNT(*) > 0;
  
  -- Se não há alertas, retornar status OK
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT 
      'SISTEMA_SAUDAVEL' as tipo_alerta,
      'INFO' as severidade,
      0 as quantidade,
      'Nenhum problema detectado no sistema' as descricao,
      'Nenhuma ação necessária' as acao_recomendada;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. COMANDOS ÚTEIS PARA MONITORAMENTO
-- =====================================================

-- Ver dashboard geral
-- SELECT * FROM dashboard_cadastro_status;

-- Executar manutenção automática
-- SELECT * FROM manutencao_automatica_sistema();

-- Ver relatório detalhado de usuários
-- SELECT * FROM relatorio_usuarios_detalhado WHERE status_analise != 'OK';

-- Auditoria dos últimos 7 dias
-- SELECT * FROM auditoria_cadastros(7);

-- Verificar alertas do sistema
-- SELECT * FROM verificar_alertas_sistema();

-- =====================================================
-- 7. GRANTS E PERMISSÕES
-- =====================================================

GRANT SELECT ON dashboard_cadastro_status TO authenticated, service_role;
GRANT SELECT ON relatorio_usuarios_detalhado TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION manutencao_automatica_sistema() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION auditoria_cadastros(INTEGER) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION verificar_alertas_sistema() TO authenticated, service_role;

-- =====================================================
-- EXECUÇÃO INICIAL
-- =====================================================

-- Executar manutenção inicial
SELECT 'EXECUTANDO MANUTENÇÃO INICIAL...' as status;
SELECT * FROM manutencao_automatica_sistema();

-- Verificar status do sistema
SELECT 'STATUS DO SISTEMA:' as info;
SELECT * FROM dashboard_cadastro_status;

-- Verificar alertas
SELECT 'ALERTAS DO SISTEMA:' as info;
SELECT * FROM verificar_alertas_sistema();

SELECT 
  'MONITORAMENTO CONFIGURADO' as status,
  'Sistema pronto para monitoramento contínuo' as message,
  NOW() as timestamp;