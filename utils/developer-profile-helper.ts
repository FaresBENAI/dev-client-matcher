import { createClient } from '@/lib/supabase'

const supabase = createClient()

/**
 * Crée automatiquement un profil développeur basé sur les métadonnées utilisateur
 * si le profil n'existe pas déjà
 */
export async function ensureDeveloperProfile(userId: string): Promise<boolean> {
  try {
    console.log('🔄 Vérification du profil développeur pour:', userId)

    // Vérifier si le profil développeur existe déjà
    const { data: existingProfile } = await supabase
      .from('developer_profiles')
      .select('id')
      .eq('id', userId)
      .single()

    if (existingProfile) {
      console.log('✅ Profil développeur existe déjà')
      return true
    }

    console.log('⚠️ Profil développeur manquant, création...')

    // Récupérer l'utilisateur et ses métadonnées
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.id !== userId) {
      console.error('❌ Utilisateur non trouvé ou ID différent')
      return false
    }

    // Récupérer le profil de base
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (!profile || profile.user_type !== 'developer') {
      console.log('⚠️ Pas un développeur, aucun profil à créer')
      return false
    }

    // Extraire les données des métadonnées utilisateur
    const metadata = user.user_metadata || {}
    
    const developerProfileData = {
      id: userId,
      title: metadata.title || profile.full_name || 'Développeur',
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

    console.log('📝 Création du profil développeur avec:', developerProfileData)

    // Créer le profil développeur
    const { data: insertResult, error: insertError } = await supabase
      .from('developer_profiles')
      .insert(developerProfileData)
      .select()

    if (insertError) {
      console.error('❌ Erreur création profil développeur:', insertError)
      return false
    }

    console.log('✅ Profil développeur créé avec succès:', insertResult)
    return true

  } catch (error) {
    console.error('❌ Erreur lors de la vérification/création du profil:', error)
    return false
  }
}

/**
 * Vérifie et crée les profils développeurs manquants pour tous les développeurs
 */
export async function checkAllDeveloperProfiles(): Promise<void> {
  try {
    console.log('🔄 Vérification de tous les profils développeurs...')

    // Récupérer tous les développeurs
    const { data: developers } = await supabase
      .from('profiles')
      .select('id, user_type')
      .eq('user_type', 'developer')

    if (!developers || developers.length === 0) {
      console.log('ℹ️ Aucun développeur trouvé')
      return
    }

    console.log(`📊 ${developers.length} développeur(s) trouvé(s)`)

    // Vérifier les profils développeurs existants
    const { data: existingProfiles } = await supabase
      .from('developer_profiles')
      .select('id')

    const existingIds = new Set(existingProfiles?.map(p => p.id) || [])
    const missingProfiles = developers.filter(dev => !existingIds.has(dev.id))

    if (missingProfiles.length === 0) {
      console.log('✅ Tous les profils développeurs existent')
      return
    }

    console.log(`⚠️ ${missingProfiles.length} profil(s) développeur manquant(s)`)

    // Créer les profils manquants
    for (const dev of missingProfiles) {
      console.log(`🔧 Création du profil pour ${dev.id}...`)
      await ensureDeveloperProfile(dev.id)
    }

    console.log('🎉 Vérification terminée')

  } catch (error) {
    console.error('❌ Erreur lors de la vérification générale:', error)
  }
} 