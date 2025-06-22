'use client';

import React, { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/layout/auth-context';
import { Search, MapPin, Calendar, DollarSign, Clock, Filter, Grid, List, Plus } from 'lucide-react';

interface Project {
  id: string;
  title: string;
  description: string;
  budget: number;
  status: string;
  created_at: string;
  location?: string;
  required_skills?: string[];
  client: {
    full_name: string;
  };
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBudget, setSelectedBudget] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClientComponentClient();

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          client:profiles!projects_client_id_fkey(full_name)
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (data) {
        setProjects(data);
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
    // Redirection vers la page de création de projet
    router.push('/projects/create');
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBudget = selectedBudget === 'all' || 
                         (selectedBudget === 'low' && project.budget < 5000) ||
                         (selectedBudget === 'medium' && project.budget >= 5000 && project.budget < 15000) ||
                         (selectedBudget === 'high' && project.budget >= 15000);
    const matchesStatus = selectedStatus === 'all' || project.status === selectedStatus;
    
    return matchesSearch && matchesBudget && matchesStatus;
  });

  const ProjectCard = ({ project }: { project: Project }) => (
    <div className="bg-white border-2 border-gray-200 p-6 hover:border-black transition-all duration-300 transform hover:scale-105">
      <div className="flex justify-between items-start mb-4">
        <h3 className="font-black text-lg text-black line-clamp-2">{project.title}</h3>
        <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider border-2 bg-black text-white border-black ml-4 flex-shrink-0">
          ACTIF
        </span>
      </div>
      
      <p className="text-gray-600 text-sm mb-4 line-clamp-3">{project.description}</p>
      
      <div className="space-y-2 mb-4">
        <div className="flex items-center text-sm text-gray-600">
          <DollarSign className="h-4 w-4 mr-2" />
          <span className="font-black text-black">{project.budget.toLocaleString()}€</span>
        </div>
        
        <div className="flex items-center text-sm text-gray-600">
          <Calendar className="h-4 w-4 mr-2" />
          <span>{new Date(project.created_at).toLocaleDateString()}</span>
        </div>
        
        {project.location && (
          <div className="flex items-center text-sm text-gray-600">
            <MapPin className="h-4 w-4 mr-2" />
            <span>{project.location}</span>
          </div>
        )}
      </div>

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

  const ProjectListItem = ({ project }: { project: Project }) => (
    <div className="bg-white border-2 border-gray-200 p-6 hover:border-black transition-all duration-300">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-2">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-black text-lg text-black">{project.title}</h3>
            <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider border-2 bg-black text-white border-black ml-4">
              ACTIF
            </span>
          </div>
          <p className="text-gray-600 text-sm line-clamp-2">{project.description}</p>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center text-sm">
            <DollarSign className="h-4 w-4 mr-2" />
            <span className="font-black text-black">{project.budget.toLocaleString()}€</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="h-4 w-4 mr-2" />
            <span>{new Date(project.created_at).toLocaleDateString()}</span>
          </div>
        </div>
        
        <div className="flex items-center justify-end">
          <button className="bg-black text-white px-6 py-2 font-black hover:bg-gray-800 transition-all duration-300 transform hover:scale-105">
            Voir Détails
          </button>
        </div>
      </div>
    </div>
  );

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
      {/* Header avec fond étoilé */}
      <div className="relative bg-black text-white py-24 overflow-hidden">
        {/* Fond étoilé animé */}
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
            {/* Recherche */}
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

            {/* Filtres + Bouton Créer */}
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

              {/* Mode d'affichage */}
              <div className="flex border-2 border-gray-200">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-3 font-black transition-all duration-300 ${
                    viewMode === 'grid' 
                      ? 'bg-black text-white' 
                      : 'bg-white text-black hover:bg-gray-50'
                  }`}
                >
                  <Grid className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-3 font-black transition-all duration-300 ${
                    viewMode === 'list' 
                      ? 'bg-black text-white' 
                      : 'bg-white text-black hover:bg-gray-50'
                  }`}
                >
                  <List className="h-5 w-5" />
                </button>
              </div>

              {/* NOUVEAU: Bouton Créer un projet */}
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
            viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProjects.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredProjects.map((project) => (
                  <ProjectListItem key={project.id} project={project} />
                ))}
              </div>
            )
          ) : (
            /* MODIFIÉ: Section vide avec CTA pour créer un projet */
            <div className="bg-white border-2 border-gray-200 p-12 text-center">
              <Search className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h3 className="font-black text-xl text-black mb-2">Aucun projet trouvé</h3>
              <p className="text-gray-600 mb-6">Essayez de modifier vos critères de recherche</p>
              
              {/* CTA pour créer un projet */}
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
            </div>
          )}
        </div>
      </div>

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
