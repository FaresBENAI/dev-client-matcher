'use client';

import React, { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/layout/auth-context';
import { ArrowLeft, MapPin, Calendar, Star, Mail, Code, MessageCircle, Briefcase } from 'lucide-react';

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
  created_at: string;
  profile_photo_url?: string;
  portfolio_url?: string;
  github_url?: string;
  linkedin_url?: string;
}

export default function DeveloperProfilePage({ params }: { params: { id: string } }) {
  const [developer, setDeveloper] = useState<DeveloperProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [contactModal, setContactModal] = useState(false);
  const [message, setMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClientComponentClient();

  useEffect(() => {
    loadDeveloperProfile();
  }, [params.id]);

  const loadDeveloperProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', params.id)
        .eq('user_type', 'developer')
        .single();

      if (data) {
        setDeveloper(data);
      } else {
        // Développeur non trouvé
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
            {/* Avatar */}
            <div className="w-32 h-32 bg-white rounded-2xl flex items-center justify-center text-black font-black text-5xl border-4 border-white">
              {developer.full_name?.charAt(0).toUpperCase() || 'D'}
            </div>

            {/* Infos principales */}
            <div className="flex-1">
              <h1 className="text-4xl font-black mb-2">{developer.full_name || 'Développeur'}</h1>
              <p className="text-xl text-gray-300 mb-4">{developer.experience_level || 'Niveau d\'expérience non spécifié'}</p>
              
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
                  Compétences
                </h2>
                <div className="flex flex-wrap gap-3">
                  {developer.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-4 py-2 bg-black text-white font-bold border-2 border-black hover:bg-white hover:text-black transition-all duration-300"
                    >
                      {skill}
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
                
                {developer.experience_level && (
                  <div>
                    <span className="text-gray-300 text-sm">Expérience</span>
                    <p className="font-bold capitalize">{developer.experience_level}</p>
                  </div>
                )}
                
                {developer.location && (
                  <div>
                    <span className="text-gray-300 text-sm">Localisation</span>
                    <p className="font-bold">{developer.location}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Liens externes */}
            {(developer.portfolio_url || developer.github_url || developer.linkedin_url) && (
              <div className="bg-gray-50 border-2 border-gray-200 p-6">
                <h3 className="text-xl font-black text-black mb-4">Liens</h3>
                <div className="space-y-3">
                  {developer.portfolio_url && (
                    <a
                      href={developer.portfolio_url}
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
