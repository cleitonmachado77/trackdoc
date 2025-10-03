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
      user_id,
      new_password,
      send_email = true
    } = await req.json()

    console.log('🔄 Iniciando atualização de senha para usuário:', user_id)
    console.log('📧 Enviar email:', send_email)

    // Validar dados obrigatórios
    if (!user_id || !new_password) {
      console.error('❌ Dados obrigatórios não fornecidos')
      return new Response(
        JSON.stringify({ error: 'ID do usuário e nova senha são obrigatórios' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Configurar cliente Supabase com service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('🔑 Configurando cliente Supabase com service role key')

    // 1. Atualizar senha do usuário
    console.log('🔐 Atualizando senha do usuário...')
    const { data: authData, error: authError } = await supabase.auth.admin.updateUserById(
      user_id,
      { password: new_password }
    )

    if (authError) {
      console.error('❌ Erro ao atualizar senha:', authError)
      return new Response(
        JSON.stringify({ error: `Erro ao atualizar senha: ${authError.message}` }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('✅ Senha atualizada com sucesso')
    console.log('👤 Dados do usuário:', {
      id: authData.user?.id,
      email: authData.user?.email
    })

    // 2. Se solicitado, enviar email com nova senha
    if (send_email && authData.user?.email) {
      console.log('📧 Iniciando envio de email para:', authData.user.email)

      try {
        const emailHtml = `
          <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
              <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #2563eb;">Senha Atualizada</h2>
                <p>Olá,</p>
                <p>Sua senha no sistema TrackDoc foi atualizada pelo administrador.</p>

                <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
                  <h3 style="margin-top: 0; color: #1e40af;">Nova Senha:</h3>
                  <p style="font-family: monospace; font-size: 16px; background-color: #f1f5f9; padding: 10px; border-radius: 4px;">${new_password}</p>
                </div>

                <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 15px; margin: 20px 0;">
                  <p style="margin: 0;"><strong>⚠️ Importante:</strong> Por segurança, recomendamos que você altere esta senha no próximo acesso.</p>
                </div>

                <p>Acesse o sistema em: <a href="${supabaseUrl.replace('.supabase.co', '.supabase.co')}" style="color: #2563eb; text-decoration: none;">TrackDoc</a></p>

                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
                <p style="font-size: 14px; color: #64748b;">
                  Atenciosamente,<br>
                  <strong>Equipe TrackDoc</strong>
                </p>
              </div>
            </body>
          </html>
        `

        console.log('📝 Preparando email HTML...')

        const { error: emailError } = await supabase.auth.admin.sendRawEmail({
          to: authData.user.email,
          subject: 'TrackDoc - Sua senha foi atualizada',
          html: emailHtml
        })

        if (emailError) {
          console.error('❌ Erro ao enviar email:', emailError)
          console.error('📧 Detalhes do erro:', {
            message: emailError.message,
            status: emailError.status,
            name: emailError.name
          })
          // Não falhar se o email não for enviado
        } else {
          console.log('✅ Email enviado com sucesso para:', authData.user.email)
        }
      } catch (emailErr) {
        console.error('❌ Erro ao enviar email (catch):', emailErr)
        console.error('📧 Tipo do erro:', typeof emailErr)
        console.error('📧 Mensagem do erro:', emailErr instanceof Error ? emailErr.message : 'Erro desconhecido')
        // Não falhar se o email não for enviado
      }
    } else {
      console.log('📧 Email não será enviado:', {
        send_email,
        has_email: !!authData.user?.email,
        email: authData.user?.email
      })
    }

    console.log('🎉 Processo concluído com sucesso')

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Senha atualizada com sucesso!',
        user: {
          id: authData.user.id,
          email: authData.user.email
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('❌ Erro geral na função:', error)
    console.error('📧 Tipo do erro:', typeof error)
    console.error('📧 Mensagem do erro:', error instanceof Error ? error.message : 'Erro desconhecido')

    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
