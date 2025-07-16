'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

function AuthCallbackContent() {
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

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">❌</div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Erreur d'authentification</h1>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => router.push('/auth/login')}
              className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition-colors"
            >
              Retour à la connexion
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Authentification en cours</h1>
          <p className="text-gray-600">{status}</p>
        </div>
      </div>
    </div>
  );
}

export default function AuthCallback() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Chargement...</h1>
            <p className="text-gray-600">Initialisation de l'authentification</p>
          </div>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}
