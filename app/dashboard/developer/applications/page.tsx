'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Eye, MessageCircle, Clock, Play, CheckCircle, Calendar, DollarSign, User, Briefcase, XCircle } from 'lucide-react';
import { supabase } from '../../../../lib/supabase';

export default function DeveloperApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState([]);

  const addDebug = (message) => {
    console.log(message);
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  useEffect(() => {
    const getUser = async () => {
      try {
        addDebug('🔍 Récupération utilisateur...');
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) {
          addDebug(`❌ Erreur auth: ${error.message}`);
          setError('Erreur d\'authentification');
          setLoading(false);
          return;
        }

        if (!user) {
          addDebug('❌ Pas d\'utilisateur connecté');
          setError('Non connecté');
          setLoading(false);
          return;
        }

        addDebug(`✅ Utilisateur: ${user.id}`);
        setUser(user);
        await loadApplications(user.id);
      } catch (error) {
        addDebug(`💥 Exception getUser: ${error.message}`);
        setError('Erreur générale');
        setLoading(false);
      }
    };
    getUser();
  }, []);

  const loadApplications = async (userId) => {
    try {
      addDebug(`📋 Chargement candidatures pour: ${userId}`);
      
      // Requête simplifiée d'abord
      const { data, error } = await supabase
        .from('project_applications')
        .select(`
          id,
          status,
          message,
          created_at,
          project_id,
          developer_id
        `)
        .eq('developer_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        addDebug(`❌ Erreur candidatures: ${error.message}`);
        setError(`Erreur candidatures: ${error.message}`);
        setLoading(false);
        return;
      }

      addDebug(`📊 ${data?.length || 0} candidatures trouvées`);
      
      if (!data || data.length === 0) {
        addDebug('ℹ️ Aucune candidature');
        setApplications([]);
        setLoading(false);
        return;
      }

      // Récupérer les détails des projets séparément
      const projectIds = data.map(app => app.project_id).filter(Boolean);
      addDebug(`🔍 Récupération ${projectIds.length} projets...`);

      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select(`
          id,
          title,
          description,
          budget_min,
          budget_max,
          project_type,
          complexity,
          required_skills,
          client_id
        `)
        .in('id', projectIds);

      if (projectsError) {
        addDebug(`⚠️ Erreur projets: ${projectsError.message}`);
      }

      // Récupérer les profils clients
      const clientIds = projectsData?.map(p => p.client_id).filter(Boolean) || [];
      addDebug(`👥 Récupération ${clientIds.length} clients...`);

      const { data: clientsData, error: clientsError } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', clientIds);

      if (clientsError) {
        addDebug(`⚠️ Erreur clients: ${clientsError.message}`);
      }

      // Récupérer les conversations pour le lien Messages
      const { data: conversationsData, error: conversationsError } = await supabase
        .from('conversations')
        .select('id, project_id, developer_id')
        .eq('developer_id', userId);

      if (conversationsError) {
        addDebug(`⚠️ Erreur conversations: ${conversationsError.message}`);
      }

      // Assembler les données
      const applicationsWithDetails = data.map(app => {
        const project = projectsData?.find(p => p.id === app.project_id);
        const client = clientsData?.find(c => c.id === project?.client_id);
        const conversation = conversationsData?.find(c => 
          c.project_id === app.project_id && c.developer_id === app.developer_id
        );
        
        return {
          ...app,
          project: project || { title: 'Projet supprimé', client_id: null },
          client: client || { full_name: 'Client inconnu', email: '' },
          conversation: conversation
        };
      });

      addDebug(`✅ Données assemblées: ${applicationsWithDetails.length} candidatures`);
      setApplications(applicationsWithDetails);
      
    } catch (error) {
      addDebug(`💥 Exception loadApplications: ${error.message}`);
      setError(`Erreur: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status) => {
    const configs = {
      en_attente: {
        label: 'En attente',
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: Clock,
        description: 'En cours d\'examen'
      },
      en_developpement: {
        label: 'En développement',
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: Play,
        description: 'Projet accepté et en cours'
      },
      rejete: {
        label: 'Rejeté',
        color: 'bg-red-100 text-red-800 border-red-200',
        icon: XCircle,
        description: 'Candidature non retenue'
      },
      projet_termine: {
        label: 'Terminé',
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: CheckCircle,
        description: 'Projet livré avec succès'
      },
      // Support ancien système
      pending: {
        label: 'En attente',
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: Clock,
        description: 'En cours d\'examen'
      },
      accepted: {
        label: 'Accepté',
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: Play,
        description: 'Candidature acceptée'
      },
      rejected: {
        label: 'Rejeté',
        color: 'bg-red-100 text-red-800 border-red-200',
        icon: XCircle,
        description: 'Candidature refusée'
      }
    };
    return configs[status] || configs.en_attente;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatBudget = (min, max) => {
    const formatter = new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    });
    return `${formatter.format(min)} - ${formatter.format(max)}`;
  };

  const getFilteredApplications = () => {
    if (filter === 'all') return applications;
    return applications.filter(app => {
      // Support des deux systèmes de statut
      if (filter === 'en_attente') return ['en_attente', 'pending'].includes(app.status);
      if (filter === 'en_developpement') return ['en_developpement', 'accepted'].includes(app.status);
      if (filter === 'rejete') return ['rejete', 'rejected'].includes(app.status);
      return app.status === filter;
    });
  };

  const getStats = () => {
    const total = applications.length;
    const enAttente = applications.filter(app => ['en_attente', 'pending'].includes(app.status)).length;
    const enDeveloppement = applications.filter(app => ['en_developpement', 'accepted'].includes(app.status)).length;
    
    return { total, enAttente, enDeveloppement };
  };

  // Affichage d'erreur avec debug
  if (error) {
    return (
      <div className="p-4 sm:p-6 max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 sm:p-6">
          <h2 className="text-red-800 font-bold mb-4">❌ Erreur</h2>
          <p className="text-red-700 mb-4">{error}</p>
          
          <details className="mb-4">
            <summary className="cursor-pointer text-red-600 hover:text-red-800">
              Voir les logs de debug
            </summary>
            <div className="mt-2 bg-gray-100 p-3 rounded text-xs max-h-40 overflow-auto">
              {debugInfo.map((info, index) => (
                <div key={index}>{info}</div>
              ))}
            </div>
          </details>
          
          <button 
            onClick={() => window.location.reload()} 
            className="bg-red-600 text-white px-4 py-2 rounded-lg"
          >
            Recharger
          </button>
        </div>
      </div>
    );
  }

  // Affichage de chargement
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-black mb-4"></div>
          <p className="text-gray-600">Chargement des candidatures...</p>
        </div>
      </div>
    );
  }

  const filteredApplications = getFilteredApplications();
  const stats = getStats();

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-black mb-2">Mes Candidatures</h1>
        <p className="text-gray-600 text-sm sm:text-base">Suivez l'état de vos candidatures et projets</p>
        <p className="text-xs sm:text-sm text-gray-500">Total: {stats.total} candidatures</p>
      </div>

      {/* Statistiques - Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div className="bg-white p-4 sm:p-6 rounded-lg border hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total candidatures</p>
              <p className="text-xl sm:text-2xl font-bold">{stats.total}</p>
            </div>
            <div className="bg-gray-800 p-2 sm:p-3 rounded-lg">
              <Briefcase className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-lg border hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">En attente</p>
              <p className="text-xl sm:text-2xl font-bold">{stats.enAttente}</p>
            </div>
            <div className="bg-yellow-500 p-2 sm:p-3 rounded-lg">
              <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-lg border hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">En développement</p>
              <p className="text-xl sm:text-2xl font-bold">{stats.enDeveloppement}</p>
            </div>
            <div className="bg-blue-500 p-2 sm:p-3 rounded-lg">
              <Play className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Filtres - Responsive */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
              filter === 'all'
                ? 'bg-black text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Toutes ({stats.total})
          </button>
          <button
            onClick={() => setFilter('en_attente')}
            className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
              filter === 'en_attente'
                ? 'bg-yellow-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            En attente ({stats.enAttente})
          </button>
          <button
            onClick={() => setFilter('en_developpement')}
            className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
              filter === 'en_developpement'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            En développement ({stats.enDeveloppement})
          </button>
        </div>
      </div>

      {/* Liste des candidatures */}
      <div className="space-y-4">
        {filteredApplications.length === 0 ? (
          <div className="text-center py-12">
            <div className="mb-4">
              <Briefcase className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-base sm:text-lg">
                {filter === 'all' 
                  ? 'Aucune candidature envoyée pour le moment' 
                  : `Aucune candidature ${getStatusConfig(filter).label.toLowerCase()}`
                }
              </p>
            </div>
            {filter === 'all' && (
              <Link
                href="/projects"
                className="bg-black text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors inline-flex items-center space-x-2 text-sm sm:text-base"
              >
                <Briefcase className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Parcourir les projets</span>
              </Link>
            )}
          </div>
        ) : (
          filteredApplications.map((application) => {
            const statusConfig = getStatusConfig(application.status);
            const StatusIcon = statusConfig.icon;
            
            return (
              <div key={application.id} className="bg-white border rounded-lg p-4 sm:p-6 hover:shadow-lg transition-shadow">
                <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3">
                      <h3 className="text-lg sm:text-xl font-bold">{application.project?.title || 'Projet inconnu'}</h3>
                      {/* Statut à côté du titre */}
                      <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full border text-sm ${statusConfig.color} w-fit`}>
                        <StatusIcon className="w-4 h-4" />
                        <span>{statusConfig.label}</span>
                      </div>
                    </div>
                    
                    <p className="text-gray-600 mb-4 line-clamp-2 text-sm sm:text-base">
                      {application.project?.description || 'Description non disponible'}
                    </p>

                    {/* Informations du projet - Responsive Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <User className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">Client: {application.client?.full_name || application.client?.email || 'Client inconnu'}</span>
                      </div>
                      {application.project?.budget_min && application.project?.budget_max && (
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <DollarSign className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{formatBudget(application.project.budget_min, application.project.budget_max)}</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">Candidature: {formatDate(application.created_at)}</span>
                      </div>
                      {application.project?.project_type && (
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Briefcase className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{application.project.project_type} • {application.project.complexity}</span>
                        </div>
                      )}
                    </div>

                    {/* Message de candidature */}
                    {application.message && (
                      <div className="bg-gray-50 p-3 sm:p-4 rounded-lg mb-4">
                        <p className="text-sm text-gray-700">
                          <strong>Votre message:</strong> "{application.message}"
                        </p>
                      </div>
                    )}

                    {/* Compétences requises - Responsive */}
                    {application.project?.required_skills && application.project.required_skills.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {application.project.required_skills.map((skill, index) => (
                          <span key={index} className="bg-blue-100 text-blue-800 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm">
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Description du statut */}
                    <div className="text-sm text-gray-600 italic">
                      {statusConfig.description}
                    </div>
                  </div>
                  
                  {/* Actions - Responsive Stack */}
                  <div className="flex flex-row lg:flex-col gap-2 lg:ml-6 flex-shrink-0">
                    <Link
                      href={`/projects/${application.project_id}`}
                      className="flex-1 lg:flex-none bg-gray-100 text-gray-700 px-3 sm:px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2 text-sm"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Voir projet</span>
                    </Link>
                    
                    {application.conversation ? (
                      <Link
                        href="/messages"
                        className="flex-1 lg:flex-none bg-black text-white px-3 sm:px-4 py-2 rounded-lg font-medium hover:bg-gray-800 transition-colors flex items-center justify-center space-x-2 text-sm"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>Messages</span>
                      </Link>
                    ) : (
                      <div className="flex-1 lg:flex-none bg-gray-200 text-gray-500 px-3 sm:px-4 py-2 rounded-lg font-medium text-center text-sm">
                        Pas de conversation
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
