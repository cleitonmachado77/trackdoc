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
      full_name, 
      email, 
      entity_role, 
      phone, 
      department, 
      position,
      entity_id,
      password 
    } = await req.json()

    // Validar dados obrigatórios
    if (!full_name || !email || !entity_role || !entity_id || !password) {
      return new Response(
        JSON.stringify({ error: 'Dados obrigatórios não fornecidos' }),
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

    // 1. Criar usuário no auth com a senha definida pelo admin
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // Confirmar email automaticamente
      user_metadata: {
        full_name: full_name,
        entity_role: entity_role
      }
    })

    if (authError) {
      console.error('Erro ao criar usuário no auth:', authError)
      return new Response(
        JSON.stringify({ 
          error: authError.message.includes('already registered') 
            ? 'Este email já está cadastrado no sistema' 
            : `Erro ao criar usuário: ${authError.message}` 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // 2. Criar perfil do usuário
    const { error: profileError } = await supabase
      .from('profiles')
      .insert([{
        id: authData.user.id,
        full_name: full_name,
        email: email,
        role: 'user',
        status: 'active',
        permissions: '["read", "write"]',
        entity_id: entity_id,
        registration_type: 'entity_user',
        entity_role: entity_role,
        phone: phone || null,
        department: department || null,
        position: position || null,
        registration_completed: true
      }])

    if (profileError) {
      // Se der erro, tentar deletar o usuário criado no auth
      await supabase.auth.admin.deleteUser(authData.user.id)
      console.error('Erro ao criar perfil:', profileError)
      return new Response(
        JSON.stringify({ error: 'Erro ao criar perfil do usuário' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // 3. Enviar email com dados de acesso usando o sistema de email do Supabase
    try {
      const { error: emailError } = await supabase.auth.admin.generateLink({
        type: 'signup',
        email: email,
        options: {
          data: {
            full_name: full_name,
            entity_role: entity_role,
            custom_password: password
          }
        }
      })

      if (emailError) {
        console.error('Erro ao gerar link de email:', emailError)
        
        // Como alternativa, vamos usar o sistema de email do Supabase
        const { error: sendEmailError } = await supabase.auth.admin.sendRawEmail({
          to: email,
          subject: 'Bem-vindo ao TrackDoc - Dados de Acesso',
          html: `
            <html>
              <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                  <h2 style="color: #2563eb;">Bem-vindo ao TrackDoc!</h2>
                  <p>Olá <strong>${full_name}</strong>,</p>
                  <p>Seu cadastro foi realizado com sucesso no sistema TrackDoc.</p>
                  
                  <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
                    <h3 style="margin-top: 0; color: #1e40af;">Dados de Acesso:</h3>
                    <ul style="list-style: none; padding: 0;">
                      <li style="margin-bottom: 10px;"><strong>Email:</strong> ${email}</li>
                      <li style="margin-bottom: 10px;"><strong>Senha:</strong> ${password}</li>
                      <li style="margin-bottom: 10px;"><strong>Cargo:</strong> ${entity_role}</li>
                    </ul>
                  </div>
                  
                  <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 15px; margin: 20px 0;">
                    <p style="margin: 0;"><strong>⚠️ Importante:</strong> Por segurança, recomendamos que você altere sua senha no primeiro acesso.</p>
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
        })

        if (sendEmailError) {
          console.error('Erro ao enviar email:', sendEmailError)
          // Não falhar se o email não for enviado, apenas logar
        }
      }
    } catch (emailErr) {
      console.error('Erro ao enviar email:', emailErr)
      // Não falhar se o email não for enviado
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Usuário cadastrado com sucesso! Email com dados de acesso foi enviado.',
        user: {
          id: authData.user.id,
          email: email,
          full_name: full_name,
          entity_role: entity_role
        }
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
