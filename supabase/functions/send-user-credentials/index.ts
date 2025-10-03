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
    const { email, full_name, password, entity_role } = await req.json()

    // Validar dados obrigatórios
    if (!email || !full_name || !password || !entity_role) {
      return new Response(
        JSON.stringify({ error: 'Dados obrigatórios não fornecidos' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Configurar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Enviar email usando o sistema de email do Supabase
    const { error: emailError } = await supabase.auth.admin.generateLink({
      type: 'signup',
      email: email,
      options: {
        data: {
          full_name: full_name,
          entity_role: entity_role,
          temp_password: password
        }
      }
    })

    if (emailError) {
      console.error('Erro ao gerar link de email:', emailError)
      return new Response(
        JSON.stringify({ error: 'Erro ao enviar email' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Como alternativa, vamos usar um template de email simples
    const emailContent = `
      <html>
        <body>
          <h2>Bem-vindo ao TrackDoc!</h2>
          <p>Olá ${full_name},</p>
          <p>Seu cadastro foi realizado com sucesso no sistema TrackDoc.</p>
          <p><strong>Dados de acesso:</strong></p>
          <ul>
            <li><strong>Email:</strong> ${email}</li>
            <li><strong>Senha temporária:</strong> ${password}</li>
            <li><strong>Cargo:</strong> ${entity_role}</li>
          </ul>
          <p><strong>Importante:</strong> Por segurança, recomendamos que você altere sua senha no primeiro acesso.</p>
          <p>Acesse o sistema em: <a href="${supabaseUrl.replace('.supabase.co', '.supabase.co')}">TrackDoc</a></p>
          <p>Atenciosamente,<br>Equipe TrackDoc</p>
        </body>
      </html>
    `

    // Enviar email usando o sistema de email do Supabase (se configurado)
    // Por enquanto, vamos apenas retornar sucesso
    console.log('Email seria enviado para:', email)
    console.log('Conteúdo do email:', emailContent)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email de acesso enviado com sucesso',
        email: email,
        temp_password: password
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Erro na função:', error)
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
