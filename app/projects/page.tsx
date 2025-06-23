'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, MapPin, Calendar, DollarSign, Grid, List, Plus, X, CheckCircle, Clock, Zap } from 'lucide-react';

// Utiliser la même config que la navbar
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
  client: {
    full_name: string;
  };
}

export default function ProjectsPage() {
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
    project_type: 'web',
    budget_min: '',
    budget_max: '',
    timeline: '',
    required_skills: [] as string[],
    complexity: 'medium'
  });
  const [skillInput, setSkillInput] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    checkUser();
    loadProjects();
    
    if (searchParams.get('success') === 'created') {
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 5000);
      window.history.replaceState({}, '', '/projects');
    }
  }, [searchParams]);

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
      
      // D'abord essayer sans la relation
      const { data: simpleData, error: simpleError } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('Projets sans relation:', simpleData);
      console.log('Erreur simple:', simpleError);

      if (simpleData && simpleData.length > 0) {
        // Ajouter un client fictif pour l'affichage
        const projectsWithClient = simpleData.map(project => ({
          ...project,
          client: { full_name: 'Client' }
        }));
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

  const closeModal = () => {
    setShowCreateModal(false);
    setFormData({
      title: '',
      description: '',
      project_type: 'web',
      budget_min: '',
      budget_max: '',
      timeline: '',
      required_skills: [],
      complexity: 'medium'
    });
    setSkillInput('');
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
      closeModal();
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 5000);
      await loadProjects(); // Recharger la liste
      
    } catch (error) {
      console.error('Erreur lors de la création:', error);
      alert(`Erreur lors de la création du projet: ${error.message}`);
    } finally {
      setCreateLoading(false);
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
      case 'web': return '🌐';
      case 'mobile': return '📱';
      case 'automation': return '🤖';
      case 'ai': return '🧠';
      default: return '💻';
    }
  };

  const ProjectCard = ({ project }: { project: Project }) => (
    <div className="bg-white border-2 border-gray-200 p-6 hover:border-black transition-all duration-300 transform hover:scale-105">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{getTypeIcon(project.project_type)}</span>
          <h3 className="font-black text-lg text-black line-clamp-2">{project.title}</h3>
        </div>
        <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider border-2 bg-black text-white border-black ml-4 flex-shrink-0">
          {project.status.toUpperCase()}
        </span>
      </div>
      
      <p className="text-gray-600 text-sm mb-4 line-clamp-3">{project.description}</p>
      
      <div className="space-y-2 mb-4">
        <div className="flex items-center text-sm text-gray-600">
          <DollarSign className="h-4 w-4 mr-2" />
          <span className="font-black text-black">
            {project.budget_min.toLocaleString()}€ - {project.budget_max.toLocaleString()}€
          </span>
        </div>
        
        <div className="flex items-center text-sm text-gray-600">
          <Clock className="h-4 w-4 mr-2" />
          <span>{project.timeline}</span>
        </div>
        
        <div className="flex items-center text-sm text-gray-600">
          <Zap className="h-4 w-4 mr-2" />
          <span className={`px-2 py-1 rounded text-xs font-bold ${getComplexityColor(project.complexity)}`}>
            {project.complexity}
          </span>
        </div>

        <div className="flex items-center text-sm text-gray-600">
          <Calendar className="h-4 w-4 mr-2" />
          <span>{new Date(project.created_at).toLocaleDateString()}</span>
        </div>
      </div>

      {project.required_skills && project.required_skills.length > 0 && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-1">
            {project.required_skills.slice(0, 3).map((skill, index) => (
              <span key={index} className="px-2 py-1 bg-gray-100 text-xs font-bold text-gray-700">
                {skill}
              </span>
            ))}
            {project.required_skills.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 text-xs font-bold text-gray-700">
                +{project.required_skills.length - 3}
              </span>
            )}
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-600">
          <span className="font-bold">Client:</span> {project.client?.full_name || 'Anonyme'}
        </div>
        <button className="bg-black text-white px-4 py-2 text-sm font-black hover:bg-gray-800 transition-all duration-300 transform hover:scale-105">
          Voir Détails
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-black rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Message de succès */}
      {showSuccessMessage && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg z-50 flex items-center gap-3">
          <CheckCircle className="h-6 w-6" />
          <span className="font-bold">Projet créé avec succès !</span>
          <button 
            onClick={() => setShowSuccessMessage(false)}
            className="ml-2 hover:bg-green-600 p-1 rounded"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="relative bg-black text-white py-24 overflow-hidden">
        <div className="absolute inset-0">
          <div className="stars"></div>
          <div className="twinkling"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-black mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Projets Disponibles
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Découvrez les opportunités qui correspondent à vos compétences et commencez votre prochain défi
          </p>
        </div>
      </div>

      {/* Filtres et recherche */}
      <div className="bg-gray-50 py-8 border-b-2 border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un projet..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 focus:border-black focus:outline-none font-bold"
              />
            </div>

            <div className="flex gap-4 items-center">
              <select
                value={selectedBudget}
                onChange={(e) => setSelectedBudget(e.target.value)}
                className="px-4 py-3 border-2 border-gray-200 focus:border-black focus:outline-none font-bold"
              >
                <option value="all">Tous budgets</option>
                <option value="low">&lt; 5 000€</option>
                <option value="medium">5 000€ - 15 000€</option>
                <option value="high">&gt; 15 000€</option>
              </select>

              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-4 py-3 border-2 border-gray-200 focus:border-black focus:outline-none font-bold"
              >
                <option value="all">Tous types</option>
                <option value="web">🌐 Web</option>
                <option value="mobile">📱 Mobile</option>
                <option value="automation">🤖 Automation</option>
                <option value="ai">🧠 IA</option>
              </select>

              <div className="flex border-2 border-gray-200">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-3 font-black transition-all duration-300 ${
                    viewMode === 'grid' ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-50'
                  }`}
                >
                  <Grid className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-3 font-black transition-all duration-300 ${
                    viewMode === 'list' ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-50'
                  }`}
                >
                  <List className="h-5 w-5" />
                </button>
              </div>

              <button
                onClick={handleCreateProject}
                className="bg-black text-white px-6 py-3 font-black hover:bg-gray-800 transition-all duration-300 transform hover:scale-105 flex items-center gap-2"
              >
                <Plus className="h-5 w-5" />
                Créer un projet
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Liste des projets */}
      <div className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-black text-black">
              {filteredProjects.length} projet{filteredProjects.length !== 1 ? 's' : ''} trouvé{filteredProjects.length !== 1 ? 's' : ''}
            </h2>
          </div>

          {filteredProjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          ) : (
            <div className="bg-white border-2 border-gray-200 p-12 text-center">
              <Search className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h3 className="font-black text-xl text-black mb-2">Aucun projet trouvé</h3>
              <p className="text-gray-600 mb-6">Essayez de modifier vos critères de recherche</p>
              
              {user && userProfile?.user_type === 'client' && (
                <div className="border-t-2 border-gray-200 pt-6 mt-6">
                  <h4 className="font-black text-lg text-black mb-3">Vous êtes client ?</h4>
                  <p className="text-gray-600 mb-4">Publiez votre projet et trouvez le développeur parfait !</p>
                  <button
                    onClick={handleCreateProject}
                    className="bg-black text-white px-8 py-4 font-black hover:bg-gray-800 transition-all duration-300 transform hover:scale-105 flex items-center gap-2 mx-auto"
                  >
                    <Plus className="h-5 w-5" />
                    Créer mon premier projet
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal de création de projet */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b-2 border-gray-200 flex justify-between items-center">
              <h2 className="text-2xl font-black">Créer un nouveau projet</h2>
              <button 
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 rounded"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6">
              <form onSubmit={handleSubmitProject} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                      className="w-full px-4 py-3 border-2 border-gray-200 focus:border-black focus:outline-none font-bold"
                    >
                      <option value="web">🌐 Développement Web</option>
                      <option value="mobile">📱 Application Mobile</option>
                      <option value="automation">🤖 Automation/Script</option>
                      <option value="ai">🧠 Intelligence Artificielle</option>
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
                    className="w-full px-4 py-3 border-2 border-gray-200 focus:border-black focus:outline-none font-bold resize-none"
                    placeholder="Décrivez votre projet en détail..."
                  />
                </div>

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
                      className="w-full px-4 py-3 border-2 border-gray-200 focus:border-black focus:outline-none font-bold"
                      placeholder="5000"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-black text-black mb-2">
                      Délai souhaité *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.timeline}
                      onChange={(e) => setFormData(prev => ({ ...prev, timeline: e.target.value }))}
                      className="w-full px-4 py-3 border-2 border-gray-200 focus:border-black focus:outline-none font-bold"
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
                      className="w-full px-4 py-3 border-2 border-gray-200 focus:border-black focus:outline-none font-bold"
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
                      className="flex-1 px-4 py-3 border-2 border-gray-200 focus:border-black focus:outline-none font-bold"
                      placeholder="Ex: React, Node.js, Python..."
                    />
                    <button
                      type="button"
                      onClick={addSkill}
                      className="bg-black text-white px-4 py-3 font-black hover:bg-gray-800 transition-colors"
                    >
                      <Plus className="h-5 w-5" />
                    </button>
                  </div>
                  {formData.required_skills.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.required_skills.map((skill, index) => (
                        <span
                          key={index}
                          className="bg-black text-white px-3 py-1 text-sm font-bold flex items-center gap-2"
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
                
                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-6 py-3 border-2 border-gray-200 text-black font-black hover:border-black transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={createLoading}
                    className="bg-black text-white px-6 py-3 font-black hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {createLoading ? 'Création...' : 'Créer le projet'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

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
          from { transform: scale(1); }
          to { transform: scale(1.1); }
        }

        @keyframes sparkle {
          from { opacity: 0.7; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
