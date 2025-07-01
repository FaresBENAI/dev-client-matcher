'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { ArrowLeft, MapPin, Calendar, Star, Mail, Code, MessageCircle, Briefcase, User, ExternalLink, Phone, Globe } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Langues disponibles avec leurs drapeaux
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

// Composant d'affichage des étoiles
const StarRating = ({ rating, totalRatings, size = 'sm' }: { rating: number; totalRatings?: number; size?: 'sm' | 'lg' }) => {
  if (!rating) return null;
  
  const starSize = size === 'lg' ? 'text-xl' : 'text-sm';
  
  return (
    <div className="flex items-center space-x-2">
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`${starSize} ${star <= Math.round(rating) ? 'text-yellow-400' : 'text-gray-300'}`}
          >
            ⭐
          </span>
        ))}
      </div>
      <span className={`${size === 'lg' ? 'text-lg' : 'text-sm'} text-gray-600 font-bold`}>
        {rating.toFixed(1)} {totalRatings ? `(${totalRatings} avis)` : ''}
      </span>
    </div>
  );
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
  avatar_url?: string;
  portfolio_url?: string;
  website?: string;
  phone?: string;
  title?: string;
  github_url?: string;
  linkedin_url?: string;
  average_rating?: number;
  total_ratings?: number;
}

interface Rating {
  id: string;
  rating: number;
  comment: string;
  project_title: string;
  created_at: string;
  client_profile?: {
    full_name: string;
    avatar_url?: string;
  };
}

export default function DeveloperProfilePage({ params }: { params: { id: string } }) {
  const [developer, setDeveloper] = useState<DeveloperProfile | null>(null);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);
  const [contactModal, setContactModal] = useState(false);
  const [message, setMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    checkUser();
    loadDeveloperProfile();
    loadRatings();
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
      
      // Charger les données de base depuis profiles
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', params.id)
        .eq('user_type', 'developer')
        .single();

      if (profileError || !profileData) {
        console.error('❌ Erreur profil de base:', profileError);
        router.push('/developers');
        return;
      }

      // Charger les données détaillées depuis developer_profiles
      const { data: devProfileData, error: devProfileError } = await supabase
        .from('developer_profiles')
        .select('*')
        .eq('id', params.id)
        .single();

      // Fusionner les données des deux tables
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

      setDeveloper(mergedProfile);

    } catch (error) {
      console.error('💥 Erreur:', error);
      router.push('/developers');
    } finally {
      setLoading(false);
    }
  };

  const loadRatings = async () => {
    try {
      console.log('🔍 Chargement des avis pour le développeur:', params.id);
      
      // 🔧 CORRECTION: Utiliser la table profiles pour les noms des clients
      const { data: ratingsData, error: ratingsError } = await supabase
        .from('ratings')
        .select(`
          *,
          profiles!ratings_client_id_fkey (
            full_name,
            avatar_url
          )
        `)
        .eq('developer_id', params.id)
        .order('created_at', { ascending: false });

      if (ratingsError) {
        console.error('❌ Erreur chargement avis:', ratingsError);
        
        // 🔧 FALLBACK: Si la jointure échoue, charger séparément
        const { data: simpleRatings } = await supabase
          .from('ratings')
          .select('*')
          .eq('developer_id', params.id)
          .order('created_at', { ascending: false });

        if (simpleRatings) {
          // Charger les profils clients séparément
          const ratingsWithClients = await Promise.all(
            simpleRatings.map(async (rating) => {
              const { data: clientProfile } = await supabase
                .from('profiles')
                .select('full_name, avatar_url')
                .eq('id', rating.client_id)
                .single();

              return {
                ...rating,
                client_profile: clientProfile
              };
            })
          );
          
          setRatings(ratingsWithClients);
        }
        return;
      }

      console.log('✅ Avis chargés:', ratingsData?.length || 0);
      
      // 🔧 CORRECTION: Formater les données avec profiles
      const formattedRatings = (ratingsData || []).map(rating => ({
        ...rating,
        client_profile: rating.profiles  // profiles au lieu de client_profiles
      }));

      setRatings(formattedRatings);

    } catch (error) {
      console.error('💥 Erreur chargement avis:', error);
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

  // Fonction pour formater la disponibilité
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

  // Fonction pour formater les années d'expérience
  const getExperienceText = (years: number) => {
    if (!years) return 'Expérience non spécifiée';
    if (years === 1) return '1 an d\'expérience';
    return `${years} ans d'expérience`;
  };

  // Fonction pour formater la date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
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
            className="bg-black text-white px-6 py-3 font-black rounded-lg hover:bg-gray-800 transition-all duration-300"
          >
            Retour aux développeurs
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      
      {/* Header minimaliste avec fond noir et étoiles */}
      <div className="relative bg-black text-white py-16 overflow-hidden">
        {/* Fond étoilé simplifié */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full opacity-40 animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>
        
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Bouton retour */}
          <button
            onClick={() => router.back()}
            className="flex items-center text-white hover:text-gray-300 transition-colors mb-8 group"
          >
            <ArrowLeft className="h-5 w-5 mr-2 group-hover:transform group-hover:-translate-x-1 transition-transform" />
            Retour
          </button>

          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-2xl overflow-hidden border-4 border-white flex-shrink-0">
              {developer.avatar_url ? (
                <img 
                  src={developer.avatar_url} 
                  alt={developer.full_name || 'Développeur'} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-white flex items-center justify-center text-black font-black text-3xl">
                  {developer.full_name?.charAt(0).toUpperCase() || 'D'}
                </div>
              )}
            </div>

            {/* Infos principales */}
            <div className="flex-1">
              {/* Nom avec langues */}
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-black">{developer.full_name || 'Développeur'}</h1>
                {developer.languages && developer.languages.length > 0 && (
                  <div className="flex gap-1">
                    {developer.languages.slice(0, 3).map((langCode: string, langIndex: number) => (
                      <span 
                        key={langIndex} 
                        className="text-lg" 
                        title={LANGUAGES[langCode as keyof typeof LANGUAGES]?.name}
                      >
                        {LANGUAGES[langCode as keyof typeof LANGUAGES]?.flag || '🌐'}
                      </span>
                    ))}
                    {developer.languages.length > 3 && (
                      <span className="text-sm text-gray-300">+{developer.languages.length - 3}</span>
                    )}
                  </div>
                )}
              </div>
              
              <p className="text-lg text-gray-300 mb-3">
                {developer.title || getExperienceText(developer.experience_years)}
              </p>
              
              {/* Note */}
              {developer.average_rating && (
                <div className="mb-4">
                  <StarRating rating={developer.average_rating} totalRatings={developer.total_ratings} size="lg" />
                </div>
              )}
              
              {/* Infos compactes */}
              <div className="flex flex-wrap gap-4 text-sm text-gray-300">
                {developer.location && (
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    {developer.location}
                  </div>
                )}
                
                {developer.hourly_rate && (
                  <div className="flex items-center font-bold text-white">
                    <Star className="h-4 w-4 mr-1" />
                    {developer.hourly_rate}€/h
                  </div>
                )}

                {developer.availability && (
                  <div>
                    {getAvailabilityText(developer.availability)}
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleContact}
                className="bg-white text-black px-6 py-3 font-black rounded-lg hover:bg-gray-100 transition-all duration-300 flex items-center"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Contacter
              </button>
              
              {developer.email && (
                <a
                  href={`mailto:${developer.email}`}
                  className="border-2 border-white text-white px-6 py-3 font-black rounded-lg hover:bg-white hover:text-black transition-all duration-300 flex items-center"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Email
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal - Layout élargi */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-8">
          
          {/* À propos - Élargi */}
          <section className="bg-gray-50 rounded-2xl p-10 border-2 border-gray-100">
            <h2 className="text-2xl font-black text-black mb-6 flex items-center">
              <User className="h-6 w-6 mr-3" />
              À propos
            </h2>
            <p className="text-gray-700 leading-relaxed text-lg">
              {developer.bio || 'Ce développeur n\'a pas encore ajouté de description personnelle.'}
            </p>
          </section>

          {/* Compétences et langues - Layout élargi */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
            
            {/* Compétences */}
            {developer.skills && developer.skills.length > 0 && (
              <section className="bg-white rounded-2xl p-10 border-2 border-gray-200">
                <h2 className="text-2xl font-black text-black mb-8 flex items-center">
                  <Code className="h-6 w-6 mr-3" />
                  Compétences
                </h2>
                <div className="flex flex-wrap gap-3">
                  {developer.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-5 py-3 bg-black text-white font-bold rounded-lg hover:bg-gray-800 transition-all duration-300"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Langues */}
            {developer.languages && developer.languages.length > 0 && (
              <section className="bg-white rounded-2xl p-10 border-2 border-gray-200">
                <h2 className="text-2xl font-black text-black mb-8 flex items-center">
                  <Globe className="h-6 w-6 mr-3" />
                  Langues
                </h2>
                <div className="flex flex-wrap gap-3">
                  {developer.languages.map((langCode, index) => (
                    <span
                      key={index}
                      className="px-5 py-3 bg-gray-100 text-black font-bold rounded-lg hover:bg-gray-200 transition-all duration-300 flex items-center gap-2"
                    >
                      <span className="text-lg">
                        {LANGUAGES[langCode as keyof typeof LANGUAGES]?.flag || '🌐'}
                      </span>
                      {LANGUAGES[langCode as keyof typeof LANGUAGES]?.name || langCode}
                    </span>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Informations de contact ET avis clients - Layout élargi */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
            
            {/* Informations de contact */}
            <section className="bg-black text-white rounded-2xl p-10">
              <h2 className="text-2xl font-black mb-8 flex items-center">
                <Briefcase className="h-6 w-6 mr-3" />
                Informations professionnelles
              </h2>
              <div className="grid grid-cols-1 gap-8">
                <div className="space-y-6">
                  <div>
                    <span className="text-gray-300 text-sm block mb-1">Email</span>
                    <p className="font-bold text-xl">{developer.email}</p>
                  </div>
                  
                  {developer.experience_years && (
                    <div>
                      <span className="text-gray-300 text-sm block mb-1">Expérience</span>
                      <p className="font-bold text-xl">{getExperienceText(developer.experience_years)}</p>
                    </div>
                  )}
                  
                  {developer.phone && (
                    <div>
                      <span className="text-gray-300 text-sm block mb-1">Téléphone</span>
                      <p className="font-bold text-xl">{developer.phone}</p>
                    </div>
                  )}

                  {developer.location && (
                    <div>
                      <span className="text-gray-300 text-sm block mb-1">Localisation</span>
                      <p className="font-bold text-xl">{developer.location}</p>
                    </div>
                  )}

                  {developer.hourly_rate && (
                    <div>
                      <span className="text-gray-300 text-sm block mb-1">Tarif horaire</span>
                      <p className="font-bold text-xl">{developer.hourly_rate}€/heure</p>
                    </div>
                  )}

                  <div>
                    <span className="text-gray-300 text-sm block mb-1">Inscrit le</span>
                    <p className="font-bold text-xl">{formatDate(developer.created_at)}</p>
                  </div>
                </div>
              </div>

              {/* Liens externes */}
              {(developer.portfolio_url || developer.website || developer.github_url || developer.linkedin_url) && (
                <div className="mt-10 pt-8 border-t border-gray-700">
                  <h3 className="text-xl font-black mb-6">Liens</h3>
                  <div className="flex flex-wrap gap-4">
                    {(developer.portfolio_url || developer.website) && (
                      <a
                        href={developer.portfolio_url || developer.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-white text-black px-6 py-3 font-bold rounded-lg hover:bg-gray-100 transition-all duration-300 flex items-center"
                      >
                        <ExternalLink className="h-5 w-5 mr-2" />
                        Portfolio
                      </a>
                    )}
                    
                    {developer.github_url && (
                      <a
                        href={developer.github_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-gray-800 text-white px-6 py-3 font-bold rounded-lg hover:bg-gray-700 transition-all duration-300 flex items-center"
                      >
                        <Code className="h-5 w-5 mr-2" />
                        GitHub
                      </a>
                    )}
                    
                    {developer.linkedin_url && (
                      <a
                        href={developer.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-blue-600 text-white px-6 py-3 font-bold rounded-lg hover:bg-blue-700 transition-all duration-300 flex items-center"
                      >
                        <Briefcase className="h-5 w-5 mr-2" />
                        LinkedIn
                      </a>
                    )}
                  </div>
                </div>
              )}
            </section>

            {/* Section des avis clients */}
            <section className="bg-gray-50 rounded-2xl p-10 border-2 border-gray-100">
              <h2 className="text-2xl font-black text-black mb-8 flex items-center">
                <Star className="h-6 w-6 mr-3 text-yellow-500" />
                Avis clients ({ratings.length})
              </h2>
              
              {ratings.length > 0 ? (
                <div className="space-y-6 max-h-96 overflow-y-auto pr-2">
                  {ratings.map((rating) => (
                    <div key={rating.id} className="bg-white rounded-xl p-6 border-2 border-gray-200">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-4">
                          {/* Avatar du client */}
                          <div className="w-12 h-12 rounded-lg overflow-hidden border-2 border-gray-300 flex-shrink-0">
                            {rating.client_profile?.avatar_url ? (
                              <img 
                                src={rating.client_profile.avatar_url} 
                                alt={rating.client_profile.full_name || 'Client'} 
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-black flex items-center justify-center text-white font-black text-lg">
                                {rating.client_profile?.full_name?.charAt(0).toUpperCase() || 'C'}
                              </div>
                            )}
                          </div>
                          
                          <div className="min-w-0 flex-1">
                            <h3 className="font-black text-black text-lg">
                              {rating.client_profile?.full_name || 'Client anonyme'}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {rating.project_title && `Projet: ${rating.project_title}`}
                            </p>
                          </div>
                        </div>
                        
                        {/* Note */}
                        <div className="text-right flex-shrink-0">
                          <div className="flex items-center gap-1 mb-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <span
                                key={star}
                                className={`text-lg ${star <= rating.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                              >
                                ⭐
                              </span>
                            ))}
                          </div>
                          <p className="text-xs text-gray-500">
                            {formatDate(rating.created_at)}
                          </p>
                        </div>
                      </div>
                      
                      {/* Commentaire */}
                      {rating.comment && (
                        <blockquote className="text-gray-700 italic text-base leading-relaxed border-l-4 border-gray-300 pl-4">
                          "{rating.comment}"
                        </blockquote>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">⭐</div>
                  <p className="text-gray-500 font-medium text-lg">Aucun avis pour le moment</p>
                  <p className="text-gray-400">Soyez le premier à laisser un avis !</p>
                </div>
              )}
            </section>
          </div>

          {/* Call to action final - Élargi */}
          <section className="bg-black text-white rounded-2xl p-12 text-center">
            <h2 className="text-3xl font-black mb-6">Prêt à collaborer ?</h2>
            <p className="text-gray-300 mb-8 text-xl max-w-2xl mx-auto">
              Contactez {developer.full_name} pour discuter de votre projet
            </p>
            <button
              onClick={handleContact}
              className="bg-white text-black px-12 py-5 font-black text-lg rounded-xl hover:bg-gray-100 transition-all duration-300 transform hover:scale-105"
            >
              Démarrer une conversation
            </button>
          </section>
        </div>
      </div>

      {/* Modal de contact */}
      {contactModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border-2 border-gray-200">
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
                className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-black focus:outline-none resize-none"
              />
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setContactModal(false)}
                className="flex-1 border-2 border-gray-300 text-black px-4 py-3 font-bold rounded-lg hover:bg-gray-50 transition-all duration-300"
              >
                Annuler
              </button>
              <button
                onClick={sendMessage}
                disabled={!message.trim() || sendingMessage}
                className="flex-1 bg-black text-white px-4 py-3 font-bold rounded-lg hover:bg-gray-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sendingMessage ? 'Envoi...' : 'Envoyer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
