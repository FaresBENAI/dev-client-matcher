'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/layout/auth-context';
import { ArrowLeft, Save, Upload, X } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface DeveloperProfile {
  id: string;
  full_name: string;
  email: string;
  bio?: string;
  location?: string;
  skills?: string[];
  experience_level?: string;
  hourly_rate?: number;
  available?: boolean;
  github_url?: string;
  portfolio_url?: string;
  specialization?: string;
}

const experienceLevels = [
  'Débutant (0-2 ans)',
  'Intermédiaire (2-5 ans)',
  'Confirmé (5-8 ans)',
  'Senior (8+ ans)',
  'Expert (10+ ans)'
];

const specializations = [
  'Intelligence Artificielle',
  'Automatisation',
  'Développement Web',
  'Applications Mobile',
  'Data Science',
  'Machine Learning',
  'Chatbots',
  'API & Intégrations',
  'DevOps',
  'Autre'
];

const commonSkills = [
  'Python', 'JavaScript', 'React', 'Node.js', 'TensorFlow', 'PyTorch',
  'OpenAI API', 'LangChain', 'Selenium', 'Pandas', 'FastAPI', 'Next.js',
  'Docker', 'AWS', 'Google Cloud', 'Azure', 'PostgreSQL', 'MongoDB',
  'Zapier', 'Make.com', 'Bubble', 'Webflow', 'Figma', 'Git'
];

export default function DeveloperProfileEdit() {
  const [profile, setProfile] = useState<DeveloperProfile>({
    id: '',
    full_name: '',
    email: '',
    bio: '',
    location: '',
    skills: [],
    experience_level: '',
    hourly_rate: 0,
    available: true,
    github_url: '',
    portfolio_url: '',
    specialization: ''
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newSkill, setNewSkill] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadProfile();
    } else {
      router.push('/auth/login');
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      // Charger le profil de base
      const { data: baseProfile, error: baseError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (baseError) throw baseError;

      // Charger le profil développeur étendu
      const { data: devProfile, error: devError } = await supabase
        .from('developer_profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      // Combiner les données
      setProfile({
        id: baseProfile.id,
        full_name: baseProfile.full_name || '',
        email: baseProfile.email || '',
        bio: devProfile?.bio || '',
        location: devProfile?.location || '',
        skills: devProfile?.skills || [],
        experience_level: devProfile?.experience_level || '',
        hourly_rate: devProfile?.hourly_rate || 0,
        available: devProfile?.availability === 'available',
        github_url: devProfile?.github_url || '',
        portfolio_url: devProfile?.portfolio_url || '',
        specialization: devProfile?.specialization || ''
      });
    } catch (error) {
      console.error('Erreur lors du chargement du profil:', error);
      setMessage({ type: 'error', text: 'Erreur lors du chargement du profil' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Mettre à jour le profil de base
      const { error: baseError } = await supabase
        .from('profiles')
        .update({
          full_name: profile.full_name,
          updated_at: new Date().toISOString()
        })
        .eq('id', user?.id);

      if (baseError) throw baseError;

      // Mettre à jour ou créer le profil développeur étendu
      const { error: devError } = await supabase
        .from('developer_profiles')
        .upsert({
          id: user?.id,
          bio: profile.bio,
          location: profile.location,
          skills: profile.skills,
          experience_level: profile.experience_level,
          hourly_rate: profile.hourly_rate,
          availability: profile.available ? 'available' : 'unavailable',
          github_url: profile.github_url,
          portfolio_url: profile.portfolio_url,
          specialization: profile.specialization
        });

      if (devError) throw devError;

      setMessage({ type: 'success', text: 'Profil mis à jour avec succès !' });
      
      // Rediriger vers le dashboard après 2 secondes
      setTimeout(() => {
        router.push('/dashboard/developer');
      }, 2000);
      
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      setMessage({ type: 'error', text: 'Erreur lors de la sauvegarde du profil' });
    } finally {
      setSaving(false);
    }
  };

  const addSkill = (skill: string) => {
    if (skill && !profile.skills?.includes(skill)) {
      setProfile(prev => ({
        ...prev,
        skills: [...(prev.skills || []), skill]
      }));
    }
    setNewSkill('');
  };

  const removeSkill = (skillToRemove: string) => {
    setProfile(prev => ({
      ...prev,
      skills: prev.skills?.filter(skill => skill !== skillToRemove) || []
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-gray-200 border-t-black rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-black text-white py-8">
        <div className="max-w-4xl mx-auto px-4">
          <button
            onClick={() => router.push('/dashboard/developer')}
            className="flex items-center text-white hover:text-gray-300 mb-4"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Retour au dashboard
          </button>
          <h1 className="text-3xl font-black">Modifier mon profil</h1>
        </div>
      </div>

      {/* Message de feedback */}
      {message && (
        <div className={`max-w-4xl mx-auto px-4 mt-4`}>
          <div className={`p-4 border-2 ${
            message.type === 'success' 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            {message.text}
          </div>
        </div>
      )}

      {/* Formulaire */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-gray-50 border-2 border-gray-200 p-8">
          
          {/* Informations de base */}
          <div className="mb-8">
            <h2 className="text-2xl font-black text-black mb-6">Informations générales</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-black mb-2">
                  Nom complet *
                </label>
                <input
                  type="text"
                  value={profile.full_name}
                  onChange={(e) => setProfile(prev => ({ ...prev, full_name: e.target.value }))}
                  className="w-full p-3 border-2 border-gray-300 focus:border-black focus:outline-none"
                  placeholder="Votre nom complet"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-black mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={profile.email}
                  disabled
                  className="w-full p-3 border-2 border-gray-300 bg-gray-100 text-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-black mb-2">
                  Localisation
                </label>
                <input
                  type="text"
                  value={profile.location || ''}
                  onChange={(e) => setProfile(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full p-3 border-2 border-gray-300 focus:border-black focus:outline-none"
                  placeholder="Paris, France"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-black mb-2">
                  Taux horaire (€)
                </label>
                <input
                  type="number"
                  value={profile.hourly_rate || ''}
                  onChange={(e) => setProfile(prev => ({ ...prev, hourly_rate: parseInt(e.target.value) || 0 }))}
                  className="w-full p-3 border-2 border-gray-300 focus:border-black focus:outline-none"
                  placeholder="50"
                  min="0"
                />
              </div>
            </div>
          </div>

          {/* Spécialisation et expérience */}
          <div className="mb-8">
            <h2 className="text-2xl font-black text-black mb-6">Expertise</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-black mb-2">
                  Spécialisation
                </label>
                <select
                  value={profile.specialization || ''}
                  onChange={(e) => setProfile(prev => ({ ...prev, specialization: e.target.value }))}
                  className="w-full p-3 border-2 border-gray-300 focus:border-black focus:outline-none"
                >
                  <option value="">Sélectionnez une spécialisation</option>
                  {specializations.map(spec => (
                    <option key={spec} value={spec}>{spec}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-black mb-2">
                  Niveau d'expérience
                </label>
                <select
                  value={profile.experience_level || ''}
                  onChange={(e) => setProfile(prev => ({ ...prev, experience_level: e.target.value }))}
                  className="w-full p-3 border-2 border-gray-300 focus:border-black focus:outline-none"
                >
                  <option value="">Sélectionnez votre niveau</option>
                  {experienceLevels.map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Compétences */}
          <div className="mb-8">
            <h2 className="text-2xl font-black text-black mb-6">Compétences</h2>
            
            {/* Compétences suggérées */}
            <div className="mb-4">
              <label className="block text-sm font-bold text-black mb-2">
                Compétences suggérées
              </label>
              <div className="flex flex-wrap gap-2">
                {commonSkills
                  .filter(skill => !profile.skills?.includes(skill))
                  .map(skill => (
                    <button
                      key={skill}
                      onClick={() => addSkill(skill)}
                      className="px-3 py-1 text-sm border-2 border-gray-300 hover:border-black hover:bg-gray-100"
                    >
                      + {skill}
                    </button>
                  ))
                }
              </div>
            </div>

            {/* Ajouter compétence personnalisée */}
            <div className="mb-4">
              <label className="block text-sm font-bold text-black mb-2">
                Ajouter une compétence
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  className="flex-1 p-3 border-2 border-gray-300 focus:border-black focus:outline-none"
                  placeholder="Ex: React Native"
                  onKeyPress={(e) => e.key === 'Enter' && addSkill(newSkill)}
                />
                <button
                  onClick={() => addSkill(newSkill)}
                  className="px-6 py-3 bg-black text-white font-bold hover:bg-gray-800"
                >
                  Ajouter
                </button>
              </div>
            </div>

            {/* Compétences sélectionnées */}
            <div>
              <label className="block text-sm font-bold text-black mb-2">
                Mes compétences ({profile.skills?.length || 0})
              </label>
              <div className="flex flex-wrap gap-2">
                {profile.skills?.map(skill => (
                  <span
                    key={skill}
                    className="inline-flex items-center px-3 py-1 bg-black text-white text-sm"
                  >
                    {skill}
                    <button
                      onClick={() => removeSkill(skill)}
                      className="ml-2 hover:text-gray-300"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Bio */}
          <div className="mb-8">
            <h2 className="text-2xl font-black text-black mb-6">Présentation</h2>
            <div>
              <label className="block text-sm font-bold text-black mb-2">
                Bio professionnelle
              </label>
              <textarea
                value={profile.bio || ''}
                onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                rows={6}
                className="w-full p-3 border-2 border-gray-300 focus:border-black focus:outline-none resize-none"
                placeholder="Décrivez votre expérience, vos projets marquants, vos spécialités..."
              />
            </div>
          </div>

          {/* Liens */}
          <div className="mb-8">
            <h2 className="text-2xl font-black text-black mb-6">Liens professionnels</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-black mb-2">
                  GitHub
                </label>
                <input
                  type="url"
                  value={profile.github_url || ''}
                  onChange={(e) => setProfile(prev => ({ ...prev, github_url: e.target.value }))}
                  className="w-full p-3 border-2 border-gray-300 focus:border-black focus:outline-none"
                  placeholder="https://github.com/votre-username"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-black mb-2">
                  Portfolio
                </label>
                <input
                  type="url"
                  value={profile.portfolio_url || ''}
                  onChange={(e) => setProfile(prev => ({ ...prev, portfolio_url: e.target.value }))}
                  className="w-full p-3 border-2 border-gray-300 focus:border-black focus:outline-none"
                  placeholder="https://votre-portfolio.com"
                />
              </div>
            </div>
          </div>

          {/* Disponibilité */}
          <div className="mb-8">
            <h2 className="text-2xl font-black text-black mb-6">Disponibilité</h2>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={profile.available}
                onChange={(e) => setProfile(prev => ({ ...prev, available: e.target.checked }))}
                className="mr-3 h-5 w-5"
              />
              <span className="text-black font-bold">
                Je suis disponible pour de nouveaux projets
              </span>
            </label>
          </div>

          {/* Boutons d'action */}
          <div className="flex gap-4 pt-6 border-t-2 border-gray-200">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center px-8 py-4 bg-black text-white font-black hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-5 w-5 mr-2" />
              {saving ? 'Sauvegarde...' : 'Sauvegarder'}
            </button>
            
            <button
              onClick={() => router.push('/dashboard/developer')}
              className="px-8 py-4 border-2 border-gray-300 text-black font-black hover:bg-gray-100"
            >
              Annuler
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
