import { createClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const next = searchParams.get('next') ?? '/'

  console.log('Callback params:', { code, token_hash, type })

  if (code) {
    // Échange du code pour une session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && data.user) {
      console.log('Code exchange successful:', data.user.email)
      
      // Vérifier si l'utilisateur a un profil
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('id', data.user.id)
        .single()

      if (profile) {
        // Rediriger vers le dashboard approprié
        const dashboardUrl = profile.user_type === 'client' 
          ? `${origin}/dashboard/client`
          : `${origin}/dashboard/developer`
        return NextResponse.redirect(dashboardUrl)
      } else {
        // Pas de profil trouvé, rediriger vers l'accueil
        return NextResponse.redirect(`${origin}/?welcome=true`)
      }
    } else {
      console.error('Code exchange error:', error)
    }
  }

  if (token_hash && type) {
    // Vérification OTP pour confirmation email
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as any
    })
    
    if (!error && data.user) {
      console.log('OTP verification successful:', data.user.email)
      return NextResponse.redirect(`${origin}/?confirmed=true`)
    } else {
      console.error('OTP verification error:', error)
    }
  }

  // Redirection par défaut en cas d'erreur
  return NextResponse.redirect(`${origin}/auth/login?error=auth_callback_error`)
}
