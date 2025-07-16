'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState('Traitement de l\'authentification...');
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('🔄 Callback Auth - Démarrage du traitement...');
        setStatus('Vérification de l\'authentification...');

        // Récupérer la session depuis l'URL (après connexion)
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Erreur session:', error);
          setError(`Erreur session: ${error.message}`);
          return;
        }

        if (!data.session) {
          console.log('⚠️ Pas de session trouvée');
          setStatus('Aucune session trouvée, redirection...');
          setTimeout(() => router.push('/auth/login'), 2000);
          return;
        }

        console.log('✅ Session trouvée:', data.session.user.email);
        setStatus('Session valide, chargement du profil...');

        // Vérifier/créer le profil utilisateur
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.session.user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          console.error('❌ Erreur profil:', profileError);
          setError(`Erreur profil: ${profileError.message}`);
          return;
        }

        // Si pas de profil, en créer un
        if (!profile) {
          console.log('📝 Création du profil utilisateur...');
          setStatus('Création de votre profil...');
          
          const { error: createError } = await supabase
            .from('profiles')
            .insert({
              id: data.session.user.id,
              email: data.session.user.email,
              full_name: data.session.user.email,
              user_type: 'developer', // Par défaut
              created_at: new Date().toISOString()
            });

          if (createError) {
            console.error('❌ Erreur création profil:', createError);
            setError(`Erreur création profil: ${createError.message}`);
            return;
          }
          
          console.log('✅ Profil créé avec succès');
        } else {
          console.log('✅ Profil existant trouvé:', profile.user_type);
        }

        // Récupérer la destination de redirection
        const redirectTo = searchParams.get('redirectTo') || '/dashboard/developer';
        
        console.log('🎯 Redirection vers:', redirectTo);
        setStatus('Connexion réussie ! Redirection...');
        
        // Attendre un peu pour laisser le temps à l'état de se propager
        setTimeout(() => {
          router.push(redirectTo);
        }, 1000);

      } catch (error) {
        console.error('❌ Erreur callback auth:', error);
        setError(`Erreur générale: ${error.message}`);
      }
    };

    handleAuthCallback();
  }, [router, searchParams]);

  // Le reste du composant (écrans de chargement et d'erreur)
  // ... (voir l'artefact complet)
}
