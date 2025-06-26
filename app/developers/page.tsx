'use client';

import React, { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/layout/auth-context';
import ContactModal from '@/components/ContactModal';
import { Search, MapPin, Calendar, Code, Star, Filter, Grid, List, Mail, User } from 'lucide-react';

// 🔧 AJOUT: Langues disponibles avec leurs drapeaux
const LANGUAGES = {
  'fr': { name: 'Français', flag: '🇫🇷' },
  'en': { name: 'English', flag: '🇬🇧' },
  'es': { name: 'Español', flag: '🇪🇸' },
  'de': { name: 'Deutsch', flag: '🇩🇪' },
  'it': { name: 'Italiano', flag: '🇮🇹' },
  'pt': { name: 'Português', flag: '🇵🇹' },
  'ar': { name: 'العربية', flag: '🇸🇦' },
  'zh': { name: '中文', flag: '🇨🇳' },
  'ja': { name: '日本語', flag: '🇯🇵' },
  'ko': { name: '한국어', flag: '🇰🇷' },
  'ru': { name: 'Русский', flag: '🇷🇺' },
  'hi': { name: 'हिन्दी', flag: '🇮🇳' }
};

interface Developer {
  id: string;
  full_name: string;
  email: string;
  bio?: string;
  location?: string;
  skills?: string[];
  languages?: string[];
  experience_level?: string;
  experience_years?: number;
  hourly_rate?: number;
  available?: boolean;
  availability?: string;
  created_at: string;
  profile_photo_url?: string;
  avatar_url?: string;
}

export default function DevelopersPage() {
  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExperience, setSelectedExperience] = useState('all');
  const [selectedAvailability, setSelectedAvailability] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [contactModal, setContactModal] = useState<{ isOpen: boolean; developer: Developer | null }>({
    isOpen: false,
    developer: null
  });
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClientComponentClient();

  useEffect(() => {
    loadDevelopers();
  }, []);

  // 🔧 MODIFICATION: Charger les développeurs avec profils détaillés
  const loadDevelopers = async () => {
    try {
      console.log('🔍 Chargement des développeurs...');
      
      // Charger d'abord les profils de base
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_type', 'developer')
        .order('created_at', { ascending: false });

      if (profilesError) {
        console.error('❌ Erreur chargement profils:', profilesError);
        setLoading(false);
        return;
      }

      console.log(`✅ ${profiles?.length || 0} profils de base chargés`);

      if (profiles && profiles.length > 0) {
        // Charger les détails pour chaque développeur
        const developersWithDetails = await Promise.all(
          profiles.map(async (profile) => {
            const { data: devProfile } = await supabase
              .from('developer_profiles')
              .select('*')
              .eq('id', profile.id)
              .single();

            return {
              ...profile,
              ...devProfile, // Fusionner les données détaillées
              // S'assurer que les données de base ne sont pas écrasées
              id: profile.id,
              full_name: profile.full_name,
              email: profile.email,
              avatar_url: profile.avatar_url
            };
          })
        );

        console.log('✅ Développeurs avec détails chargés:', developersWithDetails);
        setDevelopers(developersWithDetails);
      }
    } catch (error) {
      console.error('💥 Exception chargement développeurs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewProfile = (developer: Developer) => {
    console.log('👀 Redirection vers profil:', developer.full_name);
    router.push(`/developer/${developer.id}`);
  };

  const handleContact = async (developer: Developer) => {
    console.log('🔍 [DevelopersPage] Tentative contact développeur:', developer.full_name);
    console.log('🔍 [DevelopersPage] Vérification utilisateur connecté:', user);
    
    if (!user) {
      console.log('❌ [DevelopersPage] Utilisateur non connecté, redirection...');
      router.push('/auth/signup');
      return;
    }

    console.log('✅ [DevelopersPage] Utilisateur connecté, ouverture ContactModal');
    console.log('📋 [DevelopersPage] Données développeur:', {
      id: developer.id,
      name: developer.full_name,
      email: developer.email
    });

    setContactModal({
      isOpen: true,
      developer: developer
    });
  };

  const filteredDevelopers = developers.filter(developer => {
    const matchesSearch = developer.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         developer.bio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         developer.skills?.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesExperience = selectedExperience === 'all' || developer.experience_level === selectedExperience;
    const matchesAvailability = selectedAvailability === 'all' || 
                               (selectedAvailability === 'available' && (developer.available || developer.availability === 'available')) ||
                               (selectedAvailability === 'unavailable' && (!developer.available || developer.availability !== 'available'));
    
    return matchesSearch && matchesExperience && matchesAvailability;
  });

  // 🔧 MODIFICATION: DeveloperCard avec photo et drapeaux
  const DeveloperCard = ({ developer }: { developer: Developer }) => (
    <div className="bg-white border-2 border-gray-200 p-6 hover:border-black transition-all duration-300 transform hover:scale-105">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          {/* 🔧 AJOUT: Photo de profil avec fallback */}
          <div className="w-12 h-12 rounded-lg overflow-hidden border-2 border-gray-300 flex-shrink-0">
            {developer.avatar_url ? (
              <img 
                src={developer.avatar_url} 
                alt={developer.full_name || 'Développeur'} 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-black flex items-center justify-center text-white font-black text-lg">
                {developer.full_name?.charAt(0).toUpperCase() || 'D'}
              </div>
            )}
          </div>
          
          <div>
            {/* 🔧 AJOUT: Nom avec drapeaux des langues */}
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-black text-lg text-black">{developer.full_name || 'Développeur'}</h3>
              {/* Drapeaux des langues parlées */}
              {developer.languages && developer.languages.length > 0 && (
                <div className="flex gap-1">
                  {developer.languages.slice(0, 2).map((langCode: string, langIndex: number) => (
                    <span 
                      key={langIndex} 
                      className="text-sm" 
                      title={LANGUAGES[langCode as keyof typeof LANGUAGES]?.name}
                    >
                      {LANGUAGES[langCode as keyof typeof LANGUAGES]?.flag || '🌐'}
                    </span>
                  ))}
                  {developer.languages.length > 2 && (
                    <span 
                      className="text-xs text-gray-500" 
                      title={`+${developer.languages.length - 2} autres langues`}
                    >
                      +{developer.languages.length - 2}
                    </span>
                  )}
                </div>
              )}
            </div>
            <p className="text-sm text-gray-600">
              {developer.experience_years ? `${developer.experience_years} ans d'expérience` : (developer.experience_level || 'Non spécifié')}
            </p>
          </div>
        </div>
      </div>
      
      <p className="text-gray-600 text-sm mb-4 line-clamp-3">
        {developer.bio || 'Aucune bio disponible'}
      </p>
      
      <div className="space-y-2 mb-4">
        {developer.location && (
          <div className="flex items-center text-sm text-gray-600">
            <MapPin className="h-4 w-4 mr-2" />
            <span>{developer.location}</span>
          </div>
        )}
        
        {developer.hourly_rate && (
          <div className="flex items-center text-sm text-gray-600">
            <Star className="h-4 w-4 mr-2" />
            <span className="font-black text-black">{developer.hourly_rate}€/heure</span>
          </div>
        )}
        
        <div className="flex items-center text-sm text-gray-600">
          <Calendar className="h-4 w-4 mr-2" />
          <span>Inscrit le {new Date(developer.created_at).toLocaleDateString()}</span>
        </div>
      </div>

      {developer.skills && developer.skills.length > 0 && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {developer.skills.slice(0, 3).map((skill, index) => (
              <span key={index} className="px-2 py-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs font-bold rounded">
                {skill}
              </span>
            ))}
            {developer.skills.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-bold border border-gray-300">
                +{developer.skills.length - 3}
              </span>
            )}
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <button 
          onClick={() => handleContact(developer)}
          className="flex items-center text-sm text-gray-600 hover:text-black transition-colors"
        >
          <Mail className="h-4 w-4 mr-2" />
          Contacter
        </button>
        <button 
          onClick={() => handleViewProfile(developer)}
          className="bg-black text-white px-4 py-2 text-sm font-black hover:bg-gray-800 transition-all duration-300 transform hover:scale-105"
        >
          Voir Profil
        </button>
      </div>
    </div>
  );

  // 🔧 MODIFICATION: DeveloperListItem avec photo et drapeaux
  const DeveloperListItem = ({ developer }: { developer: Developer }) => (
    <div className="bg-white border-2 border-gray-200 p-6 hover:border-black transition-all duration-300">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-2">
          <div className="flex items-center space-x-3 mb-3">
            {/* 🔧 AJOUT: Photo de profil avec fallback */}
            <div className="w-10 h-10 rounded-lg overflow-hidden border-2 border-gray-300 flex-shrink-0">
              {developer.avatar_url ? (
                <img 
                  src={developer.avatar_url} 
                  alt={developer.full_name || 'Développeur'} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-black flex items-center justify-center text-white font-black">
                  {developer.full_name?.charAt(0).toUpperCase() || 'D'}
                </div>
              )}
            </div>
            
            <div>
              {/* 🔧 AJOUT: Nom avec drapeaux des langues */}
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-black text-lg text-black">{developer.full_name || 'Développeur'}</h3>
                {/* Drapeaux des langues parlées */}
                {developer.languages && developer.languages.length > 0 && (
                  <div className="flex gap-1">
                    {developer.languages.slice(0, 2).map((langCode: string, langIndex: number) => (
                      <span 
                        key={langIndex} 
                        className="text-sm" 
                        title={LANGUAGES[langCode as keyof typeof LANGUAGES]?.name}
                      >
                        {LANGUAGES[langCode as keyof typeof LANGUAGES]?.flag || '🌐'}
                      </span>
                    ))}
                    {developer.languages.length > 2 && (
                      <span 
                        className="text-xs text-gray-500" 
                        title={`+${developer.languages.length - 2} autres langues`}
                      >
                        +{developer.languages.length - 2}
                      </span>
                    )}
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-600">
                {developer.experience_years ? `${developer.experience_years} ans d'expérience` : (developer.experience_level || 'Non spécifié')}
              </p>
            </div>
          </div>
          <p className="text-gray-600 text-sm line-clamp-2">
            {developer.bio || 'Aucune bio disponible'}
          </p>
        </div>
        
        <div className="space-y-2">
          {developer.location && (
            <div className="flex items-center text-sm text-gray-600">
              <MapPin className="h-4 w-4 mr-2" />
              <span>{developer.location}</span>
            </div>
          )}
          {developer.hourly_rate && (
            <div className="flex items-center text-sm">
              <Star className="h-4 w-4 mr-2" />
              <span className="font-black text-black">{developer.hourly_rate}€/h</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center justify-end space-x-2">
          <button 
            onClick={() => handleContact(developer)}
            className="border-2 border-black text-black px-4 py-2 font-black hover:bg-black hover:text-white transition-all duration-300"
          >
            Contacter
          </button>
          <button 
            onClick={() => handleViewProfile(developer)}
            className="bg-black text-white px-4 py-2 font-black hover:bg-gray-800 transition-all duration-300 transform hover:scale-105"
          >
            Voir Profil
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
            Développeurs Talentueux
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Découvrez notre communauté de développeurs experts prêts à donner vie à vos projets
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
                placeholder="Rechercher un développeur..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 focus:border-black focus:outline-none font-bold"
              />
            </div>

            {/* Filtres */}
            <div className="flex gap-4 items-center">
              <select
                value={selectedExperience}
                onChange={(e) => setSelectedExperience(e.target.value)}
                className="px-4 py-3 border-2 border-gray-200 focus:border-black focus:outline-none font-bold"
              >
                <option value="all">Toute expérience</option>
                <option value="junior">Junior</option>
                <option value="middle">Intermédiaire</option>
                <option value="senior">Senior</option>
              </select>

              <select
                value={selectedAvailability}
                onChange={(e) => setSelectedAvailability(e.target.value)}
                className="px-4 py-3 border-2 border-gray-200 focus:border-black focus:outline-none font-bold"
              >
                <option value="all">Tous</option>
                <option value="available">Disponibles</option>
                <option value="unavailable">Occupés</option>
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
            </div>
          </div>
        </div>
      </div>

      {/* Liste des développeurs */}
      <div className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-black text-black">
              {filteredDevelopers.length} développeur{filteredDevelopers.length !== 1 ? 's' : ''} trouvé{filteredDevelopers.length !== 1 ? 's' : ''}
            </h2>
          </div>

          {filteredDevelopers.length > 0 ? (
            viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDevelopers.map((developer) => (
                  <DeveloperCard key={developer.id} developer={developer} />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredDevelopers.map((developer) => (
                  <DeveloperListItem key={developer.id} developer={developer} />
                ))}
              </div>
            )
          ) : (
            <div className="bg-white border-2 border-gray-200 p-12 text-center">
              <Search className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h3 className="font-black text-xl text-black mb-2">Aucun développeur trouvé</h3>
              <p className="text-gray-600">Essayez de modifier vos critères de recherche</p>
            </div>
          )}
        </div>
      </div>

      {/* Notre nouveau ContactModal avec debug */}
      {contactModal.isOpen && contactModal.developer && (
        <ContactModal
          isOpen={contactModal.isOpen}
          onClose={() => {
            console.log('🔒 [DevelopersPage] Fermeture ContactModal');
            setContactModal({ isOpen: false, developer: null });
          }}
          developerId={contactModal.developer.id}
          developerName={contactModal.developer.full_name}
        />
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
