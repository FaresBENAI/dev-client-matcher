'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { 
  User, 
  FileText, 
  Briefcase, 
  MessageSquare, 
  Settings,
  TrendingUp,
  Clock,
  CheckCircle,
  Calendar,
  DollarSign,
  Eye,
  ArrowRight
} from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function DeveloperDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({
    totalApplications: 0,
    pendingApplications: 0,
    acceptedApplications: 0,
    profileCompletion: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user) {
        await Promise.all([
          loadProfile(user.id),
          loadStats(user.id)
        ]);
      }
    } catch (error) {
      console.error('Erreur auth:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProfile = async (userId) => {
    try {
      const { data: baseProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      const { data: devProfile } = await supabase
        .from('developer_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      setProfile({ ...baseProfile, ...devProfile });
      
      // Calculer le pourcentage de completion du profil
      const completion = calculateProfileCompletion(baseProfile, devProfile);
      setStats(prev => ({ ...prev, profileCompletion: completion }));
    } catch (error) {
      console.error('Erreur chargement profil:', error);
    }
  };

  const loadStats = async (userId) => {
    try {
      const { data: applications } = await supabase
        .from('project_applications')
        .select('status')
        .eq('developer_id', userId);

      if (applications) {
        const totalApplications = applications.length;
        const pendingApplications = applications.filter(app => app.status === 'pending').length;
        const acceptedApplications = applications.filter(app => app.status === 'accepted').length;

        setStats(prev => ({
          ...prev,
          totalApplications,
          pendingApplications,
          acceptedApplications
        }));
      }
    } catch (error) {
      console.error('Erreur chargement stats:', error);
    }
  };

  const calculateProfileCompletion = (baseProfile, devProfile) => {
    let score = 0;
    const maxScore = 10;

    // Critères essentiels
    if (baseProfile?.full_name) score += 1;
    if (baseProfile?.avatar_url) score += 2; // Photo obligatoire = 2 points
    if (devProfile?.bio) score += 2; // Bio importante = 2 points
    if (devProfile?.languages?.length > 0) score += 2; // Langues = 2 points
    if (devProfile?.skills?.length >= 3) score += 2; // Compétences IA = 2 points
    if (devProfile?.experience_years) score += 0.5;
    if (devProfile?.hourly_rate) score += 0.5;

    return Math.round((score / maxScore) * 100);
  };

  const quickActions = [
    {
      title: 'Compléter mon profil',
      description: 'Optimisez vos chances d\'être choisi',
      href: '/dashboard/developer/profile',
      icon: User,
      color: 'bg-blue-500',
      urgent: stats.profileCompletion < 80
    },
    {
      title: 'Voir mes candidatures',
      description: 'Suivez l\'état de vos candidatures',
      href: '/dashboard/developer/applications',
      icon: FileText,
      color: 'bg-green-500',
      urgent: stats.pendingApplications > 0
    },
    {
      title: 'Chercher des projets',
      description: 'Trouvez votre prochain défi',
      href: '/projects',
      icon: Briefcase,
      color: 'bg-purple-500',
      urgent: false
    },
    {
      title: 'Messages',
      description: 'Communiquez avec les clients',
      href: '/messages',
      icon: MessageSquare,
      color: 'bg-orange-500',
      urgent: false
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="relative mb-8">
            <div className="w-16 h-16 border-4 border-gray-200 border-t-black rounded-full animate-spin mx-auto"></div>
            <div className="absolute top-2 left-2 w-12 h-12 border-4 border-transparent border-t-white rounded-full animate-spin"></div>
          </div>
          <h2 className="text-2xl font-black text-black mb-4">Chargement du dashboard...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        
        {/* Header de bienvenue */}
        <div className="bg-white rounded-lg shadow-sm border-2 border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center text-white font-black text-xl">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                ) : (
                  profile?.full_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'D'
                )}
              </div>
              <div>
                <h1 className="text-3xl font-black text-black">
                  Bonjour, {profile?.full_name || user?.email?.split('@')[0] || 'Développeur'} !
                </h1>
                <p className="text-gray-600 mt-1">
                  Développeur IA • Dernière connexion aujourd'hui
                </p>
              </div>
            </div>
            
            {/* Indicateur de profil */}
            <div className="text-right">
              <div className="text-sm font-black text-gray-600 mb-1">Profil complété</div>
              <div className="flex items-center gap-2">
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-500 ${
                      stats.profileCompletion >= 80 ? 'bg-green-500' : 
                      stats.profileCompletion >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${stats.profileCompletion}%` }}
                  ></div>
                </div>
                <span className="font-black text-sm">{stats.profileCompletion}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Alerte profil incomplet */}
        {stats.profileCompletion < 80 && (
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-black text-yellow-800">Optimisez votre profil !</h3>
                <p className="text-yellow-700 text-sm">
                  Un profil complet augmente vos chances d'être sélectionné par les clients.
                </p>
              </div>
              <Link 
                href="/dashboard/developer/profile"
                className="bg-yellow-500 text-white px-4 py-2 font-black hover:bg-yellow-600 transition-colors"
              >
                Compléter
              </Link>
            </div>
          </div>
        )}

        {/* Statistiques rapides */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border-2 border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-bold">Total candidatures</p>
                <p className="text-3xl font-black text-black">{stats.totalApplications}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border-2 border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-bold">En attente</p>
                <p className="text-3xl font-black text-black">{stats.pendingApplications}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border-2 border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-bold">Acceptées</p>
                <p className="text-3xl font-black text-black">{stats.acceptedApplications}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Actions rapides */}
        <div className="bg-white rounded-lg shadow-sm border-2 border-gray-200 p-6 mb-8">
          <h2 className="text-2xl font-black text-black mb-6">Actions rapides</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <Link
                key={index}
                href={action.href}
                className={`group relative p-6 rounded-lg border-2 transition-all duration-300 hover:scale-105 ${
                  action.urgent 
                    ? 'border-red-200 bg-red-50 hover:border-red-400' 
                    : 'border-gray-200 bg-white hover:border-black'
                }`}
              >
                <div className="flex items-center gap-4 mb-3">
                  <div className={`w-10 h-10 ${action.color} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <action.icon className="h-5 w-5 text-white" />
                  </div>
                  {action.urgent && (
                    <span className="px-2 py-1 bg-red-500 text-white text-xs font-black rounded">
                      URGENT
                    </span>
                  )}
                </div>
                
                <h3 className="font-black text-black mb-2">{action.title}</h3>
                <p className="text-gray-600 text-sm mb-3">{action.description}</p>
                
                <div className="flex items-center text-sm font-bold text-gray-700 group-hover:text-black">
                  Accéder
                  <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Section conseils */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-6 text-white">
          <h2 className="text-2xl font-black mb-4">💡 Conseils pour réussir</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white bg-opacity-20 rounded-lg p-4">
              <h3 className="font-black mb-2">🎯 Profil optimisé</h3>
              <p className="text-sm opacity-90">
                Photo professionnelle, bio détaillée et compétences IA à jour
              </p>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg p-4">
              <h3 className="font-black mb-2">⚡ Réactivité</h3>
              <p className="text-sm opacity-90">
                Répondez rapidement aux messages et aux opportunités
              </p>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg p-4">
              <h3 className="font-black mb-2">🚀 Candidatures ciblées</h3>
              <p className="text-sm opacity-90">
                Choisissez des projets qui correspondent à vos compétences
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
