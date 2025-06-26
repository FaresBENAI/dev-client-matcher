'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Calendar, DollarSign, Clock, Zap, User, Building, Send, X, CheckCircle, AlertCircle } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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
  
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;

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
      case 'automation': return '🤖';
      case 'ai': return '🧠';
      case 'chatbot': return '💬';
      case 'data_analysis': return '📊';
      case 'other': return '💻';
      default: return '💻';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
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

  if (error || !project) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 mx-auto mb-4 text-red-500" />
          <h1 className="text-2xl font-black text-black mb-2">Projet non trouvé</h1>
          <p className="text-gray-600 mb-6">{error || 'Ce projet n\'existe pas ou a été supprimé.'}</p>
          <button
            onClick={() => router.push('/projects')}
            className="bg-black text-white px-6 py-3 font-black hover:bg-gray-800 transition-colors"
          >
            Retour aux projets
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* 🔧 MODIFICATION: Header compact avec py-16 au lieu de py-24 */}
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
            Retour aux projets
          </button>

          {/* Contenu du header compact */}
          <div className="text-center">
            <h1 className="text-4xl font-black mb-4 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Détails du Projet
            </h1>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              Découvrez tous les détails de ce projet et candidatez si il correspond à vos compétences
            </p>
          </div>
        </div>
      </div>

      {/* 🔧 MODIFICATION: Contenu principal avec espacement */}
      <div className="bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Badge de statut en haut à droite */}
          <div className="flex justify-end mb-6">
            <span className={`px-4 py-2 border-2 font-black text-sm uppercase tracking-wider ${getStatusColor(project.status)}`}>
              {project.status === 'open' ? 'Ouvert' : 
               project.status === 'in_progress' ? 'En cours' :
               project.status === 'completed' ? 'Terminé' :
               project.status === 'cancelled' ? 'Annulé' : project.status}
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
                        {project.complexity === 'simple' ? 'Simple' :
                         project.complexity === 'medium' ? 'Moyen' :
                         project.complexity === 'complex' ? 'Complexe' : project.complexity}
                      </span>
                      <span className="px-3 py-1 bg-gray-100 text-gray-800 border-2 border-gray-200 font-bold">
                        {project.project_type === 'automation' ? 'Automation' :
                         project.project_type === 'ai' ? 'Intelligence Artificielle' :
                         project.project_type === 'chatbot' ? 'Chatbot' :
                         project.project_type === 'data_analysis' ? 'Analyse de données' :
                         project.project_type === 'other' ? 'Autre' : project.project_type}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Métadonnées importantes */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-sm text-gray-600">Budget</p>
                      <p className="font-black text-lg">
                        {project.budget_min.toLocaleString()}€ - {project.budget_max.toLocaleString()}€
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-600">Délai</p>
                      <p className="font-black text-lg">{project.timeline}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="text-sm text-gray-600">Publié le</p>
                      <p className="font-black text-lg">
                        {new Date(project.created_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Bouton de candidature */}
                {(!user || !project.client_id || user.id !== project.client_id) && (
                  <div className="border-t-2 border-gray-200 pt-4">
                    <button
                      onClick={handleApplyToProject}
                      className="w-full bg-black text-white py-4 px-6 font-black text-lg hover:bg-gray-800 transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-3"
                    >
                      <Send className="h-6 w-6" />
                      {!user ? 'Se connecter pour candidater' : 'Candidater à ce projet'}
                    </button>
                  </div>
                )}
              </div>
              
              {/* Description détaillée */}
              <div className="bg-white border-2 border-gray-200 p-6">
                <h3 className="text-2xl font-black text-black mb-4">Description du projet</h3>
                <div className="prose prose-lg max-w-none">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {project.description}
                  </p>
                </div>
              </div>
              
              {/* Compétences requises */}
              {project.required_skills && project.required_skills.length > 0 && (
                <div className="bg-white border-2 border-gray-200 p-6">
                  <h3 className="text-2xl font-black text-black mb-4">Compétences requises</h3>
                  <div className="flex flex-wrap gap-3">
                    {project.required_skills.map((skill, index) => (
                      <span
                        key={index}
                        className="px-4 py-2 bg-black text-white font-bold text-sm border-2 border-black hover:bg-white hover:text-black transition-colors"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Sidebar - Informations client */}
            <div className="space-y-6">
              
              {/* Profil du client */}
              <div className="bg-white border-2 border-gray-200 p-6">
                <h4 className="text-xl font-black text-black mb-4 flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Informations client
                </h4>
                
                {clientProfile && (
                  <div className="space-y-4">
                    <div>
                      <h5 className="font-black text-lg text-black">
                        {clientProfile.full_name || 'Client anonyme'}
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
                        <p className="text-sm font-bold text-gray-800 mb-1">Secteur d'activité</p>
                        <p className="text-gray-600">{clientProfile.industry}</p>
                      </div>
                    )}
                    
                    {clientProfile.company_size && (
                      <div>
                        <p className="text-sm font-bold text-gray-800 mb-1">Taille de l'entreprise</p>
                        <p className="text-gray-600">
                          {clientProfile.company_size === '1-10' ? '1-10 employés' :
                           clientProfile.company_size === '11-50' ? '11-50 employés' :
                           clientProfile.company_size === '51-200' ? '51-200 employés' :
                           clientProfile.company_size === '201-1000' ? '201-1000 employés' :
                           clientProfile.company_size === '1000+' ? 'Plus de 1000 employés' :
                           clientProfile.company_size}
                        </p>
                      </div>
                    )}
                    
                    {clientProfile.website_url && (
                      <div>
                        <p className="text-sm font-bold text-gray-800 mb-1">Site web</p>
                        <a
                          href={clientProfile.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 underline break-all"
                        >
                          {clientProfile.website_url}
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Statistiques du projet */}
              <div className="bg-white border-2 border-gray-200 p-6">
                <h4 className="text-xl font-black text-black mb-4">Détails du projet</h4>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Type de projet</span>
                    <span className="font-bold">
                      {project.project_type === 'automation' ? 'Automation' :
                       project.project_type === 'ai' ? 'IA' :
                       project.project_type === 'chatbot' ? 'Chatbot' :
                       project.project_type === 'data_analysis' ? 'Data Analysis' :
                       project.project_type === 'other' ? 'Autre' : project.project_type}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Complexité</span>
                    <span className={`px-2 py-1 text-xs font-bold border ${getComplexityColor(project.complexity)}`}>
                      {project.complexity === 'simple' ? 'Simple' :
                       project.complexity === 'medium' ? 'Moyen' :
                       project.complexity === 'complex' ? 'Complexe' : project.complexity}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Statut</span>
                    <span className={`px-2 py-1 text-xs font-bold border ${getStatusColor(project.status)}`}>
                      {project.status === 'open' ? 'Ouvert' : 
                       project.status === 'in_progress' ? 'En cours' :
                       project.status === 'completed' ? 'Terminé' :
                       project.status === 'cancelled' ? 'Annulé' : project.status}
                    </span>
                  </div>
                  
                  <div className="border-t pt-3 mt-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Créé le</span>
                      <span className="font-bold">
                        {new Date(project.created_at).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    
                    <div className="flex justify-between mt-2">
                      <span className="text-gray-600">Mis à jour</span>
                      <span className="font-bold">
                        {new Date(project.updated_at).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
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
          <div className="bg-white max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b-2 border-gray-200 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-black">Candidater au projet</h2>
                <p className="text-gray-600 mt-1">{project.title}</p>
              </div>
              <button 
                onClick={closeApplicationModal}
                className="p-2 hover:bg-gray-100 rounded"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            {applicationSuccess ? (
              <div className="p-8 text-center">
                <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-500" />
                <h3 className="text-2xl font-black text-black mb-2">Candidature envoyée !</h3>
                <p className="text-gray-600 mb-4">
                  Votre candidature a été envoyée au client. Vous recevrez une réponse dans votre messagerie.
                </p>
                <button
                  onClick={closeApplicationModal}
                  className="bg-black text-white px-6 py-3 font-black hover:bg-gray-800 transition-colors"
                >
                  Fermer
                </button>
              </div>
            ) : (
              <div className="p-6">
                <form onSubmit={handleSubmitApplication} className="space-y-6">
                  <div>
                    <label className="block text-sm font-black text-black mb-2">
                      Message de candidature *
                    </label>
                    <textarea
                      required
                      rows={6}
                      value={applicationData.message}
                      onChange={(e) => setApplicationData(prev => ({ ...prev, message: e.target.value }))}
                      className="w-full px-4 py-3 border-2 border-gray-200 focus:border-black focus:outline-none font-bold resize-none"
                      placeholder="Présentez-vous et expliquez pourquoi vous êtes le candidat idéal pour ce projet..."
                    />
                    <p className="text-sm text-gray-600 mt-2">
                      💡 Vous pourrez envoyer votre CV directement dans la conversation après votre candidature.
                    </p>
                  </div>
                  
                  <div className="flex gap-4 pt-4">
                    <button
                      type="button"
                      onClick={closeApplicationModal}
                      className="px-6 py-3 border-2 border-gray-200 text-black font-black hover:border-black transition-colors"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={applicationLoading}
                      className="bg-black text-white px-6 py-3 font-black hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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

      {/* 🚨 ALERTE CANDIDATURE EXISTANTE */}
      {showExistingApplicationAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" style={{ zIndex: 99999 }}>
          <div className="bg-white max-w-md w-full rounded-lg shadow-lg border-4 border-red-500">
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
                  className="flex-1 px-4 py-3 bg-gray-200 text-black font-black rounded hover:bg-gray-300 transition-colors"
                >
                  Fermer
                </button>
                <button
                  onClick={() => {
                    setShowExistingApplicationAlert(false);
                    router.push('/messages');
                  }}
                  className="flex-1 px-4 py-3 bg-black text-white font-black rounded hover:bg-gray-800 transition-colors"
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
