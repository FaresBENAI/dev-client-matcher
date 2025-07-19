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
      
      // SYSTÈME DE CRÉATION AUTOMATIQUE RENFORCÉ
      await ensureUserProfileExists(data.user, supabase)
      
      // Vérifier le profil après création
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_type, full_name')
        .eq('id', data.user.id)
        .single()

      console.log('📋 Profil final trouvé:', profile)

      if (profile) {
        // Rediriger vers le dashboard approprié avec confirmation
        const dashboardUrl = profile.user_type === 'client' 
          ? `${origin}/dashboard/client?confirmed=true`
          : `${origin}/dashboard/developer?confirmed=true`
        
        console.log('🎯 Redirection vers:', dashboardUrl)
        return NextResponse.redirect(dashboardUrl)
      } else {
        console.error('❌ Échec création profil après plusieurs tentatives')
        return NextResponse.redirect(`${origin}/?error=profile_creation_failed`)
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
    // Utilisateur déjà connecté, rediriger selon le type
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('id', session.user.id)
      .single()

    if (profile) {
      const dashboardUrl = profile.user_type === 'client' 
        ? `${origin}/dashboard/client`
        : `${origin}/dashboard/developer`
      return NextResponse.redirect(dashboardUrl)
    }
  }

  // Redirection par défaut
  return NextResponse.redirect(`${origin}${next}`)
}

/**
 * Système robuste de création de profils utilisateur
 * Fonctionne même si les triggers de base de données sont cassés
 */
async function ensureUserProfileExists(user: any, supabase: any) {
  try {
    console.log('🔄 Vérification/création profil pour:', user.email)
    
    // 1. Vérifier si le profil existe déjà
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (existingProfile) {
      console.log('✅ Profil existe déjà')
      
      // Si c'est un développeur, s'assurer que le profil développeur existe aussi
      if (existingProfile.user_type === 'developer') {
        await ensureDeveloperProfileExists(user, supabase)
      }
      return
    }

    console.log('⚠️ Profil manquant, création automatique...')
    
    // 2. Extraire les métadonnées utilisateur
    const metadata = user.user_metadata || {}
    const userType = metadata.user_type || 'developer' // défaut développeur
    
    // 3. Créer le profil de base
    const profileData = {
      id: user.id,
      email: user.email,
      full_name: metadata.full_name || user.email?.split('@')[0] || 'Utilisateur',
      user_type: userType,
      phone: metadata.phone || null,
      avatar_url: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    console.log('📝 Création profil de base:', profileData)

    const { data: createdProfile, error: profileError } = await supabase
      .from('profiles')
      .insert(profileData)
      .select()
      .single()

    if (profileError) {
      console.error('❌ Erreur création profil de base:', profileError)
      throw profileError
    }

    console.log('✅ Profil de base créé:', createdProfile)

    // 4. Si c'est un développeur, créer aussi le profil développeur
    if (userType === 'developer') {
      await ensureDeveloperProfileExists(user, supabase)
    }

  } catch (error) {
    console.error('❌ Erreur dans ensureUserProfileExists:', error)
    throw error
  }
}

/**
 * Création/vérification du profil développeur étendu
 */
async function ensureDeveloperProfileExists(user: any, supabase: any) {
  try {
    console.log('🔄 Vérification profil développeur pour:', user.email)
    
    // Vérifier si existe déjà
    const { data: existingDevProfile } = await supabase
      .from('developer_profiles')
      .select('id')
      .eq('id', user.id)
      .single()

    if (existingDevProfile) {
      console.log('✅ Profil développeur existe déjà')
      return
    }

    console.log('⚠️ Profil développeur manquant, création...')
    
    // Extraire les métadonnées
    const metadata = user.user_metadata || {}
    
    const developerProfileData = {
      id: user.id,
      title: metadata.title || metadata.full_name || 'Développeur',
      bio: metadata.bio || '',
      location: '',
      phone: metadata.phone || '',
      experience_years: metadata.experience_years || 0,
      daily_rate: metadata.daily_rate || null,
      daily_rate_defined: metadata.daily_rate_defined !== false,
      availability: 'available',
      skills: Array.isArray(metadata.skills) ? metadata.skills : [],
      specializations: Array.isArray(metadata.specializations) ? metadata.specializations : [],
      languages: [],
      github_url: metadata.github_url || '',
      linkedin_url: metadata.linkedin_url || '',
      portfolio_url: metadata.portfolio_url || '',
      website: metadata.portfolio_url || '',
      average_rating: 0,
      total_ratings: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    console.log('📝 Création profil développeur:', developerProfileData)

    const { data: createdDevProfile, error: devProfileError } = await supabase
      .from('developer_profiles')
      .insert(developerProfileData)
      .select()
      .single()

    if (devProfileError) {
      console.error('❌ Erreur création profil développeur:', devProfileError)
      // Ne pas faire planter tout le processus pour ça
      return
    }

    console.log('✅ Profil développeur créé:', createdDevProfile)

  } catch (error) {
    console.error('❌ Erreur dans ensureDeveloperProfileExists:', error)
    // Ne pas faire planter tout le processus
  }
} 