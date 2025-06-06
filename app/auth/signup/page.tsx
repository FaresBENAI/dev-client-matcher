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
  const router = useRouter()

  // Données de base
  const [basicData, setBasicData] = useState({
    email: '',
    password: '',
    fullName: ''
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

  const handleBasicSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (userType === 'developer') {
      setStep(2) // Passer aux infos développeur
    } else {
      handleFinalSubmit() // Créer le compte client directement
    }
  }

  const handleFinalSubmit = async () => {
    setLoading(true)
    setError('')

    try {
      const { data, error } = await supabase.auth.signUp({
        email: basicData.email,
        password: basicData.password,
        options: {
          data: {
            full_name: basicData.fullName,
            user_type: userType,
            // Données développeur si applicable
            ...(userType === 'developer' && {
              title: devData.title,
              bio: devData.bio,
              experience_years: parseInt(devData.experience_years) || 0,
              hourly_rate: parseInt(devData.hourly_rate) || 0,
              skills: devData.skills,
              specializations: devData.specializations,
              github_url: devData.github_url,
              linkedin_url: devData.linkedin_url,
              portfolio_url: devData.portfolio_url
            })
          }
        }
      })

      if (error) {
        setError(error.message)
      } else {
        alert('Compte créé avec succès ! Bienvenue !')
        router.push('/auth/login')
      }
    } catch (err) {
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
    <div className="min-h-screen bg-slate-900 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-8 border border-slate-700/50">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white">
              🚀 Rejoignez Dev-Client Matcher
            </h2>
            <p className="mt-2 text-slate-300">
              {step === 1 ? 'Créez votre compte' : 'Complétez votre profil développeur'}
            </p>
            
            {userType === 'developer' && (
              <div className="mt-4 flex items-center justify-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${step >= 1 ? 'bg-cyan-500' : 'bg-slate-600'}`}></div>
                <div className={`w-3 h-3 rounded-full ${step >= 2 ? 'bg-cyan-500' : 'bg-slate-600'}`}></div>
                <span className="text-slate-400 text-sm ml-2">Étape {step}/2</span>
              </div>
            )}
          </div>

          {step === 1 && (
            <form onSubmit={handleBasicSubmit} className="space-y-6">
              {/* Type d'utilisateur */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  Je suis un :
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className={`cursor-pointer rounded-lg border-2 p-4 text-center transition-all ${
                    userType === 'client' 
                      ? 'border-cyan-500 bg-cyan-500/10' 
                      : 'border-slate-600 hover:border-slate-500'
                  }`}>
                    <input
                      type="radio"
                      value="client"
                      checked={userType === 'client'}
                      onChange={(e) => setUserType(e.target.value as 'client')}
                      className="sr-only"
                    />
                    <div className="text-2xl mb-2">👔</div>
                    <div className="font-medium text-white">Client</div>
                    <div className="text-sm text-slate-400">J'ai des projets à réaliser</div>
                  </label>
                  
                  <label className={`cursor-pointer rounded-lg border-2 p-4 text-center transition-all ${
                    userType === 'developer' 
                      ? 'border-purple-500 bg-purple-500/10' 
                      : 'border-slate-600 hover:border-slate-500'
                  }`}>
                    <input
                      type="radio"
                      value="developer"
                      checked={userType === 'developer'}
                      onChange={(e) => setUserType(e.target.value as 'developer')}
                      className="sr-only"
                    />
                    <div className="text-2xl mb-2">💻</div>
                    <div className="font-medium text-white">Développeur</div>
                    <div className="text-sm text-slate-400">Je propose mes services</div>
                  </label>
                </div>
              </div>

              {/* Informations de base */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Nom complet
                  </label>
                  <Input
                    type="text"
                    value={basicData.fullName}
                    onChange={(e) => setBasicData(prev => ({...prev, fullName: e.target.value}))}
                    required
                    placeholder="John Doe"
                    className="bg-slate-700/50 border-slate-600 text-white placeholder-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Email
                  </label>
                  <Input
                    type="email"
                    value={basicData.email}
                    onChange={(e) => setBasicData(prev => ({...prev, email: e.target.value}))}
                    required
                    placeholder="john@example.com"
                    className="bg-slate-700/50 border-slate-600 text-white placeholder-slate-400"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Mot de passe
                  </label>
                  <Input
                    type="password"
                    value={basicData.password}
                    onChange={(e) => setBasicData(prev => ({...prev, password: e.target.value}))}
                    required
                    placeholder="••••••••"
                    className="bg-slate-700/50 border-slate-600 text-white placeholder-slate-400"
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-500/20 border border-red-500/50 text-red-400 px-4 py-3 rounded-md">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
              >
                {userType === 'developer' ? 'Continuer →' : (loading ? 'Création...' : 'Créer mon compte')}
              </Button>
            </form>
          )}

          {step === 2 && userType === 'developer' && (
            <div className="space-y-6">
              <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                <h3 className="font-medium text-purple-400 mb-2">💼 Profil développeur</h3>
                <p className="text-slate-300 text-sm">
                  Ces informations aideront les clients à vous trouver et à évaluer vos compétences.
                </p>
              </div>

              {/* Titre professionnel */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Titre professionnel
                </label>
                <Input
                  type="text"
                  value={devData.title}
                  onChange={(e) => setDevData(prev => ({...prev, title: e.target.value}))}
                  placeholder="Ex: Développeur Full-Stack spécialisé IA"
                  className="bg-slate-700/50 border-slate-600 text-white placeholder-slate-400"
                />
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Description professionnelle
                </label>
                <textarea
                  value={devData.bio}
                  onChange={(e) => setDevData(prev => ({...prev, bio: e.target.value}))}
                  placeholder="Présentez votre expérience, vos spécialités et ce qui vous différencie..."
                  rows={3}
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-md px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Expérience et tarif */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Années d'expérience
                  </label>
                  <Input
                    type="number"
                    value={devData.experience_years}
                    onChange={(e) => setDevData(prev => ({...prev, experience_years: e.target.value}))}
                    placeholder="5"
                    className="bg-slate-700/50 border-slate-600 text-white placeholder-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Tarif horaire (€)
                  </label>
                  <Input
                    type="number"
                    value={devData.hourly_rate}
                    onChange={(e) => setDevData(prev => ({...prev, hourly_rate: e.target.value}))}
                    placeholder="50"
                    className="bg-slate-700/50 border-slate-600 text-white placeholder-slate-400"
                  />
                </div>
              </div>

              {/* Compétences techniques */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  Compétences techniques
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                  {skillOptions.map((skill) => (
                    <label key={skill} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={devData.skills.includes(skill)}
                        onChange={() => toggleSkill(skill)}
                        className="rounded border-slate-600 bg-slate-700 text-purple-500 focus:ring-purple-500"
                      />
                      <span className="text-slate-300 text-sm">{skill}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Spécialisations IA/Automation */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  Spécialisations IA & Automatisation
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-32 overflow-y-auto">
                  {specializationOptions.map((spec) => (
                    <label key={spec} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={devData.specializations.includes(spec)}
                        onChange={() => toggleSpecialization(spec)}
                        className="rounded border-slate-600 bg-slate-700 text-cyan-500 focus:ring-cyan-500"
                      />
                      <span className="text-slate-300 text-sm">{spec}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Liens portfolio */}
              <div className="space-y-4">
                <h4 className="text-slate-300 font-medium">Portfolio & Réseaux</h4>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <Input
                      type="url"
                      value={devData.github_url}
                      onChange={(e) => setDevData(prev => ({...prev, github_url: e.target.value}))}
                      placeholder="GitHub URL"
                      className="bg-slate-700/50 border-slate-600 text-white placeholder-slate-400"
                    />
                  </div>
                  <div>
                    <Input
                      type="url"
                      value={devData.linkedin_url}
                      onChange={(e) => setDevData(prev => ({...prev, linkedin_url: e.target.value}))}
                      placeholder="LinkedIn URL"
                      className="bg-slate-700/50 border-slate-600 text-white placeholder-slate-400"
                    />
                  </div>
                  <div>
                    <Input
                      type="url"
                      value={devData.portfolio_url}
                      onChange={(e) => setDevData(prev => ({...prev, portfolio_url: e.target.value}))}
                      placeholder="Portfolio URL"
                      className="bg-slate-700/50 border-slate-600 text-white placeholder-slate-400"
                    />
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-red-500/20 border border-red-500/50 text-red-400 px-4 py-3 rounded-md">
                  {error}
                </div>
              )}

              <div className="flex space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="border-slate-600 text-slate-300 hover:border-purple-400"
                >
                  ← Retour
                </Button>
                <Button
                  type="button"
                  onClick={handleFinalSubmit}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600"
                >
                  {loading ? 'Création...' : 'Créer mon profil développeur 🚀'}
                </Button>
              </div>
            </div>
          )}

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-400">
              Déjà un compte ?{' '}
              <Link href="/auth/login" className="font-medium text-cyan-400 hover:text-cyan-300">
                Se connecter
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
