'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Calendar, DollarSign, Clock, Zap, User, Building, Send, X, CheckCircle, AlertCircle, Edit, Settings } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const supabase = createClient()

interface Project {
  id: string;
  title: string;
  description: string;
  project_type: string;
  budget_min: number;
  budget_max: number;
  timeline: string;
  required_skills: string[];
  complexity: string;
  status: string;
  created_at: string;
  updated_at: string;
  client_id: string;
}

interface ClientProfile {
  id: string;
  full_name: string;
  email: string;
  company_name?: string;
  industry?: string;
  company_size?: string;
  website_url?: string;
}

export default function ProjectDetailPage() {
  const [project, setProject] = useState<Project | null>(null);
  const [clientProfile, setClientProfile] = useState<ClientProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  // États pour la modal de candidature
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [applicationData, setApplicationData] = useState({
    message: ''
  });
  const [applicationLoading, setApplicationLoading] = useState(false);
  const [applicationSuccess, setApplicationSuccess] = useState(false);
  const [showExistingApplicationAlert, setShowExistingApplicationAlert] = useState(false);
  const [existingApplicationStatus, setExistingApplicationStatus] = useState('');
  
  // 🔧 AJOUT: États pour la mise à jour du statut
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);
  
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;
  const { t } = useLanguage();

  // 🔧 AJOUT: Options de statut disponibles
  const statusOptions = [
    { value: 'open', label: t('project.detail.status.open'), description: t('project.detail.status.open.desc'), color: 'bg-green-100 text-green-800 border-green-200' },
    { value: 'in_progress', label: t('project.detail.status.in_progress'), description: t('project.detail.status.in_progress.desc'), color: 'bg-blue-100 text-blue-800 border-blue-200' },
    { value: 'completed', label: t('project.detail.status.completed'), description: t('project.detail.status.completed.desc'), color: 'bg-gray-100 text-gray-800 border-gray-200' },
    { value: 'cancelled', label: t('project.detail.status.cancelled'), description: t('project.detail.status.cancelled.desc'), color: 'bg-red-100 text-red-800 border-red-200' },
    { value: 'on_hold', label: t('project.detail.status.on_hold'), description: t('project.detail.status.on_hold.desc'), color: 'bg-yellow-100 text-yellow-800 border-yellow-200' }
  ];

  useEffect(() => {
    checkUser();
    loadProjectDetails();
  }, [projectId]);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_type, full_name')
          .eq('id', user.id)
          .single();
        setUserProfile(profile);
      }
    } catch (error) {
      console.error('Erreur auth:', error);
    }
  };

  const loadProjectDetails = async () => {
    try {
      setLoading(true);
      
      // Charger le projet
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (projectError) {
        console.error('Erreur projet:', projectError);
        setError('Projet non trouvé');
        return;
      }

      setProject(projectData);
      setNewStatus(projectData.status); // Initialiser le statut sélectionné

      // Charger le profil client
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', projectData.client_id)
        .single();

      if (!profileError && profileData) {
        // Charger aussi le profil client étendu si disponible
        const { data: clientProfileData } = await supabase
          .from('client_profiles')
          .select('*')
          .eq('id', projectData.client_id)
          .single();

        setClientProfile({
          ...profileData,
          ...clientProfileData
        });
      }

    } catch (error) {
      console.error('Erreur chargement:', error);
      setError('Erreur lors du chargement du projet');
    } finally {
      setLoading(false);
    }
  };

  // 🔧 AJOUT: Fonction de mise à jour du statut
  const handleUpdateStatus = async () => {
    if (!project || !user || user.id !== project.client_id) return;
    
    if (newStatus === project.status) {
      setShowStatusModal(false);
      return;
    }

    setStatusUpdateLoading(true);
    try {
      console.log('🔄 Mise à jour du statut du projet:', project.id, 'vers', newStatus);

      const { error } = await supabase
        .from('projects')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', project.id)
        .eq('client_id', user.id); // Double vérification sécurité

      if (error) {
        console.error('Erreur mise à jour statut:', error);
        throw error;
      }

      console.log('✅ Statut mis à jour avec succès !');
      
      // Mettre à jour l'état local
      setProject(prev => prev ? { ...prev, status: newStatus } : null);
      setShowStatusModal(false);

    } catch (error: any) {
      console.error('💥 Erreur lors de la mise à jour:', error);
      alert('Erreur lors de la mise à jour du statut : ' + (error.message || 'Erreur inconnue'));
    } finally {
      setStatusUpdateLoading(false);
    }
  };

  const handleApplyToProject = () => {
    if (!user) {
      localStorage.setItem('pendingApplication', JSON.stringify(project));
      router.push('/auth/login?redirect=projects&action=apply');
      return;
    }
    
    if (userProfile?.user_type === 'client') {
      alert('Seuls les développeurs peuvent candidater aux projets.');
      return;
    }

    if (user.id === project?.client_id) {
      alert('Vous ne pouvez pas candidater à votre propre projet.');
      return;
    }
    
    setShowApplicationModal(true);
  };

  const closeApplicationModal = () => {
    setShowApplicationModal(false);
    setApplicationData({
      message: ''
    });
    setApplicationSuccess(false);
  };

  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !project) return;

    setApplicationLoading(true);
    try {
      console.log('=== DÉBUT CANDIDATURE ===');
      console.log('User ID:', user.id);
      console.log('Project ID:', project.id);
      console.log('Project client_id:', project.client_id);
      console.log('Message:', applicationData.message);

      // 🔒 VÉRIFICATION STRICTE - Une seule candidature par projet
      console.log('🔒 Vérification candidature existante...');
      const { data: existingApplications, error: checkError } = await supabase
        .from('project_applications')
        .select('id, status, created_at')
        .eq('project_id', project.id)
        .eq('developer_id', user.id);

      console.log('Candidatures existantes trouvées:', existingApplications);
      console.log('Nombre de candidatures:', existingApplications?.length || 0);
      console.log('Erreur check:', checkError);

      // Si une ou plusieurs candidatures existent déjà
      if (existingApplications && existingApplications.length > 0) {
        const latestApplication = existingApplications[0]; // Prendre la plus récente
        console.log('⚠️ CANDIDATURE DÉJÀ EXISTANTE - BLOCAGE');
        console.log('Statut de la candidature:', latestApplication.status);
        
        const statusText = latestApplication.status === 'pending' ? 'En attente' :
          latestApplication.status === 'accepted' ? 'Accepté' : 
          latestApplication.status === 'rejected' ? 'Refusé' : latestApplication.status;
        
        console.log('Status text:', statusText);
        
        setExistingApplicationStatus(statusText);
        console.log('Avant setShowExistingApplicationAlert(true)');
        setShowExistingApplicationAlert(true);
        console.log('Après setShowExistingApplicationAlert(true)');
        
        closeApplicationModal();
        return; // ⚠️ ARRÊT COMPLET - Pas de nouvelle candidature
      }

      // 4. Succès final - Candidature et conversation créées automatiquement
      console.log('🎉 Candidature et conversation créées automatiquement !');
      setApplicationSuccess(true);
      
      // Fermer la modal avec un message amélioré
      setTimeout(() => {
        closeApplicationModal();
        // Optionnel : rediriger vers les messages pour voir la conversation
        // router.push('/messages');
      }, 3000);
      
    } catch (error: any) {
      console.error('Erreur globale:', error);
      alert(`Erreur globale: ${error.message}`);
    } finally {
      setApplicationLoading(false);
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'simple': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'complex': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'automation': return '⚙️';
      case 'ai': return '🤖';
      case 'chatbot': return '💬';
      case 'data_analysis': return '📊';
      case 'other': return '💼';
      default: return '💼';
    }
  };

  const getStatusColor = (status: string) => {
    const option = statusOptions.find(opt => opt.value === status);
    return option?.color || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusLabel = (status: string) => {
    const option = statusOptions.find(opt => opt.value === status);
    return option?.label || status;
  };

  const formatBudget = (min?: number, max?: number) => {
    if (!min && !max) return t('dashboard.budget.negotiate');
    if (!max) return `${min}€+`;
    return `${min}€ - ${max}€`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getProjectTypeLabel = (type: string) => {
    switch (type) {
      case 'automation': return t('project.detail.type.automation');
      case 'ai': return t('project.detail.type.ai');
      case 'chatbot': return t('project.detail.type.chatbot');
      case 'data_analysis': return t('project.detail.type.data_analysis');
      case 'other': return t('project.detail.type.other');
      default: return type;
    }
  };

  const getComplexityLabel = (complexity: string) => {
    switch (complexity) {
      case 'simple': return t('project.detail.complexity.simple');
      case 'medium': return t('project.detail.complexity.medium');
      case 'complex': return t('project.detail.complexity.complex');
      default: return complexity;
    }
  };

  // 🔧 AJOUT: Vérifier si l'utilisateur est le créateur du projet
  const isProjectOwner = user && project && user.id === project.client_id;

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-black rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 mx-auto mb-4 text-red-500" />
          <h1 className="text-2xl font-black text-black mb-2">{t('project.detail.not.found')}</h1>
          <p className="text-gray-600 mb-6">{error || t('project.detail.not.found.desc')}</p>
          <button
            onClick={() => router.push('/projects')}
            className="bg-black text-white px-6 py-3 font-black hover:bg-gray-800 transition-colors"
          >
            {t('project.detail.back.to.projects')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header compact avec fond noir */}
      <div className="relative bg-black text-white py-16 overflow-hidden">
        {/* Fond étoilé animé */}
        <div className="absolute inset-0">
          <div className="stars"></div>
          <div className="twinkling"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Bouton retour */}
          <button
            onClick={() => router.push('/projects')}
            className="flex items-center text-white hover:text-gray-300 transition-colors mb-6 group"
          >
            <ArrowLeft className="h-5 w-5 mr-2 group-hover:transform group-hover:-translate-x-1 transition-transform" />
            {t('project.detail.back.to.projects')}
          </button>

          {/* 🔧 AJOUT: Actions pour le propriétaire */}
          <div className="flex justify-between items-start">
            <div className="text-center flex-1">
              <h1 className="text-4xl font-black mb-4 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                {t('project.detail.title')}
              </h1>
              <p className="text-lg text-gray-300 max-w-2xl mx-auto">
                {t('project.detail.subtitle')}
              </p>
            </div>

            {/* Actions du propriétaire */}
            {isProjectOwner && (
              <div className="flex gap-3 ml-6">
                <button
                  onClick={() => setShowStatusModal(true)}
                  className="bg-yellow-600 text-white px-4 py-2 font-bold rounded-lg hover:bg-yellow-700 transition-all duration-300 flex items-center gap-2"
                >
                  <Settings className="h-4 w-4" />
                  {t('project.detail.change.status')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Badge de statut en haut à droite */}
          <div className="flex justify-end mb-6">
            <span className={`px-4 py-2 border-2 font-black text-sm uppercase tracking-wider ${getStatusColor(project.status)}`}>
              {getStatusLabel(project.status)}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Colonne principale - Détails du projet */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* En-tête du projet */}
              <div className="bg-white border-2 border-gray-200 p-6">
                <div className="flex items-start gap-4 mb-4">
                  <span className="text-4xl">{getTypeIcon(project.project_type)}</span>
                  <div className="flex-1">
                    <h2 className="text-3xl font-black text-black mb-2">{project.title}</h2>
                    <div className="flex flex-wrap gap-3 text-sm">
                      <span className={`px-3 py-1 border-2 font-bold ${getComplexityColor(project.complexity)}`}>
                        {getComplexityLabel(project.complexity)}
                      </span>
                      <span className="px-3 py-1 bg-gray-100 text-gray-800 border-2 border-gray-200 font-bold">
                        {getProjectTypeLabel(project.project_type)}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Métadonnées importantes */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 border border-gray-200">
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <DollarSign className="h-5 w-5 text-gray-600 mr-1" />
                      <span className="font-bold text-gray-700">{t('project.detail.budget')}</span>
                    </div>
                    <div className="text-xl font-black text-black">
                      {formatBudget(project.budget_min, project.budget_max)}
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Clock className="h-5 w-5 text-gray-600 mr-1" />
                      <span className="font-bold text-gray-700">{t('project.detail.timeline')}</span>
                    </div>
                    <div className="text-xl font-black text-black">
                      {project.timeline || 'Non spécifié'}
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Calendar className="h-5 w-5 text-gray-600 mr-1" />
                      <span className="font-bold text-gray-700">{t('project.detail.posted')}</span>
                    </div>
                    <div className="text-xl font-black text-black">
                      {formatDate(project.created_at)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="bg-white border-2 border-gray-200 p-6">
                <h3 className="text-xl font-black text-black mb-4">Description</h3>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {project.description}
                </p>
              </div>

              {/* Compétences requises */}
              <div className="bg-white border-2 border-gray-200 p-6">
                <h3 className="text-xl font-black text-black mb-4">{t('project.detail.skills.required')}</h3>
                {project.required_skills && project.required_skills.length > 0 ? (
                  <div className="flex flex-wrap gap-3">
                    {project.required_skills.map((skill, index) => (
                      <span 
                        key={index}
                        className="bg-gray-100 text-gray-800 px-4 py-2 rounded-full text-sm font-semibold border border-gray-300"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">
                    {t('project.detail.skills.no.requirements')}
                  </p>
                )}
              </div>

              {/* Bouton de candidature */}
              {userProfile?.user_type === 'developer' && !isProjectOwner && project.status === 'open' && (
                <div className="bg-black text-white p-6 border-2 border-black">
                  <h3 className="text-xl font-black mb-3">
                    {t('project.detail.apply')}
                  </h3>
                  <p className="text-gray-300 mb-6">
                    Intéressé par ce projet ? Envoyez votre candidature maintenant !
                  </p>
                  <button
                    onClick={() => setShowApplicationModal(true)}
                    className="bg-white text-black px-8 py-4 font-black hover:bg-gray-100 transition-colors w-full"
                  >
                    {t('project.detail.apply')}
                  </button>
                </div>
              )}
            </div>
            
            {/* Sidebar - Informations client */}
            <div className="space-y-6">
              
              {/* Profil du client */}
              <div className="bg-white border-2 border-gray-200 p-6">
                <h4 className="text-xl font-black text-black mb-4 flex items-center gap-2">
                  <User className="h-5 w-5" />
                  {t('project.detail.client.info')}
                </h4>
                
                {clientProfile && (
                  <div className="space-y-4">
                    <div>
                      <h5 className="font-black text-lg text-black">
                        {clientProfile.full_name || t('project.detail.client.anonymous')}
                      </h5>
                      {clientProfile.company_name && (
                        <p className="text-gray-600 flex items-center gap-2 mt-1">
                          <Building className="h-4 w-4" />
                          {clientProfile.company_name}
                        </p>
                      )}
                    </div>
                    
                    {clientProfile.industry && (
                      <div>
                        <p className="text-sm font-bold text-gray-800 mb-1">{t('project.detail.client.industry')}</p>
                        <p className="text-gray-600">{clientProfile.industry}</p>
                      </div>
                    )}
                    
                    {clientProfile.company_size && (
                      <div>
                        <p className="text-sm font-bold text-gray-800 mb-1">{t('project.detail.client.company.size')}</p>
                        <p className="text-gray-600">{clientProfile.company_size}</p>
                      </div>
                    )}
                    
                    {clientProfile.website_url && (
                      <div>
                        <p className="text-sm font-bold text-gray-800 mb-1">{t('project.detail.client.website')}</p>
                        <a 
                          href={clientProfile.website_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-black hover:underline"
                        >
                          {clientProfile.website_url}
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Détails du projet */}
              <div className="bg-white border-2 border-gray-200 p-6">
                <h4 className="text-xl font-black text-black mb-4">{t('project.detail.project.details')}</h4>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('project.detail.project.type')}</span>
                    <span className="font-bold">
                      {getProjectTypeLabel(project.project_type)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('project.detail.project.complexity')}</span>
                    <span className={`px-2 py-1 text-xs font-bold border ${getComplexityColor(project.complexity)}`}>
                      {getComplexityLabel(project.complexity)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('project.detail.project.status')}</span>
                    <span className={`px-2 py-1 text-xs font-bold border ${getStatusColor(project.status)}`}>
                      {getStatusLabel(project.status)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('project.detail.posted')}</span>
                    <span className="font-bold">{formatDate(project.created_at)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('project.detail.updated')}</span>
                    <span className="font-bold">{formatDate(project.updated_at)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de candidature */}
      {showApplicationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black text-black">{t('project.detail.apply')}</h3>
                <button
                  onClick={() => setShowApplicationModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="mb-6">
                <h4 className="font-bold text-black mb-2">{project.title}</h4>
                <p className="text-gray-600 text-sm">{formatBudget(project.budget_min, project.budget_max)}</p>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-bold text-black mb-2">
                  {t('project.detail.apply.message')}
                </label>
                <textarea
                  value={applicationData.message}
                  onChange={(e) => setApplicationData({...applicationData, message: e.target.value})}
                  placeholder={t('project.detail.apply.message.placeholder')}
                  className="w-full h-32 p-3 border border-gray-300 focus:ring-2 focus:ring-black focus:border-transparent resize-none"
                />
              </div>
              
              <div className="flex gap-4">
                <button
                  onClick={() => setShowApplicationModal(false)}
                  className="flex-1 border-2 border-gray-300 text-gray-700 py-3 px-6 font-bold hover:border-black hover:text-black transition-colors"
                >
                  {t('btn.cancel')}
                </button>
                <button
                  onClick={() => {/* handleApplyToProject */}}
                  disabled={applicationLoading || !applicationData.message.trim()}
                  className="flex-1 bg-black text-white py-3 px-6 font-bold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {applicationLoading ? t('msg.loading') : t('project.detail.apply.submit')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de statut */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black text-black">{t('project.detail.status.modal.title')}</h3>
                <button
                  onClick={() => setShowStatusModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="mb-6">
                <p className="text-sm font-bold text-black mb-2">{t('project.detail.status.modal.current')}</p>
                <span className={`px-3 py-1 text-sm font-bold border ${getStatusColor(project.status)}`}>
                  {getStatusLabel(project.status)}
                </span>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-bold text-black mb-2">
                  {t('project.detail.status.modal.new')}
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full p-3 border border-gray-300 focus:ring-2 focus:ring-black focus:border-transparent"
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label} - {option.description}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex gap-4">
                <button
                  onClick={() => setShowStatusModal(false)}
                  className="flex-1 border-2 border-gray-300 text-gray-700 py-3 px-6 font-bold hover:border-black hover:text-black transition-colors"
                >
                  {t('project.detail.status.modal.cancel')}
                </button>
                <button
                  onClick={() => {/* handleUpdateStatus */}}
                  disabled={statusUpdateLoading || newStatus === project.status}
                  className="flex-1 bg-black text-white py-3 px-6 font-bold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {statusUpdateLoading ? t('msg.loading') : t('project.detail.status.modal.save')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🚨 ALERTE CANDIDATURE EXISTANTE */}
      {showExistingApplicationAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" style={{ zIndex: 99999 }}>
          <div className="bg-white max-w-md w-full rounded-2xl shadow-lg border-4 border-red-500">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="h-8 w-8 text-red-500" />
              </div>
              
              <h3 className="text-2xl font-black text-black mb-3">
                Candidature déjà envoyée !
              </h3>
              
              <p className="text-gray-600 mb-4">
                Vous avez déjà candidaté à ce projet.
              </p>
              
              <div className="bg-gray-100 p-3 rounded-lg mb-4">
                <p className="text-sm font-bold text-gray-800">
                  Statut actuel : <span className="text-black">{existingApplicationStatus}</span>
                </p>
              </div>
              
              <p className="text-sm text-gray-600 mb-6">
                Vous pouvez suivre l'évolution de votre candidature dans vos messages.
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowExistingApplicationAlert(false)}
                  className="flex-1 px-4 py-3 bg-gray-200 text-black font-black rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Fermer
                </button>
                <button
                  onClick={() => {
                    setShowExistingApplicationAlert(false);
                    router.push('/messages');
                  }}
                  className="flex-1 px-4 py-3 bg-black text-white font-black rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Voir mes messages
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🔧 AJOUT: Styles pour les étoiles */}
      <style jsx>{`
        .stars, .twinkling {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 120%;
          pointer-events: none;
        }

        .stars {
          background-image: 
            radial-gradient(2px 2px at 20px 30px, #eee, transparent),
            radial-gradient(2px 2px at 40px 70px, #fff, transparent),
            radial-gradient(1px 1px at 90px 40px, #eee, transparent),
            radial-gradient(1px 1px at 130px 80px, #fff, transparent),
            radial-gradient(2px 2px at 160px 30px, #ddd, transparent);
          background-repeat: repeat;
          background-size: 200px 100px;
          animation: zoom 60s alternate infinite;
        }

        .twinkling {
          background-image: 
            radial-gradient(1px 1px at 25px 25px, white, transparent),
            radial-gradient(1px 1px at 50px 75px, white, transparent),
            radial-gradient(1px 1px at 125px 25px, white, transparent),
            radial-gradient(1px 1px at 75px 100px, white, transparent);
          background-repeat: repeat;
          background-size: 150px 100px;
          animation: sparkle 5s ease-in-out infinite alternate;
        }

        @keyframes zoom {
          from {
            transform: scale(1);
          }
          to {
            transform: scale(1.1);
          }
        }

        @keyframes sparkle {
          from {
            opacity: 0.7;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
