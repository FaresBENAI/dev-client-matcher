'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, MapPin, Calendar, DollarSign, Grid, List, Plus, X, CheckCircle, Clock, Zap, Send, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/contexts/LanguageContext';
import InfoPopup from '@/components/ui/info-popup';

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
  client: {
    full_name: string;
  };
}

function ProjectsContent() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBudget, setSelectedBudget] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  
  // États pour la modal de création
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    project_type: 'automation',
    budget_min: '',
    budget_max: '',
    timeline: '',
    required_skills: [] as string[],
    complexity: 'medium'
  });
  const [skillInput, setSkillInput] = useState('');
  const [createLoading, setCreateLoading] = useState(false);

  // États pour la modal de candidature
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [applicationData, setApplicationData] = useState({
    message: ''
  });
  const [applicationLoading, setApplicationLoading] = useState(false);
  const [applicationSuccess, setApplicationSuccess] = useState(false);

  // NOUVEAU : États pour l'alerte stylée de candidature existante
  const [showExistingApplicationAlert, setShowExistingApplicationAlert] = useState(false);
  const [existingApplicationData, setExistingApplicationData] = useState<{
    status: string;
    project: Project | null;
  }>({ status: '', project: null });

  // États pour le popup d'information
  const [showInfoPopup, setShowInfoPopup] = useState(false);
  const [infoPopupData, setInfoPopupData] = useState({
    title: '',
    message: '',
    type: 'info' as 'info' | 'processing' | 'success'
  });
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();

  useEffect(() => {
    checkUser();
    loadProjects();
    
    if (searchParams.get('success') === 'created') {
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 5000);
      window.history.replaceState({}, '', '/projects');
    }

    // Vérifier s'il y a une candidature en attente après auth
    if (searchParams.get('action') === 'apply' && user) {
      const pendingApplication = localStorage.getItem('pendingApplication');
      if (pendingApplication) {
        try {
          const project = JSON.parse(pendingApplication);
          localStorage.removeItem('pendingApplication');
          
          // Petit délai pour s'assurer que userProfile est chargé
          setTimeout(() => {
            if (userProfile?.user_type === 'developer' && user.id !== project.client_id) {
              setSelectedProject(project);
              setShowApplicationModal(true);
            }
          }, 500);
        } catch (error) {
          console.error('Erreur parsing pendingApplication:', error);
        }
      }
      // Nettoyer l'URL
      window.history.replaceState({}, '', '/projects');
    }
  }, [searchParams, user, userProfile]);

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

  const loadProjects = async () => {
    try {
      console.log('=== CHARGEMENT PROJETS ===');
      
      // Charger d'abord les projets
      const { data: simpleData, error: simpleError } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('Projets sans relation:', simpleData);

      if (simpleData && simpleData.length > 0) {
        // Charger les noms des clients pour chaque projet
        const projectsWithClient = await Promise.all(
          simpleData.map(async (project) => {
            if (project.client_id) {
              const { data: clientData } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('id', project.client_id)
                .single();
              
              return {
                ...project,
                client: { full_name: clientData?.full_name || 'Client Anonyme' }
              };
            } else {
              return {
                ...project,
                client: { full_name: 'Client Anonyme' }
              };
            }
          })
        );

        setProjects(projectsWithClient);
        console.log('Projets chargés avec succès:', projectsWithClient.length);
      } else {
        console.log('Aucun projet trouvé');
        setProjects([]);
      }

      if (simpleError) {
        console.error('Erreur load projects:', simpleError);
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = () => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    
    if (userProfile?.user_type === 'developer') {
      alert('Seuls les clients peuvent créer des projets.');
      return;
    }
    
    setShowCreateModal(true);
  };

  const handleApplyToProject = async (project: Project) => {
    if (!user) {
      // Stocker le projet dans le localStorage pour après l'auth
      localStorage.setItem('pendingApplication', JSON.stringify(project));
      router.push('/auth/login?redirect=projects&action=apply');
      return;
    }
    
    // Vérifier si l'utilisateur n'est pas le créateur du projet
    if (user.id === project.client_id) {
      alert('Vous ne pouvez pas candidater à votre propre projet.');
      return;
    }
    
    // Avertissement pour les clients mais permettre quand même
    if (userProfile?.user_type === 'client') {
      const confirmed = confirm('Vous êtes inscrit comme client. Voulez-vous vraiment candidater à ce projet en tant que développeur ?');
      if (!confirmed) return;
    }
    
    // Vérifier si une candidature existe déjà
    try {
      const { data: existingApplication } = await supabase
        .from('project_applications')
        .select('id, status')
        .eq('project_id', project.id)
        .eq('developer_id', user.id)
        .single();

      if (existingApplication) {
        console.log('🔍 DEBUG - Candidature existante trouvée:', existingApplication);
        
        // Vérifier si le message de candidature existe déjà dans la conversation
        const { data: existingConversation } = await supabase
          .from('conversations')
          .select('id')
          .eq('client_id', project.client_id)
          .eq('developer_id', user.id)
          .eq('project_id', project.id)
          .single();

        if (existingConversation) {
          console.log('🔍 DEBUG - Conversation existante trouvée:', existingConversation.id);
          
          // Vérifier si un message de candidature existe déjà (en cherchant par contenu)
          const { data: existingMessage } = await supabase
            .from('messages')
            .select('id, content')
            .eq('conversation_id', existingConversation.id)
            .eq('sender_id', user.id)
            .ilike('content', '%nouvelle candidature%')
            .single();

          console.log('🔍 DEBUG - Message existant:', existingMessage);

          if (!existingMessage) {
            console.log('🔍 DEBUG - Création du message de candidature manquant...');
            // Créer le message de candidature dans la conversation existante
            const messageData = {
              conversation_id: existingConversation.id,
              sender_id: user.id,
              content: `🎉 Vous avez reçu une nouvelle candidature !\n\nCandidature envoyée\n\nNous vous souhaitons une excellente collaboration et la réussite de votre projet. L'équipe LinkerAI reste disponible pour vous accompagner tout au long de cette aventure.\n\nBonne chance ! 🚀`,
              is_read: false
            };

            const { error: msgError } = await supabase
              .from('messages')
              .insert([messageData]);

            if (msgError) {
              console.error('❌ DEBUG - Erreur création message:', msgError);
            } else {
              console.log('✅ DEBUG - Message de candidature créé avec succès');
            }
          } else {
            console.log('✅ DEBUG - Message de candidature existe déjà');
          }
        } else {
          console.log('⚠️ DEBUG - Pas de conversation trouvée pour cette candidature');
        }

        // Afficher l'alerte stylée pour candidature existante
        setExistingApplicationData({
          status: existingApplication.status,
          project: project
        });
        setShowExistingApplicationAlert(true);
        return;
      }
    } catch (error) {
      // Pas de candidature existante, continuer normalement
      console.log('🔍 DEBUG - Aucune candidature existante trouvée, continuer...');
    }
    
    // Ouvrir la modal de candidature
    setSelectedProject(project);
    setShowApplicationModal(true);
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setFormData({
      title: '',
      description: '',
      project_type: 'automation',
      budget_min: '',
      budget_max: '',
      timeline: '',
      required_skills: [],
      complexity: 'medium'
    });
    setSkillInput('');
  };

  const closeApplicationModal = () => {
    setShowApplicationModal(false);
    setSelectedProject(null);
    setApplicationData({
      message: ''
    });
    setApplicationSuccess(false);
  };

  // NOUVEAU : Fermer l'alerte de candidature existante
  const closeExistingApplicationAlert = () => {
    setShowExistingApplicationAlert(false);
    setExistingApplicationData({ status: '', project: null });
  };

  // NOUVEAU : Rediriger vers les messages
  const goToMessages = () => {
    closeExistingApplicationAlert();
    router.push('/messages');
  };

  const handleSubmitProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setCreateLoading(true);
    try {
      console.log('=== CREATION PROJET ===');
      console.log('User ID:', user.id);
      console.log('Form data:', formData);
      
      // Version avec tous les champs obligatoires selon votre structure
      const projectData = {
        title: formData.title,
        description: formData.description,
        project_type: formData.project_type,
        budget_min: parseInt(formData.budget_min),
        budget_max: parseInt(formData.budget_max),
        timeline: formData.timeline,
        required_skills: formData.required_skills,
        complexity: formData.complexity,
        status: 'open',
        client_id: user.id
      };
      
      console.log('Project data to insert:', projectData);
      
      const { data, error } = await supabase
        .from('projects')
        .insert([projectData]);

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      console.log('Project created successfully:', data);

      // Fermer la modal et recharger les projets
      closeCreateModal();
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 5000);
      await loadProjects(); // Recharger la liste
      
    } catch (error: any) {
      console.error('Erreur lors de la création:', error);
      alert(`Erreur lors de la création du projet: ${error.message}`);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedProject) return;

    // Afficher le popup d'information immédiatement
    setInfoPopupData({
      title: 'Candidature en cours',
      message: 'Votre candidature est en cours de traitement. Nous créons votre profil de candidature et notifions le client. Cette opération peut prendre quelques minutes.',
      type: 'processing'
    });
    setShowInfoPopup(true);

    setApplicationLoading(true);
    try {
      console.log('🚀 DÉMARRAGE CANDIDATURE FORCÉE:', {
        userId: user.id,
        projectId: selectedProject.id,
        clientId: selectedProject.client_id
      });

      // 1. CRÉER LA CANDIDATURE D'ABORD
      const { data: newApplication, error: appError } = await supabase
        .from('project_applications')
        .insert({
          developer_id: user.id,
          project_id: selectedProject.id,
          status: 'pending'
        })
        .select()
        .single();

      if (appError) {
        console.error('❌ Erreur candidature:', appError);
        throw new Error(`Erreur candidature: ${appError.message}`);
      }

      console.log('✅ Candidature créée:', newApplication);

      // 2. CRÉER OU RÉCUPÉRER CONVERSATION (UPSERT LOGIC)
      let conversationId: string;
      
      // D'abord essayer de récupérer une conversation existante
      const { data: existingConv } = await supabase
        .from('conversations')
        .select('id')
        .eq('client_id', selectedProject.client_id)
        .eq('developer_id', user.id)
        .eq('project_id', selectedProject.id)
        .single();

      if (existingConv) {
        // Conversation existe, on l'utilise
        conversationId = existingConv.id;
        console.log('📞 Conversation existante utilisée:', conversationId);
        
        // Mettre à jour timestamp
        await supabase
          .from('conversations')
          .update({ 
            updated_at: new Date().toISOString(),
            last_message_at: new Date().toISOString()
          })
          .eq('id', conversationId);
      } else {
        // Créer nouvelle conversation
        const { data: newConversation, error: convError } = await supabase
          .from('conversations')
          .insert({
            client_id: selectedProject.client_id,
            developer_id: user.id,
            project_id: selectedProject.id,
            subject: `Candidature pour "${selectedProject.title}"`,
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (convError) {
          console.error('❌ Erreur conversation:', convError);
          throw new Error(`Erreur conversation: ${convError.message}`);
        }

        conversationId = newConversation.id;
        console.log('✅ Nouvelle conversation créée:', conversationId);
      }

      // 3. CRÉER MESSAGE DE CANDIDATURE FORCÉ
      const { data: newMessage, error: msgError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content: `🎉 Vous avez reçu une nouvelle candidature !\n\n${applicationData.message}\n\nNous vous souhaitons une excellente collaboration et la réussite de votre projet. L'équipe LinkerAI reste disponible pour vous accompagner tout au long de cette aventure.\n\nBonne chance ! 🚀`,
          is_read: false,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (msgError) {
        console.error('❌ Erreur message:', msgError);
        throw new Error(`Erreur message: ${msgError.message}`);
      }

      console.log('✅ Message créé:', newMessage);

      console.log('🎉 CANDIDATURE COMPLÈTE RÉUSSIE !');
      
      // Afficher popup de succès
      setInfoPopupData({
        title: 'Candidature envoyée !',
        message: '🎉 Votre candidature a été envoyée avec succès ! Le client a été notifié et vous pouvez suivre l\'évolution dans vos messages. Bonne chance !',
        type: 'success'
      });
      
      setApplicationSuccess(true);
      setTimeout(() => {
        closeApplicationModal();
      }, 2000);
      
    } catch (error: any) {
      console.error('💥 ERREUR CANDIDATURE:', error);
      
      // Afficher popup d'erreur
      setInfoPopupData({
        title: 'Erreur de candidature',
        message: `Une erreur s'est produite lors de l'envoi de votre candidature : ${error.message}. Veuillez réessayer.`,
        type: 'info'
      });
    } finally {
      setApplicationLoading(false);
    }
  };

  const addSkill = () => {
    if (skillInput.trim() && !formData.required_skills.includes(skillInput.trim())) {
      setFormData(prev => ({
        ...prev,
        required_skills: [...prev.required_skills, skillInput.trim()]
      }));
      setSkillInput('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      required_skills: prev.required_skills.filter(skill => skill !== skillToRemove)
    }));
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBudget = selectedBudget === 'all' || 
                         (selectedBudget === 'low' && project.budget_max < 5000) ||
                         (selectedBudget === 'medium' && project.budget_max >= 5000 && project.budget_max < 15000) ||
                         (selectedBudget === 'high' && project.budget_max >= 15000);
    const matchesType = selectedType === 'all' || project.project_type === selectedType;
    
    return matchesSearch && matchesBudget && matchesType;
  });

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'simple': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'complex': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'automation': return '🤖';
      case 'ai': return '🧠';
      case 'chatbot': return '💬';
      case 'data_analysis': return '📊';
      case 'other': return '💻';
      default: return '💻';
    }
  };

  // NOUVEAU : Fonction pour obtenir le style du statut
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'open':
        return 'px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full border border-green-200';
      case 'in_progress':
        return 'px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full border border-blue-200';
      case 'completed':
        return 'px-3 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full border border-purple-200';
      case 'cancelled':
        return 'px-3 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full border border-red-200';
      case 'paused':
        return 'px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full border border-yellow-200';
      default:
        return 'px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full border border-gray-200';
    }
  };

  // NOUVEAU : Fonction pour formater le statut
  const getStatusText = (status: string) => {
    switch (status) {
      case 'open': return `● ${t('status.open')}`;
      case 'in_progress': return `● ${t('status.in_progress')}`;
      case 'completed': return `● ${t('status.completed')}`;
      case 'cancelled': return `● ${t('status.cancelled')}`;
      case 'paused': return `● ${t('status.paused')}`;
      case 'pending': return `● ${t('status.pending')}`;
      case 'accepted': return `● ${t('status.accepted')}`;
      case 'rejected': return `● ${t('status.rejected')}`;
      default: return `● ${status}`;
    }
  };

  // Fonction pour formater le temps écoulé
  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return t('time.today');
    if (diffInDays === 1) return `1${t('time.day')}`;
    if (diffInDays < 7) return `${diffInDays}${t('time.day')}`;
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks === 1) return `1${t('time.week')}`;
    return `${diffInWeeks}${t('time.week')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-black rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  const ProjectCard = ({ project }: { project: Project }) => {
    return (
      <div className="group bg-gray-50 rounded-2xl p-4 border-2 border-gray-200 hover:border-black transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
          <span className="px-3 py-1 bg-black text-white text-xs font-bold rounded-full w-fit">
            {getTypeIcon(project.project_type)} {project.project_type || 'Projet'}
          </span>
          <span className={getStatusStyle(project.status)}>
            {getStatusText(project.status)}
          </span>
        </div>
        
        <h3 className="text-lg font-black text-black mb-2 group-hover:text-gray-700 transition-colors">
          {project.title}
        </h3>
        
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{project.description}</p>
        
        <div className="space-y-1 mb-3 text-xs">
          <div className="flex items-center text-gray-600">
            <DollarSign className="h-3 w-3 mr-1 flex-shrink-0" />
            <span className="font-bold text-black">
              {project.budget_min?.toLocaleString()}€ - {project.budget_max?.toLocaleString()}€
            </span>
          </div>
          
          <div className="flex items-center text-gray-600">
            <Clock className="h-3 w-3 mr-1 flex-shrink-0" />
            <span>{project.timeline}</span>
          </div>
          
          <div className="flex items-center text-gray-600">
            <Zap className="h-3 w-3 mr-1 flex-shrink-0" />
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${getComplexityColor(project.complexity)}`}>
              {project.complexity}
            </span>
          </div>
        </div>

        {project.required_skills && project.required_skills.length > 0 && (
          <div className="mb-3">
            <div className="flex flex-wrap gap-1">
              {project.required_skills.slice(0, 2).map((skill, index) => (
                <span key={index} className="px-2 py-0.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs font-medium rounded hover:scale-105 transition-all duration-300">
                  {skill}
                </span>
              ))}
              {project.required_skills.length > 2 && (
                <span className="px-2 py-0.5 bg-gray-200 text-gray-600 text-xs font-medium rounded">
                  +{project.required_skills.length - 2}
                </span>
              )}
            </div>
          </div>
        )}

        <div className="flex justify-between items-center mb-3 text-xs">
          <div className="text-black font-bold truncate">
            Par: {project.client?.full_name || 'Anonyme'}
          </div>
          <div className="text-gray-400 flex-shrink-0">{t('time.ago')} {getTimeAgo(project.created_at)}</div>
        </div>

        <div className="flex gap-2">
          <button 
            onClick={() => router.push(`/projects/${project.id}`)}
            className="flex-1 bg-black text-white hover:bg-gray-800 font-bold py-2 rounded-lg text-sm transition-all duration-300 hover:scale-105"
          >
            {t('projects.see')} →
          </button>
          
          {/* Bouton candidater - simple condition */}
          {user?.id !== project.client_id && (
            <button 
              onClick={() => handleApplyToProject(project)}
              className="border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium px-4 py-2 rounded-lg text-sm"
            >
              <Send className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Message de succès */}
      {showSuccessMessage && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-4 sm:px-6 py-3 sm:py-4 rounded-lg shadow-lg z-50 flex items-center gap-3">
          <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6" />
          <span className="font-bold text-sm sm:text-base">Projet créé avec succès !</span>
          <button 
            onClick={() => setShowSuccessMessage(false)}
            className="ml-2 hover:bg-green-600 p-1 rounded"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Header - Responsive */}
      <div className="relative bg-black text-white py-16 sm:py-24 overflow-hidden">
        <div className="absolute inset-0">
          <div className="stars"></div>
          <div className="twinkling"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-4 sm:mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            {t('projects.title')}
          </h1>
          <p className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto">
            {t('projects.subtitle')}
          </p>
        </div>
      </div>

      {/* Transition */}
      <div className="h-4 bg-gradient-to-b from-black to-white"></div>

      {/* Ancien design des filtres - Interface simple */}
      <div className="bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Barre de recherche */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder={t('projects.search')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>
          </div>

          {/* Filtres */}
          <div className="flex flex-wrap gap-8 mb-6">
            {/* Filtre Budget */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('projects.budget')}</label>
              <div className="relative">
                <select
                  value={selectedBudget}
                  onChange={(e) => setSelectedBudget(e.target.value)}
                  className="appearance-none w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent bg-white pr-10 cursor-pointer hover:border-gray-400 transition-colors"
                >
                  <option value="all">Tous les budgets</option>
                  <option value="low">Moins de 5 000€</option>
                  <option value="medium">5 000€ - 15 000€</option>
                  <option value="high">Plus de 15 000€</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Filtre Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('projects.type')}</label>
              <div className="relative">
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="appearance-none w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent bg-white pr-10 cursor-pointer hover:border-gray-400 transition-colors"
                >
                  <option value="all">Tous les types</option>
                  <option value="automation">Automation</option>
                  <option value="ai">Intelligence Artificielle</option>
                  <option value="chatbot">Chatbot</option>
                  <option value="data_analysis">Analyse de données</option>
                  <option value="other">Autre</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Contrôles de vue */}
            <div className="ml-auto">
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('projects.view')}</label>
              <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-2 ${viewMode === 'grid' ? 'bg-black text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                >
                  <Grid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-2 ${viewMode === 'list' ? 'bg-black text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Bouton créer */}
          <div className="flex justify-between items-center mb-6">
            <div></div>
            <button
              onClick={handleCreateProject}
              className="bg-black text-white px-6 py-3 rounded-lg font-bold hover:bg-gray-800 transition-colors flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              {t('projects.create')}
            </button>
          </div>

          {/* Filtres actifs */}
          {(searchTerm || selectedBudget !== 'all' || selectedType !== 'all') && (
            <div className="mb-6">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-gray-600">Filtres actifs:</span>
                {searchTerm && (
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                    Recherche: "{searchTerm}"
                    <button
                      onClick={() => setSearchTerm('')}
                      className="ml-1 hover:bg-blue-200 rounded"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {selectedBudget !== 'all' && (
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                    Budget: {selectedBudget === 'low' ? '< 5 000€' : selectedBudget === 'medium' ? '5 000€ - 15 000€' : '> 15 000€'}
                    <button
                      onClick={() => setSelectedBudget('all')}
                      className="ml-1 hover:bg-green-200 rounded"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {selectedType !== 'all' && (
                  <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm">
                    Type: {selectedType}
                    <button
                      onClick={() => setSelectedType('all')}
                      className="ml-1 hover:bg-purple-200 rounded"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                <button
                  onClick={() => {
                    setSearchTerm('')
                    setSelectedBudget('all')
                    setSelectedType('all')
                  }}
                  className="text-sm text-gray-600 hover:text-gray-800 underline"
                >
                  Effacer tous les filtres
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Liste des projets */}
      <div className="py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-black">
              {filteredProjects.length} {filteredProjects.length === 1 ? t('projects.found') : t('projects.found.plural')}
            </h2>
          </div>

          {filteredProjects.length > 0 ? (
            <div className={`grid gap-4 sm:gap-6 ${
              viewMode === 'grid' 
                ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' 
                : 'grid-cols-1'
            }`}>
              {filteredProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl sm:text-2xl">🔍</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {t('projects.no.results')}
              </h3>
              <p className="text-gray-600 mb-6">
                {t('projects.no.results.desc')}
              </p>
              
              {user && userProfile?.user_type === 'client' && (
                <div className="border-t-2 border-gray-200 pt-6 mt-6">
                  <h4 className="font-black text-lg text-black mb-3">Vous êtes client ?</h4>
                  <p className="text-gray-600 mb-4">Publiez votre projet et trouvez le développeur parfait !</p>
                  <button
                    onClick={handleCreateProject}
                    className="bg-black text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-black hover:bg-gray-800 transition-all duration-300 transform hover:scale-105 flex items-center gap-2 mx-auto text-sm sm:text-base"
                  >
                    <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                    Créer mon premier projet
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* NOUVELLE Modal d'alerte pour candidature existante - Responsive */}
      {showExistingApplicationAlert && existingApplicationData.project && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white max-w-md w-full rounded-xl shadow-xl border-2 border-red-200">
            <div className="p-4 sm:p-6 text-center">
              <div className="flex justify-center mb-4">
                <div className="bg-red-100 p-3 rounded-full">
                  <AlertTriangle className="h-6 w-6 sm:h-8 sm:w-8 text-red-600" />
                </div>
              </div>
              
              <h2 className="text-xl sm:text-2xl font-black text-black mb-3">
                Candidature déjà envoyée !
              </h2>
              
              <p className="text-gray-600 mb-4 text-sm sm:text-base">
                Vous avez déjà candidaté à ce projet.
              </p>
              
              <div className="bg-gray-50 p-3 sm:p-4 rounded-lg mb-4 sm:mb-6">
                <p className="text-sm font-bold text-gray-700 mb-2">
                  Statut actuel : {getStatusText(existingApplicationData.status)}
                </p>
              </div>
              
              <p className="text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6">
                Vous pouvez suivre l'évolution de votre candidature dans vos messages.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={closeExistingApplicationAlert}
                  className="flex-1 px-4 py-3 border-2 border-gray-200 text-black font-black rounded-lg hover:border-black transition-colors text-sm"
                >
                  Fermer
                </button>
                <button
                  onClick={goToMessages}
                  className="flex-1 bg-black text-white px-4 py-3 font-black rounded-lg hover:bg-gray-800 transition-colors text-sm"
                >
                  Voir mes messages
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de création de projet - Responsive */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white max-w-3xl w-full max-h-[90vh] overflow-y-auto rounded-xl">
            <div className="p-4 sm:p-6 border-b-2 border-gray-200 flex justify-between items-center">
              <h2 className="text-xl sm:text-2xl font-black">Créer un nouveau projet</h2>
              <button 
                onClick={closeCreateModal}
                className="p-2 hover:bg-gray-100 rounded"
              >
                <X className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
            </div>
            
            <div className="p-4 sm:p-6">
              <form onSubmit={handleSubmitProject} className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label className="block text-sm font-black text-black mb-2">
                      Titre du projet *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-200 rounded-lg focus:border-black focus:outline-none font-bold text-sm sm:text-base"
                      placeholder="Ex: Application e-commerce"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-black text-black mb-2">
                      Type de projet *
                    </label>
                    <select
                      required
                      value={formData.project_type}
                      onChange={(e) => setFormData(prev => ({ ...prev, project_type: e.target.value }))}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-200 rounded-lg focus:border-black focus:outline-none font-bold text-sm sm:text-base"
                    >
                      <option value="automation">🤖 Automation</option>
                      <option value="ai">🧠 Intelligence Artificielle</option>
                      <option value="chatbot">💬 Chatbot</option>
                      <option value="data_analysis">📊 Analyse de données</option>
                      <option value="other">💻 Autre</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-black text-black mb-2">
                    Description *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-200 rounded-lg focus:border-black focus:outline-none font-bold resize-none text-sm sm:text-base"
                    placeholder="Décrivez votre projet en détail..."
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label className="block text-sm font-black text-black mb-2">
                      Budget minimum (€) *
                    </label>
                    <input
                      type="number"
                      required
                      min="100"
                      value={formData.budget_min}
                      onChange={(e) => setFormData(prev => ({ ...prev, budget_min: e.target.value }))}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-200 rounded-lg focus:border-black focus:outline-none font-bold text-sm sm:text-base"
                      placeholder="1000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-black text-black mb-2">
                      Budget maximum (€) *
                    </label>
                    <input
                      type="number"
                      required
                      min="100"
                      value={formData.budget_max}
                      onChange={(e) => setFormData(prev => ({ ...prev, budget_max: e.target.value }))}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-200 rounded-lg focus:border-black focus:outline-none font-bold text-sm sm:text-base"
                      placeholder="5000"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label className="block text-sm font-black text-black mb-2">
                      Délai souhaité *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.timeline}
                      onChange={(e) => setFormData(prev => ({ ...prev, timeline: e.target.value }))}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-200 rounded-lg focus:border-black focus:outline-none font-bold text-sm sm:text-base"
                      placeholder="Ex: 2 semaines, 1 mois"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-black text-black mb-2">
                      Complexité *
                    </label>
                    <select
                      required
                      value={formData.complexity}
                      onChange={(e) => setFormData(prev => ({ ...prev, complexity: e.target.value }))}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-200 rounded-lg focus:border-black focus:outline-none font-bold text-sm sm:text-base"
                    >
                      <option value="simple">Simple</option>
                      <option value="medium">Moyenne</option>
                      <option value="complex">Complexe</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-black text-black mb-2">
                    Compétences requises
                  </label>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                      className="flex-1 px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-200 rounded-lg focus:border-black focus:outline-none font-bold text-sm sm:text-base"
                      placeholder="Ex: React, Node.js, Python..."
                    />
                    <button
                      type="button"
                      onClick={addSkill}
                      className="bg-black text-white px-3 sm:px-4 py-2 sm:py-3 rounded-lg font-black hover:bg-gray-800 transition-colors"
                    >
                      <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                  </div>
                  {formData.required_skills.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.required_skills.map((skill, index) => (
                        <span
                          key={index}
                          className="bg-black text-white px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-bold flex items-center gap-2"
                        >
                          {skill}
                          <button
                            type="button"
                            onClick={() => removeSkill(skill)}
                            className="hover:text-gray-300"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
                  <button
                    type="button"
                    onClick={closeCreateModal}
                    className="px-4 sm:px-6 py-2 sm:py-3 border-2 border-gray-200 text-black font-black rounded-lg hover:border-black transition-colors text-sm sm:text-base"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={createLoading}
                    className="bg-black text-white px-4 sm:px-6 py-2 sm:py-3 font-black rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                  >
                    {createLoading ? 'Création...' : 'Créer le projet'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de candidature - Responsive */}
      {showApplicationModal && selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-xl">
            <div className="p-4 sm:p-6 border-b-2 border-gray-200 flex justify-between items-center">
              <div>
                <h2 className="text-xl sm:text-2xl font-black">Candidater au projet</h2>
                <p className="text-gray-600 mt-1 text-sm sm:text-base truncate">{selectedProject.title}</p>
              </div>
              <button 
                onClick={closeApplicationModal}
                className="p-2 hover:bg-gray-100 rounded flex-shrink-0"
              >
                <X className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
            </div>
            
            {applicationSuccess ? (
              <div className="p-6 sm:p-8 text-center">
                <CheckCircle className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-4 text-green-500" />
                <h3 className="text-xl sm:text-2xl font-black text-black mb-2">Candidature envoyée !</h3>
                <p className="text-gray-600 mb-4 text-sm sm:text-base">
                  Votre candidature a été envoyée au client. Vous recevrez une réponse dans votre messagerie.
                </p>
                <button
                  onClick={closeApplicationModal}
                  className="bg-black text-white px-4 sm:px-6 py-2 sm:py-3 font-black rounded-lg hover:bg-gray-800 transition-colors text-sm sm:text-base"
                >
                  Fermer
                </button>
              </div>
            ) : (
              <div className="p-4 sm:p-6">
                <form onSubmit={handleSubmitApplication} className="space-y-4 sm:space-y-6">
                  <div>
                    <label className="block text-sm font-black text-black mb-2">
                      Message de candidature *
                    </label>
                    <textarea
                      required
                      rows={6}
                      value={applicationData.message}
                      onChange={(e) => setApplicationData(prev => ({ ...prev, message: e.target.value }))}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-200 rounded-lg focus:border-black focus:outline-none font-bold resize-none text-sm sm:text-base"
                      placeholder="Présentez-vous et expliquez pourquoi vous êtes le candidat idéal pour ce projet..."
                    />
                    <p className="text-xs sm:text-sm text-gray-600 mt-2">
                      💡 Vous pourrez envoyer votre CV directement dans la conversation après votre candidature.
                    </p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
                    <button
                      type="button"
                      onClick={closeApplicationModal}
                      className="px-4 sm:px-6 py-2 sm:py-3 border-2 border-gray-200 text-black font-black rounded-lg hover:border-black transition-colors text-sm sm:text-base"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={applicationLoading}
                      className="bg-black text-white px-4 sm:px-6 py-2 sm:py-3 font-black rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
                    >
                      {applicationLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Envoi...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          Envoyer la candidature
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
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
          from { transform: scale(1); }
          to { transform: scale(1.1); }
        }

        @keyframes sparkle {
          from { opacity: 0.7; }
          to { opacity: 1; }
        }

        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        @media (max-width: 640px) {
          .stars, .twinkling {
            background-size: 150px 80px;
          }
        }
      `}</style>

      {/* Popup d'information */}
      <InfoPopup
        isOpen={showInfoPopup}
        onClose={() => setShowInfoPopup(false)}
        title={infoPopupData.title}
        message={infoPopupData.message}
        type={infoPopupData.type}
        autoCloseDelay={infoPopupData.type === 'success' ? 5000 : 0}
      />
    </div>
  );
}

function ProjectsLoading() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-gray-200 border-t-black rounded-full animate-spin"></div>
      </div>
    </div>
  );
}

export default function ProjectsPage() {
  return (
    <Suspense fallback={<ProjectsLoading />}>
      <ProjectsContent />
    </Suspense>
  );
}
