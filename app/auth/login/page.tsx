'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Eye, EyeOff, Mail, Lock, ArrowRight } from 'lucide-react';
import dynamic from 'next/dynamic';

function LoginPageContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // S'assurer qu'on est côté client
  useEffect(() => {
    setMounted(true);
    
    // Vérifier si l'utilisateur est déjà connecté
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        console.log('✅ Utilisateur déjà connecté, redirection...');
        
        // Récupérer le profil pour redirection appropriée
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_type')
          .eq('id', session.user.id)
          .single();
        
        const dashboardRoute = profile?.user_type === 'client' 
          ? '/dashboard/client'
          : '/dashboard/developer';
        
        router.push(dashboardRoute);
      }
    };
    
    checkUser();
  }, []);

  // Récupérer le redirectTo seulement côté client
  const redirectTo = mounted ? (searchParams.get('redirectTo') || '/dashboard/developer') : '/dashboard/developer';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('🔐 Tentative de connexion pour:', email);
      console.log('🎯 Redirection prévue vers:', redirectTo);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('❌ Erreur connexion:', error);
        setError(error.message);
        return;
      }

      console.log('✅ Connexion réussie:', data.user.email);
      
      // SYSTÈME DE VÉRIFICATION ET CRÉATION AUTOMATIQUE DE PROFILS
      await ensureUserProfileExists(data.user);
      
      // Récupérer le profil utilisateur pour redirection appropriée
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('id', data.user.id)
        .single();

      // Redirection directe vers le dashboard approprié
      if (profile) {
        const dashboardRoute = profile.user_type === 'client' 
          ? '/dashboard/client'
          : '/dashboard/developer';
        
        console.log('🎯 Redirection directe vers:', dashboardRoute);
        router.push(dashboardRoute);
      } else {
        // Si pas de profil, rediriger vers page d'accueil
        console.log('🎯 Redirection vers page d\'accueil');
        router.push('/?login=success');
      }

    } catch (error) {
      console.error('❌ Erreur inattendue:', error);
      setError('Une erreur inattendue s\'est produite');
    } finally {
      setLoading(false);
    }
  };

  /**
   * S'assurer que l'utilisateur a un profil complet
   * Rattrape les comptes créés avant que le système automatique soit en place
   */
  const ensureUserProfileExists = async (user: any) => {
    try {
      console.log('🔄 Vérification profil pour:', user.email);
      
      // Vérifier si le profil existe
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (existingProfile) {
        console.log('✅ Profil existe');
        
        // Si c'est un développeur, vérifier le profil développeur
        if (existingProfile.user_type === 'developer') {
          await ensureDeveloperProfileExists(user);
        }
        return;
      }

      console.log('⚠️ Profil manquant, création automatique...');
      
      // Créer le profil de base avec les métadonnées disponibles
      const metadata = user.user_metadata || {};
      const profileData = {
        id: user.id,
        email: user.email,
        full_name: metadata.full_name || user.email?.split('@')[0] || 'Utilisateur',
        user_type: metadata.user_type || 'developer',
        phone: metadata.phone || null,
        avatar_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error: profileError } = await supabase
        .from('profiles')
        .insert(profileData);

      if (profileError) {
        console.error('❌ Erreur création profil:', profileError);
        return;
      }

      console.log('✅ Profil créé automatiquement');

      // Si c'est un développeur, créer aussi le profil développeur
      if (profileData.user_type === 'developer') {
        await ensureDeveloperProfileExists(user);
      }

    } catch (error) {
      console.error('❌ Erreur vérification profil:', error);
    }
  };

  /**
   * S'assurer que le profil développeur existe
   */
  const ensureDeveloperProfileExists = async (user: any) => {
    try {
      const { data: existingDevProfile } = await supabase
        .from('developer_profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      if (existingDevProfile) {
        console.log('✅ Profil développeur existe');
        return;
      }

      console.log('⚠️ Création profil développeur manquant...');
      
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

      const { error: devProfileError } = await supabase
        .from('developer_profiles')
        .insert(developerProfileData);

      if (devProfileError) {
        console.error('❌ Erreur création profil développeur:', devProfileError);
        return;
      }

      console.log('✅ Profil développeur créé automatiquement');

    } catch (error) {
      console.error('❌ Erreur vérification profil développeur:', error);
    }
  };

  // Ne rien afficher côté serveur pour éviter l'hydration mismatch
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center">
            <div className="bg-black text-white w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-black">L</span>
            </div>
            <h2 className="text-3xl font-black text-black">LinkerAI</h2>
            <p className="mt-2 text-gray-600">Chargement...</p>
          </div>
        </div>
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10 border-2 border-gray-200">
            <div className="flex justify-center">
              <div className="w-8 h-8 border-4 border-gray-200 border-t-black rounded-full animate-spin"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <div className="bg-black text-white w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl font-black">L</span>
          </div>
          <h2 className="text-3xl font-black text-black">LinkerAI</h2>
          <p className="mt-2 text-gray-600">Connectez-vous à votre compte</p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10 border-2 border-gray-200">
          <form className="space-y-6" onSubmit={handleLogin}>
            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
                <div className="flex">
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-bold text-gray-900">
                Adresse email *
              </label>
              <div className="mt-1 relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-4 py-3 border-2 border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-0 focus:border-black transition-all duration-300"
                  placeholder="votre@email.com"
                />
                <Mail className="absolute right-3 top-3 h-5 w-5 text-gray-400" />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-bold text-gray-900">
                Mot de passe *
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-4 py-3 border-2 border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-0 focus:border-black transition-all duration-300 pr-12"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 h-5 w-5 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  Se souvenir de moi
                </label>
              </div>

              <div className="text-sm">
                <Link
                  href="/auth/forgot-password"
                  className="font-medium text-black hover:text-gray-700 transition-colors"
                >
                  Mot de passe oublié ?
                </Link>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-sm font-black rounded-lg text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Connexion en cours...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Lock className="w-4 h-4 mr-2" />
                    Se connecter
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </div>
                )}
              </button>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                Pas encore de compte ?{' '}
                <Link
                  href="/auth/signup"
                  className="font-medium text-black hover:text-gray-700 transition-colors"
                >
                  S'inscrire
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Export avec dynamic import pour désactiver le SSR
const LoginPage = dynamic(() => Promise.resolve(LoginPageContent), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="bg-black text-white w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl font-black">L</span>
        </div>
        <h2 className="text-2xl font-black text-black mb-4">LinkerAI</h2>
        <div className="w-8 h-8 border-4 border-gray-200 border-t-black rounded-full animate-spin mx-auto"></div>
        <p className="text-gray-600 mt-4">Chargement de la page de connexion...</p>
      </div>
    </div>
  )
});

export default LoginPage;
