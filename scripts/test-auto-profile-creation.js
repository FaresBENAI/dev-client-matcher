const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://vvvagmviexgqeawwycwq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2dmFnbXZpZXhncWVhd3d5Y3dxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg2NDAzMDEsImV4cCI6MjA2NDIxNjMwMX0.JiZasInlZuqnQ058uzqrSykrXckkmy4p40VVVq0zKBM'
);

/**
 * Script pour tester et appliquer le système de création automatique de profils
 * Migre tous les utilisateurs qui ont un compte auth mais pas de profil
 */
async function testAndMigrateProfiles() {
  try {
    console.log('🔄 DÉBUT DU TEST DE MIGRATION AUTOMATIQUE\n');

    // 1. Lister tous les utilisateurs auth
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) throw authError;

    console.log('📧 Utilisateurs dans auth.users:', authUsers.users.length);
    authUsers.users.forEach(u => {
      console.log(`  - ${u.email} (${u.id})`);
    });

    // 2. Lister tous les profils existants
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, full_name, user_type');
    
    if (profilesError) throw profilesError;

    console.log('\n👤 Profils existants:', profiles.length);
    profiles.forEach(p => {
      console.log(`  - ${p.email} | ${p.full_name} | ${p.user_type}`);
    });

    // 3. Identifier les utilisateurs sans profil
    const profileIds = new Set(profiles.map(p => p.id));
    const usersWithoutProfile = authUsers.users.filter(u => !profileIds.has(u.id));

    console.log('\n⚠️ Utilisateurs sans profil:', usersWithoutProfile.length);
    usersWithoutProfile.forEach(u => {
      console.log(`  - ${u.email} (${u.id})`);
    });

    // 4. Créer les profils manquants
    if (usersWithoutProfile.length > 0) {
      console.log('\n🔧 CRÉATION DES PROFILS MANQUANTS\n');
      
      for (const user of usersWithoutProfile) {
        await createMissingProfile(user);
      }
    } else {
      console.log('\n✅ Tous les utilisateurs ont déjà un profil');
    }

    // 5. Vérifier le résultat final
    console.log('\n📊 ÉTAT FINAL APRÈS MIGRATION\n');
    await checkFinalState();

  } catch (error) {
    console.error('❌ Erreur durant la migration:', error);
  }
}

/**
 * Créer un profil manquant pour un utilisateur
 */
async function createMissingProfile(user) {
  try {
    console.log(`🔄 Création profil pour: ${user.email}`);
    
    const metadata = user.user_metadata || {};
    const userType = metadata.user_type || 'developer'; // Défaut développeur
    
    // Créer le profil de base
    const profileData = {
      id: user.id,
      email: user.email,
      full_name: metadata.full_name || user.email?.split('@')[0] || 'Utilisateur',
      user_type: userType,
      phone: metadata.phone || null,
      avatar_url: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('📝 Données profil:', profileData);

    const { data: createdProfile, error: profileError } = await supabase
      .from('profiles')
      .insert(profileData)
      .select()
      .single();

    if (profileError) {
      console.error(`❌ Erreur création profil pour ${user.email}:`, profileError);
      return;
    }

    console.log(`✅ Profil créé pour ${user.email}`);

    // Si c'est un développeur, créer aussi le profil développeur
    if (userType === 'developer') {
      await createDeveloperProfile(user);
    }

  } catch (error) {
    console.error(`❌ Erreur pour ${user.email}:`, error);
  }
}

/**
 * Créer un profil développeur
 */
async function createDeveloperProfile(user) {
  try {
    console.log(`🔄 Création profil développeur pour: ${user.email}`);
    
    const metadata = user.user_metadata || {};
    
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
    };

    console.log('📝 Données profil développeur:', developerProfileData);

    const { data: createdDevProfile, error: devProfileError } = await supabase
      .from('developer_profiles')
      .insert(developerProfileData)
      .select()
      .single();

    if (devProfileError) {
      console.error(`❌ Erreur création profil développeur pour ${user.email}:`, devProfileError);
      return;
    }

    console.log(`✅ Profil développeur créé pour ${user.email}`);

  } catch (error) {
    console.error(`❌ Erreur profil développeur pour ${user.email}:`, error);
  }
}

/**
 * Vérifier l'état final après migration
 */
async function checkFinalState() {
  try {
    const { data: authUsers } = await supabase.auth.admin.listUsers();
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email, full_name, user_type');
    
    const { data: devProfiles } = await supabase
      .from('developer_profiles')
      .select('id');

    console.log('📊 STATISTIQUES FINALES:');
    console.log(`  Auth users: ${authUsers?.users?.length || 0}`);
    console.log(`  Profiles: ${profiles?.length || 0}`);
    console.log(`  Developer profiles: ${devProfiles?.length || 0}`);
    
    const profileIds = new Set(profiles?.map(p => p.id) || []);
    const missingProfiles = authUsers?.users?.filter(u => !profileIds.has(u.id)) || [];
    
    console.log(`  Profils manquants: ${missingProfiles.length}`);
    
    if (missingProfiles.length === 0) {
      console.log('✅ SUCCÈS: Tous les utilisateurs ont maintenant un profil!');
    } else {
      console.log('⚠️ Il reste des profils manquants:');
      missingProfiles.forEach(u => console.log(`    - ${u.email}`));
    }

  } catch (error) {
    console.error('❌ Erreur vérification état final:', error);
  }
}

// Exécuter le script
testAndMigrateProfiles(); 