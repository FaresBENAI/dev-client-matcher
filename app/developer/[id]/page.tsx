'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MapPin, Calendar, Star, Mail, MessageCircle, Globe, Briefcase, DollarSign, Phone, User, Edit, Clock } from 'lucide-react';
import StarRating from '@/components/StarRating';
import RatingModal from '@/components/rating/RatingModal';
import ContactDeveloperModal from '@/components/messaging/contact-developer-modal';
import { useLanguage } from '@/contexts/LanguageContext';

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
  const { t } = useLanguage();

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
          <p className="text-gray-600">{t('profile.developer.loading')}</p>
        </div>
      </div>
    );
  }

  if (error || !developer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || t('profile.developer.not.found')}</p>
          <Link href="/developers" className="text-black underline">
            {t('profile.developer.back.to.developers')}
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
            {t('profile.developer.back')}
          </button>
          
          <div className="flex flex-col lg:flex-row lg:items-start gap-8">
            {/* Photo de profil et infos principales */}
            <div className="lg:w-1/3">
              <div className="bg-white rounded-2xl p-8 border-2 border-gray-200 hover:border-gray-300 transition-all duration-300">
                <div className="text-center mb-6">
                  {developer.profile_image && developer.profile_image.trim() !== '' ? (
                    <img 
                      src={developer.profile_image} 
                      alt={developer.full_name}
                      className="w-32 h-32 rounded-full mx-auto mb-4 object-cover border-4 border-gray-200"
                      onError={(e) => {
                        console.log('❌ Erreur chargement image:', developer.profile_image);
                        // Fallback si l'image ne charge pas
                        e.currentTarget.style.display = 'none';
                        const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                        if (fallback) {
                          fallback.classList.remove('hidden');
                        }
                      }}
                      onLoad={() => {
                        console.log('✅ Image chargée:', developer.profile_image);
                      }}
                    />
                  ) : null}
                  <div className={`w-32 h-32 rounded-full mx-auto mb-4 bg-gray-200 flex items-center justify-center border-4 border-gray-300 ${developer.profile_image && developer.profile_image.trim() !== '' ? 'hidden' : ''}`}>
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
                        {developer.hourly_rate}€{t('profile.developer.daily.rate')}
                      </div>
                    </div>
                  )}
                </div>

                {/* Informations de contact */}
                <div className="space-y-3 border-t border-gray-200 pt-6">
                  <h3 className="font-black text-lg text-black mb-4">{t('profile.developer.contact.info')}</h3>

                  {developer.location && (
                    <div className="flex items-center text-gray-600">
                      <MapPin className="h-4 w-4 mr-3 text-gray-400" />
                      <span>{developer.location}</span>
                    </div>
                  )}

                  <div className="flex items-center text-gray-600">
                    <Mail className="h-4 w-4 mr-3 text-gray-400" />
                    <span>{developer.email}</span>
                  </div>

                  {developer.phone && (
                    <div className="flex items-center text-gray-600">
                      <Phone className="h-4 w-4 mr-3 text-gray-400" />
                      <span>{developer.phone}</span>
                    </div>
                  )}

                  {(developer.portfolio_url || developer.website_url) && (
                    <div className="flex items-center text-gray-600">
                      <Globe className="h-4 w-4 mr-3 text-gray-400" />
                      <a 
                        href={developer.portfolio_url || developer.website_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-black hover:underline"
                      >
                        {t('profile.developer.website')}
                      </a>
                    </div>
                  )}

                  {developer.years_of_experience && (
                    <div className="flex items-center text-gray-600">
                      <Briefcase className="h-4 w-4 mr-3 text-gray-400" />
                      <span>
                        {developer.years_of_experience} {t('profile.developer.experience.years')}
                      </span>
                    </div>
                  )}

                  {developer.availability && (
                    <div className="flex items-center text-gray-600">
                      <div className={`w-3 h-3 rounded-full mr-3 ${
                        developer.availability === 'available' ? 'bg-green-500' : 
                        developer.availability === 'busy' ? 'bg-yellow-500' : 'bg-red-500'
                      }`}></div>
                      <span>
                        {developer.availability === 'available' ? t('profile.developer.availability.available') : 
                         developer.availability === 'busy' ? t('profile.developer.availability.busy') : 
                         t('profile.developer.availability.unavailable')}
                      </span>
                    </div>
                  )}

                  {developer.timezone && (
                    <div className="flex items-center text-gray-600">
                      <Clock className="h-4 w-4 mr-3 text-gray-400" />
                      <span>{developer.timezone}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="mt-6 space-y-3">
                  <h3 className="font-black text-lg text-black mb-4">{t('profile.developer.actions')}</h3>
                  
                  {!isOwnProfile ? (
                    <div className="space-y-3">
                      <button
                        onClick={() => setShowContactModal(true)}
                        className="w-full bg-black text-white py-3 px-6 rounded-lg font-bold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                      >
                        <MessageCircle className="h-5 w-5" />
                        {t('profile.developer.contact')}
                      </button>
                      
                      {currentUser && (
                        <button
                          onClick={() => setShowRatingModal(true)}
                          className="w-full border-2 border-gray-300 text-gray-700 py-3 px-6 rounded-lg font-bold hover:border-black hover:text-black transition-colors flex items-center justify-center gap-2"
                        >
                          <Star className="h-5 w-5" />
                          {t('profile.developer.rate')}
                        </button>
                      )}
                    </div>
                  ) : (
                    <Link
                      href="/dashboard/developer/profile"
                      className="w-full bg-black text-white py-3 px-6 rounded-lg font-bold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                    >
                      <Edit className="h-5 w-5" />
                      {t('profile.developer.edit.profile')}
                    </Link>
                  )}
                </div>
              </div>
            </div>

            {/* Contenu principal */}
            <div className="lg:w-2/3 space-y-8">
              {/* À propos */}
              <div className="bg-white rounded-2xl p-8 border-2 border-gray-200 hover:border-gray-300 transition-all duration-300">
                <h2 className="text-xl font-black text-black mb-4">{t('profile.developer.about')}</h2>
                {developer.bio ? (
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {developer.bio}
                  </p>
                ) : (
                  <p className="text-gray-500 italic">
                    {t('profile.developer.no.description')}
                  </p>
                )}
              </div>

              {/* Compétences */}
              <div className="bg-white rounded-2xl p-8 border-2 border-gray-200 hover:border-gray-300 transition-all duration-300">
                <h2 className="text-xl font-black text-black mb-6">{t('profile.developer.skills')}</h2>
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
                    {t('profile.developer.no.skills')}
                  </p>
                )}
              </div>

              {/* Langues */}
              <div className="bg-white rounded-2xl p-8 border-2 border-gray-200 hover:border-gray-300 transition-all duration-300">
                <h2 className="text-xl font-black text-black mb-6">{t('profile.developer.languages')}</h2>
                {developer.languages && developer.languages.length > 0 ? (
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
                ) : (
                  <p className="text-gray-500 italic">
                    {t('profile.developer.no.languages')}
                  </p>
                )}
              </div>

              {/* Portfolio & Liens */}
              {(developer.portfolio_url || developer.github_url || developer.linkedin_url || developer.website_url) && (
                <div className="bg-white rounded-2xl p-8 border-2 border-gray-200 hover:border-gray-300 transition-all duration-300">
                  <h2 className="text-xl font-black text-black mb-6">{t('profile.developer.portfolio')}</h2>
                  <div className="space-y-4">
                    {developer.github_url && (
                      <a 
                        href={developer.github_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center text-gray-600 hover:text-black transition-colors"
                      >
                        <Globe className="h-5 w-5 mr-3" />
                        {t('profile.developer.portfolio.github')}
                      </a>
                    )}
                    
                    {developer.linkedin_url && (
                      <a 
                        href={developer.linkedin_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center text-gray-600 hover:text-black transition-colors"
                      >
                        <Globe className="h-5 w-5 mr-3" />
                        {t('profile.developer.portfolio.linkedin')}
                      </a>
                    )}
                    
                    {(developer.portfolio_url || developer.website_url) && (
                      <a 
                        href={developer.portfolio_url || developer.website_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center text-gray-600 hover:text-black transition-colors"
                      >
                        <Globe className="h-5 w-5 mr-3" />
                        {t('profile.developer.portfolio.website')}
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Avis & Évaluations */}
              <div className="bg-white rounded-2xl p-8 border-2 border-gray-200 hover:border-gray-300 transition-all duration-300">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-black text-black">{t('profile.developer.ratings.reviews')}</h2>
                  <button
                    onClick={() => {
                      loadDeveloperProfile();
                      loadDeveloperRatings();
                    }}
                    className="text-sm text-gray-600 hover:text-black transition-colors px-3 py-1 rounded-lg border border-gray-300 hover:border-gray-400"
                  >
                    🔄 Actualiser
                  </button>
                </div>
                
                {/* Afficher les ratings s'il y en a, même si average_rating est 0 */}
                {ratings.length > 0 ? (
                  <div className="mb-6">
                    {/* Afficher les statistiques seulement si elles existent */}
                    {developer.average_rating > 0 && developer.total_ratings > 0 && (
                      <div className="flex items-center space-x-4 mb-4">
                        <div className="text-3xl font-black text-black">
                          {developer.average_rating.toFixed(1)}
                        </div>
                        <div>
                          <StarRating rating={developer.average_rating} />
                          <p className="text-gray-600 text-sm">
                            {developer.total_ratings} {t('profile.developer.ratings.total')}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {/* Liste des avis */}
                    <div className="space-y-4">
                      {ratings.map((rating) => (
                        <div key={rating.id} className="border-l-4 border-gray-200 pl-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <StarRating rating={rating.rating} />
                              <span className="text-sm text-gray-600">
                                {t('profile.developer.ratings.by')} {rating.client_name || t('profile.developer.ratings.anonymous')}
                              </span>
                            </div>
                            <span className="text-xs text-gray-400">
                              {new Date(rating.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          
                          {rating.project_title && (
                            <p className="text-sm font-semibold text-gray-700 mb-1">
                              {t('profile.developer.ratings.project')}: {rating.project_title}
                            </p>
                          )}
                          
                          {rating.comment && (
                            <p className="text-gray-700">{rating.comment}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Star className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">
                      {t('profile.developer.ratings.no.reviews')}
                    </h3>
                    <p className="text-gray-500">
                      {t('profile.developer.ratings.first.review')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de contact */}
      {showContactModal && developer && (
        <ContactDeveloperModal
          developer={developer}
          onClose={() => setShowContactModal(false)}
          projectId={projectId}
        />
      )}

      {/* Modal de notation */}
      {showRatingModal && developer && currentUser && (
        <RatingModal
          isOpen={showRatingModal}
          onClose={() => setShowRatingModal(false)}
          developerId={developer.id}
          developerName={developer.full_name}
          projectTitle={projectId ? "Projet" : undefined}
          currentUser={currentUser}
          onRatingSubmitted={() => {
            setShowRatingModal(false);
            // Recharger les ratings
            loadDeveloperRatings();
          }}
        />
      )}
    </div>
  );
}
