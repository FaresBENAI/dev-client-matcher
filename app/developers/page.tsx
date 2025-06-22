'use client';

import React, { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/layout/auth-context';
import { Search, MapPin, Calendar, Code, Star, Filter, Grid, List, Mail } from 'lucide-react';

interface Developer {
  id: string;
  full_name: string;
  email: string;
  bio?: string;
  location?: string;
  skills?: string[];
  experience_level?: string;
  hourly_rate?: number;
  available?: boolean;
  created_at: string;
  profile_photo_url?: string;
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
  const [message, setMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClientComponentClient();

  useEffect(() => {
    loadDevelopers();
  }, []);

  const loadDevelopers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_type', 'developer')
        .order('created_at', { ascending: false });

      if (data) {
        setDevelopers(data);
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewProfile = (developer: Developer) => {
    // Redirection vers la page profil dédiée
    router.push(`/developer/${developer.id}`);
  };

  const handleContact = async (developer: Developer) => {
    console.log('🔍 Vérification utilisateur connecté:', user);
    
    if (!user) {
      console.log('❌ Utilisateur non connecté, redirection...');
      router.push('/auth/signup');
      return;
    }

    console.log('✅ Utilisateur connecté, ouverture modal');
    // Ouvrir la modal de contact
    setContactModal({
      isOpen: true,
      developer: developer
    });
  };

  const sendMessage = async () => {
    if (!message.trim() || !contactModal.developer || !user) return;

    setSendingMessage(true);
    try {
      console.log('📤 Envoi message...');
      
      // Vérifier si une conversation existe déjà
      const { data: existingConversation } = await supabase
        .from('conversations')
        .select('id')
        .or(`and(client_id.eq.${user.id},developer_id.eq.${contactModal.developer.id}),and(client_id.eq.${contactModal.developer.id},developer_id.eq.${user.id})`)
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
            developer_id: contactModal.developer.id
          })
          .select('id')
          .single();

        if (convError) {
          console.error('Erreur création conversation:', convError);
          alert('Erreur lors de la création de la conversation');
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

      if (messageError) {
        console.error('Erreur envoi message:', messageError);
        alert('Erreur lors de l\'envoi du message');
        return;
      }

      console.log('✅ Message envoyé avec succès');
      
      // Fermer la modal et rediriger vers messages
      setContactModal({ isOpen: false, developer: null });
      setMessage('');
      router.push('/messages');
      
    } catch (error) {
      console.error('💥 Erreur complète:', error);
      alert('Une erreur est survenue');
    } finally {
      setSendingMessage(false);
    }
  };

  const filteredDevelopers = developers.filter(developer => {
    const matchesSearch = developer.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         developer.bio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         developer.skills?.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesExperience = selectedExperience === 'all' || developer.experience_level === selectedExperience;
    const matchesAvailability = selectedAvailability === 'all' || 
                               (selectedAvailability === 'available' && developer.available) ||
                               (selectedAvailability === 'unavailable' && !developer.available);
    
    return matchesSearch && matchesExperience && matchesAvailability;
  });

  const DeveloperCard = ({ developer }: { developer: Developer }) => (
    <div className="bg-white border-2 border-gray-200 p-6 hover:border-black transition-all duration-300 transform hover:scale-105">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center text-white font-black text-lg">
            {developer.full_name?.charAt(0).toUpperCase() || 'D'}
          </div>
          <div>
            <h3 className="font-black text-lg text-black">{developer.full_name || 'Développeur'}</h3>
            <p className="text-sm text-gray-600">{developer.experience_level || 'Non spécifié'}</p>
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
              <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-bold border border-gray-300">
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

  const DeveloperListItem = ({ developer }: { developer: Developer }) => (
    <div className="bg-white border-2 border-gray-200 p-6 hover:border-black transition-all duration-300">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-2">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center text-white font-black">
              {developer.full_name?.charAt(0).toUpperCase() || 'D'}
            </div>
            <div>
              <h3 className="font-black text-lg text-black">{developer.full_name || 'Développeur'}</h3>
              <p className="text-sm text-gray-600">{developer.experience_level || 'Non spécifié'}</p>
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

      {/* Modal de contact */}
      {contactModal.isOpen && contactModal.developer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white border-2 border-black max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-black">
                Contacter {contactModal.developer.full_name}
              </h3>
              <button
                onClick={() => setContactModal({ isOpen: false, developer: null })}
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
                onClick={() => setContactModal({ isOpen: false, developer: null })}
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
