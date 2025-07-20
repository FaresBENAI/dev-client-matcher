'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  developerId: string;
  developerName: string;
  projectTitle?: string;
  currentUser: any;
  onRatingSubmitted?: () => void;
}

export default function RatingModal({
  isOpen,
  onClose,
  developerId,
  developerName,
  projectTitle,
  currentUser,
  onRatingSubmitted
}: RatingModalProps) {
  const user = currentUser; // Utiliser currentUser passé en props
  const [selectedRating, setSelectedRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<boolean>(false);
  const [clientProfileId, setClientProfileId] = useState<string | null>(null);

  // Récupérer l'ID du profil client depuis la table profiles avec user_type
  useEffect(() => {
    async function fetchClientProfile() {
      if (!isOpen || !user?.id) return;

      try {
        console.log('🔍 Vérification du type d\'utilisateur pour:', user.id);
        
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('id, user_type')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('❌ Erreur lors de la récupération du profil:', error);
          setError('Impossible de récupérer votre profil');
          return;
        }

        if (profile && profile.user_type === 'client') {
          setClientProfileId(profile.id);
          console.log('✅ Utilisateur client confirmé:', profile.id);
          setError(''); // Clear any previous errors
        } else {
          console.warn('⚠️ Utilisateur n\'est pas un client, type:', profile?.user_type);
          setError('Vous devez être un client pour noter un développeur');
        }
      } catch (err) {
        console.error('❌ Erreur complète:', err);
        setError('Erreur lors du chargement de votre profil');
      }
    }

    fetchClientProfile();
  }, [user, isOpen]);

  // Reset du modal quand il s'ouvre
  useEffect(() => {
    if (isOpen) {
      setSelectedRating(0);
      setHoveredRating(0);
      setComment('');
      setError('');
      setSuccess(false);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!clientProfileId) {
      setError('Impossible de récupérer votre profil client');
      return;
    }

    if (selectedRating === 0) {
      setError('Veuillez sélectionner une note');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      console.log('🔍 Debug - Données à soumettre:', {
        'client_id': clientProfileId,
        'developer_id': developerId,
        'rating': selectedRating,
        'comment': comment,
        'project_title': projectTitle
      });

      const { data, error } = await supabase
        .from('ratings')
        .upsert({
          client_id: clientProfileId,
          developer_id: developerId,
          rating: selectedRating,
          comment: comment || null,
          project_title: projectTitle || 'Projet'
        });

      if (error) {
        console.error('❌ Erreur Supabase:', error);
        throw error;
      }

      console.log('✅ Note soumise avec succès!', data);

      // 🆕 NOUVEAU: Recalculer et mettre à jour les statistiques du développeur
      await updateDeveloperRatingStats(developerId);

      setSuccess(true);
      
      // Appeler le callback si fourni
      if (onRatingSubmitted) {
        onRatingSubmitted();
      }
      
      // Fermer le modal après 1.5 secondes
      setTimeout(() => {
        onClose();
      }, 1500);

    } catch (error: any) {
      console.error('❌ Erreur complète:', error);
      
      // 🔧 AJOUT: Message spécifique pour les notes en double
      if (error.code === '23505' || error.message?.includes('duplicate') || error.message?.includes('unique')) {
        setError('Vous avez déjà noté ce développeur. Une seule note par client est autorisée.');
      } else {
        setError('Erreur lors de la soumission de votre note. Veuillez réessayer.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // 🆕 NOUVEAU: Fonction pour recalculer les statistiques de rating du développeur
  const updateDeveloperRatingStats = async (developerId: string) => {
    try {
      console.log('🔄 Recalcul des statistiques de rating pour:', developerId);

      // Récupérer toutes les notes du développeur
      const { data: ratings, error: ratingsError } = await supabase
        .from('ratings')
        .select('rating')
        .eq('developer_id', developerId);

      if (ratingsError) {
        console.error('❌ Erreur récupération ratings:', ratingsError);
        return;
      }

      if (!ratings || ratings.length === 0) {
        console.log('⚠️ Aucune note trouvée pour le développeur');
        return;
      }

      // Calculer la moyenne et le total
      const totalRatings = ratings.length;
      const averageRating = ratings.reduce((sum, r) => sum + r.rating, 0) / totalRatings;

      console.log('📊 Nouvelles statistiques:', {
        totalRatings,
        averageRating: averageRating.toFixed(2)
      });

      // Mettre à jour le profil développeur
      const { error: updateError } = await supabase
        .from('developer_profiles')
        .update({
          average_rating: Math.round(averageRating * 10) / 10, // Arrondi à 1 décimale
          total_ratings: totalRatings,
          updated_at: new Date().toISOString()
        })
        .eq('id', developerId);

      if (updateError) {
        console.error('❌ Erreur mise à jour profil développeur:', updateError);
      } else {
        console.log('✅ Statistiques de rating mises à jour avec succès');
      }

    } catch (error) {
      console.error('❌ Erreur recalcul statistiques:', error);
    }
  };

  const handleStarClick = (rating: number) => {
    setSelectedRating(rating);
  };

  const handleStarHover = (rating: number) => {
    setHoveredRating(rating);
  };

  const handleStarLeave = () => {
    setHoveredRating(0);
  };

  const getRatingText = (rating: number) => {
    switch (rating) {
      case 1: return 'Très insatisfait';
      case 2: return 'Insatisfait';
      case 3: return 'Neutre';
      case 4: return 'Satisfait';
      case 5: return 'Très satisfait';
      default: return '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900">
            Noter le développeur
          </h2>
          <p className="text-gray-600 mt-1">
            {developerName}
          </p>
          {projectTitle && (
            <p className="text-sm text-gray-500 mt-1">
              Projet : {projectTitle}
            </p>
          )}
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Success Message */}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="text-green-600">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="ml-3 text-sm text-green-800">
                  Votre note a été envoyée avec succès !
                </p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="text-red-600">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="ml-3 text-sm text-red-800">
                  {error}
                </p>
              </div>
            </div>
          )}

          {/* Rating Section */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-3">
              Votre note (obligatoire)
            </label>
            <div className="flex items-center space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleStarClick(star)}
                  onMouseEnter={() => handleStarHover(star)}
                  onMouseLeave={handleStarLeave}
                  disabled={isSubmitting || success}
                  className={`text-3xl transition-all duration-200 hover:scale-110 disabled:cursor-not-allowed ${
                    star <= (hoveredRating || selectedRating)
                      ? 'text-yellow-400'
                      : 'text-gray-300'
                  }`}
                >
                  ⭐
                </button>
              ))}
            </div>
            {(selectedRating > 0 || hoveredRating > 0) && (
              <p className="text-sm text-gray-600 mt-2">
                {hoveredRating > 0 ? hoveredRating : selectedRating}/5 - {getRatingText(hoveredRating > 0 ? hoveredRating : selectedRating)}
              </p>
            )}
          </div>

          {/* Comment Section */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-3">
              Commentaire (optionnel)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              disabled={isSubmitting || success}
              placeholder="Partagez votre expérience avec ce développeur..."
              maxLength={500}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent resize-none disabled:bg-gray-50 disabled:cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-2">
              {comment.length}/500 caractères
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || selectedRating === 0 || success || !clientProfileId}
            className="flex-1 px-4 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Envoi...
              </div>
            ) : success ? (
              'Envoyé !'
            ) : (
              'Publier la note'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
