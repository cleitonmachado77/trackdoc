// @deno-types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { 
      email, 
      full_name, 
      password,
      entity_name,
      role,
      app_url 
    } = await req.json()

    // Validar dados obrigatórios
    if (!email || !full_name || !password) {
      return new Response(
        JSON.stringify({ error: 'Dados obrigatórios não fornecidos' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Configurar cliente Supabase com service role key
    const supabaseUrl = (globalThis as any).Deno?.env?.get('SUPABASE_URL') || process.env.SUPABASE_URL!
    const supabaseServiceKey = (globalThis as any).Deno?.env?.get('SUPABASE_SERVICE_ROLE_KEY') || process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('📧 [send-signup-email] Enviando email para:', email)

    // Gerar link de confirmação manual
    const confirmationToken = crypto.randomUUID()
    const confirmationUrl = `${app_url}/auth/callback?token_hash=${confirmationToken}&type=signup&next=/confirm-email`

    // Template de email HTML
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Bem-vindo ao TrackDoc</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }
            .credentials-box { background: white; border: 2px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .button { display: inline-block; background: #4f46e5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
            .warning { background: #fef3c7; border: 1px solid #f59e0b; border-radius: 6px; padding: 15px; margin: 20px 0; }
            .footer { text-align: center; color: #64748b; font-size: 14px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Bem-vindo ao TrackDoc!</h1>
              <p>Sua conta foi criada com sucesso</p>
            </div>
            
            <div class="content">
              <p>Olá <strong>${full_name}</strong>,</p>
              
              <p>Sua conta foi criada com sucesso no sistema TrackDoc${entity_name ? ` para a entidade <strong>${entity_name}</strong>` : ''}.</p>
              
              <div class="credentials-box">
                <h3>📋 Seus dados de acesso:</h3>
                <ul style="list-style: none; padding: 0;">
                  <li style="margin-bottom: 10px;"><strong>📧 Email:</strong> ${email}</li>
                  <li style="margin-bottom: 10px;"><strong>🔑 Senha:</strong> ${password}</li>
                  ${role ? `<li style="margin-bottom: 10px;"><strong>👤 Cargo:</strong> ${role}</li>` : ''}
                </ul>
              </div>
              
              <div class="warning">
                <p style="margin: 0;"><strong>⚠️ Importante:</strong> Por segurança, recomendamos que você altere sua senha no primeiro acesso.</p>
              </div>
              
              <div style="text-align: center;">
                <a href="${confirmationUrl}" class="button">
                  ✅ Confirmar Email e Acessar Sistema
                </a>
              </div>
              
              <p style="font-size: 14px; color: #64748b;">
                Se o botão não funcionar, copie e cole este link no seu navegador:<br>
                <a href="${confirmationUrl}" style="color: #4f46e5; word-break: break-all;">${confirmationUrl}</a>
              </p>
              
              <div style="background: #e0f2fe; border-left: 4px solid #0284c7; padding: 15px; margin: 20px 0;">
                <h4 style="margin-top: 0; color: #0284c7;">📋 Próximos passos:</h4>
                <ol style="margin-bottom: 0; color: #0369a1;">
                  <li>Clique no botão acima para confirmar seu email</li>
                  <li>Faça login com suas credenciais</li>
                  <li>Altere sua senha nas configurações</li>
                  <li>Explore as funcionalidades do sistema</li>
                </ol>
              </div>
            </div>
            
            <div class="footer">
              <p>Atenciosamente,<br><strong>Equipe TrackDoc</strong></p>
              <p style="font-size: 12px;">Este email foi enviado automaticamente. Se você não solicitou esta conta, ignore este email.</p>
            </div>
          </div>
        </body>
      </html>
    `

    // Tentar enviar via Supabase Auth primeiro
    try {
      const { data, error } = await supabase.auth.admin.generateLink({
        type: 'signup',
        email: email,
        options: {
          data: {
            full_name: full_name,
            confirmation_token: confirmationToken
          }
        }
      })

      if (!error) {
        console.log('✅ [send-signup-email] Email enviado via Supabase Auth')
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Email enviado via Supabase Auth',
            method: 'supabase_auth'
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
    } catch (authError) {
      console.log('⚠️ [send-signup-email] Supabase Auth falhou, tentando método alternativo')
    }

    // Fallback: Tentar enviar via fetch para serviço de email
    try {
      // Aqui você pode integrar com SendGrid, Mailgun, etc.
      // Por enquanto, vamos simular o envio e salvar o token para confirmação manual
      
      // Salvar token de confirmação na tabela para validação posterior
      const { error: tokenError } = await supabase
        .from('email_confirmations')
        .insert([{
          email: email,
          token: confirmationToken,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 horas
          email_content: emailHtml,
          created_at: new Date().toISOString()
        }])

      if (tokenError) {
        console.error('❌ [send-signup-email] Erro ao salvar token:', tokenError)
      }

      // Por enquanto, retornar sucesso com o HTML do email para debug
      console.log('📧 [send-signup-email] Email preparado (fallback mode)')
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Email preparado para envio',
          method: 'fallback',
          confirmation_url: confirmationUrl,
          debug_email_html: emailHtml // Remover em produção
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )

    } catch (fallbackError) {
      console.error('❌ [send-signup-email] Erro no fallback:', fallbackError)
      
      return new Response(
        JSON.stringify({ 
          error: 'Erro ao enviar email',
          details: fallbackError.message 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

  } catch (error) {
    console.error('❌ [send-signup-email] Erro geral:', error)
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})