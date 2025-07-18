import { createClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const next = searchParams.get('next') ?? '/'

  console.log('🔄 Auth Callback - Params:', { code, token_hash, type })

  if (code) {
    const supabase = createClient()
    
    // Échange du code pour une session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && data.user) {
      console.log('✅ Email confirmé pour:', data.user.email)
      
      // Vérifier si l'utilisateur a un profil
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_type, full_name')
        .eq('id', data.user.id)
        .single()

      console.log('📋 Profil trouvé:', profile)

      if (profile) {
        // Rediriger vers le dashboard approprié avec confirmation
        const dashboardUrl = profile.user_type === 'client' 
          ? `${origin}/dashboard/client?confirmed=true`
          : `${origin}/dashboard/developer?confirmed=true`
        
        console.log('🎯 Redirection vers:', dashboardUrl)
        return NextResponse.redirect(dashboardUrl)
      } else {
        // Pas de profil trouvé, rediriger vers l'accueil avec message
        console.log('⚠️ Pas de profil trouvé, création automatique...')
        
        // Créer un profil basique automatiquement
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            email: data.user.email,
            full_name: data.user.user_metadata?.full_name || data.user.email,
            user_type: data.user.user_metadata?.user_type || 'developer',
            phone: data.user.user_metadata?.phone,
            created_at: new Date().toISOString()
          })

        if (profileError) {
          console.error('❌ Erreur création profil:', profileError)
          return NextResponse.redirect(`${origin}/?error=profile_creation_failed`)
        }

        console.log('✅ Profil créé automatiquement')
        const userType = data.user.user_metadata?.user_type || 'developer'
        const dashboardUrl = userType === 'client' 
          ? `${origin}/dashboard/client?welcome=true&confirmed=true`
          : `${origin}/dashboard/developer?welcome=true&confirmed=true`
        
        return NextResponse.redirect(dashboardUrl)
      }
    } else {
      console.error('❌ Erreur échange code:', error)
      return NextResponse.redirect(`${origin}/auth/login?error=email_confirmation_failed`)
    }
  }

  // Si pas de code, vérifier si l'utilisateur est déjà connecté
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  
  if (session?.user) {
    console.log('✅ Utilisateur déjà connecté, redirection vers page d\'accueil')
    return NextResponse.redirect(`${origin}/?login=success`)
  }

  // Fallback - redirection vers la page d'accueil avec info
  console.log('⚠️ Callback sans code valide, redirection vers accueil')
  return NextResponse.redirect(`${origin}/?info=please_check_email`)
} 