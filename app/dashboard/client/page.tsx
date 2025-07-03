'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import Link from 'next/link';
import { Eye, MessageCircle, Clock, Play, CheckCircle, Users, Calendar, DollarSign, XCircle, Star, User, Plus } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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

export default function ClientDashboard() {
  const [projects, setProjects] = useState([]);
  const [developers, setDevelopers] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        await loadUserProfile(user.id);
        await loadDashboardData(user.id);
      }
    };
    getUser();
  }, []);

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
      // 1. Charger les projets du client
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .eq('client_id', userId)
        .order('created_at', { ascending: false });

      if (projectsError) {
        console.error('Erreur projets:', projectsError);
      } else {
        setProjects(projectsData || []);
      }

      // 2. Charger les conversations pour identifier les développeurs
      const { data: conversationsData, error: conversationsError } = await supabase
        .from('conversations')
        .select('*')
        .eq('client_id', userId)
        .order('updated_at', { ascending: false });

      if (conversationsError) {
        console.error('Erreur conversations:', conversationsError);
      } else {
        setConversations(conversationsData || []);
        
        // 3. Charger les développeurs avec leurs détails et notes
        if (conversationsData && conversationsData.length > 0) {
          // 🔧 CORRECTION: Utiliser Array.from() au lieu du spread operator
          const developerIds = Array.from(new Set(conversationsData.map(conv => conv.developer_id)));
          
          const developersWithDetails = await Promise.all(
            developerIds.map(async (devId) => {
              // Charger le profil de base
              const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', devId)
                .single();

              // Charger les détails développeur
              const { data: devProfile } = await supabase
                .from('developer_profiles')
                .select('*')
                .eq('id', devId)
                .single();

              // Charger les messages non lus
              const { data: unreadMessages } = await supabase
                .from('messages')
                .select('id')
                .eq('conversation_id', conversationsData.find(c => c.developer_id === devId)?.id)
                .eq('is_read', false)
                .neq('sender_id', userId);

              return {
                ...profile,
                ...devProfile,
                id: profile?.id,
                full_name: profile?.full_name,
                email: profile?.email,
                avatar_url: profile?.avatar_url,
                unread_count: unreadMessages?.length || 0,
                conversation_id: conversationsData.find(c => c.developer_id === devId)?.id
              };
            })
          );

          setDevelopers(developersWithDetails.filter(dev => dev.id));
        }
      }

    } catch (error) {
      console.error('Erreur lors du chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProjectStatusConfig = (status) => {
    const configs = {
      open: {
        label: 'Ouvert',
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: Play
      },
      in_progress: {
        label: 'En cours',
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: Clock
      },
      completed: {
        label: 'Terminé',
        color: 'bg-gray-100 text-gray-800 border-gray-200',
        icon: CheckCircle
      },
      cancelled: {
        label: 'Annulé',
        color: 'bg-red-100 text-red-800 border-red-200',
        icon: XCircle
      }
    };
    return configs[status] || configs.open;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatBudget = (min, max) => {
    if (!min && !max) return 'Budget à négocier';
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
                Dashboard Client
              </h1>
              <p className="text-gray-300">
                Bienvenue {userProfile?.full_name || user?.email} - Gérez vos projets et développeurs
              </p>
            </div>
            <Link
              href="/projects/create"
              className="bg-white text-black px-6 py-3 font-black rounded-lg hover:bg-gray-100 transition-all duration-300 flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              Nouveau Projet
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Statistiques rapides */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 border-2 border-gray-200 hover:border-black transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Mes Projets</p>
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
                <p className="text-sm text-gray-600 font-medium">Développeurs</p>
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
                <p className="text-sm text-gray-600 font-medium">Messages non lus</p>
                <p className="text-3xl font-black text-black">
                  {developers.reduce((total, dev) => total + dev.unread_count, 0)}
                </p>
              </div>
              <div className="bg-yellow-500 p-3 rounded-xl">
                <Clock className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Mes Projets */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black text-black">Mes Projets</h2>
            <Link
              href="/projects"
              className="text-black hover:text-gray-600 font-medium"
            >
              Voir tous →
            </Link>
          </div>

          {projects.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border-2 border-gray-200">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-xl font-black text-black mb-2">Aucun projet créé</h3>
              <p className="text-gray-600 mb-6">Créez votre premier projet pour commencer à collaborer avec des développeurs</p>
              <Link
                href="/projects/create"
                className="bg-black text-white px-8 py-4 font-black rounded-lg hover:bg-gray-800 transition-all duration-300"
              >
                Créer mon premier projet
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.slice(0, 6).map((project) => {
                const statusConfig = getProjectStatusConfig(project.status);
                const StatusIcon = statusConfig.icon;
                
                return (
                  <div key={project.id} className="bg-white rounded-2xl p-6 border-2 border-gray-200 hover:border-black transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-black text-black mb-2 line-clamp-1">
                          {project.title}
                        </h3>
                        <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full border text-sm ${statusConfig.color}`}>
                          <StatusIcon className="w-4 h-4" />
                          <span className="font-medium">{statusConfig.label}</span>
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
                        Créé le {formatDate(project.created_at)}
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs font-medium">
                        {project.project_type}
                      </span>
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
                        href={`/projects/${project.id}/edit`}
                        className="border-2 border-gray-300 text-gray-700 py-2 px-4 rounded-lg font-bold text-sm hover:border-black hover:text-black transition-all duration-300 text-center"
                      >
                        Modifier
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
            <h2 className="text-2xl font-black text-black">Développeurs Collaborateurs</h2>
            <Link
              href="/developers"
              className="text-black hover:text-gray-600 font-medium"
            >
              Voir tous →
            </Link>
          </div>

          {developers.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border-2 border-gray-200">
              <div className="text-6xl mb-4">👥</div>
              <h3 className="text-xl font-black text-black mb-2">Aucun développeur assigné</h3>
              <p className="text-gray-600 mb-6">Commencez à collaborer avec des développeurs en créant un projet</p>
              <Link
                href="/developers"
                className="bg-black text-white px-8 py-4 font-black rounded-lg hover:bg-gray-800 transition-all duration-300"
              >
                Explorer les développeurs
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
                          alt={developer.full_name || 'Développeur'} 
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
                        {developer.full_name || 'Développeur'}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {developer.title || (developer.experience_years ? `${developer.experience_years}+ ans d'expérience` : 'Expert')}
                      </p>
                      
                      {/* Note */}
                      <StarRating rating={developer.average_rating} totalRatings={developer.total_ratings} />
                    </div>
                  </div>

                  {/* Informations supplémentaires */}
                  <div className="space-y-2 mb-4">
                    {developer.location && (
                      <div className="flex items-center text-sm text-gray-500">
                        <span>📍 {developer.location}</span>
                      </div>
                    )}
                    {developer.hourly_rate && (
                      <div className="flex items-center text-sm text-gray-500">
                        <DollarSign className="w-4 h-4 mr-1" />
                        {developer.hourly_rate}€/heure
                      </div>
                    )}
                    {developer.unread_count > 0 && (
                      <div className="flex items-center text-sm text-red-600 font-medium">
                        <MessageCircle className="w-4 h-4 mr-1" />
                        {developer.unread_count} message{developer.unread_count > 1 ? 's' : ''} non lu{developer.unread_count > 1 ? 's' : ''}
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
                      Profil
                    </Link>
                    <Link
                      href="/messages"
                      className="flex-1 bg-black text-white py-2 px-4 rounded-lg font-bold text-sm hover:bg-gray-800 transition-all duration-300 text-center flex items-center justify-center gap-2"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Contacter
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions rapides */}
        <div className="bg-black text-white rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-black mb-4">Besoin d'aide ?</h2>
          <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
            Explorez notre plateforme pour trouver les meilleurs développeurs ou gérez vos projets existants
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/developers"
              className="bg-white text-black px-8 py-4 font-black rounded-lg hover:bg-gray-100 transition-all duration-300"
            >
              Explorer les développeurs
            </Link>
            <Link
              href="/projects"
              className="border-2 border-white text-white px-8 py-4 font-black rounded-lg hover:bg-white hover:text-black transition-all duration-300"
            >
              Gérer mes projets
            </Link>
            <Link
              href="/messages"
              className="border-2 border-white text-white px-8 py-4 font-black rounded-lg hover:bg-white hover:text-black transition-all duration-300"
            >
              Mes conversations
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
