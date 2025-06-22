'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Search, Users, Briefcase, MessageCircle, TrendingUp, Clock, Star, Award } from 'lucide-react';

interface Application {
  id: string;
  status: string;
  created_at: string;
  project: {
    id: string;
    title: string;
    budget: number;
    status: string;
  };
}

interface DashboardStats {
  totalApplications: number;
  activeApplications: number;
  acceptedApplications: number;
  profileCompleteness: number;
}

export default function DeveloperDashboardContent() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [applications, setApplications] = useState<Application[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalApplications: 0,
    activeApplications: 0,
    acceptedApplications: 0,
    profileCompleteness: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Charger les candidatures récentes
      const { data: applicationsData } = await supabase
        .from('applications')
        .select(`
          *,
          project:projects(id, title, budget, status)
        `)
        .eq('developer_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (applicationsData) {
        setApplications(applicationsData);

        // Calculer les stats
        const totalApplications = applicationsData.length;
        const activeApplications = applicationsData.filter(a => a.status === 'pending').length;
        const acceptedApplications = applicationsData.filter(a => a.status === 'accepted').length;

        setStats({
          totalApplications,
          activeApplications,
          acceptedApplications,
          profileCompleteness: 85
        });
      }
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ icon: Icon, title, value, description }: {
    icon: any;
    title: string;
    value: number | string;
    description: string;
  }) => (
    <div className="bg-gray-50 border-2 border-gray-200 p-6 hover:border-black transition-all duration-300 transform hover:scale-105">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-black text-black">{value}</p>
          <p className="text-xs text-gray-500 mt-1">{description}</p>
        </div>
        <Icon className="h-8 w-8 text-black" />
      </div>
    </div>
  );

  const ApplicationCard = ({ application }: { application: Application }) => (
    <div className="bg-white border-2 border-gray-200 p-6 hover:border-black transition-all duration-300">
      <div className="flex justify-between items-start mb-4">
        <h3 className="font-black text-lg text-black">{application.project.title}</h3>
        <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider border-2 ${
          application.status === 'pending' 
            ? 'bg-black text-white border-black' 
            : application.status === 'accepted'
            ? 'bg-white text-black border-black'
            : 'bg-gray-50 text-gray-600 border-gray-300'
        }`}>
          {application.status}
        </span>
      </div>
      <div className="flex justify-between items-center">
        <span className="font-black text-black">{application.project.budget}€</span>
        <span className="text-sm text-gray-500">
          {new Date(application.created_at).toLocaleDateString()}
        </span>
      </div>
    </div>
  );

  const ProgressRing = ({ percentage }: { percentage: number }) => {
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <div className="relative w-24 h-24">
        <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r={radius}
            stroke="#f3f4f6"
            strokeWidth="8"
            fill="none"
          />
          <circle
            cx="50"
            cy="50"
            r={radius}
            stroke="#000000"
            strokeWidth="8"
            fill="none"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-black text-black">{percentage}%</span>
        </div>
      </div>
    );
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
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-black text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-black mb-4">Dashboard Développeur</h1>
          <p className="text-xl text-gray-300">Trouvez les projets parfaits et développez votre carrière</p>
        </div>
      </div>

      {/* Conseils Pro */}
      <div className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-black text-black mb-8">Conseils Pro</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-black text-white p-6 transform hover:scale-105 transition-all duration-300">
              <Star className="h-8 w-8 mb-4" />
              <h3 className="font-black text-lg mb-2">Optimisez votre profil</h3>
              <p className="text-gray-300 text-sm">
                Un profil complet augmente vos chances de 3x
              </p>
            </div>
            <div className="border-2 border-black p-6 transform hover:scale-105 transition-all duration-300 hover:bg-black hover:text-white group">
              <TrendingUp className="h-8 w-8 mb-4 text-black group-hover:text-white" />
              <h3 className="font-black text-lg mb-2">Candidatez rapidement</h3>
              <p className="text-gray-600 group-hover:text-gray-300 text-sm">
                Les premiers candidats ont 5x plus de chances
              </p>
            </div>
            <div className="bg-gray-50 border-2 border-gray-200 p-6 transform hover:scale-105 transition-all duration-300 hover:border-black">
              <MessageCircle className="h-8 w-8 mb-4 text-black" />
              <h3 className="font-black text-lg mb-2">Restez actif</h3>
              <p className="text-gray-600 text-sm">
                Répondez aux messages sous 24h
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              icon={Briefcase}
              title="Candidatures"
              value={stats.totalApplications}
              description="Total envoyées"
            />
            <StatCard
              icon={Clock}
              title="En Attente"
              value={stats.activeApplications}
              description="Réponses attendues"
            />
            <StatCard
              icon={Award}
              title="Acceptées"
              value={stats.acceptedApplications}
              description="Projets obtenus"
            />
            <div className="bg-gray-50 border-2 border-gray-200 p-6 hover:border-black transition-all duration-300 transform hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Profil</p>
                  <p className="text-xs text-gray-500 mt-1">Complétude</p>
                </div>
                <ProgressRing percentage={stats.profileCompleteness} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions Rapides */}
      <div className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-black text-black mb-8">Actions Rapides</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <button
              onClick={() => router.push('/projects')}
              className="bg-black text-white p-8 hover:bg-gray-800 transition-all duration-300 transform hover:scale-105 group"
            >
              <Search className="h-12 w-12 mx-auto mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="font-black text-xl mb-2">Nouveaux Projets</h3>
              <p className="text-gray-300">Découvrir les opportunités</p>
            </button>

            <button
              onClick={() => router.push('/developers')}
              className="border-2 border-black text-black p-8 hover:bg-black hover:text-white transition-all duration-300 transform hover:scale-105 group"
            >
              <Users className="h-12 w-12 mx-auto mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="font-black text-xl mb-2">Communauté</h3>
              <p className="text-gray-600 group-hover:text-gray-300">Voir les autres développeurs</p>
            </button>

            <button
              onClick={() => router.push('/messages')}
              className="bg-gray-50 border-2 border-gray-200 text-black p-8 hover:border-black hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 group"
            >
              <MessageCircle className="h-12 w-12 mx-auto mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="font-black text-xl mb-2">Messages</h3>
              <p className="text-gray-600">Suivre les discussions</p>
            </button>
          </div>
        </div>
      </div>

      {/* Candidatures Récentes */}
      <div className="bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-black text-black">Candidatures Récentes</h2>
            <button
              onClick={() => router.push('/dashboard/developer/applications')}
              className="bg-black text-white px-6 py-3 font-black hover:bg-gray-800 transition-all duration-300 transform hover:scale-105"
            >
              Voir Toutes
            </button>
          </div>
          
          {applications.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {applications.map((application) => (
                <ApplicationCard key={application.id} application={application} />
              ))}
            </div>
          ) : (
            <div className="bg-white border-2 border-gray-200 p-12 text-center">
              <Search className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h3 className="font-black text-xl text-black mb-2">Aucune candidature</h3>
              <p className="text-gray-600 mb-6">Commencez à postuler sur des projets</p>
              <button
                onClick={() => router.push('/projects')}
                className="bg-black text-white px-8 py-3 font-black hover:bg-gray-800 transition-all duration-300 transform hover:scale-105"
              >
                Parcourir les Projets
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Progression */}
      <div className="bg-black text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-black mb-8">Votre Progression</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-gray-900 border-2 border-gray-700 p-8 hover:border-white transition-all duration-300">
              <h3 className="font-black text-xl mb-4">Profil Développeur</h3>
              <p className="text-gray-400 mb-6">
                Complétez votre profil pour augmenter votre visibilité
              </p>
              <button
                onClick={() => router.push('/dashboard/developer/profile')}
                className="bg-white text-black px-6 py-3 font-black hover:bg-gray-200 transition-all duration-300 transform hover:scale-105"
              >
                Modifier le Profil
              </button>
            </div>
            
            <div className="bg-gray-900 border-2 border-gray-700 p-8 hover:border-white transition-all duration-300">
              <h3 className="font-black text-xl mb-4">Taux de Succès</h3>
              <p className="text-gray-400 mb-6">
                {stats.totalApplications > 0 
                  ? `${Math.round((stats.acceptedApplications / stats.totalApplications) * 100)}% de vos candidatures acceptées`
                  : 'Postulez pour voir vos statistiques'
                }
              </p>
              <button
                onClick={() => router.push('/projects')}
                className="border-2 border-white text-white px-6 py-3 font-black hover:bg-white hover:text-black transition-all duration-300 transform hover:scale-105"
              >
                Voir les Projets
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
