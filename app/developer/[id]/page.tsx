'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MapPin, Calendar, Star, Mail, MessageCircle, Globe, Briefcase, DollarSign, Phone, User, Edit } from 'lucide-react';
import StarRating from '@/components/StarRating';
import RatingModal from '@/components/rating/RatingModal';
import ContactDeveloperModal from '@/components/messaging/contact-developer-modal';

// Interface pour les ratings
interface Rating {
  id: string;
  client_id: string;
  rating: number;
  comment?: string;
  project_title?: string;
  created_at: string;
  client_name?: string;
}

interface DeveloperProfile {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  bio?: string;
  location?: string;
  skills?: string[];
  speciality?: string;
  years_of_experience?: number;
  experience_years?: number;
  hourly_rate?: number;
  average_rating?: number;
  total_ratings?: number;
  languages?: string[];
  availability?: string;
  timezone?: string;
  portfolio_url?: string;
  github_url?: string;
  linkedin_url?: string;
  website_url?: string;
  profile_image?: string;
  created_at?: string;
  updated_at?: string;
  user_type?: string;
}

export default function DeveloperProfilePage() {
  const [developer, setDeveloper] = useState<DeveloperProfile | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loadingRatings, setLoadingRatings] = useState(false);
  
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const developerId = params?.id as string;
  const projectId = searchParams?.get('project'); // Récupérer l'ID du projet depuis l'URL

  const checkCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
      setIsOwnProfile(user?.id === developerId);
    } catch (error) {
      console.error('Erreur utilisateur:', error);
    }
  };

  // Fonction pour charger les ratings
  const loadDeveloperRatings = async () => {
    if (!developerId) return;
    
    setLoadingRatings(true);
    try {
      console.log('🔄 Chargement des notes pour:', developerId);

      const { data: ratingsData, error: ratingsError } = await supabase
        .from('ratings')
        .select(`
          id,
          client_id,
          rating,
          comment,
          project_title,
          created_at
        `)
        .eq('developer_id', developerId)
        .order('created_at', { ascending: false });

      if (ratingsError) {
        console.error('Erreur chargement ratings:', ratingsError);
        return;
      }

      // Récupérer les noms des clients
      if (ratingsData && ratingsData.length > 0) {
        const clientIds = ratingsData.map(rating => rating.client_id);
        const { data: clientsData } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', clientIds);

        const ratingsWithNames = ratingsData.map(rating => ({
          ...rating,
          client_name: clientsData?.find(client => client.id === rating.client_id)?.full_name || 'Client anonyme'
        }));

        setRatings(ratingsWithNames);
        console.log('✅ Ratings chargés:', ratingsWithNames.length);
      } else {
        setRatings([]);
      }
    } catch (error) {
      console.error('Erreur chargement ratings:', error);
    } finally {
      setLoadingRatings(false);
    }
  };

  const loadDeveloperProfile = async () => {
    try {
      console.log('🔄 Chargement profil développeur:', developerId);
      setLoading(true);

      // Charger le profil de base depuis la table profiles
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', developerId)
        .single();

      if (profileError) {
        console.error('Erreur profil:', profileError);
        setError('Profil non trouvé');
        return;
      }

      console.log('✅ Profil de base chargé:', profile);

      // Charger les données développeur spécifiques depuis developer_profiles
      const { data: devProfile, error: devError } = await supabase
        .from('developer_profiles')
        .select('*')
        .eq('id', developerId)
        .single();

      console.log('✅ Profil développeur chargé:', devProfile);
      if (devError && devError.code !== 'PGRST116') {
        console.error('Erreur developer_profiles:', devError);
      }

      // Combiner les données en priorisant les données de developer_profiles
      const combinedProfile = {
        // Données de base du profil
        id: profile.id,
        full_name: profile.full_name,
        email: profile.email,
        user_type: profile.user_type,
        created_at: profile.created_at,
        updated_at: profile.updated_at,
        
        // Photo de profil (depuis profiles.avatar_url)
        profile_image: profile.avatar_url,
        
        // Données étendues du développeur (depuis developer_profiles)
        bio: devProfile?.bio || '',
        location: devProfile?.location || '',
        phone: devProfile?.phone || '',
        skills: devProfile?.skills || [],
        speciality: devProfile?.specialization || '',
        years_of_experience: devProfile?.experience_years || devProfile?.years_of_experience,
        hourly_rate: devProfile?.daily_rate || devProfile?.hourly_rate,
        average_rating: devProfile?.average_rating || 0,
        total_ratings: devProfile?.total_ratings || 0,
        languages: devProfile?.languages || [],
        availability: devProfile?.availability || 'available',
        timezone: devProfile?.timezone || '',
        portfolio_url: devProfile?.portfolio_url || devProfile?.website || '',
        github_url: devProfile?.github_url || '',
        linkedin_url: devProfile?.linkedin_url || '',
        website_url: devProfile?.website || ''
      };

      console.log('✅ Profil combiné:', combinedProfile);
      setDeveloper(combinedProfile);

    } catch (error) {
      console.error('Erreur générale:', error);
      setError('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel(`developer-profile-${developerId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'developer_profiles',
          filter: `user_id=eq.${developerId}`
        },
        (payload) => {
          console.log('🔄 Mise à jour temps réel developer_profiles:', payload);
          loadDeveloperProfile();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${developerId}`
        },
        (payload) => {
          console.log('🔄 Mise à jour temps réel profiles:', payload);
          loadDeveloperProfile();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleFocus = () => {
    console.log('🔄 Page re-focus, rechargement...');
    loadDeveloperProfile();
    loadDeveloperRatings();
  };

  useEffect(() => {
    if (developerId) {
      checkCurrentUser();
      loadDeveloperProfile();
      loadDeveloperRatings();
      const unsubscribe = setupRealtimeSubscription();
      
      // Écouter les changements de focus
      window.addEventListener('focus', handleFocus);
      
      return () => {
        unsubscribe();
        window.removeEventListener('focus', handleFocus);
      };
    }
  }, [developerId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du profil...</p>
        </div>
      </div>
    );
  }

  if (error || !developer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Profil non trouvé'}</p>
          <Link href="/developers" className="text-black underline">
            Retour aux développeurs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header avec navigation */}
        <div className="mb-8">
          <button 
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-black transition-colors mb-4"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Retour
          </button>
          
          <div className="flex flex-col lg:flex-row lg:items-start gap-8">
            {/* Photo de profil et infos principales */}
            <div className="lg:w-1/3">
              <div className="bg-white rounded-2xl p-8 border-2 border-gray-200 hover:border-gray-300 transition-all duration-300">
                <div className="text-center mb-6">
                  {developer.profile_image ? (
                    <img 
                      src={developer.profile_image} 
                      alt={developer.full_name}
                      className="w-32 h-32 rounded-full mx-auto mb-4 object-cover border-4 border-gray-200"
                      onError={(e) => {
                        // Fallback si l'image ne charge pas
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <div className={`w-32 h-32 rounded-full mx-auto mb-4 bg-gray-200 flex items-center justify-center border-4 border-gray-300 ${developer.profile_image ? 'hidden' : ''}`}>
                    <User className="h-16 w-16 text-gray-400" />
                  </div>
                  
                  <h1 className="text-2xl font-black text-black mb-2">
                    {developer.full_name}
                  </h1>
                  
                  {developer.speciality && (
                    <p className="text-lg text-gray-600 font-semibold mb-4">
                      {developer.speciality}
                    </p>
                  )}

                  {/* Rating */}
                  <div className="flex items-center justify-center mb-4">
                    <StarRating 
                      rating={developer.average_rating} 
                      totalRatings={developer.total_ratings} 
                    />
                  </div>

                  {/* Tarif */}
                  {developer.hourly_rate && (
                    <div className="text-center mb-4">
                      <div className="text-2xl font-black text-black">
                        {developer.hourly_rate}€/h
                      </div>
                    </div>
                  )}
                </div>

                {/* Informations de contact */}
                <div className="space-y-3 border-t border-gray-200 pt-6">
                  {developer.location && (
                    <div className="flex items-center text-gray-600">
                      <MapPin className="h-4 w-4 mr-3 flex-shrink-0" />
                      <span className="text-sm">{developer.location}</span>
                    </div>
                  )}
                  
                  {developer.email && (
                    <div className="flex items-center text-gray-600">
                      <Mail className="h-4 w-4 mr-3 flex-shrink-0" />
                      <span className="text-sm">{developer.email}</span>
                    </div>
                  )}
                  
                  {developer.phone && (
                    <div className="flex items-center text-gray-600">
                      <Phone className="h-4 w-4 mr-3 flex-shrink-0" />
                      <span className="text-sm">{developer.phone}</span>
                    </div>
                  )}

                  {developer.years_of_experience && (
                    <div className="flex items-center text-gray-600">
                      <Briefcase className="h-4 w-4 mr-3 flex-shrink-0" />
                      <span className="text-sm">{developer.years_of_experience} ans d'expérience</span>
                    </div>
                  )}

                  {developer.created_at && (
                    <div className="flex items-center text-gray-600">
                      <Calendar className="h-4 w-4 mr-3 flex-shrink-0" />
                      <span className="text-sm">
                        Membre depuis {new Date(developer.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                      </span>
                    </div>
                  )}
                </div>

                {/* Liens externes */}
                {(developer.website_url || developer.github_url || developer.linkedin_url || developer.portfolio_url) && (
                  <div className="border-t border-gray-200 pt-6 mt-6">
                    <h3 className="font-bold text-black mb-4">Liens</h3>
                    <div className="space-y-2">
                      {developer.website_url && (
                        <a 
                          href={developer.website_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center text-black hover:text-gray-600 transition-colors"
                        >
                          <Globe className="h-4 w-4 mr-3" />
                          <span className="text-sm">Site web</span>
                        </a>
                      )}
                      
                      {developer.github_url && (
                        <a 
                          href={developer.github_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center text-black hover:text-gray-600 transition-colors"
                        >
                          <Globe className="h-4 w-4 mr-3" />
                          <span className="text-sm">GitHub</span>
                        </a>
                      )}
                      
                      {developer.linkedin_url && (
                        <a 
                          href={developer.linkedin_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center text-black hover:text-gray-600 transition-colors"
                        >
                          <Globe className="h-4 w-4 mr-3" />
                          <span className="text-sm">LinkedIn</span>
                        </a>
                      )}
                      
                      {developer.portfolio_url && (
                        <a 
                          href={developer.portfolio_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center text-black hover:text-gray-600 transition-colors"
                        >
                          <Globe className="h-4 w-4 mr-3" />
                          <span className="text-sm">Portfolio</span>
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                {isOwnProfile ? (
                  <div className="border-t border-gray-200 pt-6 mt-6">
                    <Link 
                      href="/dashboard/developer/profile"
                      className="w-full bg-black text-white py-3 px-4 rounded-lg font-bold hover:bg-gray-800 transition-colors flex items-center justify-center"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Modifier le profil
                    </Link>
                  </div>
                ) : currentUser && (
                  <div className="border-t border-gray-200 pt-6 mt-6 space-y-3">
                    <button
                      onClick={() => setShowContactModal(true)}
                      className="w-full bg-black text-white py-3 px-4 rounded-lg font-bold hover:bg-gray-800 transition-colors flex items-center justify-center"
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      {projectId ? 'Postuler au projet' : 'Contacter'}
                    </button>
                    
                    {/* Bouton Noter */}
                    <button
                      onClick={() => setShowRatingModal(true)}
                      className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-bold hover:bg-blue-700 transition-colors flex items-center justify-center"
                    >
                      <Star className="h-4 w-4 mr-2" />
                      Noter ce développeur
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Contenu principal */}
            <div className="lg:w-2/3 space-y-8">
              {/* À propos */}
              <div className="bg-white rounded-2xl p-8 border-2 border-gray-200 hover:border-gray-300 transition-all duration-300">
                <h2 className="text-xl font-black text-black mb-4">À propos</h2>
                {developer.bio ? (
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {developer.bio}
                  </p>
                ) : (
                  <p className="text-gray-500 italic">
                    Aucune description disponible pour le moment.
                  </p>
                )}
              </div>

              {/* Compétences */}
              <div className="bg-white rounded-2xl p-8 border-2 border-gray-200 hover:border-gray-300 transition-all duration-300">
                <h2 className="text-xl font-black text-black mb-6">Compétences</h2>
                {developer.skills && developer.skills.length > 0 ? (
                  <div className="flex flex-wrap gap-3">
                    {developer.skills.map((skill, index) => (
                      <span 
                        key={index}
                        className="bg-gray-100 text-gray-800 px-4 py-2 rounded-full text-sm font-semibold hover:bg-gray-200 transition-colors"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">
                    Aucune compétence renseignée pour le moment.
                  </p>
                )}
              </div>

              {/* Langues */}
              {developer.languages && developer.languages.length > 0 && (
                <div className="bg-white rounded-2xl p-8 border-2 border-gray-200 hover:border-gray-300 transition-all duration-300">
                  <h2 className="text-xl font-black text-black mb-6">Langues</h2>
                  <div className="flex flex-wrap gap-3">
                    {developer.languages.map((language, index) => (
                      <span 
                        key={index}
                        className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-semibold"
                      >
                        {language}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Disponibilité */}
              {(developer.availability || developer.timezone) && (
                <div className="bg-white rounded-2xl p-8 border-2 border-gray-200 hover:border-gray-300 transition-all duration-300">
                  <h2 className="text-xl font-black text-black mb-6">Disponibilité</h2>
                  <div className="space-y-3">
                    {developer.availability && (
                      <div>
                        <span className="font-semibold text-gray-700">Statut : </span>
                        <span className="text-gray-600">{developer.availability}</span>
                      </div>
                    )}
                    {developer.timezone && (
                      <div>
                        <span className="font-semibold text-gray-700">Fuseau horaire : </span>
                        <span className="text-gray-600">{developer.timezone}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Section des avis clients */}
              {ratings.length > 0 && (
                <div className="bg-white rounded-2xl p-8 border-2 border-gray-200 hover:border-gray-300 transition-all duration-300">
                  <h2 className="text-xl font-black text-black mb-6">
                    Avis clients ({ratings.length})
                  </h2>
                  
                  {loadingRatings ? (
                    <p className="text-gray-500">Chargement des avis...</p>
                  ) : (
                    <div className="space-y-6">
                      {ratings.map((rating) => (
                        <div key={rating.id} className="border-b border-gray-200 pb-6 last:border-b-0 last:pb-0">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="font-semibold text-gray-900">
                                  {rating.client_name}
                                </span>
                                <div className="flex">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                      key={star}
                                      className={`h-4 w-4 ${
                                        star <= rating.rating
                                          ? 'text-yellow-400 fill-current'
                                          : 'text-gray-300'
                                      }`}
                                    />
                                  ))}
                                </div>
                              </div>
                              {rating.project_title && (
                                <p className="text-sm text-gray-500 mb-2">
                                  Projet: {rating.project_title}
                                </p>
                              )}
                            </div>
                            <span className="text-sm text-gray-400">
                              {new Date(rating.created_at).toLocaleDateString('fr-FR')}
                            </span>
                          </div>
                          
                          {rating.comment && (
                            <p className="text-gray-700 leading-relaxed">
                              "{rating.comment}"
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Call to action */}
              {!isOwnProfile && currentUser && (
                <div className="bg-black text-white p-8 rounded-2xl hover:bg-gray-800 transition-all duration-300">
                  <h3 className="text-lg font-black mb-3">
                    {projectId ? 'Prêt à postuler ?' : 'Prêt à collaborer ?'}
                  </h3>
                  <p className="text-gray-300 mb-6">
                    {projectId 
                      ? `Postulez maintenant pour travailler avec ${developer.full_name} sur ce projet.`
                      : `Contactez ${developer.full_name} pour discuter de votre projet et démarrer votre collaboration.`
                    }
                  </p>
                  <div className="flex gap-4">
                    <button
                      onClick={() => setShowContactModal(true)}
                      className="bg-white text-black px-6 py-3 rounded-lg font-bold hover:bg-gray-100 transition-colors flex-1"
                    >
                      {projectId ? 'Postuler maintenant' : 'Envoyer un message'}
                    </button>
                    <div className="text-center">
                      {developer.hourly_rate ? (
                        <div>
                          <div className="text-3xl font-black text-white mb-2">
                            {developer.hourly_rate}€
                          </div>
                          <div className="text-gray-300 text-sm">
                            par heure
                          </div>
                        </div>
                      ) : (
                        <div className="text-gray-300 text-sm">
                          Tarif sur demande
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de contact/candidature */}
      {showContactModal && (
        <ContactDeveloperModal
          developer={developer}
          projectId={projectId || undefined}
          onClose={() => setShowContactModal(false)}
          onSuccess={() => {
            console.log('✅ Candidature réussie!');
            // Optionnel: rediriger vers les messages
            // router.push('/messages');
          }}
        />
      )}

      {/* Modal de notation */}
      {showRatingModal && (
        <RatingModal
          isOpen={showRatingModal}
          onClose={() => setShowRatingModal(false)}
          developerId={developer.id}
          developerName={developer.full_name}
          currentUser={currentUser}
          onRatingSubmitted={() => {
            loadDeveloperProfile();
            loadDeveloperRatings();
          }}
        />
      )}
    </div>
  );
}
