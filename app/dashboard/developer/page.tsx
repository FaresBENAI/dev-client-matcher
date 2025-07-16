'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, MessageCircle, Clock, Play, CheckCircle, Users, Calendar, DollarSign, XCircle, Star, User, Plus, Briefcase, TrendingUp } from 'lucide-react';

// Composant d'affichage des étoiles
const StarRating = ({ rating, totalRatings }: { rating: number; totalRatings?: number }) => {
  if (!rating) return (
    <span className="text-xs text-gray-400">Pas encore noté</span>
  );
  
  return (
    <div className="flex items-center space-x-1">
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`text-xs ${star <= Math.round(rating) ? 'text-yellow-400' : 'text-gray-300'}`}
          >
            ⭐
          </span>
        ))}
      </div>
      <span className="text-xs text-gray-600 font-medium">
        {rating.toFixed(1)} {totalRatings ? `(${totalRatings})` : ''}
      </span>
    </div>
  );
};

export default function DeveloperDashboard() {
  const [assignedProjects, setAssignedProjects] = useState([]);
  const [applications, setApplications] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [developerProfile, setDeveloperProfile] = useState(null);
  const [error, setError] = useState(null);
  const router = useRouter();

  // Debug console
  const log = (message: string, data?: any) => {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`${timestamp}: [DASHBOARD DEV] ${message}`, data || '');
  };

  useEffect(() => {
    log('🚀 Dashboard Developer - Initialisation');
    
    const initializeDashboard = async () => {
      try {
        setLoading(true);
        setError(null);
        
        log('📍 Récupération utilisateur...');
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          log('❌ Erreur auth:', userError);
          throw new Error(`Erreur authentification: ${userError.message}`);
        }
        
        if (!user) {
          log('🔒 Pas d\'utilisateur, redirection vers login');
          router.push('/auth/login?redirectTo=/dashboard/developer');
          return;
        }

        log('✅ Utilisateur trouvé:', user.email);
        setUser(user);
        
        // Charger le profil utilisateur
        log('📍 Chargement profil utilisateur...');
        try {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
            
          if (profileError) {
            log('⚠️ Erreur profil (création d\'un profil par défaut)');
            // Créer un profil par défaut au lieu de planter
            setUserProfile({
              id: user.id,
              email: user.email,
              full_name: user.email,
              user_type: 'developer'
            });
          } else {
            log('✅ Profil chargé:', profile.user_type);
            setUserProfile(profile);
            
            // Vérification du type d'utilisateur
            if (profile.user_type !== 'developer') {
              log('❌ Pas un développeur, redirection client');
              router.push('/dashboard/client');
              return;
            }
          }
        } catch (profileErr) {
          log('⚠️ Erreur profil, profil par défaut créé');
          setUserProfile({
            id: user.id,
            email: user.email,
            full_name: user.email,
            user_type: 'developer'
          });
        }
        
        // Charger le profil développeur (optionnel)
        log('📍 Chargement profil développeur...');
        try {
          const { data: devProfile } = await supabase
            .from('developer_profiles')
            .select('*')
            .eq('id', user.id)
            .single();
          
          setDeveloperProfile(devProfile);
          log('✅ Profil développeur chargé:', devProfile);
        } catch (devError) {
          log('⚠️ Pas de profil développeur détaillé (optionnel)');
          setDeveloperProfile(null);
        }
        
        // Charger les données du dashboard
        log('📍 Chargement données dashboard...');
        await loadDashboardData(user.id);
        
        log('🎉 Dashboard initialisé avec succès');
        
      } catch (error) {
        log('❌ Erreur critique:', error);
        setError(error.message || 'Erreur inconnue');
        console.error('Erreur dashboard:', error);
      } finally {
        setLoading(false);
      }
    };
    
    initializeDashboard();
  }, [router]);

  const loadDashboardData = async (userId: string) => {
    try {
      log('📊 Chargement projets assignés...');
      
      // 1. Projets assignés (simplifiés au maximum)
      try {
        const { data: projectsData, error: projectsError } = await supabase
          .from('project_applications')
          .select(`
            id,
            created_at,
            projects (
              id,
              title,
              description,
              budget_min,
              budget_max,
              project_type,
              complexity,
              created_at
            )
          `)
          .eq('developer_id', userId)
          .eq('status', 'accepted')
          .limit(10)
          .order('created_at', { ascending: false });

        if (projectsError) {
          log('⚠️ Erreur projets assignés:', projectsError);
          setAssignedProjects([]);
        } else {
          const projects = projectsData?.map(app => app.projects).filter(Boolean) || [];
          setAssignedProjects(projects);
          log('✅ Projets assignés chargés:', projects.length);
        }
      } catch (err) {
        log('⚠️ Erreur lors du chargement des projets assignés');
        setAssignedProjects([]);
      }

      log('📊 Chargement candidatures...');
      
      // 2. Candidatures (simplifiées)
      try {
        const { data: applicationsData, error: applicationsError } = await supabase
          .from('project_applications')
          .select(`
            id,
            status,
            created_at,
            projects (
              id,
              title,
              description,
              budget_min,
              budget_max,
              project_type,
              created_at
            )
          `)
          .eq('developer_id', userId)
          .limit(10)
          .order('created_at', { ascending: false });

        if (applicationsError) {
          log('⚠️ Erreur candidatures:', applicationsError);
          setApplications([]);
        } else {
          setApplications(applicationsData || []);
          log('✅ Candidatures chargées:', applicationsData?.length || 0);
        }
      } catch (err) {
        log('⚠️ Erreur lors du chargement des candidatures');
        setApplications([]);
      }

      log('📊 Chargement conversations...');
      
      // 3. Conversations (simplifiées)
      try {
        const { data: conversationsData, error: conversationsError } = await supabase
          .from('conversations')
          .select('id, created_at, updated_at')
          .eq('developer_id', userId)
          .limit(10)
          .order('updated_at', { ascending: false });

        if (conversationsError) {
          log('⚠️ Erreur conversations:', conversationsError);
          setConversations([]);
        } else {
          setConversations(conversationsData || []);
          log('✅ Conversations chargées:', conversationsData?.length || 0);
        }
      } catch (err) {
        log('⚠️ Erreur lors du chargement des conversations');
        setConversations([]);
      }

      log('🎉 Toutes les données chargées');

    } catch (error) {
      log('❌ Erreur générale lors du chargement:', error);
      // On continue avec des données vides plutôt que de crasher
      setAssignedProjects([]);
      setApplications([]);
      setConversations([]);
    }
  };

  const getApplicationStatusConfig = (status: string) => {
    const configs = {
      pending: {
        label: 'En attente',
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: Clock
      },
      accepted: {
        label: 'Acceptée',
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: CheckCircle
      },
      rejected: {
        label: 'Refusée',
        color: 'bg-red-100 text-red-800 border-red-200',
        icon: XCircle
      }
    };
    return configs[status] || configs.pending;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Date inconnue';
    try {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return 'Date invalide';
    }
  };

  const formatBudget = (min?: number, max?: number) => {
    if (!min && !max) return 'Budget à négocier';
    if (!max) return `${min}€+`;
    return `${min}€ - ${max}€`;
  };

  // Écran de chargement
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="relative mb-8">
            <div className="w-16 h-16 border-4 border-gray-200 border-t-black rounded-full animate-spin"></div>
            <div className="absolute top-2 left-2 w-12 h-12 border-4 border-transparent border-t-white rounded-full animate-spin"></div>
          </div>
          <h2 className="text-xl font-black text-black mb-2">Chargement du dashboard...</h2>
          <p className="text-gray-600">Préparation de vos données</p>
        </div>
      </div>
    );
  }

  // Écran d'erreur
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-black text-black mb-2">Erreur de chargement</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-black text-white px-8 py-4 font-black rounded-lg hover:bg-gray-800 transition-all duration-300"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  // Vérification accès
  if (!user || !userProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-xl font-black text-black mb-2">Accès non autorisé</h2>
          <p className="text-gray-600 mb-6">Redirection en cours...</p>
          <Link
            href="/auth/login"
            className="bg-black text-white px-8 py-4 font-black rounded-lg hover:bg-gray-800 transition-all duration-300"
          >
            Se connecter
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* Header avec fond noir */}
      <div className="bg-black text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-black mb-2">
                Dashboard Développeur
              </h1>
              <p className="text-gray-300">
                Bienvenue {userProfile?.full_name || user?.email} - Gérez vos projets et candidatures
              </p>
            </div>
            <div className="flex gap-4">
              <Link
                href="/projects"
                className="bg-white text-black px-6 py-3 font-black rounded-lg hover:bg-gray-100 transition-all duration-300 flex items-center gap-2"
              >
                <Briefcase className="h-5 w-5" />
                Explorer Projets
              </Link>
              <Link
                href={`/developer/${user?.id}`}
                className="border-2 border-white text-white px-6 py-3 font-black rounded-lg hover:bg-white hover:text-black transition-all duration-300 flex items-center gap-2"
              >
                <User className="h-5 w-5" />
                Mon Profil Public
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Statistiques rapides */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 border-2 border-gray-200 hover:border-black transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Projets Actifs</p>
                <p className="text-3xl font-black text-black">{assignedProjects.length}</p>
              </div>
              <div className="bg-black p-3 rounded-xl">
                <Briefcase className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border-2 border-gray-200 hover:border-black transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Candidatures</p>
                <p className="text-3xl font-black text-black">{applications.length}</p>
              </div>
              <div className="bg-blue-500 p-3 rounded-xl">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border-2 border-gray-200 hover:border-black transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Conversations</p>
                <p className="text-3xl font-black text-black">{conversations.length}</p>
              </div>
              <div className="bg-green-500 p-3 rounded-xl">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border-2 border-gray-200 hover:border-black transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Note Moyenne</p>
                <p className="text-3xl font-black text-black">
                  {developerProfile?.average_rating ? developerProfile.average_rating.toFixed(1) : '—'}
                </p>
              </div>
              <div className="bg-yellow-500 p-3 rounded-xl">
                <Star className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Mes Projets Actifs */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black text-black">Mes Projets Actifs</h2>
            <Link
              href="/projects"
              className="text-black hover:text-gray-600 font-medium"
            >
              Explorer plus →
            </Link>
          </div>

          {assignedProjects.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border-2 border-gray-200">
              <div className="text-6xl mb-4">💼</div>
              <h3 className="text-xl font-black text-black mb-2">Aucun projet actif</h3>
              <p className="text-gray-600 mb-6">Candidatez à des projets pour commencer à collaborer avec des clients</p>
              <Link
                href="/projects"
                className="bg-black text-white px-8 py-4 font-black rounded-lg hover:bg-gray-800 transition-all duration-300"
              >
                Explorer les projets
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {assignedProjects.slice(0, 6).map((project) => (
                <div key={project.id} className="bg-white rounded-2xl p-6 border-2 border-gray-200 hover:border-black transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-black text-black mb-2 line-clamp-1">
                        {project.title}
                      </h3>
                      <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full border text-sm bg-green-100 text-green-800 border-green-200">
                        <CheckCircle className="w-4 h-4" />
                        <span className="font-medium">Assigné</span>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {project.description}
                  </p>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-500">
                      <DollarSign className="w-4 h-4 mr-2" />
                      {formatBudget(project.budget_min, project.budget_max)}
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="w-4 h-4 mr-2" />
                      Assigné le {formatDate(project.created_at)}
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {project.project_type && (
                      <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs font-medium">
                        {project.project_type}
                      </span>
                    )}
                    {project.complexity && (
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                        {project.complexity}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Link
                      href={`/projects/${project.id}`}
                      className="flex-1 bg-black text-white py-2 px-4 rounded-lg font-bold text-sm hover:bg-gray-800 transition-all duration-300 text-center"
                    >
                      Voir le projet
                    </Link>
                    <Link
                      href="/messages"
                      className="border-2 border-gray-300 text-gray-700 py-2 px-4 rounded-lg font-bold text-sm hover:border-black hover:text-black transition-all duration-300 text-center"
                    >
                      Contacter
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Mes Candidatures */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black text-black">Mes Candidatures</h2>
            <Link
              href="/applications"
              className="text-black hover:text-gray-600 font-medium"
            >
              Voir toutes →
            </Link>
          </div>

          {applications.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border-2 border-gray-200">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-xl font-black text-black mb-2">Aucune candidature</h3>
              <p className="text-gray-600 mb-6">Commencez à candidater aux projets qui vous intéressent</p>
              <Link
                href="/projects"
                className="bg-black text-white px-8 py-4 font-black rounded-lg hover:bg-gray-800 transition-all duration-300"
              >
                Voir les projets disponibles
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {applications.slice(0, 6).map((application) => {
                const statusConfig = getApplicationStatusConfig(application.status);
                const StatusIcon = statusConfig.icon;
                
                return (
                  <div key={application.id} className="bg-white rounded-2xl p-6 border-2 border-gray-200 hover:border-black transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-black text-black mb-2 line-clamp-1">
                          {application.projects?.title || 'Projet sans titre'}
                        </h3>
                        <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full border text-sm ${statusConfig.color}`}>
                          <StatusIcon className="w-4 h-4" />
                          <span className="font-medium">{statusConfig.label}</span>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {application.projects?.description || 'Pas de description'}
                    </p>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-gray-500">
                        <DollarSign className="w-4 h-4 mr-2" />
                        {formatBudget(application.projects?.budget_min, application.projects?.budget_max)}
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="w-4 h-4 mr-2" />
                        Candidature le {formatDate(application.created_at)}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Link
                        href={`/projects/${application.projects?.id || '#'}`}
                        className="flex-1 bg-black text-white py-2 px-4 rounded-lg font-bold text-sm hover:bg-gray-800 transition-all duration-300 text-center"
                      >
                        Voir le projet
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Actions rapides */}
        <div className="bg-black text-white rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-black mb-4">Développez votre carrière !</h2>
          <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
            Explorez de nouveaux projets, développez vos compétences et construisez votre réputation
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/projects"
              className="bg-white text-black px-8 py-4 font-black rounded-lg hover:bg-gray-100 transition-all duration-300"
            >
              Explorer les projets
            </Link>
            <Link
              href="/messages"
              className="border-2 border-white text-white px-8 py-4 font-black rounded-lg hover:bg-white hover:text-black transition-all duration-300"
            >
              Mes conversations
            </Link>
            <Link
              href="/dashboard/developer/profile"
              className="border-2 border-white text-white px-8 py-4 font-black rounded-lg hover:bg-white hover:text-black transition-all duration-300"
            >
              Modifier mon profil
            </Link>
            <Link
              href={`/developer/${user?.id}`}
              className="border-2 border-white text-white px-8 py-4 font-black rounded-lg hover:bg-white hover:text-black transition-all duration-300"
            >
              Mon profil public
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
