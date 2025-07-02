'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Camera, Upload, X, Plus, Globe, Briefcase, MapPin, Calendar, Mail, User, Check, AlertCircle } from 'lucide-react';

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

// Compétences IA spécialisées
const AI_SKILLS = [
  'Machine Learning',
  'Deep Learning', 
  'TensorFlow',
  'PyTorch',
  'OpenAI API',
  'Langchain',
  'Hugging Face',
  'Computer Vision',
  'NLP',
  'LLMs',
  'GPT Integration',
  'Claude API',
  'Prompt Engineering',
  'RAG Systems',
  'Vector Databases',
  'AI Automation',
  'Chatbot Development',
  'AI Ethics',
  'Model Training',
  'Data Science'
];

export default function DeveloperProfilePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', content: '' });
  
  // États du formulaire
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    bio: '',
    location: '',
    phone: '',
    website: '',
    experience_years: '',
    daily_rate: '', // 🆕 CHANGÉ: hourly_rate -> daily_rate
    daily_rate_defined: true, // 🆕 NOUVEAU: option "à définir"
    availability: 'available',
    profile_image: '',
    languages: [], // Max 2 langues
    skills: []      // Compétences IA
  });
  
  // États pour l'upload d'image
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // États pour les sélections
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('');

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      console.log('🔐 User récupéré:', user);
      setUser(user);
      
      if (user) {
        await loadProfile(user.id);
      }
    } catch (error) {
      console.error('Erreur auth:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProfile = async (userId) => {
    try {
      console.log('📥 Chargement du profil pour userId:', userId);
      
      // Charger le profil de base
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      console.log('📥 Profil de base chargé:', profile);
      if (profileError) console.log('⚠️ Erreur profil de base:', profileError);

      // Charger le profil développeur étendu
      const { data: devProfile, error: devError } = await supabase
        .from('developer_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      console.log('📥 Profil développeur chargé:', devProfile);
      if (devError) console.log('⚠️ Erreur profil dev:', devError);

      if (profile) {
        setFormData(prev => ({
          ...prev,
          full_name: profile.full_name || '',
          email: profile.email || user?.email || '',
          profile_image: profile.avatar_url || ''
        }));
        
        if (profile.avatar_url) {
          setImagePreview(profile.avatar_url);
        }
      }

      if (devProfile) {
        setFormData(prev => ({
          ...prev,
          bio: devProfile.bio || '',
          location: devProfile.location || '',
          phone: devProfile.phone || '',
          website: devProfile.website || devProfile.portfolio_url || '',
          experience_years: devProfile.experience_years || '',
          daily_rate: devProfile.daily_rate || '', // 🆕 CHANGÉ
          daily_rate_defined: devProfile.daily_rate_defined !== false, // 🆕 NOUVEAU: défaut true
          availability: devProfile.availability || 'available',
          languages: Array.isArray(devProfile.languages) ? devProfile.languages : [],
          skills: Array.isArray(devProfile.skills) ? devProfile.skills : []
        }));
      }
    } catch (error) {
      console.error('Erreur chargement profil:', error);
      setMessage({ type: 'error', content: 'Erreur lors du chargement du profil' });
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB max
        setMessage({ type: 'error', content: 'L\'image ne doit pas dépasser 5MB' });
        return;
      }
      
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async () => {
    if (!imageFile || !user) {
      console.error('❌ Prérequis manquants:', { 
        hasImageFile: !!imageFile, 
        hasUser: !!user,
        userId: user?.id 
      });
      return null;
    }

    console.log('🚀 DÉBUT UPLOAD avec politiques RLS correctes');
    console.log('👤 User ID:', user.id);
    console.log('📁 File:', { name: imageFile.name, size: imageFile.size, type: imageFile.type });

    setUploadingImage(true);
    
    try {
      // 1. Vérifier l'authentification
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      
      if (!authUser || authError) {
        throw new Error('Utilisateur non authentifié');
      }
      
      console.log('✅ Authentification OK:', authUser.id);

      // 2. Créer le nom de fichier avec la structure attendue par RLS
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `avatar-${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;
      
      console.log('📂 Chemin fichier:', filePath);

      // 3. Supprimer l'ancienne image si elle existe
      if (formData.profile_image) {
        try {
          const oldImageUrl = formData.profile_image;
          const match = oldImageUrl.match(/\/avatars\/(.+)$/);
          
          if (match && match[1]) {
            const oldFilePath = match[1];
            console.log('🗑️ Suppression ancienne image:', oldFilePath);
            
            const { error: deleteError } = await supabase.storage
              .from('avatars')
              .remove([oldFilePath]);
              
            if (deleteError) {
              console.log('⚠️ Erreur suppression (ignorée):', deleteError.message);
            } else {
              console.log('✅ Ancienne image supprimée');
            }
          }
        } catch (deleteError) {
          console.log('⚠️ Erreur lors de la suppression (ignorée):', deleteError);
        }
      }

      // 4. Upload du nouveau fichier
      console.log('📤 Upload en cours...');
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, imageFile, {
          cacheControl: '3600',
          upsert: true,
          contentType: imageFile.type
        });

      if (uploadError) {
        console.error('❌ Erreur upload:', uploadError);
        throw new Error(`Upload échoué: ${uploadError.message}`);
      }

      console.log('✅ Upload réussi:', uploadData);

      // 5. Récupérer l'URL publique
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      console.log('🔗 URL publique générée:', urlData.publicUrl);
      console.log('🎉 UPLOAD TERMINÉ AVEC SUCCÈS');
      return urlData.publicUrl;

    } catch (error) {
      console.error('💥 ERREUR GLOBALE UPLOAD:', error);
      setMessage({ 
        type: 'error', 
        content: `Erreur upload: ${error.message}` 
      });
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const addLanguage = () => {
    if (selectedLanguage && formData.languages.length < 2 && !formData.languages.includes(selectedLanguage)) {
      setFormData(prev => ({
        ...prev,
        languages: [...prev.languages, selectedLanguage]
      }));
      setSelectedLanguage('');
    }
  };

  const removeLanguage = (languageToRemove) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages.filter(lang => lang !== languageToRemove)
    }));
  };

  const addSkill = () => {
    if (selectedSkill && formData.skills.length < 8 && !formData.skills.includes(selectedSkill)) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, selectedSkill]
      }));
      setSelectedSkill('');
    }
  };

  const removeSkill = (skillToRemove) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };

  const validateForm = () => {
    console.log('🔍 VALIDATION - Début');
    console.log('📝 FormData à valider:', formData);
    
    // Vérifications obligatoires
    if (!formData.full_name || formData.full_name.trim().length === 0) {
      console.error('❌ VALIDATION - Nom manquant ou vide');
      setMessage({ type: 'error', content: 'Le nom complet est obligatoire' });
      return false;
    }
    
    if (!formData.bio || formData.bio.trim().length === 0) {
      console.error('❌ VALIDATION - Bio manquante ou vide');
      setMessage({ type: 'error', content: 'La biographie est obligatoire' });
      return false;
    }
    
    if (!imagePreview && !formData.profile_image) {
      console.error('❌ VALIDATION - Photo manquante');
      setMessage({ type: 'error', content: 'La photo de profil est obligatoire' });
      return false;
    }
    
    if (!formData.languages || formData.languages.length === 0) {
      console.error('❌ VALIDATION - Langues manquantes');
      setMessage({ type: 'error', content: 'Au moins une langue est obligatoire' });
      return false;
    }
    
    if (!formData.skills || formData.skills.length < 3) {
      console.error('❌ VALIDATION - Compétences insuffisantes');
      setMessage({ type: 'error', content: 'Au moins 3 compétences IA sont obligatoires' });
      return false;
    }
    
    console.log('✅ VALIDATION - Réussie');
    return true;
  };

  const handleSubmit = async () => {
    console.log('🚀 DEBUT handleSubmit');
    
    if (!user) {
      console.error('❌ Pas d\'utilisateur connecté');
      setMessage({ type: 'error', content: 'Utilisateur non connecté' });
      return;
    }

    if (!validateForm()) {
      console.error('❌ Validation échouée');
      return;
    }

    setSaving(true);
    setMessage({ type: '', content: '' });

    try {
      // Upload d'image si une nouvelle image est sélectionnée
      let avatarUrl = formData.profile_image;
      
      if (imageFile) {
        console.log('📤 Upload d\'image en cours...');
        try {
          const uploadedUrl = await uploadImage();
          if (uploadedUrl) {
            avatarUrl = uploadedUrl;
            console.log('📤 Image uploadée avec succès:', uploadedUrl);
          } else {
            console.log('⚠️ Upload d\'image échoué, continue avec l\'avatar actuel');
          }
        } catch (uploadError) {
          console.log('⚠️ Erreur upload image, continue sans:', uploadError);
        }
      }

      // Mise à jour du profil de base
      console.log('💾 Mise à jour du profil de base...');
      const profileUpdateData = {
        full_name: formData.full_name,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString()
      };

      const { data: profileResult, error: profileError } = await supabase
        .from('profiles')
        .update(profileUpdateData)
        .eq('id', user.id)
        .select();

      if (profileError) {
        console.error('❌ Erreur profil de base:', profileError);
        throw new Error(`Erreur profil: ${profileError.message}`);
      }

      console.log('✅ Profil de base mis à jour');

      // Gestion du profil développeur
      console.log('💾 Gestion du profil développeur...');

      const devProfileData = {
        id: user.id,
        user_id: user.id,
        title: formData.full_name,
        bio: formData.bio || '',
        location: formData.location || '',
        phone: formData.phone || '',
        website: formData.website || '',
        portfolio_url: formData.website || '',
        experience_years: formData.experience_years ? parseInt(formData.experience_years) : null,
        daily_rate: formData.daily_rate_defined && formData.daily_rate ? parseInt(formData.daily_rate) : null, // 🆕 CHANGÉ
        daily_rate_defined: formData.daily_rate_defined, // 🆕 NOUVEAU
        availability: formData.availability || 'available',
        languages: formData.languages || [],
        skills: formData.skills || [],
        specializations: formData.skills || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Vérifier si le profil existe
      const { data: existingProfile } = await supabase
        .from('developer_profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      if (existingProfile) {
        // Le profil existe, faire un UPDATE
        const updateData = {
          title: formData.full_name,
          bio: formData.bio || '',
          location: formData.location || '',
          phone: formData.phone || '',
          website: formData.website || '',
          portfolio_url: formData.website || '',
          experience_years: formData.experience_years ? parseInt(formData.experience_years) : null,
          daily_rate: formData.daily_rate_defined && formData.daily_rate ? parseInt(formData.daily_rate) : null, // 🆕 CHANGÉ
          daily_rate_defined: formData.daily_rate_defined, // 🆕 NOUVEAU
          availability: formData.availability || 'available',
          languages: formData.languages || [],
          skills: formData.skills || [],
          specializations: formData.skills || [],
          updated_at: new Date().toISOString()
        };

        const { data: updateResult, error: updateError } = await supabase
          .from('developer_profiles')
          .update(updateData)
          .eq('id', user.id)
          .select();

        if (updateError) {
          console.error('❌ Erreur UPDATE:', updateError);
          throw new Error(`Erreur UPDATE: ${updateError.message}`);
        }

        console.log('✅ Profil développeur mis à jour');
      } else {
        // Le profil n'existe pas, faire un INSERT
        const { data: insertResult, error: insertError } = await supabase
          .from('developer_profiles')
          .insert(devProfileData)
          .select();

        if (insertError) {
          console.error('❌ Erreur INSERT:', insertError);
          throw new Error(`Erreur INSERT: ${insertError.message}`);
        }

        console.log('✅ Profil développeur créé');
      }

      setMessage({ type: 'success', content: 'Profil mis à jour avec succès !' });
      
      // Recharger les données après 1 seconde
      setTimeout(async () => {
        await loadProfile(user.id);
      }, 1000);
      
    } catch (error) {
      console.error('💥 ERREUR GLOBALE:', error);
      setMessage({ 
        type: 'error', 
        content: `Erreur lors de la sauvegarde: ${error.message}` 
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-gray-200 border-t-black rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border-2 border-gray-200 p-6 mb-6">
          <h1 className="text-3xl font-black text-black mb-2">Profil Développeur IA</h1>
          <p className="text-gray-600">Complétez votre profil pour attirer les meilleurs clients</p>
        </div>

        {/* Message de feedback */}
        {message.content && (
          <div className={`mb-6 p-4 rounded-lg border-2 flex items-center gap-3 ${
            message.type === 'success' 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            {message.type === 'success' ? <Check className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
            <span className="font-bold">{message.content}</span>
          </div>
        )}

        <div className="space-y-6">
          
          {/* Photo de profil */}
          <div className="bg-white rounded-lg shadow-sm border-2 border-gray-200 p-6">
            <h2 className="text-xl font-black text-black mb-4 flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Photo de profil *
            </h2>
            
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="w-32 h-32 bg-gray-100 rounded-full border-4 border-gray-200 overflow-hidden">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                </div>
                
                {uploadingImage && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
              
              <div>
                <label className="bg-black text-white px-4 py-2 font-black hover:bg-gray-800 cursor-pointer inline-flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Choisir une photo
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
                <p className="text-sm text-gray-600 mt-2">
                  Format JPG, PNG ou GIF. Max 5MB. <span className="text-red-600 font-bold">Obligatoire</span>
                </p>
              </div>
            </div>
          </div>

          {/* Informations de base */}
          <div className="bg-white rounded-lg shadow-sm border-2 border-gray-200 p-6">
            <h2 className="text-xl font-black text-black mb-4 flex items-center gap-2">
              <User className="h-5 w-5" />
              Informations personnelles
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-black text-black mb-2">
                  Nom complet *
                </label>
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-gray-200 focus:border-black focus:outline-none font-bold"
                  placeholder="Votre nom complet"
                />
              </div>
              
              <div>
                <label className="block text-sm font-black text-black mb-2">
                  Email
                </label>
                <input
                  type="email"
                  disabled
                  value={formData.email}
                  className="w-full px-4 py-3 border-2 border-gray-200 bg-gray-50 font-bold text-gray-600"
                />
              </div>
              
              <div>
                <label className="block text-sm font-black text-black mb-2">
                  Localisation
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-gray-200 focus:border-black focus:outline-none font-bold"
                  placeholder="Ville, Pays"
                />
              </div>
              
              <div>
                <label className="block text-sm font-black text-black mb-2">
                  Téléphone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-gray-200 focus:border-black focus:outline-none font-bold"
                  placeholder="+33 6 12 34 56 78"
                />
              </div>
            </div>
          </div>

          {/* Langues parlées */}
          <div className="bg-white rounded-lg shadow-sm border-2 border-gray-200 p-6">
            <h2 className="text-xl font-black text-black mb-4 flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Langues parlées * (Max 2)
            </h2>
            
            <div className="flex gap-3 mb-4">
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="flex-1 px-4 py-3 border-2 border-gray-200 focus:border-black focus:outline-none font-bold"
                disabled={formData.languages.length >= 2}
              >
                <option value="">Sélectionner une langue</option>
                {Object.entries(LANGUAGES).map(([code, lang]) => (
                  <option key={code} value={code} disabled={formData.languages.includes(code)}>
                    {lang.flag} {lang.name}
                  </option>
                ))}
              </select>
              
              <button
                type="button"
                onClick={addLanguage}
                disabled={!selectedLanguage || formData.languages.length >= 2}
                className="bg-black text-white px-4 py-3 font-black hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>
            
            {formData.languages.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.languages.map((langCode) => (
                  <span
                    key={langCode}
                    className="bg-black text-white px-4 py-2 font-bold flex items-center gap-2"
                  >
                    <span className="text-lg">{LANGUAGES[langCode]?.flag}</span>
                    {LANGUAGES[langCode]?.name}
                    <button
                      type="button"
                      onClick={() => removeLanguage(langCode)}
                      className="hover:text-gray-300"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Compétences IA */}
          <div className="bg-white rounded-lg shadow-sm border-2 border-gray-200 p-6">
            <h2 className="text-xl font-black text-black mb-4 flex items-center gap-2">
              🧠 Compétences IA * (Min 3, Max 8)
            </h2>
            
            <div className="flex gap-3 mb-4">
              <select
                value={selectedSkill}
                onChange={(e) => setSelectedSkill(e.target.value)}
                className="flex-1 px-4 py-3 border-2 border-gray-200 focus:border-black focus:outline-none font-bold"
                disabled={formData.skills.length >= 8}
              >
                <option value="">Sélectionner une compétence</option>
                {AI_SKILLS.map((skill) => (
                  <option key={skill} value={skill} disabled={formData.skills.includes(skill)}>
                    {skill}
                  </option>
                ))}
              </select>
              
              <button
                type="button"
                onClick={addSkill}
                disabled={!selectedSkill || formData.skills.length >= 8}
                className="bg-black text-white px-4 py-3 font-black hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>
            
            {formData.skills.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.skills.map((skill) => (
                  <span
                    key={skill}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-3 py-1 text-sm font-bold flex items-center gap-2"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => removeSkill(skill)}
                      className="hover:text-gray-300"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            
            <p className="text-sm text-gray-600 mt-2">
              {formData.skills.length}/8 compétences sélectionnées
            </p>
          </div>

          {/* Biographie */}
          <div className="bg-white rounded-lg shadow-sm border-2 border-gray-200 p-6">
            <h2 className="text-xl font-black text-black mb-4">
              Biographie *
            </h2>
            
            <textarea
              required
              rows={5}
              value={formData.bio}
              onChange={(e) => {
                console.log('📝 Bio en cours de modification:', e.target.value);
                setFormData(prev => ({ ...prev, bio: e.target.value }));
              }}
              className="w-full px-4 py-3 border-2 border-gray-200 focus:border-black focus:outline-none font-bold resize-none"
              placeholder="Décrivez votre expérience en IA, vos spécialités, et ce qui vous rend unique..."
            />
            <p className="text-sm text-gray-600 mt-2">
              Présentez votre expertise en intelligence artificielle de manière engageante.
            </p>
          </div>

          {/* Informations professionnelles avec TJM */}
          <div className="bg-white rounded-lg shadow-sm border-2 border-gray-200 p-6">
            <h2 className="text-xl font-black text-black mb-4 flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Informations professionnelles
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-black text-black mb-2">
                  Années d'expérience
                </label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={formData.experience_years}
                  onChange={(e) => setFormData(prev => ({ ...prev, experience_years: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-gray-200 focus:border-black focus:outline-none font-bold"
                  placeholder="3"
                />
              </div>
              
              {/* 🆕 NOUVEAU: Section TJM avec option "à définir" */}
              <div className="md:col-span-2">
                <label className="block text-sm font-black text-black mb-2">
                  💰 Taux Journalier Moyen (TJM)
                </label>
                
                {/* Checkbox "À définir" */}
                <div className="mb-3">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!formData.daily_rate_defined}
                      onChange={(e) => setFormData(prev => ({
                        ...prev, 
                        daily_rate_defined: !e.target.checked,
                        daily_rate: e.target.checked ? '' : prev.daily_rate
                      }))}
                      className="w-4 h-4 border-2 border-gray-300 rounded bg-white checked:bg-black checked:border-black focus:ring-black"
                    />
                    <span className="text-sm text-gray-700 font-medium">
                      📋 À définir avec le client (négociable selon le projet)
                    </span>
                  </label>
                </div>
                
                {/* Input TJM conditionnel */}
                {formData.daily_rate_defined ? (
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      value={formData.daily_rate}
                      onChange={(e) => setFormData(prev => ({ ...prev, daily_rate: e.target.value }))}
                      placeholder="400"
                      className="w-full px-4 py-3 border-2 border-gray-200 focus:border-black focus:outline-none font-bold pr-12"
                    />
                    <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-bold">
                      €/jour
                    </span>
                  </div>
                ) : (
                  <div className="bg-gray-100 border-2 border-gray-300 rounded-lg px-4 py-3 text-gray-600 font-medium">
                    🤝 TJM à négocier selon la complexité et la durée du projet
                  </div>
                )}
                
                <p className="text-xs text-gray-500 mt-2">
                  {formData.daily_rate_defined 
                    ? "Votre TJM sera affiché publiquement sur votre profil" 
                    : "Les clients pourront vous contacter pour discuter du tarif"}
                </p>
              </div>
            </div>
            
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-black text-black mb-2">
                  Disponibilité
                </label>
                <select
                  value={formData.availability}
                  onChange={(e) => setFormData(prev => ({ ...prev, availability: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-gray-200 focus:border-black focus:outline-none font-bold"
                >
                  <option value="available">🟢 Disponible</option>
                  <option value="busy">🟡 Occupé</option>
                  <option value="unavailable">🔴 Indisponible</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-black text-black mb-2">
                  Site web / Portfolio
                </label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-gray-200 focus:border-black focus:outline-none font-bold"
                  placeholder="https://monportfolio.com"
                />
              </div>
            </div>
          </div>

          {/* Bouton de sauvegarde */}
          <div className="bg-white rounded-lg shadow-sm border-2 border-gray-200 p-6">
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="w-full bg-black text-white py-4 px-6 font-black text-lg hover:bg-gray-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              {saving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Sauvegarde en cours...
                </>
              ) : (
                <>
                  <Check className="h-5 w-5" />
                  Sauvegarder le profil
                </>
              )}
            </button>
            
            <div className="mt-4 p-3 bg-blue-50 border-2 border-blue-200 rounded">
              <p className="text-sm text-blue-800 font-bold">
                💡 <strong>Nouveau :</strong> Vous pouvez maintenant choisir d'afficher votre TJM ou de le laisser "à définir" pour négocier avec chaque client.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
