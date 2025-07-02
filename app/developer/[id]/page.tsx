'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/layout/auth-context';
import ContactModal from '@/components/ContactModal';
import { ArrowLeft, MapPin, Calendar, Star, Mail, MessageCircle, Globe, Briefcase } from 'lucide-react';

interface DeveloperProfile {
  id: string;
  full_name: string;
  email: string;
  bio?: string;
  location?: string;
  skills?: string[];
  experience_level?: string;
  experience_years?: number;
  daily_rate?: number;
  daily_rate_defined?: boolean;
  available?: boolean;
  availability?: string;
  languages?: string[];
  created_at: string;
  average_rating?: number;
  total_ratings?: number;
  avatar_url?: string;
}

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

const TJMDisplay = ({ daily_rate, daily_rate_defined }: { daily_rate?: number; daily_rate_defined?: boolean }) => {
  if (daily_rate_defined === false || (!daily_rate_defined && !daily_rate)) {
    return (
      <div className="bg-blue-50 border-2 border-blue-200 p-4 rounded-lg">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">💬</span>
          <div>
            <p className="font-bold text-blue-800">TJM à définir</p>
            <p className="text-sm text-blue-600">Tarif négociable selon le projet</p>
          </div>
        </div>
      </div>
    );
  }
  
  if (daily_rate && daily_rate > 0) {
    return (
      <div className="bg-green-50 border-2 border-green-200 p-4 rounded-lg">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">💰</span>
          <div>
            <p className="font-bold text-green-800">{daily_rate}€ / jour</p>
            <p className="text-sm text-green-600">Taux Journalier Moyen</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-gray-50 border-2 border-gray-200 p-4 rounded-lg">
      <div className="flex items-center space-x-2">
        <span className="text-2xl">💼</span>
        <div>
          <p className="font-bold text-gray-800">TJM à discuter</p>
          <p className="text-sm text-gray-600">Contactez-moi pour plus d'infos</p>
        </div>
      </div>
    </div>
  );
};

const StarRating = ({ rating, totalRatings }: { rating?: number; totalRatings?: number }) => {
  if (!rating || rating === 0) {
    return (
      <div className="flex items-center space-x-2">
        <div className="flex">
          {[1, 2, 3, 4, 5].map((star) => (
            <span key={star} className="text-lg text-gray-300">⭐</span>
          ))}
        </div>
        <span className="text-sm text-gray-500 font-medium">Pas encore noté</span>
      </div>
    );
  }
  
  return (
    <div className="flex items-center space-x-2">
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`text-lg ${star <= Math.round(rating) ? 'text-yellow-400' : 'text-gray-300'}`}
          >
            ⭐
          </span>
        ))}
      </div>
      <span className="text-sm text-gray-700 font-bold">
        {rating.toFixed(1)} {totalRatings ? `(${totalRatings} avis)` : ''}
      </span>
    </div>
  );
};

function DeveloperProfileContent() {
  const [developer, setDeveloper] = useState<DeveloperProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [contactModal, setContactModal] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const supabase = createClientComponentClient();

  const developerId = searchParams.get('id');

  useEffect(() => {
    if (developerId) {
      loadDeveloperProfile();
    } else {
      router.push('/developers');
    }
  }, [developerId]);

  const loadDeveloperProfile = async () => {
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', developerId)
        .eq('user_type', 'developer')
        .single();

      if (!profile) {
        router.push('/developers');
        return;
      }

      const { data: devProfile, error: devError } = await supabase
        .from('developer_profiles')
        .select('*')
        .eq('id', developerId)
        .single();

      if (profile) {
        const combinedProfile: DeveloperProfile = {
          ...profile,
          ...devProfile,
          id: profile.id,
          full_name: profile.full_name,
          email: profile.email,
          created_at: profile.created_at,
          avatar_url: profile.avatar_url
        };

        setDeveloper(combinedProfile);
      } else {
        router.push('/developers');
      }
    } catch (error) {
      console.error('Erreur:', error);
      router.push('/developers');
    } finally {
      setLoading(false);
    }
  };

  const handleContact = () => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    setContactModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-gray-200 border-t-black rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!developer) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-black text-black mb-4">Développeur non trouvé</h2>
          <button
            onClick={() => router.push('/developers')}
            className="bg-black text-white px-6 py-3 font-black hover:bg-gray-800"
          >
            Retour aux développeurs
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="relative bg-black text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <button
            onClick={() => router.back()}
            className="flex items-center text-white hover:text-gray-300 mb-8"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Retour
          </button>

          <div className="flex flex-col lg:flex-row gap-8">
            <div className="w-32 h-32 bg-white rounded-2xl flex items-center justify-center text-black font-black text-5xl overflow-hidden">
              {developer.avatar_url ? (
                <img 
                  src={developer.avatar_url} 
                  alt={developer.full_name} 
                  className="w-full h-full object-cover"
                />
              ) : (
                developer.full_name?.charAt(0).toUpperCase() || 'D'
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl font-black">{developer.full_name || 'Développeur'}</h1>
                {developer.languages && developer.languages.length > 0 && (
                  <div className="flex gap-2">
                    {developer.languages.map((langCode, index) => (
                      <span 
                        key={index} 
                        className="text-2xl" 
                        title={LANGUAGES[langCode as keyof typeof LANGUAGES]?.name}
                      >
                        {LANGUAGES[langCode as keyof typeof LANGUAGES]?.flag || '🌐'}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              
              <p className="text-xl text-gray-300 mb-4">
                {developer.experience_years ? `${developer.experience_years}+ ans d'expérience` : 'Développeur Expert'} 
                en IA & Automatisation
              </p>
              
              <div className="mb-4">
                <StarRating rating={developer.average_rating} totalRatings={developer.total_ratings} />
              </div>
              
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${
                  developer.availability === 'available' ? 'bg-green-400' : 
                  developer.availability === 'busy' ? 'bg-yellow-400' : 'bg-red-400'
                }`}></div>
                <span className="text-gray-300">
                  {developer.availability === 'available' ? 'Disponible' : 
                   developer.availability === 'busy' ? 'Occupé' : 'Non disponible'}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <button
                onClick={handleContact}
                className="bg-white text-black px-8 py-4 font-black hover:bg-gray-200 flex items-center"
              >
                <MessageCircle className="h-5 w-5 mr-2" />
                Contacter
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-8">
            
            <div className="bg-gray-50 border-2 border-gray-200 p-8">
              <h2 className="text-2xl font-black text-black mb-6">À propos</h2>
              <p className="text-gray-700 leading-relaxed">
                {developer.bio || 'Ce développeur n\'a pas encore ajouté de description personnelle.'}
              </p>
            </div>
            
            {developer.skills && developer.skills.length > 0 && (
              <div className="bg-gray-50 border-2 border-gray-200 p-8">
                <h2 className="text-2xl font-black text-black mb-6">Compétences</h2>
                <div className="flex flex-wrap gap-3">
                  {developer.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-lg hover:scale-105 transition-transform"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="space-y-6">
            
            <TJMDisplay 
              daily_rate={developer.daily_rate} 
              daily_rate_defined={developer.daily_rate_defined} 
            />
            
            <div className="bg-gray-50 border-2 border-gray-200 p-6">
              <h3 className="text-lg font-black text-black mb-4">Informations</h3>
              <div className="space-y-3">
                
                {developer.location && (
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-gray-600" />
                    <span className="text-gray-700">{developer.location}</span>
                  </div>
                )}
                
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-600" />
                  <span className="text-gray-700">
                    Membre depuis {new Date(developer.created_at).toLocaleDateString('fr-FR', {
                      month: 'long',
                      year: 'numeric'
                    })}
                  </span>
                </div>
                
                {developer.experience_years && (
                  <div className="flex items-center space-x-2">
                    <Briefcase className="h-4 w-4 text-gray-600" />
                    <span className="text-gray-700">
                      {developer.experience_years}+ années d'expérience
                    </span>
                  </div>
                )}
                
                {developer.languages && developer.languages.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <Globe className="h-4 w-4 text-gray-600" />
                    <span className="text-gray-700">
                      {developer.languages.map(langCode => 
                        LANGUAGES[langCode as keyof typeof LANGUAGES]?.name
                      ).filter(Boolean).join(', ')}
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="bg-black text-white p-6 rounded-lg">
              <h3 className="text-lg font-black mb-3">Prêt à collaborer ?</h3>
              <p className="text-gray-300 text-sm mb-4">
                Contactez {developer.full_name?.split(' ')[0] || 'ce développeur'} pour discuter de votre projet.
              </p>
              <button
                onClick={handleContact}
                className="w-full bg-white text-black py-3 font-black hover:bg-gray-200 transition-colors"
              >
                Envoyer un message
              </button>
            </div>
          </div>
        </div>
      </div>

      {contactModal && developer && (
        <ContactModal
          isOpen={contactModal}
          onClose={() => setContactModal(false)}
          developerId={developer.id}
          developerName={developer.full_name}
        />
      )}
    </div>
  );
}

function DeveloperProfileLoading() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-16 h-16 border-4 border-gray-200 border-t-black rounded-full animate-spin"></div>
    </div>
  );
}

export default function DeveloperProfilePage() {
  return (
    <Suspense fallback={<DeveloperProfileLoading />}>
      <DeveloperProfileContent />
    </Suspense>
  );
}
