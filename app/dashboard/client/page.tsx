'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import Link from 'next/link';
import { Eye, MessageCircle, Clock, Play, CheckCircle, Users, Calendar, DollarSign, XCircle, Star, User, Plus, RefreshCw } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const supabase = createClient()

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

export default function ClientDashboard() {
  const [projects, setProjects] = useState([]);
  const [developers, setDevelopers] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const { t } = useLanguage();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  useEffect(() => {
    if (user) {
      loadUserProfile(user.id);
      loadDashboardData(user.id);
    }
  }, [user]);

  // Écouteur en temps réel pour les messages
  useEffect(() => {
    if (!user) return;

    // Écouter les nouveaux messages
    const messagesSubscription = supabase
      .channel('messages_changes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=in.(${conversations.map(c => c.id).join(',')})`
      }, (payload) => {
        console.log('🆕 Nouveau message reçu:', payload);
        // Rafraîchir les données si le message n'est pas de l'utilisateur actuel
        if (payload.new.sender_id !== user.id) {
          refreshData();
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=in.(${conversations.map(c => c.id).join(',')})`
      }, (payload) => {
        console.log('📝 Message mis à jour:', payload);
        // Rafraîchir si le statut de lecture a changé
        if (payload.new.is_read !== payload.old.is_read) {
          refreshData();
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(messagesSubscription);
    };
  }, [user, conversations]);

  const loadUserProfile = async (userId) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      setUserProfile(profile);
    } catch (error) {
      console.error('Erreur profil utilisateur:', error);
    }
  };

  const loadDashboardData = async (userId) => {
    try {
      console.log('🔄 Chargement des données dashboard pour:', userId);
      
      // 1. Charger les projets du client
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .eq('client_id', userId)
        .order('created_at', { ascending: false });

      if (projectsError) throw projectsError;
      setProjects(projectsData || []);

      // 2. Charger les conversations du client
      const { data: conversationsData, error: conversationsError } = await supabase
        .from('conversations')
        .select('*')
        .eq('client_id', userId)
        .order('updated_at', { ascending: false });

      if (conversationsError) throw conversationsError;
      
      if (!conversationsData || conversationsData.length === 0) {
        setConversations([]);
        setDevelopers([]);
      } else {
        setConversations(conversationsData || []);
        
        // 3. Charger les développeurs avec leurs détails et notes
        if (conversationsData && conversationsData.length > 0) {
          // 🔧 CORRECTION: Utiliser Array.from() au lieu du spread operator
          const developerIds = Array.from(new Set(conversationsData.map(conv => conv.developer_id)));
          
          console.log('👥 Développeurs trouvés:', developerIds);
          
          const developersWithDetails = await Promise.all(
            developerIds.map(async (devId) => {
              // Charger le profil de base
              const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', devId)
                .single();

              // Charger les détails développeur
              const { data: devProfile, error: devError } = await supabase
                .from('developer_profiles')
                .select('*')
                .eq('id', devId)
                .single();

              if (devError) {
                console.error(`Erreur chargement profil développeur pour ${devId}:`, devError);
              } else {
                console.log(`✅ Profil développeur chargé pour ${profile?.full_name}:`, {
                  hourly_rate: devProfile?.hourly_rate,
                  daily_rate: devProfile?.daily_rate,
                  average_rating: devProfile?.average_rating,
                  total_ratings: devProfile?.total_ratings
                });
              }

              // Charger les messages non lus
              const conversationId = conversationsData.find(c => c.developer_id === devId)?.id;
              let unreadCount = 0;
              
              if (conversationId) {
                try {
                  const { data: unreadMessages, error } = await supabase
                    .from('messages')
                    .select('content, sender_id')
                    .eq('conversation_id', conversationId)
                    .eq('is_read', false)
                    .neq('sender_id', userId);

                  if (error) {
                    console.error('Erreur comptage messages non lus:', error);
                  } else {
                    // Filtrer les messages système et de mise à jour de statut
                    const filteredMessages = unreadMessages?.filter(message => {
                      const content = message.content?.toLowerCase() || '';
                      
                      // Exclure les messages système et de mise à jour de statut
                      const systemKeywords = [
                        'candidature acceptée',
                        'candidature refusée',
                        'candidature en attente',
                        'statut mis à jour',
                        'progression du projet',
                        '✨**candidature acceptée !**✨',
                        '✨**candidature refusée !**✨',
                        '✨**candidature en attente !**✨',
                        'félicitations',
                        'votre candidature a été acceptée',
                        'votre candidature n\'a pas été retenue',
                        'le projet peut maintenant commencer',
                        '🎉 **candidature acceptée !**',
                        '❌ **candidature refusée**',
                        'malheureusement, votre candidature n\'a pas été retenue'
                      ];
                      
                      // Vérifier si le message contient des mots-clés système
                      const isSystemMessage = systemKeywords.some(keyword => content.includes(keyword.toLowerCase()));
                      
                      // Vérifier aussi si c'est un message avec des étoiles ou des emojis (format système)
                      const hasSystemFormat = (content.includes('**') || content.includes('🎉') || content.includes('❌')) && 
                                             (content.includes('candidature') || content.includes('félicitations') || content.includes('malheureusement'));
                      
                      // Vérifier si c'est un message de notification automatique
                      const isAutoNotification = content.includes('félicitations') && content.includes('candidature') && content.includes('acceptée');
                      
                      return !isSystemMessage && !hasSystemFormat && !isAutoNotification;
                    }) || [];

                    unreadCount = filteredMessages.length;
                    console.log(`📬 Messages non lus pour ${profile?.full_name}: ${unreadCount} (après filtrage)`);
                  }
                } catch (error) {
                  console.error('Erreur lors du comptage des messages non lus:', error);
                }
              }

              const developerData = {
                ...profile,
                ...devProfile,
                id: profile?.id,
                full_name: profile?.full_name,
                email: profile?.email,
                avatar_url: profile?.avatar_url,
                // 🆕 S'assurer que les données du profil développeur sont prioritaires
                hourly_rate: devProfile?.hourly_rate || profile?.hourly_rate,
                daily_rate: devProfile?.daily_rate || profile?.daily_rate,
                average_rating: devProfile?.average_rating || profile?.average_rating,
                total_ratings: devProfile?.total_ratings || profile?.total_ratings,
                location: devProfile?.location || profile?.location,
                skills: devProfile?.skills || profile?.skills,
                title: devProfile?.title || profile?.title,
                experience_years: devProfile?.experience_years || profile?.experience_years,
                unread_count: unreadCount,
                conversation_id: conversationId
              };

              console.log(`📊 Données finales pour ${profile?.full_name}:`, {
                hourly_rate: developerData.hourly_rate,
                daily_rate: developerData.daily_rate,
                average_rating: developerData.average_rating,
                total_ratings: developerData.total_ratings,
                location: developerData.location
              });

              return developerData;
            })
          );

          const validDevelopers = developersWithDetails.filter(dev => dev.id);
          console.log('✅ Développeurs chargés:', validDevelopers.length);
          setDevelopers(validDevelopers);
        }
      }

    } catch (error) {
      console.error('Erreur lors du chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour rafraîchir les données
  const refreshData = async () => {
    if (user) {
      setLoading(true);
      await loadDashboardData(user.id);
    }
  };

  const getProjectStatusConfig = (status) => {
    const configs = {
      open: {
        label: t('status.open'),
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: Play
      },
      in_progress: {
        label: t('status.in_progress'),
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: Clock
      },
      completed: {
        label: t('status.completed'),
        color: 'bg-gray-100 text-gray-800 border-gray-200',
        icon: CheckCircle
      },
      cancelled: {
        label: t('status.cancelled'),
        color: 'bg-red-100 text-red-800 border-red-200',
        icon: XCircle
      }
    };
    return configs[status] || configs.open;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatBudget = (min, max) => {
    if (!min && !max) return t('dashboard.budget.negotiate');
    if (!max) return `${min}€+`;
    return `${min}€ - ${max}€`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-black rounded-full animate-spin"></div>
          <div className="absolute top-2 left-2 w-12 h-12 border-4 border-transparent border-t-white rounded-full animate-spin"></div>
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
                {t('dashboard.client.title')}
              </h1>
              <p className="text-gray-300">
                {t('dashboard.client.welcome')} {userProfile?.full_name || user?.email} - {t('dashboard.client.subtitle')}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={refreshData}
                disabled={loading}
                className="bg-gray-800 text-white px-4 py-3 font-bold rounded-lg hover:bg-gray-700 transition-all duration-300 flex items-center gap-2 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                {t('dashboard.refresh')}
              </button>
              <Link
                href="/projects/create"
                className="bg-white text-black px-6 py-3 font-black rounded-lg hover:bg-gray-100 transition-all duration-300 flex items-center gap-2"
              >
                <Plus className="h-5 w-5" />
                {t('dashboard.new.project')}
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
                <p className="text-sm text-gray-600 font-medium">{t('dashboard.my.projects')}</p>
                <p className="text-3xl font-black text-black">{projects.length}</p>
              </div>
              <div className="bg-black p-3 rounded-xl">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border-2 border-gray-200 hover:border-black transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">{t('dashboard.developers')}</p>
                <p className="text-3xl font-black text-black">{developers.length}</p>
              </div>
              <div className="bg-blue-500 p-3 rounded-xl">
                <User className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border-2 border-gray-200 hover:border-black transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">{t('dashboard.conversations')}</p>
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
                <p className="text-sm text-gray-600 font-medium">{t('dashboard.active.projects')}</p>
                <p className="text-3xl font-black text-black">
                  {projects.filter(p => p.status === 'in_progress').length}
                </p>
              </div>
              <div className="bg-orange-500 p-3 rounded-xl">
                <Clock className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Mes Projets */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black text-black">{t('dashboard.my.projects')}</h2>
            <Link
              href="/projects"
              className="text-black hover:text-gray-600 font-medium"
            >
              {t('dashboard.view.all')} →
            </Link>
          </div>

          {projects.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border-2 border-gray-200">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-xl font-black text-black mb-2">{t('dashboard.no.projects')}</h3>
              <p className="text-gray-600 mb-6">{t('dashboard.no.projects.desc')}</p>
              <Link
                href="/projects/create"
                className="bg-black text-white px-8 py-4 font-black rounded-lg hover:bg-gray-800 transition-all duration-300"
              >
                {t('dashboard.create.first.project')}
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => {
                const statusConfig = getProjectStatusConfig(project.status);
                const StatusIcon = statusConfig.icon;
                
                return (
                  <div key={project.id} className="bg-white rounded-2xl p-6 border-2 border-gray-200 hover:border-black transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                    {/* Status badge */}
                    <div className="flex items-center justify-between mb-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${statusConfig.color} flex items-center gap-1`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusConfig.label}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatDate(project.created_at)}
                      </span>
                    </div>

                    <h3 className="text-lg font-black text-black mb-2 truncate">
                      {project.title}
                    </h3>
                    
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {project.description}
                    </p>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-gray-500">
                        <DollarSign className="w-4 h-4 mr-1" />
                        {formatBudget(project.budget_min, project.budget_max)}
                      </div>
                      {project.timeline && (
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="w-4 h-4 mr-1" />
                          {project.timeline}
                        </div>
                      )}
                    </div>

                    {/* Compétences */}
                    {project.required_skills && project.required_skills.length > 0 && (
                      <div className="mb-4">
                        <div className="flex flex-wrap gap-1">
                          {project.required_skills.slice(0, 3).map((skill, index) => (
                            <span key={index} className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs font-medium">
                              {skill}
                            </span>
                          ))}
                          {project.required_skills.length > 3 && (
                            <span className="bg-gray-200 text-gray-600 px-2 py-1 rounded text-xs font-medium">
                              +{project.required_skills.length - 3}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Link
                        href={`/projects/${project.id}`}
                        className="flex-1 bg-black text-white py-2 px-4 rounded-lg font-bold text-sm hover:bg-gray-800 transition-all duration-300 text-center"
                      >
                        {t('dashboard.view.project')}
                      </Link>
                      <Link
                        href={`/projects/${project.id}/edit`}
                        className="border-2 border-gray-300 text-gray-700 py-2 px-4 rounded-lg font-bold text-sm hover:border-black hover:text-black transition-all duration-300 text-center"
                      >
                        {t('dashboard.edit')}
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Développeurs Assignés */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black text-black">{t('dashboard.collaborating.developers')}</h2>
            <Link
              href="/developers"
              className="text-black hover:text-gray-600 font-medium"
            >
              {t('dashboard.view.all')} →
            </Link>
          </div>

          {developers.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border-2 border-gray-200">
              <div className="text-6xl mb-4">👥</div>
              <h3 className="text-xl font-black text-black mb-2">{t('dashboard.no.developers')}</h3>
              <p className="text-gray-600 mb-6">{t('dashboard.no.developers.desc')}</p>
              <Link
                href="/developers"
                className="bg-black text-white px-8 py-4 font-black rounded-lg hover:bg-gray-800 transition-all duration-300"
              >
                {t('dashboard.explore.developers')}
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {developers.map((developer) => (
                <div key={developer.id} className="bg-white rounded-2xl p-6 border-2 border-gray-200 hover:border-black transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                  <div className="flex items-start space-x-4 mb-4">
                    {/* Avatar */}
                    <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-gray-300 flex-shrink-0">
                      {developer.avatar_url ? (
                        <img 
                          src={developer.avatar_url} 
                          alt={developer.full_name || t('dashboard.developer')} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-black flex items-center justify-center text-white font-black text-xl">
                          {developer.full_name?.charAt(0).toUpperCase() || 'D'}
                        </div>
                      )}
                    </div>

                    {/* Infos développeur */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-black text-black mb-1 truncate">
                        {developer.full_name || t('dashboard.developer')}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {developer.title || (developer.experience_years ? `${developer.experience_years}+ ${t('dashboard.years.experience')}` : t('developers.expert'))}
                      </p>
                      
                      {/* Note */}
                      <StarRating rating={developer.average_rating} totalRatings={developer.total_ratings} t={t} />
                    </div>
                  </div>

                  {/* Informations supplémentaires */}
                  <div className="space-y-2 mb-4">
                    {developer.location && (
                      <div className="flex items-center text-sm text-gray-500">
                        <span>📍 {developer.location}</span>
                      </div>
                    )}
                    {(developer.daily_rate || developer.hourly_rate) && (
                      <div className="flex items-center text-sm text-gray-500">
                        <DollarSign className="w-4 h-4 mr-1" />
                        {developer.daily_rate ? `${developer.daily_rate}€/${t('dashboard.day')}` : `${developer.hourly_rate}€/${t('dashboard.hour')}`}
                      </div>
                    )}
                    {developer.unread_count > 0 && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-sm text-red-600 font-medium">
                          <MessageCircle className="w-4 h-4 mr-1" />
                          {developer.unread_count} {t('dashboard.unread.messages')}
                        </div>
                        <span className="bg-red-500 text-white text-xs font-bold rounded-full px-2 py-1">
                          {developer.unread_count}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Compétences */}
                  {developer.skills && developer.skills.length > 0 && (
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-1">
                        {developer.skills.slice(0, 3).map((skill, index) => (
                          <span key={index} className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs font-medium">
                            {skill}
                          </span>
                        ))}
                        {developer.skills.length > 3 && (
                          <span className="bg-gray-200 text-gray-600 px-2 py-1 rounded text-xs font-medium">
                            +{developer.skills.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Link
                      href={`/developer/${developer.id}`}
                      className="flex-1 border-2 border-gray-300 text-gray-700 py-2 px-4 rounded-lg font-bold text-sm hover:border-black hover:text-black transition-all duration-300 text-center flex items-center justify-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      {t('dashboard.profile')}
                    </Link>
                    <Link
                      href="/messages"
                      className="flex-1 bg-black text-white py-2 px-4 rounded-lg font-bold text-sm hover:bg-gray-800 transition-all duration-300 text-center flex items-center justify-center gap-2"
                    >
                      <MessageCircle className="w-4 h-4" />
                      {t('dashboard.contact')}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions rapides */}
        <div className="bg-black text-white rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-black mb-4">{t('dashboard.need.help')}</h2>
          <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
            {t('dashboard.need.help.desc')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/developers"
              className="bg-white text-black px-8 py-4 font-black rounded-lg hover:bg-gray-100 transition-all duration-300"
            >
              {t('dashboard.explore.developers')}
            </Link>
            <Link
              href="/projects"
              className="border-2 border-white text-white px-8 py-4 font-black rounded-lg hover:bg-white hover:text-black transition-all duration-300"
            >
              {t('dashboard.manage.projects')}
            </Link>
            <Link
              href="/messages"
              className="border-2 border-white text-white px-8 py-4 font-black rounded-lg hover:bg-white hover:text-black transition-all duration-300"
            >
              {t('dashboard.my.conversations')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
