'use client'

import { useState, useEffect } from 'react'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import SuccessModal from '../../../components/ui/success-modal'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/contexts/LanguageContext'

const supabase = createClient()

export default function SignupPage() {
  const [step, setStep] = useState(1)
  const [userType, setUserType] = useState<'client' | 'developer'>('client')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  
  // 🎉 Success Modal State
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [successData, setSuccessData] = useState({
    title: '',
    message: '',
    emailConfirmed: false
  })
  
  const router = useRouter()
  const { t } = useLanguage()

  // 🔍 DEBUG - État pour afficher les informations de debug
  const [debugInfo, setDebugInfo] = useState({
    lastAction: '',
    timestamp: '',
    supabaseStatus: 'unknown',
    networkStatus: 'unknown',
    errorMessage: '',
    recommendation: '',
    errorType: '',
    errorStatus: '',
    errorCode: '',
    attempt: 0
  })

  // 🔍 DEBUG - Fonction pour mettre à jour les infos de debug
  const updateDebugInfo = (action: string, details?: any) => {
    setDebugInfo(prev => ({
      ...prev,
      lastAction: action,
      timestamp: new Date().toISOString(),
      ...(details || {})
    }))
    console.log('🔍 DEBUG UPDATE:', action, details)
  }

  // 🔍 DEBUG - Test de connectivité au montage du composant
  useEffect(() => {
    const testConnectivity = async () => {
      updateDebugInfo('Testing Supabase connectivity...')
      try {
        const { data, error } = await supabase.auth.getSession()
        updateDebugInfo('Supabase connectivity test', {
          supabaseStatus: error ? 'error' : 'ok',
          networkStatus: 'ok'
        })
      } catch (err) {
        updateDebugInfo('Supabase connectivity failed', {
          supabaseStatus: 'failed',
          networkStatus: 'failed'
        })
      }
    }
    testConnectivity()
  }, [])

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
    daily_rate: '',
    // 🆕 NOUVEAU: Option TJM à définir (correspond à la BDD)
    daily_rate_defined: true,
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
    updateDebugInfo('Starting signup process...')

    const attemptSignup = async (retryCount = 0) => {
      const maxRetries = 2
      
      // 🔍 DEBUG AMÉLIORÉ - Information système
      console.log('🔄 DEBUT INSCRIPTION - TIMESTAMP:', new Date().toISOString())
      console.log('🔄 Tentative:', retryCount + 1, '/', maxRetries + 1)
      console.log('🌐 User Agent:', navigator.userAgent)
      console.log('🌐 URL actuelle:', window.location.href)
      console.log('🌐 Origin:', window.location.origin)
      
      console.log('📝 Données:', { 
        email: basicData.email, 
        password: basicData.password.length + ' caractères', 
        fullName: basicData.fullName,
        userType 
      })

      // 🔍 DEBUG - Vérifier l'état de Supabase
      console.log('🔧 Configuration Supabase:')
      console.log('- URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
      console.log('- Anon Key disponible:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

      try {
        // Validation photo obligatoire pour développeurs
        if (userType === 'developer' && !profilePhoto) {
          updateDebugInfo('Validation failed: Missing profile photo')
          setError('Une photo de profil est obligatoire pour les développeurs')
          setLoading(false)
          return
        }

        updateDebugInfo(`Preparing Supabase request... (Attempt ${retryCount + 1})`)
        console.log('📤 Envoi requête Supabase...')

        // 🔍 DEBUG - Test de connectivité avant signup
        console.log('🔍 Test connectivité Supabase...')
        updateDebugInfo('Testing Supabase connectivity before signup...')
        try {
          const { data: testSession } = await supabase.auth.getSession()
          console.log('✅ Connectivité Supabase OK, session actuelle:', testSession)
          updateDebugInfo('Supabase connectivity OK', { supabaseStatus: 'ok' })
        } catch (connectError) {
          console.error('❌ Problème connectivité Supabase:', connectError)
          updateDebugInfo('Supabase connectivity failed', { supabaseStatus: 'failed', error: connectError.message })
        }

        // Préparer les métadonnées utilisateur
        const userMetadata = {
          full_name: basicData.fullName,
          phone: basicData.phone,
          user_type: userType
        }

        // Ajouter les données développeur si applicable
        if (userType === 'developer') {
          // 🆕 NOUVEAU: Gérer le TJM selon la checkbox (correspond à la BDD)
          const dailyRateValue = devData.daily_rate_defined ? (devData.daily_rate ? parseInt(devData.daily_rate) : null) : null
          
          Object.assign(userMetadata, {
            title: devData.title,
            bio: devData.bio,
            experience_years: devData.experience_years ? parseInt(devData.experience_years) : 0,
            daily_rate: dailyRateValue,
            daily_rate_defined: devData.daily_rate_defined, // 🆕 NOUVEAU
            skills: devData.skills,
            specializations: devData.specializations,
            github_url: devData.github_url,
            linkedin_url: devData.linkedin_url,
            portfolio_url: devData.portfolio_url
          })
        }

        console.log('📊 Métadonnées utilisateur complètes:', userMetadata)

        // 🔍 DEBUG - Préparer les options de signup avec debug
        const signUpOptions = {
          data: userMetadata,
          emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/auth/callback?type=signup`
        }
        console.log('📤 Options signup:', signUpOptions)

        // 🔍 DEBUG - Timestamp avant l'appel
        const startTime = Date.now()
        console.log('⏰ Début appel signUp:', new Date(startTime).toISOString())
        updateDebugInfo('Calling Supabase signUp API...', { startTime })

        let authData, authError

        try {
          // Tentative avec le client Supabase normal
          const result = await supabase.auth.signUp({
            email: basicData.email,
            password: basicData.password,
            options: signUpOptions
          })
          authData = result.data
          authError = result.error
        } catch (clientError) {
          console.log('❌ Erreur client Supabase, tentative API directe...', clientError)
          
          // 🔄 Fallback: Appel direct à l'API Supabase
          try {
            updateDebugInfo('Trying direct API call as fallback...')
            
            const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/signup`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
              },
              body: JSON.stringify({
                email: basicData.email,
                password: basicData.password,
                data: signUpOptions.data,
                gotrue_meta_security: {},
              })
            })

            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`)
            }

            const apiResult = await response.json()
            authData = apiResult
            authError = null
            console.log('✅ API directe réussie!', apiResult)
            updateDebugInfo('Direct API call successful')
            
          } catch (apiError) {
            console.error('❌ Erreur API directe aussi:', apiError)
            authError = clientError // Garder l'erreur client originale
          }
        }

        // 🔍 DEBUG - Timestamp après l'appel
        const endTime = Date.now()
        console.log('⏰ Fin appel signUp:', new Date(endTime).toISOString())
        console.log('⏱️ Durée appel:', (endTime - startTime), 'ms')
        updateDebugInfo('Supabase signUp API completed', { 
          duration: (endTime - startTime),
          hasError: !!authError,
          hasData: !!authData,
          attempt: retryCount + 1
        })

        console.log('📊 REPONSE SUPABASE COMPLETE:')
        console.log('✅ Data:', authData)
        console.log('❌ Error:', authError)

        // 🔍 DEBUG - Analyse détaillée de l'erreur
        if (authError) {
          console.log('🚨 ERREUR DETAILS COMPLETES:')
          console.log('- Message:', authError.message)
          console.log('- Status:', authError.status)
          console.log('- Code:', authError.code)
          console.log('- Stack:', authError.stack)
          console.log('- Objet complet:', JSON.stringify(authError, null, 2))
          
          updateDebugInfo('Supabase signup failed', {
            errorMessage: authError.message,
            errorStatus: authError.status,
            errorCode: authError.code,
            attempt: retryCount + 1
          })
          
          // 🔍 DEBUG - Spécial pour rate limit
          if (authError.message?.includes('rate limit') || authError.status === 429) {
            console.log('🚨 RATE LIMIT DETECTE!')
            console.log('- Type d\'erreur: Rate Limit Exceeded')
            console.log('- Statut HTTP:', authError.status)
            console.log('- Recommandation: Attendre ou configurer SMTP personnalisé')
            updateDebugInfo('Rate limit detected', { 
              errorType: 'RATE_LIMIT',
              status: authError.status,
              recommendation: 'Wait or configure custom SMTP',
              attempt: retryCount + 1
            })
            throw authError // Ne pas retry pour rate limit
          }

          // 🔍 DEBUG - Spécial pour 504/timeout avec retry
          if (authError.status === 504 || authError.message?.includes('timeout') || authError.name?.includes('AuthRetryableFetchError')) {
            console.log('🚨 TIMEOUT/504 DETECTE!')
            console.log('- Type d\'erreur: Server Timeout')
            console.log('- Cause probable: Problème infrastructure Supabase')
            
            if (retryCount < maxRetries) {
              console.log(`🔄 Tentative de retry (${retryCount + 1}/${maxRetries})...`)
              updateDebugInfo('Server timeout detected - retrying...', {
                errorType: 'TIMEOUT',
                status: authError.status,
                recommendation: `Retrying... (${retryCount + 1}/${maxRetries})`,
                attempt: retryCount + 1
              })
              
              // Attendre 2 secondes avant retry
              await new Promise(resolve => setTimeout(resolve, 2000))
              return attemptSignup(retryCount + 1)
            } else {
              console.log('❌ Tous les retries épuisés')
              updateDebugInfo('All retries exhausted', {
                errorType: 'TIMEOUT',
                status: authError.status,
                recommendation: 'Configure custom SMTP or try again later',
                attempt: retryCount + 1
              })
            }
          }

          throw authError
        }

        if (!authData.user) {
          console.log('❌ Aucun utilisateur retourné par Supabase')
          updateDebugInfo('No user returned by Supabase')
          throw new Error('Erreur lors de la création du compte')
        }

        console.log('✅ Utilisateur créé avec succès!')
        console.log('- ID:', authData.user.id)
        console.log('- Email:', authData.user.email)
        console.log('- Email confirmé:', authData.user.email_confirmed_at)
        console.log('- Métadonnées:', authData.user.user_metadata)
        
        updateDebugInfo('User created successfully', {
          userId: authData.user.id,
          emailConfirmed: !!authData.user.email_confirmed_at,
          attempt: retryCount + 1
        })

        // Upload photo si développeur
        let photoUrl = null
        if (userType === 'developer' && profilePhoto) {
          console.log('📸 Upload de la photo...')
          updateDebugInfo('Uploading profile photo...')
          photoUrl = await uploadProfilePhoto(authData.user.id)
          
          if (photoUrl) {
            console.log('🔄 Mise à jour du profil avec la photo...')
            updateDebugInfo('Updating profile with photo...')
            // Attendre un peu pour que le trigger ait créé le profil
            await new Promise(resolve => setTimeout(resolve, 1000))
            
            const { error: updateError } = await supabase
              .from('profiles')
              .update({ profile_photo_url: photoUrl })
              .eq('id', authData.user.id)

            if (updateError) {
              console.error('❌ Erreur mise à jour photo:', updateError)
              updateDebugInfo('Photo update failed', { error: updateError.message })
            } else {
              console.log('✅ Photo mise à jour dans le profil')
              updateDebugInfo('Photo updated successfully')
            }
          }
        }

        console.log('🎉 Processus complet de création de compte terminé!')
        updateDebugInfo('Account creation process completed successfully')
        
        // 🎉 Afficher le modal de succès personnalisé au lieu de l'alert
        const isEmailConfirmed = !!authData.user.email_confirmed_at
        setSuccessData({
          title: 'Compte créé avec succès !',
          message: isEmailConfirmed 
            ? 'Votre compte a été créé et votre email est déjà confirmé. Vous pouvez maintenant vous connecter.'
            : 'Votre compte a été créé avec succès ! Un email de confirmation a été envoyé à votre adresse.',
          emailConfirmed: isEmailConfirmed
        })
        setShowSuccessModal(true)
        
        // Note: La redirection se fera via les boutons du modal

      } catch (err) {
        console.error('❌ ERREUR GENERALE COMPLETE:')
        console.error('- Message:', err.message)
        console.error('- Stack:', err.stack)
        console.error('- Objet complet:', err)
        console.error('- Type:', typeof err)
        console.error('- Constructor:', err.constructor?.name)
        
        updateDebugInfo('General error occurred', {
          errorMessage: err.message,
          errorType: typeof err,
          errorConstructor: err.constructor?.name,
          attempt: retryCount + 1
        })
        
        throw err
      }
    }

    try {
      await attemptSignup()
    } catch (err) {
      setError('Une erreur est survenue lors de la création du compte: ' + err.message)
    } finally {
      setLoading(false)
      console.log('🔄 FIN PROCESSUS INSCRIPTION - TIMESTAMP:', new Date().toISOString())
      updateDebugInfo('Signup process finished')
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

  // 🆕 NOUVEAU: Fonction pour gérer la checkbox TJM à définir
  const handleDailyRateDefinedChange = (checked: boolean) => {
    setDevData(prev => ({
      ...prev,
      daily_rate_defined: checked,
      daily_rate: checked ? prev.daily_rate : '' // Vider le champ si non défini
    }))
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header - Fond Noir */}
      <div className="bg-black py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white mb-2">
              {t('signup.title')}
            </h2>
            <p className="text-gray-300">
              {step === 1 ? t('signup.create.account') : t('signup.complete.profile')}
            </p>
            
            {userType === 'developer' && (
              <div className="mt-6 flex items-center justify-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${step >= 1 ? 'bg-white' : 'bg-gray-600'}`}></div>
                <div className={`w-3 h-3 rounded-full ${step >= 2 ? 'bg-white' : 'bg-gray-600'}`}></div>
                <span className="text-gray-300 text-sm ml-2">{t('signup.step')} {step}/2</span>
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
                    {t('signup.user.type')}
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
                      <div className="font-bold text-black text-lg">{t('signup.client.title')}</div>
                      <div className="text-sm text-gray-600 mt-1">{t('signup.client.description')}</div>
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
                      <div className="font-bold text-black text-lg">{t('signup.developer.title')}</div>
                      <div className="text-sm text-gray-600 mt-1">{t('signup.developer.description')}</div>
                    </label>
                  </div>
                </div>

                {/* Informations de base */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-black mb-2">
                      {t('signup.full.name')} <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="text"
                      value={basicData.fullName}
                      onChange={(e) => setBasicData(prev => ({...prev, fullName: e.target.value}))}
                      required
                      placeholder={t('signup.full.name.placeholder')}
                      className="bg-white border-2 border-gray-300 text-black placeholder-gray-400 focus:border-black"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-black mb-2">
                      {t('signup.email')} <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="email"
                      value={basicData.email}
                      onChange={(e) => setBasicData(prev => ({...prev, email: e.target.value}))}
                      required
                      placeholder={t('signup.email.placeholder')}
                      className="bg-white border-2 border-gray-300 text-black placeholder-gray-400 focus:border-black"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-black mb-2">
                      {t('signup.phone')} <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="tel"
                      value={basicData.phone}
                      onChange={(e) => setBasicData(prev => ({...prev, phone: e.target.value}))}
                      required
                      placeholder={t('signup.phone.placeholder')}
                      className="bg-white border-2 border-gray-300 text-black placeholder-gray-400 focus:border-black"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-black mb-2">
                      {t('signup.password')} <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="password"
                      value={basicData.password}
                      onChange={(e) => setBasicData(prev => ({...prev, password: e.target.value}))}
                      required
                      placeholder={t('signup.password.placeholder')}
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
                  {userType === 'developer' ? t('signup.continue') : (loading ? t('signup.creating') : t('signup.create.account.button'))}
                </Button>
              </form>
            )}

            {step === 2 && userType === 'developer' && (
              <div className="space-y-6">
                <div className="bg-black rounded-lg p-4 border-2 border-black">
                  <h3 className="font-bold text-white mb-2">{t('signup.developer.profile')}</h3>
                  <p className="text-gray-300 text-sm">
                    Ces informations aideront les clients à vous trouver et à évaluer vos compétences.
                  </p>
                </div>

                {/* Photo de profil */}
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    {t('signup.profile.photo')} <span className="text-red-500">*</span>
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
                      {t('signup.photo.required')}
                    </p>
                  )}
                </div>

                {/* Titre professionnel */}
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    {t('signup.professional.title')}
                  </label>
                  <Input
                    type="text"
                    value={devData.title}
                    onChange={(e) => setDevData(prev => ({...prev, title: e.target.value}))}
                    placeholder={t('signup.professional.title.placeholder')}
                    className="bg-white border-2 border-gray-300 text-black placeholder-gray-400 focus:border-black"
                  />
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    {t('signup.bio')}
                  </label>
                  <textarea
                    value={devData.bio}
                    onChange={(e) => setDevData(prev => ({...prev, bio: e.target.value}))}
                    placeholder={t('signup.bio.placeholder')}
                    rows={3}
                    className="w-full bg-white border-2 border-gray-300 rounded-lg px-3 py-2 text-black placeholder-gray-400 focus:outline-none focus:border-black"
                  />
                </div>

                {/* Expérience et tarif */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-black mb-2">
                      {t('signup.years.experience')}
                    </label>
                    <Input
                      type="number"
                      value={devData.experience_years}
                      onChange={(e) => setDevData(prev => ({...prev, experience_years: e.target.value}))}
                      placeholder={t('signup.years.experience.placeholder')}
                      className="bg-white border-2 border-gray-300 text-black placeholder-gray-400 focus:border-black"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-black mb-2">
                      {t('signup.daily.rate')}
                    </label>
                    
                    {/* Checkbox TJM à définir */}
                    <div className="mb-3">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!devData.daily_rate_defined}
                          onChange={(e) => handleDailyRateDefinedChange(!e.target.checked)}
                          className="w-4 h-4 border-2 border-gray-300 rounded bg-white checked:bg-black checked:border-black focus:ring-black"
                        />
                        <span className="text-sm font-medium text-black">{t('signup.rate.to.define')}</span>
                      </label>
                    </div>
                    
                    {/* Champ tarif */}
                    <Input
                      type="number"
                      value={devData.daily_rate}
                      onChange={(e) => setDevData(prev => ({...prev, daily_rate: e.target.value}))}
                      placeholder={t('signup.daily.rate.placeholder')}
                      disabled={!devData.daily_rate_defined}
                      className={`bg-white border-2 border-gray-300 text-black placeholder-gray-400 focus:border-black ${
                        !devData.daily_rate_defined ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    />
                  </div>
                </div>

                {/* Compétences */}
                <div>
                  <label className="block text-sm font-medium text-black mb-3">
                    {t('signup.skills')}
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
                    {t('signup.specializations')}
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
                        placeholder={t('signup.github.placeholder')}
                        className="bg-white border-2 border-gray-300 text-black placeholder-gray-400 focus:border-black"
                      />
                    </div>
                    <div>
                      <Input
                        type="url"
                        value={devData.linkedin_url}
                        onChange={(e) => setDevData(prev => ({...prev, linkedin_url: e.target.value}))}
                        placeholder={t('signup.linkedin.placeholder')}
                        className="bg-white border-2 border-gray-300 text-black placeholder-gray-400 focus:border-black"
                      />
                    </div>
                    <div>
                      <Input
                        type="url"
                        value={devData.portfolio_url}
                        onChange={(e) => setDevData(prev => ({...prev, portfolio_url: e.target.value}))}
                        placeholder={t('signup.portfolio.placeholder')}
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
                    {loading ? t('signup.creating') : t('signup.create.developer.profile')}
                  </Button>
                </div>
              </div>
            )}

            <div className="mt-8 text-center">
              <p className="text-sm text-gray-600">
                {t('signup.already.have.account')}{' '}
                <Link href="/auth/login" className="font-bold text-black hover:underline">
                  {t('signup.login.here')}
                </Link>
              </p>
            </div>

            {/* 🔍 DEBUG Panel - Temporarily enabled for production debugging */}
            {(process.env.NODE_ENV === 'development') && (
              <div className="mt-8 p-4 bg-gray-100 rounded-lg border-2 border-gray-300">
                <h3 className="text-sm font-bold text-gray-800 mb-2">🔍 Debug Info</h3>
                <div className="text-xs text-gray-600 space-y-1">
                  <div><strong>Dernière action:</strong> {debugInfo.lastAction}</div>
                  <div><strong>Timestamp:</strong> {debugInfo.timestamp}</div>
                  <div><strong>Statut Supabase:</strong> 
                    <span className={`ml-1 px-2 py-1 rounded ${
                      debugInfo.supabaseStatus === 'ok' ? 'bg-green-200 text-green-800' :
                      debugInfo.supabaseStatus === 'failed' ? 'bg-red-200 text-red-800' :
                      'bg-yellow-200 text-yellow-800'
                    }`}>
                      {debugInfo.supabaseStatus}
                    </span>
                  </div>
                  <div><strong>Réseau:</strong> 
                    <span className={`ml-1 px-2 py-1 rounded ${
                      debugInfo.networkStatus === 'ok' ? 'bg-green-200 text-green-800' :
                      debugInfo.networkStatus === 'failed' ? 'bg-red-200 text-red-800' :
                      'bg-yellow-200 text-yellow-800'
                    }`}>
                      {debugInfo.networkStatus}
                    </span>
                  </div>
                  {debugInfo.errorMessage && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                      <strong>Erreur:</strong> {debugInfo.errorMessage}
                    </div>
                  )}
                  {debugInfo.recommendation && (
                    <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
                      <strong>Recommandation:</strong> {debugInfo.recommendation}
                    </div>
                  )}
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  Ouvrez la console (F12) pour plus de détails
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* 🎉 Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title={successData.title}
        message={successData.message}
        emailConfirmed={successData.emailConfirmed}
      />
    </div>
  )
}
