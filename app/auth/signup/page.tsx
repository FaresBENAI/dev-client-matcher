'use client'

import { useState } from 'react'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function SignupPage() {
  const [step, setStep] = useState(1)
  const [userType, setUserType] = useState<'client' | 'developer'>('client')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const router = useRouter()

  // Données de base
  const [basicData, setBasicData] = useState({
    email: '',
    password: '',
    fullName: '',
    phone: ''
  })

  // Données développeur spécifiques
  const [devData, setDevData] = useState({
    title: '',
    bio: '',
    experience_years: '',
    hourly_rate: '',
    skills: [] as string[],
    specializations: [] as string[],
    github_url: '',
    linkedin_url: '',
    portfolio_url: ''
  })

  const skillOptions = [
    'JavaScript', 'Python', 'TypeScript', 'React', 'Node.js', 'Vue.js', 'Angular',
    'PHP', 'Laravel', 'Django', 'Flask', 'Express', 'Next.js', 'Nuxt.js',
    'HTML/CSS', 'Tailwind CSS', 'Bootstrap', 'SASS/SCSS',
    'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Firebase',
    'AWS', 'Google Cloud', 'Azure', 'Docker', 'Kubernetes',
    'Git', 'API REST', 'GraphQL', 'Webhooks'
  ]

  const specializationOptions = [
    'Machine Learning', 'Deep Learning', 'Computer Vision', 'NLP',
    'TensorFlow', 'PyTorch', 'Scikit-learn', 'OpenAI API',
    'Automatisation RPA', 'Web Scraping', 'Data Analysis',
    'Chatbots', 'IA Conversationnelle', 'Business Intelligence',
    'Excel/VBA Automation', 'Zapier/Make', 'Power Automate'
  ]

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validation du fichier
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
      const maxSize = 5 * 1024 * 1024 // 5MB

      if (!validTypes.includes(file.type)) {
        setError('Format d\'image non supporté. Utilisez JPG, PNG ou WebP.')
        return
      }

      if (file.size > maxSize) {
        setError('L\'image est trop grande. Taille maximum : 5MB.')
        return
      }

      setProfilePhoto(file)
      setError('')

      // Créer aperçu
      const reader = new FileReader()
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const uploadProfilePhoto = async (userId: string): Promise<string | null> => {
    if (!profilePhoto) return null

    try {
      const fileExt = profilePhoto.name.split('.').pop()
      const fileName = `${userId}/profile.${fileExt}`

      console.log('📤 Upload photo:', fileName)

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(fileName, profilePhoto, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) {
        console.error('❌ Erreur upload:', uploadError)
        return null
      }

      // Récupérer l'URL publique
      const { data: { publicUrl } } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(fileName)

      console.log('✅ Photo uploadée:', publicUrl)
      return publicUrl
    } catch (error) {
      console.error('❌ Erreur lors de l\'upload:', error)
      return null
    }
  }

  const handleBasicSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation des champs obligatoires
    if (!basicData.email || !basicData.password || !basicData.fullName || !basicData.phone) {
      setError('Tous les champs sont obligatoires')
      return
    }

    // Validation email basique
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(basicData.email)) {
      setError('Email non valide')
      return
    }

    // Validation mot de passe
    if (basicData.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères')
      return
    }

    setError('')

    if (userType === 'developer') {
      setStep(2) // Passer aux infos développeur
    } else {
      handleFinalSubmit() // Créer le compte client directement
    }
  }

  const handleFinalSubmit = async () => {
    setLoading(true)
    setError('')

    console.log('🔄 DEBUT INSCRIPTION')
    console.log('📝 Données:', { 
      email: basicData.email, 
      password: basicData.password.length + ' caractères', 
      fullName: basicData.fullName,
      userType 
    })

    try {
      // Validation photo obligatoire pour développeurs
      if (userType === 'developer' && !profilePhoto) {
        setError('Une photo de profil est obligatoire pour les développeurs')
        setLoading(false)
        return
      }

      console.log('📤 Envoi requête Supabase...')

      // Préparer les métadonnées utilisateur
      const userMetadata = {
        full_name: basicData.fullName,
        phone: basicData.phone,
        user_type: userType
      }

      // Ajouter les données développeur si applicable
      if (userType === 'developer') {
        Object.assign(userMetadata, {
          title: devData.title,
          bio: devData.bio,
          experience_years: devData.experience_years ? parseInt(devData.experience_years) : 0,
          hourly_rate: devData.hourly_rate ? parseInt(devData.hourly_rate) : 0,
          skills: devData.skills,
          specializations: devData.specializations,
          github_url: devData.github_url,
          linkedin_url: devData.linkedin_url,
          portfolio_url: devData.portfolio_url
        })
      }

      console.log('📊 Métadonnées utilisateur:', userMetadata)

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: basicData.email,
        password: basicData.password,
        options: {
          data: userMetadata
        }
      })

      console.log('📊 REPONSE SUPABASE:')
      console.log('✅ Data:', authData)
      console.log('❌ Error:', authError)

      if (authError) {
        console.log('🚨 ERREUR DETAILS:', authError.message, authError.status)
        setError(authError.message)
        setLoading(false)
        return
      }

      if (!authData.user) {
        setError('Erreur lors de la création du compte')
        setLoading(false)
        return
      }

      console.log('✅ Utilisateur créé:', authData.user.id)

      // Upload photo si développeur
      let photoUrl = null
      if (userType === 'developer' && profilePhoto) {
        console.log('📸 Upload de la photo...')
        photoUrl = await uploadProfilePhoto(authData.user.id)
        
        if (photoUrl) {
          console.log('🔄 Mise à jour du profil avec la photo...')
          // Attendre un peu pour que le trigger ait créé le profil
          await new Promise(resolve => setTimeout(resolve, 1000))
          
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ profile_photo_url: photoUrl })
            .eq('id', authData.user.id)

          if (updateError) {
            console.error('❌ Erreur mise à jour photo:', updateError)
          } else {
            console.log('✅ Photo mise à jour dans le profil')
          }
        }
      }

      console.log('🎉 Compte créé avec succès!')
      
      // Message de succès différencié
      if (authData.user.email_confirmed_at) {
        alert('Compte créé avec succès ! Vous pouvez vous connecter.')
      } else {
        alert('Compte créé avec succès ! Vérifiez votre email pour confirmer votre compte avant de vous connecter.')
      }
      
      router.push('/auth/login')

    } catch (err) {
      console.error('❌ Erreur générale:', err)
      setError('Une erreur est survenue lors de la création du compte')
    } finally {
      setLoading(false)
    }
  }

  const toggleSkill = (skill: string) => {
    setDevData(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }))
  }

  const toggleSpecialization = (spec: string) => {
    setDevData(prev => ({
      ...prev,
      specializations: prev.specializations.includes(spec)
        ? prev.specializations.filter(s => s !== spec)
        : [...prev.specializations, spec]
    }))
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header - Fond Noir */}
      <div className="bg-black py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white mb-2">
              Rejoignez LinkerAI
            </h2>
            <p className="text-gray-300">
              {step === 1 ? 'Créez votre compte' : 'Complétez votre profil développeur'}
            </p>
            
            {userType === 'developer' && (
              <div className="mt-6 flex items-center justify-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${step >= 1 ? 'bg-white' : 'bg-gray-600'}`}></div>
                <div className={`w-3 h-3 rounded-full ${step >= 2 ? 'bg-white' : 'bg-gray-600'}`}></div>
                <span className="text-gray-300 text-sm ml-2">Étape {step}/2</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Contenu - Fond Blanc */}
      <div className="bg-white py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-gray-50 rounded-lg p-8 border-2 border-gray-200">
            {step === 1 && (
              <form onSubmit={handleBasicSubmit} className="space-y-6">
                {/* Type d'utilisateur */}
                <div>
                  <label className="block text-sm font-medium text-black mb-3">
                    Je suis un :
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <label className={`cursor-pointer rounded-lg border-2 p-6 text-center transition-all hover:border-black ${
                      userType === 'client' 
                        ? 'border-black bg-white' 
                        : 'border-gray-300 bg-white'
                    }`}>
                      <input
                        type="radio"
                        value="client"
                        checked={userType === 'client'}
                        onChange={(e) => setUserType(e.target.value as 'client')}
                        className="sr-only"
                      />
                      <div className="text-3xl mb-3">👔</div>
                      <div className="font-bold text-black text-lg">Client</div>
                      <div className="text-sm text-gray-600 mt-1">J'ai des projets à réaliser</div>
                    </label>
                    
                    <label className={`cursor-pointer rounded-lg border-2 p-6 text-center transition-all hover:border-black ${
                      userType === 'developer' 
                        ? 'border-black bg-white' 
                        : 'border-gray-300 bg-white'
                    }`}>
                      <input
                        type="radio"
                        value="developer"
                        checked={userType === 'developer'}
                        onChange={(e) => setUserType(e.target.value as 'developer')}
                        className="sr-only"
                      />
                      <div className="text-3xl mb-3">💻</div>
                      <div className="font-bold text-black text-lg">Développeur</div>
                      <div className="text-sm text-gray-600 mt-1">Je propose mes services</div>
                    </label>
                  </div>
                </div>

                {/* Informations de base */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-black mb-2">
                      Nom complet <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="text"
                      value={basicData.fullName}
                      onChange={(e) => setBasicData(prev => ({...prev, fullName: e.target.value}))}
                      required
                      placeholder="John Doe"
                      className="bg-white border-2 border-gray-300 text-black placeholder-gray-400 focus:border-black"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-black mb-2">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="email"
                      value={basicData.email}
                      onChange={(e) => setBasicData(prev => ({...prev, email: e.target.value}))}
                      required
                      placeholder="john@example.com"
                      className="bg-white border-2 border-gray-300 text-black placeholder-gray-400 focus:border-black"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-black mb-2">
                      Numéro de téléphone <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="tel"
                      value={basicData.phone}
                      onChange={(e) => setBasicData(prev => ({...prev, phone: e.target.value}))}
                      required
                      placeholder="+33 6 12 34 56 78"
                      className="bg-white border-2 border-gray-300 text-black placeholder-gray-400 focus:border-black"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-black mb-2">
                      Mot de passe <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="password"
                      value={basicData.password}
                      onChange={(e) => setBasicData(prev => ({...prev, password: e.target.value}))}
                      required
                      placeholder="••••••••"
                      className="bg-white border-2 border-gray-300 text-black placeholder-gray-400 focus:border-black"
                    />
                    <p className="text-xs text-gray-500 mt-1">Minimum 6 caractères</p>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-100 border-2 border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-black text-white hover:bg-gray-800 border-2 border-black py-3 text-lg font-bold"
                >
                  {userType === 'developer' ? 'Continuer →' : (loading ? 'Création...' : 'Créer mon compte')}
                </Button>
              </form>
            )}

            {step === 2 && userType === 'developer' && (
              <div className="space-y-6">
                <div className="bg-black rounded-lg p-4 border-2 border-black">
                  <h3 className="font-bold text-white mb-2">Profil développeur</h3>
                  <p className="text-gray-300 text-sm">
                    Ces informations aideront les clients à vous trouver et à évaluer vos compétences.
                  </p>
                </div>

                {/* Photo de profil OBLIGATOIRE */}
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Photo de profil <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center space-x-4">
                    {photoPreview ? (
                      <div className="relative">
                        <img
                          src={photoPreview}
                          alt="Aperçu"
                          className="w-20 h-20 rounded-full object-cover border-2 border-gray-300"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setProfilePhoto(null)
                            setPhotoPreview(null)
                          }}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-gray-200 border-2 border-gray-300 flex items-center justify-center">
                        <span className="text-gray-400 text-2xl">📷</span>
                      </div>
                    )}
                    
                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={handlePhotoChange}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-2 file:border-black file:text-sm file:font-medium file:bg-white file:text-black hover:file:bg-gray-50"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        JPG, PNG ou WebP. Max 5MB.
                      </p>
                    </div>
                  </div>
                  {!profilePhoto && (
                    <p className="text-red-500 text-sm mt-2">
                      ⚠️ Une photo de profil est obligatoire pour créer un compte développeur
                    </p>
                  )}
                </div>

                {/* Titre professionnel */}
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Titre professionnel
                  </label>
                  <Input
                    type="text"
                    value={devData.title}
                    onChange={(e) => setDevData(prev => ({...prev, title: e.target.value}))}
                    placeholder="Ex: Développeur Full-Stack spécialisé IA"
                    className="bg-white border-2 border-gray-300 text-black placeholder-gray-400 focus:border-black"
                  />
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Description professionnelle
                  </label>
                  <textarea
                    value={devData.bio}
                    onChange={(e) => setDevData(prev => ({...prev, bio: e.target.value}))}
                    placeholder="Présentez votre expérience, vos spécialités et ce qui vous différencie..."
                    rows={3}
                    className="w-full bg-white border-2 border-gray-300 rounded-lg px-3 py-2 text-black placeholder-gray-400 focus:outline-none focus:border-black"
                  />
                </div>

                {/* Expérience et tarif */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-black mb-2">
                      Années d'expérience
                    </label>
                    <Input
                      type="number"
                      value={devData.experience_years}
                      onChange={(e) => setDevData(prev => ({...prev, experience_years: e.target.value}))}
                      placeholder="5"
                      className="bg-white border-2 border-gray-300 text-black placeholder-gray-400 focus:border-black"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-black mb-2">
                      Tarif horaire (€)
                    </label>
                    <Input
                      type="number"
                      value={devData.hourly_rate}
                      onChange={(e) => setDevData(prev => ({...prev, hourly_rate: e.target.value}))}
                      placeholder="50"
                      className="bg-white border-2 border-gray-300 text-black placeholder-gray-400 focus:border-black"
                    />
                  </div>
                </div>

                {/* Compétences techniques */}
                <div>
                  <label className="block text-sm font-medium text-black mb-3">
                    Compétences techniques
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto border-2 border-gray-300 rounded-lg p-4 bg-white">
                    {skillOptions.map((skill) => (
                      <label key={skill} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                        <input
                          type="checkbox"
                          checked={devData.skills.includes(skill)}
                          onChange={() => toggleSkill(skill)}
                          className="w-4 h-4 border-2 border-gray-300 rounded bg-white checked:bg-black checked:border-black focus:ring-black"
                        />
                        <span className="text-black text-sm">{skill}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Spécialisations IA/Automation */}
                <div>
                  <label className="block text-sm font-medium text-black mb-3">
                    Spécialisations IA & Automatisation
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-32 overflow-y-auto border-2 border-gray-300 rounded-lg p-4 bg-white">
                    {specializationOptions.map((spec) => (
                      <label key={spec} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                        <input
                          type="checkbox"
                          checked={devData.specializations.includes(spec)}
                          onChange={() => toggleSpecialization(spec)}
                          className="w-4 h-4 border-2 border-gray-300 rounded bg-white checked:bg-black checked:border-black focus:ring-black"
                        />
                        <span className="text-black text-sm">{spec}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Liens portfolio */}
                <div className="space-y-4">
                  <h4 className="text-black font-bold">Portfolio & Réseaux</h4>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <Input
                        type="url"
                        value={devData.github_url}
                        onChange={(e) => setDevData(prev => ({...prev, github_url: e.target.value}))}
                        placeholder="GitHub URL"
                        className="bg-white border-2 border-gray-300 text-black placeholder-gray-400 focus:border-black"
                      />
                    </div>
                    <div>
                      <Input
                        type="url"
                        value={devData.linkedin_url}
                        onChange={(e) => setDevData(prev => ({...prev, linkedin_url: e.target.value}))}
                        placeholder="LinkedIn URL"
                        className="bg-white border-2 border-gray-300 text-black placeholder-gray-400 focus:border-black"
                      />
                    </div>
                    <div>
                      <Input
                        type="url"
                        value={devData.portfolio_url}
                        onChange={(e) => setDevData(prev => ({...prev, portfolio_url: e.target.value}))}
                        placeholder="Portfolio URL"
                        className="bg-white border-2 border-gray-300 text-black placeholder-gray-400 focus:border-black"
                      />
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-100 border-2 border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error}
                  </div>
                )}

                <div className="flex space-x-4">
                  <Button
                    type="button"
                    onClick={() => setStep(1)}
                    className="bg-white border-2 border-black text-black hover:bg-black hover:text-white py-3 px-6"
                  >
                    ← Retour
                  </Button>
                  <Button
                    type="button"
                    onClick={handleFinalSubmit}
                    disabled={loading || !profilePhoto}
                    className="flex-1 bg-black text-white hover:bg-gray-800 border-2 border-black py-3 text-lg font-bold disabled:bg-gray-400 disabled:border-gray-400"
                  >
                    {loading ? 'Création...' : 'Créer mon profil développeur'}
                  </Button>
                </div>
              </div>
            )}

            <div className="mt-8 text-center">
              <p className="text-sm text-gray-600">
                Déjà un compte ?{' '}
                <Link href="/auth/login" className="font-bold text-black hover:underline">
                  Se connecter
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
