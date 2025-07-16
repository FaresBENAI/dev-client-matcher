'use client';

import React, { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, X } from 'lucide-react';

export default function CreateProjectPage() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    budget: '',
    location: '',
    required_skills: [] as string[]
  });
  const [skillInput, setSkillInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
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
      
      // Vérifier si c'est un client (seuls les clients peuvent créer des projets)
      if (profile?.user_type !== 'client') {
        alert('Seuls les clients peuvent créer des projets.');
        router.push('/projects');
        return;
      }
    } catch (error) {
      console.error('Erreur auth:', error);
      router.push('/auth/login');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('projects')
        .insert([{
          title: formData.title,
          description: formData.description,
          budget: parseInt(formData.budget),
          location: formData.location || null,
          required_skills: formData.required_skills,
          client_id: user.id,
          status: 'active'
        }]);

      if (error) throw error;

      // Rediriger vers la liste des projets avec un message de succès
      router.push('/projects?success=created');
    } catch (error) {
      console.error('Erreur lors de la création:', error);
      alert('Erreur lors de la création du projet. Veuillez réessayer.');
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

  if (authLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-black rounded-full animate-spin"></div>
          <div className="absolute top-2 left-2 w-12 h-12 border-4 border-transparent border-t-white rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!user || !userProfile) {
    return null; // La redirection vers login est déjà en cours
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
          <h1 className="text-4xl font-black">Créer un nouveau projet</h1>
          <p className="text-gray-300 mt-2">
            Décrivez votre projet pour trouver le développeur parfait
          </p>
        </div>
      </div>

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

            {/* Budget */}
            <div>
              <label className="block text-sm font-black text-black mb-2">
                Budget (€) *
              </label>
              <input
                type="number"
                required
                min="100"
                value={formData.budget}
                onChange={(e) => setFormData(prev => ({ ...prev, budget: e.target.value }))}
                className="w-full px-4 py-3 border-2 border-gray-200 focus:border-black focus:outline-none font-bold"
                placeholder="5000"
              />
            </div>

            {/* Localisation */}
            <div>
              <label className="block text-sm font-black text-black mb-2">
                Localisation (optionnel)
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                className="w-full px-4 py-3 border-2 border-gray-200 focus:border-black focus:outline-none font-bold"
                placeholder="Paris, France"
              />
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

            {/* Boutons */}
            <div className="flex gap-4 pt-6">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-8 py-3 border-2 border-gray-200 text-black font-black hover:border-black transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-black text-white px-8 py-3 font-black hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Création...' : 'Créer le projet'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
