'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';
import { Eye, MessageCircle, Clock, Play, CheckCircle, Users, Calendar, DollarSign, XCircle } from 'lucide-react';

export default function ClientDashboard() {
  const [projects, setProjects] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('projects');
  const [user, setUser] = useState(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        await loadDashboardData(user.id);
      }
    };
    getUser();
  }, []);

  const loadDashboardData = async (userId) => {
    try {
      // Charger les projets du client avec le nombre de candidatures
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select(`
          *,
          applications:project_applications(count),
          profile:profiles!projects_client_id_fkey(*)
        `)
        .eq('client_id', userId)
        .order('created_at', { ascending: false });

      if (projectsError) {
        console.error('Erreur projets:', projectsError);
      } else {
        setProjects(projectsData || []);
      }

      // Charger toutes les candidatures avec détails
      const { data: applicationsData, error: applicationsError } = await supabase
        .from('project_applications')
        .select(`
          *,
          project:projects!inner(*),
          developer:profiles(*),
          conversation:conversations(*)
        `)
        .eq('project.client_id', userId)
        .order('created_at', { ascending: false });

      if (applicationsError) {
        console.error('Erreur candidatures:', applicationsError);
      } else {
        setApplications(applicationsData || []);
      }

    } catch (error) {
      console.error('Erreur lors du chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status) => {
    const configs = {
      en_attente: {
        label: 'En attente',
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: Clock
      },
      en_developpement: {
        label: 'En développement',
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: Play
      },
      rejete: {
        label: 'Rejeté',
        color: 'bg-red-100 text-red-800 border-red-200',
        icon: XCircle
      },
      projet_termine: {
        label: 'Terminé',
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: CheckCircle
      }
    };
    return configs[status] || configs.en_attente;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatBudget = (budget) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(budget);
  };

  const getApplicationsStats = () => {
    const total = applications.length;
    const enAttente = applications.filter(app => app.status === 'en_attente').length;
    const enDeveloppement = applications.filter(app => app.status === 'en_developpement').length;
    const rejetes = applications.filter(app => app.status === 'rejete').length;
    const termines = applications.filter(app => app.status === 'projet_termine').length;
    
    return { total, enAttente, enDeveloppement, rejetes, termines };
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-black"></div>
      </div>
    );
  }

  const stats = getApplicationsStats();

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black mb-2">Dashboard Client</h1>
        <p className="text-gray-600">Gérez vos projets et suivez les candidatures</p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg border hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Projets actifs</p>
              <p className="text-2xl font-bold">{projects.length}</p>
            </div>
            <div className="bg-black p-3 rounded-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Candidatures</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <div className="bg-yellow-500 p-3 rounded-lg">
              <Clock className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">En développement</p>
              <p className="text-2xl font-bold">{stats.enDeveloppement}</p>
            </div>
            <div className="bg-blue-500 p-3 rounded-lg">
              <Play className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Terminés</p>
              <p className="text-2xl font-bold">{stats.termines}</p>
            </div>
            <div className="bg-green-500 p-3 rounded-lg">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('projects')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'projects'
                  ? 'border-black text-black'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Mes Projets ({projects.length})
            </button>
            <button
              onClick={() => setActiveTab('applications')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'applications'
                  ? 'border-black text-black'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Candidatures ({stats.total})
            </button>
          </nav>
        </div>
      </div>

      {/* Contenu des tabs */}
      {activeTab === 'projects' && (
        <div className="space-y-4">
          {projects.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">Aucun projet créé pour le moment</p>
              <Link
                href="/projects/create"
                className="bg-black text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors"
              >
                Créer mon premier projet
              </Link>
            </div>
          ) : (
            projects.map((project) => (
              <div key={project.id} className="bg-white border rounded-lg p-6 hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2">{project.title}</h3>
                    <p className="text-gray-600 mb-3 line-clamp-2">{project.description}</p>
                    
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <DollarSign className="w-4 h-4" />
                        <span>{formatBudget(project.budget_min)} - {formatBudget(project.budget_max)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>Créé le {formatDate(project.created_at)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Users className="w-4 h-4" />
                        <span>{project.applications?.[0]?.count || 0} candidature(s)</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Link
                      href={`/projects/${project.id}`}
                      className="bg-black text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-800 transition-colors flex items-center space-x-2"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Voir</span>
                    </Link>
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                  <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm">
                    {project.project_type}
                  </span>
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                    {project.complexity}
                  </span>
                  {project.required_skills && project.required_skills.map((skill, index) => (
                    <span key={index} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'applications' && (
        <div className="space-y-4">
          {applications.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Aucune candidature reçue pour le moment</p>
            </div>
          ) : (
            applications.map((application) => {
              const statusConfig = getStatusConfig(application.status);
              const StatusIcon = statusConfig.icon;
              
              return (
                <div key={application.id} className="bg-white border rounded-lg p-6 hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <h3 className="text-lg font-semibold">
                          {application.developer?.full_name || application.developer?.email}
                        </h3>
                        <div className={`flex items-center space-x-2 px-3 py-1 rounded-full border text-sm ${statusConfig.color}`}>
                          <StatusIcon className="w-4 h-4" />
                          <span>{statusConfig.label}</span>
                        </div>
                      </div>
                      
                      <p className="text-gray-600 mb-2">
                        <strong>Projet :</strong> {application.project?.title}
                      </p>
                      
                      <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>Candidature du {formatDate(application.created_at)}</span>
                        </div>
                        {application.developer?.specialization && (
                          <div className="flex items-center space-x-1">
                            <Users className="w-4 h-4" />
                            <span>{application.developer.specialization}</span>
                          </div>
                        )}
                      </div>

                      {application.message && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-700 italic">
                            "{application.message}"
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex space-x-2 ml-4">
                      <Link
                        href={`/developers/${application.developer_id}`}
                        className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center space-x-2"
                      >
                        <Eye className="w-4 h-4" />
                        <span>Profil</span>
                      </Link>
                      
                      {application.conversation && application.conversation.length > 0 && (
                        <Link
                          href="/messages"
                          className="bg-black text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-800 transition-colors flex items-center space-x-2"
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span>Discuter</span>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
