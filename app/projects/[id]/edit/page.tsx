'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, X, Plus, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

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

export default function EditProjectPage() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    project_type: 'web',
    budget_min: '',
    budget_max: '',
    timeline: '',
    required_skills: [] as string[],
    complexity: 'medium',
    status: 'active'
  });
  const [skillInput, setSkillInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [projectLoading, setProjectLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', content: string } | null>(null);
  
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;

  useEffect(() => {
    checkUserAndLoadProject();
  }, [projectId]);

  const checkUserAndLoadProject = async () => {
    try {
      setProjectLoading(true);
      setError(null);
      
      // Vérifier l'authentification
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/auth/login');
        return;
      }
      
      setUser(user);
      
      // Récupérer le profil utilisateur
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_type, full_name')
        .eq('id', user.id)
        .single();
      
      setUserProfile(profile);
      
      // Vérifier si c'est un client
      if (profile?.user_type !== 'client') {
        setError('Seuls les clients peuvent modifier des projets.');
        return;
      }

      // Charger le projet
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (projectError) {
        setError('Projet non trouvé.');
        return;
      }

      // Vérifier que l'utilisateur est le propriétaire du projet
      if (projectData.client_id !== user.id) {
        setError('Vous n\'êtes pas autorisé à modifier ce projet.');
        return;
      }

      setProject(projectData);
      
      // Pré-remplir le formulaire
      setFormData({
        title: projectData.title || '',
        description: projectData.description || '',
        project_type: projectData.project_type || 'web',
        budget_min: projectData.budget_min?.toString() || '',
        budget_max: projectData.budget_max?.toString() || '',
        timeline: projectData.timeline || '',
        required_skills: Array.isArray(projectData.required_skills) ? projectData.required_skills : [],
        complexity: projectData.complexity || 'medium',
        status: projectData.status || 'active'
      });

    } catch (error) {
      console.error('Erreur:', error);
      setError('Erreur lors du chargement du projet.');
    } finally {
      setProjectLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !project) return;

    setLoading(true);
    setMessage(null);
    
    try {
      const { error } = await supabase
        .from('projects')
        .update({
          title: formData.title,
          description: formData.description,
          project_type: formData.project_type,
          budget_min: parseInt(formData.budget_min) || 0,
          budget_max: parseInt(formData.budget_max) || 0,
          timeline: formData.timeline,
          required_skills: formData.required_skills,
          complexity: formData.complexity,
          status: formData.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', projectId);

      if (error) throw error;

      setMessage({ type: 'success', content: 'Projet modifié avec succès !' });
      
      // Rediriger vers la page du projet après 2 secondes
      setTimeout(() => {
        router.push(`/projects/${projectId}`);
      }, 2000);
      
    } catch (error) {
      console.error('Erreur lors de la modification:', error);
      setMessage({ type: 'error', content: 'Erreur lors de la modification du projet. Veuillez réessayer.' });
    } finally {
      setLoading(false);
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSkill();
    }
  };

  // Écran de chargement
  if (projectLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="relative mb-8">
            <div className="w-16 h-16 border-4 border-gray-200 border-t-black rounded-full animate-spin"></div>
            <div className="absolute top-2 left-2 w-12 h-12 border-4 border-transparent border-t-white rounded-full animate-spin"></div>
          </div>
          <h2 className="text-xl font-black text-black mb-2">Chargement du projet...</h2>
          <p className="text-gray-600">Préparation de l'édition</p>
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
          <h2 className="text-xl font-black text-black mb-2">Erreur</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.back()}
            className="bg-black text-white px-8 py-4 font-black rounded-lg hover:bg-gray-800 transition-all duration-300"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-black text-white py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-white hover:text-gray-300 mb-6 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            Retour
          </button>
          <h1 className="text-4xl font-black">Modifier le projet</h1>
          <p className="text-gray-300 mt-2">
            Mettez à jour les informations de votre projet
          </p>
        </div>
      </div>

      {/* Message de succès/erreur */}
      {message && (
        <div className={`max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 ${
          message.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
        } border-2 rounded-lg p-4`}>
          <div className="flex items-center gap-2">
            {message.type === 'success' ? (
              <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
            ) : (
              <AlertCircle className="h-5 w-5 text-red-500" />
            )}
            <span className={`font-bold ${message.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
              {message.content}
            </span>
          </div>
        </div>
      )}

      {/* Formulaire */}
      <div className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Titre */}
            <div>
              <label className="block text-sm font-black text-black mb-2">
                Titre du projet *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-4 py-3 border-2 border-gray-200 focus:border-black focus:outline-none font-bold"
                placeholder="Ex: Développement d'une application mobile"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-black text-black mb-2">
                Description détaillée *
              </label>
              <textarea
                required
                rows={6}
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-4 py-3 border-2 border-gray-200 focus:border-black focus:outline-none font-bold resize-none"
                placeholder="Décrivez votre projet en détail : objectifs, fonctionnalités attendues, contraintes techniques..."
              />
            </div>

            {/* Type de projet et complexité */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-black text-black mb-2">
                  Type de projet *
                </label>
                <select
                  value={formData.project_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, project_type: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-gray-200 focus:border-black focus:outline-none font-bold"
                >
                  <option value="web">🌐 Application Web</option>
                  <option value="mobile">📱 Application Mobile</option>
                  <option value="automation">🤖 Automatisation</option>
                  <option value="ai">🧠 Intelligence Artificielle</option>
                  <option value="chatbot">💬 Chatbot</option>
                  <option value="data_analysis">📊 Analyse de données</option>
                  <option value="other">💻 Autre</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-black text-black mb-2">
                  Complexité *
                </label>
                <select
                  value={formData.complexity}
                  onChange={(e) => setFormData(prev => ({ ...prev, complexity: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-gray-200 focus:border-black focus:outline-none font-bold"
                >
                  <option value="simple">Simple</option>
                  <option value="medium">Moyen</option>
                  <option value="complex">Complexe</option>
                </select>
              </div>
            </div>

            {/* Budget */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  className="w-full px-4 py-3 border-2 border-gray-200 focus:border-black focus:outline-none font-bold"
                  placeholder="5000"
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
                  className="w-full px-4 py-3 border-2 border-gray-200 focus:border-black focus:outline-none font-bold"
                  placeholder="10000"
                />
              </div>
            </div>

            {/* Délai */}
            <div>
              <label className="block text-sm font-black text-black mb-2">
                Délai estimé *
              </label>
              <select
                value={formData.timeline}
                onChange={(e) => setFormData(prev => ({ ...prev, timeline: e.target.value }))}
                className="w-full px-4 py-3 border-2 border-gray-200 focus:border-black focus:outline-none font-bold"
              >
                <option value="">Sélectionnez un délai</option>
                <option value="1-2 semaines">1-2 semaines</option>
                <option value="1 mois">1 mois</option>
                <option value="2-3 mois">2-3 mois</option>
                <option value="3-6 mois">3-6 mois</option>
                <option value="6+ mois">6+ mois</option>
              </select>
            </div>

            {/* Compétences requises */}
            <div>
              <label className="block text-sm font-black text-black mb-2">
                Compétences requises
              </label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1 px-4 py-3 border-2 border-gray-200 focus:border-black focus:outline-none font-bold"
                  placeholder="Ex: React, Python, IA..."
                />
                <button
                  type="button"
                  onClick={addSkill}
                  className="bg-black text-white px-4 py-3 font-bold hover:bg-gray-800 transition-colors flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Ajouter
                </button>
              </div>
              
              {formData.required_skills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.required_skills.map((skill, index) => (
                    <span
                      key={index}
                      className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-bold flex items-center gap-2"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeSkill(skill)}
                        className="text-gray-500 hover:text-red-500"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Statut */}
            <div>
              <label className="block text-sm font-black text-black mb-2">
                Statut du projet *
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-4 py-3 border-2 border-gray-200 focus:border-black focus:outline-none font-bold"
              >
                <option value="active">🟢 Actif</option>
                <option value="in_progress">🟡 En cours</option>
                <option value="completed">✅ Terminé</option>
                <option value="cancelled">🔴 Annulé</option>
                <option value="on_hold">⏸️ En pause</option>
              </select>
            </div>

            {/* Boutons d'action */}
            <div className="flex gap-4 pt-6">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-black text-white py-4 px-6 font-black text-lg hover:bg-gray-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Sauvegarde en cours...
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5" />
                    Sauvegarder les modifications
                  </>
                )}
              </button>
              
              <button
                type="button"
                onClick={() => router.back()}
                className="border-2 border-gray-300 text-gray-700 py-4 px-6 font-black text-lg hover:border-black hover:text-black transition-colors"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 