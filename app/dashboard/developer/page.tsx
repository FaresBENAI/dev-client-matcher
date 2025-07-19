'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, MessageCircle, Clock, Play, CheckCircle, Users, Calendar, DollarSign, XCircle, Star, User, Plus, Briefcase, TrendingUp } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

// Composant d'affichage des étoiles
const StarRating = ({ rating, totalRatings, t }: { rating: number; totalRatings?: number; t: any }) => {
  if (!rating) return (
    <span className="text-xs text-gray-400">{t('dashboard.not.rated.yet')}</span>
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
  const { t } = useLanguage();

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
        label: t('status.pending'),
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: Clock
      },
      accepted: {
        label: t('status.accepted'),
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: CheckCircle
      },
      rejected: {
        label: t('status.rejected'),
        color: 'bg-red-100 text-red-800 border-red-200',
        icon: XCircle
      }
    };
    return configs[status] || configs.pending;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return t('dashboard.unknown.date');
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return t('dashboard.invalid.date');
    }
  };

  const formatBudget = (min?: number, max?: number) => {
    if (!min && !max) return t('dashboard.budget.negotiate');
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
          <h2 className="text-xl font-black text-black mb-2">{t('dashboard.loading')}</h2>
          <p className="text-gray-600">{t('dashboard.preparing.data')}</p>
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
          <h2 className="text-xl font-black text-black mb-2">{t('dashboard.loading.error')}</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-black text-white px-8 py-4 font-black rounded-lg hover:bg-gray-800 transition-all duration-300"
          >
            {t('dashboard.retry')}
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
          <h2 className="text-xl font-black text-black mb-2">{t('dashboard.access.denied')}</h2>
          <p className="text-gray-600 mb-6">{t('dashboard.redirecting')}</p>
          <Link
            href="/auth/login"
            className="bg-black text-white px-8 py-4 font-black rounded-lg hover:bg-gray-800 transition-all duration-300"
          >
            {t('nav.login')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* Header avec fond noir */}
      <div className="bg-black text-white py-6 md:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-black mb-2">
                {t('dashboard.developer.title')}
              </h1>
              <p className="text-gray-300 text-sm md:text-base">
                {t('dashboard.developer.welcome')} {userProfile?.full_name || user?.email} - {t('dashboard.developer.subtitle')}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/projects"
                className="bg-white text-black px-4 md:px-6 py-2 md:py-3 font-black rounded-lg hover:bg-gray-100 transition-all duration-300 flex items-center justify-center gap-2 text-sm md:text-base"
              >
                <Briefcase className="h-4 w-4 md:h-5 md:w-5" />
                {t('dashboard.explore.projects')}
              </Link>
              <Link
                href={`/developer/${user?.id}`}
                className="border-2 border-white text-white px-4 md:px-6 py-2 md:py-3 font-black rounded-lg hover:bg-white hover:text-black transition-all duration-300 flex items-center justify-center gap-2 text-sm md:text-base"
              >
                <User className="h-4 w-4 md:h-5 md:w-5" />
                {t('dashboard.my.public.profile')}
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        
        {/* Statistiques rapides */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8">
          <div className="bg-white rounded-xl md:rounded-2xl p-4 md:p-6 border-2 border-gray-200 hover:border-black transition-all duration-300">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="mb-2 md:mb-0">
                <p className="text-xs md:text-sm text-gray-600 font-medium">{t('dashboard.active.projects')}</p>
                <p className="text-xl md:text-3xl font-black text-black">{assignedProjects.length}</p>
              </div>
              <div className="bg-black p-2 md:p-3 rounded-lg md:rounded-xl self-end md:self-auto">
                <Briefcase className="w-4 h-4 md:w-6 md:h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl md:rounded-2xl p-4 md:p-6 border-2 border-gray-200 hover:border-black transition-all duration-300">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="mb-2 md:mb-0">
                <p className="text-xs md:text-sm text-gray-600 font-medium">{t('dashboard.applications')}</p>
                <p className="text-xl md:text-3xl font-black text-black">{applications.length}</p>
              </div>
              <div className="bg-blue-500 p-2 md:p-3 rounded-lg md:rounded-xl self-end md:self-auto">
                <Users className="w-4 h-4 md:w-6 md:h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl md:rounded-2xl p-4 md:p-6 border-2 border-gray-200 hover:border-black transition-all duration-300">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="mb-2 md:mb-0">
                <p className="text-xs md:text-sm text-gray-600 font-medium">{t('dashboard.conversations')}</p>
                <p className="text-xl md:text-3xl font-black text-black">{conversations.length}</p>
              </div>
              <div className="bg-green-500 p-2 md:p-3 rounded-lg md:rounded-xl self-end md:self-auto">
                <MessageCircle className="w-4 h-4 md:w-6 md:h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl md:rounded-2xl p-4 md:p-6 border-2 border-gray-200 hover:border-black transition-all duration-300">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="mb-2 md:mb-0">
                <p className="text-xs md:text-sm text-gray-600 font-medium">{t('dashboard.rating')}</p>
                <p className="text-xl md:text-3xl font-black text-black">
                  {developerProfile?.average_rating ? developerProfile.average_rating.toFixed(1) : '0.0'}
                </p>
              </div>
              <div className="bg-yellow-500 p-2 md:p-3 rounded-lg md:rounded-xl self-end md:self-auto">
                <Star className="w-4 h-4 md:w-6 md:h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Projets Assignés */}
        <div className="mb-6 md:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 md:mb-6 gap-2">
            <h2 className="text-xl md:text-2xl font-black text-black">{t('dashboard.assigned.projects')}</h2>
            <Link
              href="/projects"
              className="text-black hover:text-gray-600 font-medium text-sm md:text-base"
            >
              {t('dashboard.view.all')} →
            </Link>
          </div>

          {assignedProjects.length === 0 ? (
            <div className="bg-white rounded-xl md:rounded-2xl p-8 md:p-12 text-center border-2 border-gray-200">
              <div className="text-4xl md:text-6xl mb-4">💼</div>
              <h3 className="text-lg md:text-xl font-black text-black mb-2">{t('dashboard.no.assigned.projects')}</h3>
              <p className="text-gray-600 mb-4 md:mb-6 text-sm md:text-base">{t('dashboard.no.assigned.projects.desc')}</p>
              <Link
                href="/projects"
                className="bg-black text-white px-6 md:px-8 py-3 md:py-4 font-black rounded-lg hover:bg-gray-800 transition-all duration-300 text-sm md:text-base"
              >
                {t('dashboard.find.projects')}
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {assignedProjects.slice(0, 6).map((project) => (
                <div key={project.id} className="bg-white rounded-xl md:rounded-2xl p-4 md:p-6 border-2 border-gray-200 hover:border-black transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                  <div className="flex items-start justify-between mb-3 md:mb-4">
                    <div className="flex-1">
                      <h3 className="text-base md:text-lg font-black text-black mb-2 line-clamp-1">
                        {project.title}
                      </h3>
                      <div className="inline-flex items-center space-x-2 px-2 md:px-3 py-1 rounded-full border text-xs md:text-sm bg-green-100 text-green-800 border-green-200">
                        <CheckCircle className="w-3 h-3 md:w-4 md:h-4" />
                        <span className="font-medium">{t('dashboard.assigned')}</span>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 text-xs md:text-sm mb-3 md:mb-4 line-clamp-2">
                    {project.description}
                  </p>
                  
                  <div className="space-y-1 md:space-y-2 mb-3 md:mb-4">
                    <div className="flex items-center text-xs md:text-sm text-gray-500">
                      <DollarSign className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                      {formatBudget(project.budget_min, project.budget_max)}
                    </div>
                    <div className="flex items-center text-xs md:text-sm text-gray-500">
                      <Calendar className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                      {t('dashboard.created')} {formatDate(project.created_at)}
                    </div>
                  </div>

                  <Link
                    href={`/projects/${project.id}`}
                    className="w-full bg-black text-white py-2 md:py-3 px-4 rounded-lg font-bold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 text-xs md:text-sm"
                  >
                    <Eye className="w-3 h-3 md:w-4 md:h-4" />
                    {t('dashboard.view.project')}
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Candidatures récentes */}
        <div className="mb-6 md:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 md:mb-6 gap-2">
            <h2 className="text-xl md:text-2xl font-black text-black">{t('dashboard.recent.applications')}</h2>
            <Link
              href="/dashboard/developer/applications"
              className="text-black hover:text-gray-600 font-medium text-sm md:text-base"
            >
              {t('dashboard.view.all')} →
            </Link>
          </div>

          {applications.length === 0 ? (
            <div className="bg-white rounded-xl md:rounded-2xl p-8 md:p-12 text-center border-2 border-gray-200">
              <div className="text-4xl md:text-6xl mb-4">📋</div>
              <h3 className="text-lg md:text-xl font-black text-black mb-2">{t('dashboard.no.recent.applications')}</h3>
              <p className="text-gray-600 mb-4 md:mb-6 text-sm md:text-base">{t('dashboard.no.recent.applications.desc')}</p>
              <Link
                href="/projects"
                className="bg-black text-white px-6 md:px-8 py-3 md:py-4 font-black rounded-lg hover:bg-gray-800 transition-all duration-300 text-sm md:text-base"
              >
                {t('dashboard.browse.projects')}
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {applications.slice(0, 6).map((application) => {
                const statusConfig = getApplicationStatusConfig(application.status);
                const StatusIcon = statusConfig.icon;
                
                return (
                  <div key={application.id} className="bg-white rounded-xl md:rounded-2xl p-4 md:p-6 border-2 border-gray-200 hover:border-black transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                    <div className="flex items-start justify-between mb-3 md:mb-4">
                      <div className="flex-1">
                        <h3 className="text-base md:text-lg font-black text-black mb-2 line-clamp-1">
                          {application.projects?.title || t('dashboard.untitled.project')}
                        </h3>
                        <div className={`inline-flex items-center space-x-2 px-2 md:px-3 py-1 rounded-full border text-xs md:text-sm ${statusConfig.color}`}>
                          <StatusIcon className="w-3 h-3 md:w-4 md:h-4" />
                          <span className="font-medium">{statusConfig.label}</span>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-gray-600 text-xs md:text-sm mb-3 md:mb-4 line-clamp-2">
                      {application.projects?.description || t('dashboard.no.description')}
                    </p>
                    
                    <div className="space-y-1 md:space-y-2 mb-3 md:mb-4">
                      <div className="flex items-center text-xs md:text-sm text-gray-500">
                        <Calendar className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                        {t('dashboard.applied')} {formatDate(application.created_at)}
                      </div>
                    </div>

                    <Link
                      href={`/projects/${application.projects?.id}`}
                      className="w-full bg-gray-100 text-gray-700 py-2 md:py-3 px-4 rounded-lg font-bold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 text-xs md:text-sm"
                    >
                      <Eye className="w-3 h-3 md:w-4 md:h-4" />
                      {t('dashboard.view.project')}
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Call to action */}
        <div className="bg-black text-white rounded-xl md:rounded-2xl p-6 md:p-8 text-center">
          <h2 className="text-xl md:text-2xl font-black mb-3 md:mb-4">{t('dashboard.develop.career')}</h2>
          <p className="text-gray-300 mb-4 md:mb-6 max-w-2xl mx-auto text-sm md:text-base">
            {t('dashboard.develop.career.desc')}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
            <Link
              href="/projects"
              className="bg-white text-black px-6 md:px-8 py-3 md:py-4 font-black rounded-lg hover:bg-gray-100 transition-all duration-300 text-sm md:text-base"
            >
              {t('dashboard.explore.projects')}
            </Link>
            <Link
              href="/messages"
              className="border-2 border-white text-white px-6 md:px-8 py-3 md:py-4 font-black rounded-lg hover:bg-white hover:text-black transition-all duration-300 text-sm md:text-base"
            >
              {t('dashboard.my.conversations')}
            </Link>
            <Link
              href="/dashboard/developer/profile"
              className="border-2 border-white text-white px-6 md:px-8 py-3 md:py-4 font-black rounded-lg hover:bg-white hover:text-black transition-all duration-300 text-sm md:text-base"
            >
              {t('dashboard.edit.profile')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
