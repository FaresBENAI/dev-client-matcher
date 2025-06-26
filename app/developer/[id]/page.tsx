'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { ArrowLeft, MapPin, Calendar, Star, Mail, Code, MessageCircle, Briefcase, User } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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

interface DeveloperProfile {
  id: string;
  full_name: string;
  email: string;
  bio?: string;
  location?: string;
  skills?: string[];
  languages?: string[];
  specializations?: string[];
  experience_years?: number;
  hourly_rate?: number;
  availability?: string;
  created_at: string;
  profile_photo_url?: string;
  avatar_url?: string;
  portfolio_url?: string;
  website?: string;
  phone?: string;
  title?: string;
  github_url?: string;
  linkedin_url?: string;
}

export default function DeveloperProfilePage({ params }: { params: { id: string } }) {
  const [developer, setDeveloper] = useState<DeveloperProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [contactModal, setContactModal] = useState(false);
  const [message, setMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    checkUser();
    loadDeveloperProfile();
  }, [params.id]);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    } catch (error) {
      console.error('Erreur auth:', error);
    }
  };

  const loadDeveloperProfile = async () => {
    try {
      console.log('🔍 Chargement du profil développeur:', params.id);
      
      // 🔧 CORRECTION: Charger les données de base depuis profiles
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', params.id)
        .eq('user_type', 'developer')
        .single();

      console.log('📥 Profil de base chargé:', profileData);

      if (profileError || !profileData) {
        console.error('❌ Erreur profil de base:', profileError);
        router.push('/developers');
        return;
      }

      // 🔧 CORRECTION: Charger les données détaillées depuis developer_profiles
      const { data: devProfileData, error: devProfileError } = await supabase
        .from('developer_profiles')
        .select('*')
        .eq('id', params.id) // 🔧 Utiliser 'id' au lieu de 'user_id'
        .single();

      console.log('📥 Profil développeur détaillé chargé:', devProfileData);

      // 🔧 Fusionner les données des deux tables
      const mergedProfile = {
        ...profileData,
        ...devProfileData,
        // S'assurer que les données de base ne sont pas écrasées
        id: profileData.id,
        full_name: profileData.full_name,
        email: profileData.email,
        created_at: profileData.created_at,
        avatar_url: profileData.avatar_url
      };

      console.log('✅ Profil fusionné:', mergedProfile);
      setDeveloper(mergedProfile);

    } catch (error) {
      console.error('💥 Erreur:', error);
      router.push('/developers');
    } finally {
      setLoading(false);
    }
  };

  const handleContact = () => {
    if (!user) {
      router.push('/auth/signup');
      return;
    }
    setContactModal(true);
  };

  const sendMessage = async () => {
    if (!message.trim() || !developer || !user) return;

    setSendingMessage(true);
    try {
      // Vérifier si une conversation existe déjà
      const { data: existingConversation } = await supabase
        .from('conversations')
        .select('id')
        .or(`and(client_id.eq.${user.id},developer_id.eq.${developer.id}),and(client_id.eq.${developer.id},developer_id.eq.${user.id})`)
        .single();

      let conversationId;

      if (existingConversation) {
        conversationId = existingConversation.id;
      } else {
        // Créer une nouvelle conversation
        const { data: newConversation, error: convError } = await supabase
          .from('conversations')
          .insert({
            client_id: user.id,
            developer_id: developer.id
          })
          .select('id')
          .single();

        if (convError) {
          console.error('Erreur création conversation:', convError);
          return;
        }

        conversationId = newConversation.id;
      }

      // Envoyer le message
      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content: message,
          is_read: false
        });

      if (!messageError) {
        setContactModal(false);
        setMessage('');
        router.push('/messages');
      }
    } catch (error) {
      console.error('Erreur envoi message:', error);
    } finally {
      setSendingMessage(false);
    }
  };

  // 🔧 Fonction pour formater la disponibilité
  const getAvailabilityText = (availability: string) => {
    switch (availability) {
      case 'available':
        return '🟢 Disponible';
      case 'busy':
        return '🟡 Occupé';
      case 'unavailable':
        return '🔴 Indisponible';
      default:
        return 'Statut non défini';
    }
  };

  // 🔧 Fonction pour formater les années d'expérience
  const getExperienceText = (years: number) => {
    if (!years) return 'Expérience non spécifiée';
    if (years === 1) return '1 an d\'expérience';
    return `${years} ans d'expérience`;
  };

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

  if (!developer) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-black text-black mb-4">Développeur non trouvé</h2>
          <button
            onClick={() => router.push('/developers')}
            className="bg-black text-white px-6 py-3 font-black hover:bg-gray-800 transition-all duration-300"
          >
            Retour aux développeurs
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header avec fond étoilé */}
      <div className="relative bg-black text-white py-16 overflow-hidden">
        {/* Fond étoilé */}
        <div className="absolute inset-0">
          <div className="stars"></div>
          <div className="twinkling"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Bouton retour */}
          <button
            onClick={() => router.back()}
            className="flex items-center text-white hover:text-gray-300 transition-colors mb-8 group"
          >
            <ArrowLeft className="h-5 w-5 mr-2 group-hover:transform group-hover:-translate-x-1 transition-transform" />
            Retour
          </button>

          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-8">
            {/* 🔧 MODIFICATION: Avatar avec photo réelle */}
            <div className="w-32 h-32 rounded-2xl overflow-hidden border-4 border-white flex-shrink-0">
              {developer.avatar_url ? (
                <img 
                  src={developer.avatar_url} 
                  alt={developer.full_name || 'Développeur'} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-white flex items-center justify-center text-black font-black text-5xl">
                  {developer.full_name?.charAt(0).toUpperCase() || 'D'}
                </div>
              )}
            </div>

            {/* Infos principales */}
            <div className="flex-1">
              {/* 🔧 AJOUT: Nom avec drapeaux des langues */}
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl font-black">{developer.full_name || 'Développeur'}</h1>
                {/* Drapeaux des langues parlées */}
                {developer.languages && developer.languages.length > 0 && (
                  <div className="flex gap-2">
                    {developer.languages.map((langCode: string, langIndex: number) => (
                      <span 
                        key={langIndex} 
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
                {developer.title || getExperienceText(developer.experience_years)}
              </p>
              
              <div className="flex flex-wrap gap-6 text-gray-300">
                {developer.location && (
                  <div className="flex items-center">
                    <MapPin className="h-5 w-5 mr-2" />
                    <span>{developer.location}</span>
                  </div>
                )}
                
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  <span>Inscrit le {new Date(developer.created_at).toLocaleDateString()}</span>
                </div>
                
                {developer.hourly_rate && (
                  <div className="flex items-center">
                    <Star className="h-5 w-5 mr-2" />
                    <span className="font-black text-white">{developer.hourly_rate}€/heure</span>
                  </div>
                )}

                {developer.availability && (
                  <div className="flex items-center">
                    <span>{getAvailabilityText(developer.availability)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleContact}
                className="bg-white text-black px-8 py-4 font-black hover:bg-gray-200 transition-all duration-300 transform hover:scale-105 flex items-center"
              >
                <MessageCircle className="h-5 w-5 mr-2" />
                Contacter
              </button>
              
              {developer.email && (
                <a
                  href={`mailto:${developer.email}`}
                  className="border-2 border-white text-white px-8 py-4 font-black hover:bg-white hover:text-black transition-all duration-300 transform hover:scale-105 flex items-center"
                >
                  <Mail className="h-5 w-5 mr-2" />
                  Email
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Colonne principale */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Bio */}
            <div className="bg-gray-50 border-2 border-gray-200 p-8">
              <h2 className="text-2xl font-black text-black mb-6 flex items-center">
                <Briefcase className="h-6 w-6 mr-3" />
                À propos
              </h2>
              <p className="text-gray-700 leading-relaxed">
                {developer.bio || 'Ce développeur n\'a pas encore ajouté de description personnelle.'}
              </p>
            </div>

            {/* Compétences */}
            {developer.skills && developer.skills.length > 0 && (
              <div className="bg-white border-2 border-gray-200 p-8">
                <h2 className="text-2xl font-black text-black mb-6 flex items-center">
                  <Code className="h-6 w-6 mr-3" />
                  Compétences IA
                </h2>
                <div className="flex flex-wrap gap-3">
                  {developer.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold border-2 border-purple-600 hover:bg-white hover:text-purple-600 transition-all duration-300"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 🔧 MODIFICATION: Langues parlées avec noms complets */}
            {developer.languages && developer.languages.length > 0 && (
              <div className="bg-white border-2 border-gray-200 p-8">
                <h2 className="text-2xl font-black text-black mb-6 flex items-center">
                  🌐 Langues parlées
                </h2>
                <div className="flex flex-wrap gap-3">
                  {developer.languages.map((langCode, index) => (
                    <span
                      key={index}
                      className="px-4 py-2 bg-black text-white font-bold border-2 border-black hover:bg-white hover:text-black transition-all duration-300 flex items-center gap-2"
                    >
                      <span className="text-lg">
                        {LANGUAGES[langCode as keyof typeof LANGUAGES]?.flag || '🌐'}
                      </span>
                      {LANGUAGES[langCode as keyof typeof LANGUAGES]?.name || langCode}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            
            {/* Informations de contact */}
            <div className="bg-black text-white p-6">
              <h3 className="text-xl font-black mb-4">Informations</h3>
              <div className="space-y-3">
                <div>
                  <span className="text-gray-300 text-sm">Email</span>
                  <p className="font-bold">{developer.email}</p>
                </div>
                
                {developer.experience_years && (
                  <div>
                    <span className="text-gray-300 text-sm">Expérience</span>
                    <p className="font-bold">{getExperienceText(developer.experience_years)}</p>
                  </div>
                )}
                
                {developer.location && (
                  <div>
                    <span className="text-gray-300 text-sm">Localisation</span>
                    <p className="font-bold">{developer.location}</p>
                  </div>
                )}

                {developer.availability && (
                  <div>
                    <span className="text-gray-300 text-sm">Disponibilité</span>
                    <p className="font-bold">{getAvailabilityText(developer.availability)}</p>
                  </div>
                )}

                {developer.hourly_rate && (
                  <div>
                    <span className="text-gray-300 text-sm">Tarif horaire</span>
                    <p className="font-bold">{developer.hourly_rate}€/heure</p>
                  </div>
                )}

                {developer.phone && (
                  <div>
                    <span className="text-gray-300 text-sm">Téléphone</span>
                    <p className="font-bold">{developer.phone}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Liens externes */}
            {(developer.portfolio_url || developer.website || developer.github_url || developer.linkedin_url) && (
              <div className="bg-gray-50 border-2 border-gray-200 p-6">
                <h3 className="text-xl font-black text-black mb-4">Liens</h3>
                <div className="space-y-3">
                  {(developer.portfolio_url || developer.website) && (
                    <a
                      href={developer.portfolio_url || developer.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-black hover:text-gray-600 font-bold transition-colors"
                    >
                      🌐 Portfolio
                    </a>
                  )}
                  
                  {developer.github_url && (
                    <a
                      href={developer.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-black hover:text-gray-600 font-bold transition-colors"
                    >
                      💻 GitHub
                    </a>
                  )}
                  
                  {developer.linkedin_url && (
                    <a
                      href={developer.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-black hover:text-gray-600 font-bold transition-colors"
                    >
                      💼 LinkedIn
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Call to action */}
            <div className="bg-white border-2 border-black p-6 text-center">
              <h3 className="text-xl font-black text-black mb-4">Intéressé par ce développeur ?</h3>
              <button
                onClick={handleContact}
                className="w-full bg-black text-white py-4 font-black hover:bg-gray-800 transition-all duration-300 transform hover:scale-105"
              >
                Démarrer une conversation
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de contact */}
      {contactModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white border-2 border-black max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-black">
                Contacter {developer.full_name}
              </h3>
              <button
                onClick={() => setContactModal(false)}
                className="text-gray-500 hover:text-black font-black text-xl"
              >
                ×
              </button>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-bold text-black mb-2">
                Votre message :
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Décrivez votre projet ou votre demande..."
                rows={4}
                className="w-full p-3 border-2 border-gray-200 focus:border-black focus:outline-none resize-none"
              />
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setContactModal(false)}
                className="flex-1 border-2 border-black text-black px-4 py-3 font-black hover:bg-gray-50 transition-all duration-300"
              >
                Annuler
              </button>
              <button
                onClick={sendMessage}
                disabled={!message.trim() || sendingMessage}
                className="flex-1 bg-black text-white px-4 py-3 font-black hover:bg-gray-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sendingMessage ? 'Envoi...' : 'Envoyer'}
              </button>
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

