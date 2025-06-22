'use client';

import React, { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/layout/auth-context';
import ContactModal from '@/components/ContactModal';
import { ArrowLeft, MapPin, Calendar, Star, Mail, MessageCircle } from 'lucide-react';

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
}

export default function DeveloperProfilePage() {
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
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', developerId)
        .eq('user_type', 'developer')
        .single();

      if (data) {
        setDeveloper(data);
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
            <div className="w-32 h-32 bg-white rounded-2xl flex items-center justify-center text-black font-black text-5xl">
              {developer.full_name?.charAt(0).toUpperCase() || 'D'}
            </div>

            <div className="flex-1">
              <h1 className="text-4xl font-black mb-2">{developer.full_name || 'Développeur'}</h1>
              <p className="text-xl text-gray-300 mb-4">{developer.experience_level || 'Non spécifié'}</p>
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
        <div className="bg-gray-50 border-2 border-gray-200 p-8">
          <h2 className="text-2xl font-black text-black mb-6">À propos</h2>
          <p className="text-gray-700">
            {developer.bio || 'Ce développeur n\'a pas encore ajouté de description personnelle.'}
          </p>
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
