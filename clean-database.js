// Charger les variables d'environnement depuis .env.local
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  console.log('Assurez-vous que NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY sont définies dans .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanDatabase() {
  console.log('🧹 Début du nettoyage de la base de données...\n');

  try {
    // 1. Supprimer les messages (dépendent des conversations et applications)
    console.log('📝 Suppression des messages...');
    const { error: messagesError } = await supabase
      .from('messages')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Supprimer tous les messages

    if (messagesError) {
      console.error('❌ Erreur suppression messages:', messagesError);
    } else {
      console.log('✅ Messages supprimés');
    }

    // 2. Supprimer les conversations (dépendent des projets)
    console.log('💬 Suppression des conversations...');
    const { error: conversationsError } = await supabase
      .from('conversations')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Supprimer toutes les conversations

    if (conversationsError) {
      console.error('❌ Erreur suppression conversations:', conversationsError);
    } else {
      console.log('✅ Conversations supprimées');
    }

    // 3. Supprimer les candidatures (dépendent des projets)
    console.log('📋 Suppression des candidatures...');
    const { error: applicationsError } = await supabase
      .from('project_applications')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Supprimer toutes les candidatures

    if (applicationsError) {
      console.error('❌ Erreur suppression candidatures:', applicationsError);
    } else {
      console.log('✅ Candidatures supprimées');
    }

    // 4. Supprimer les projets
    console.log('🚀 Suppression des projets...');
    const { error: projectsError } = await supabase
      .from('projects')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Supprimer tous les projets

    if (projectsError) {
      console.error('❌ Erreur suppression projets:', projectsError);
    } else {
      console.log('✅ Projets supprimés');
    }

    // 5. Vérifier le nettoyage
    console.log('\n🔍 Vérification du nettoyage...');
    
    const { data: remainingMessages } = await supabase
      .from('messages')
      .select('id')
      .limit(1);
    
    const { data: remainingConversations } = await supabase
      .from('conversations')
      .select('id')
      .limit(1);
    
    const { data: remainingApplications } = await supabase
      .from('project_applications')
      .select('id')
      .limit(1);
    
    const { data: remainingProjects } = await supabase
      .from('projects')
      .select('id')
      .limit(1);

    console.log(`📊 Éléments restants:`);
    console.log(`   - Messages: ${remainingMessages?.length || 0}`);
    console.log(`   - Conversations: ${remainingConversations?.length || 0}`);
    console.log(`   - Candidatures: ${remainingApplications?.length || 0}`);
    console.log(`   - Projets: ${remainingProjects?.length || 0}`);

    if (!remainingMessages?.length && !remainingConversations?.length && 
        !remainingApplications?.length && !remainingProjects?.length) {
      console.log('\n🎉 Base de données nettoyée avec succès !');
    } else {
      console.log('\n⚠️ Certains éléments n\'ont pas pu être supprimés');
    }

  } catch (error) {
    console.error('💥 Erreur lors du nettoyage:', error);
  }
}

// Exécuter le nettoyage
cleanDatabase(); 