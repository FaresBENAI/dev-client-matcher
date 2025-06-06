'use client'

import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { useRouter } from 'next/navigation'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function CreateProjectContent() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    project_type: 'automation',
    budget_min: '',
    budget_max: '',
    timeline: '',
    required_skills: [] as string[],
    complexity: 'medium'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const skillOptions = [
    'Python', 'JavaScript', 'Machine Learning', 'TensorFlow', 'PyTorch',
    'OpenAI API', 'Automation', 'RPA', 'Chatbots', 'Data Analysis',
    'Computer Vision', 'NLP', 'API Development', 'Web Scraping', 'Excel Automation'
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setError('Vous devez être connecté')
        return
      }

      const { data, error } = await supabase
        .from('projects')
        .insert([{
          client_id: user.id,
          title: formData.title,
          description: formData.description,
          project_type: formData.project_type,
          budget_min: formData.budget_min ? parseInt(formData.budget_min) : null,
          budget_max: formData.budget_max ? parseInt(formData.budget_max) : null,
          timeline: formData.timeline,
          required_skills: formData.required_skills,
          complexity: formData.complexity
        }])

      if (error) {
        setError(error.message)
      } else {
        router.push('/dashboard/client?success=project-created')
      }
    } catch (err) {
      setError('Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  const toggleSkill = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      required_skills: prev.required_skills.includes(skill)
        ? prev.required_skills.filter(s => s !== skill)
        : [...prev.required_skills, skill]
    }))
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-8 border border-slate-700/50">
          <h1 className="text-3xl font-bold text-white mb-6">✨ Créer un nouveau projet</h1>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Titre */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Titre du projet *
              </label>
              <Input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({...prev, title: e.target.value}))}
                placeholder="Ex: Automatisation de ma comptabilité"
                required
                className="bg-slate-700/50 border-slate-600 text-white placeholder-slate-400"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Description détaillée *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({...prev, description: e.target.value}))}
                placeholder="Décrivez votre projet, vos objectifs et vos contraintes..."
                required
                rows={4}
                className="w-full bg-slate-700/50 border border-slate-600 rounded-md px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            {/* Type de projet */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Type de projet *
              </label>
              <select
                value={formData.project_type}
                onChange={(e) => setFormData(prev => ({...prev, project_type: e.target.value}))}
                className="w-full bg-slate-700/50 border border-slate-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="automation">Automatisation</option>
                <option value="ai">Intelligence Artificielle</option>
                <option value="chatbot">Chatbot</option>
                <option value="data_analysis">Analyse de données</option>
                <option value="other">Autre</option>
              </select>
            </div>

            {/* Budget */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Budget minimum (€)
                </label>
                <Input
                  type="number"
                  value={formData.budget_min}
                  onChange={(e) => setFormData(prev => ({...prev, budget_min: e.target.value}))}
                  placeholder="1000"
                  className="bg-slate-700/50 border-slate-600 text-white placeholder-slate-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Budget maximum (€)
                </label>
                <Input
                  type="number"
                  value={formData.budget_max}
                  onChange={(e) => setFormData(prev => ({...prev, budget_max: e.target.value}))}
                  placeholder="5000"
                  className="bg-slate-700/50 border-slate-600 text-white placeholder-slate-400"
                />
              </div>
            </div>

            {/* Timeline */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Délai souhaité
              </label>
              <Input
                type="text"
                value={formData.timeline}
                onChange={(e) => setFormData(prev => ({...prev, timeline: e.target.value}))}
                placeholder="Ex: 2 semaines, 1 mois, 3 mois"
                className="bg-slate-700/50 border-slate-600 text-white placeholder-slate-400"
              />
            </div>

            {/* Compétences requises */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Compétences requises
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {skillOptions.map((skill) => (
                  <label key={skill} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.required_skills.includes(skill)}
                      onChange={() => toggleSkill(skill)}
                      className="rounded border-slate-600 bg-slate-700 text-cyan-500 focus:ring-cyan-500"
                    />
                    <span className="text-slate-300 text-sm">{skill}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Complexité */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Complexité du projet
              </label>
              <div className="flex space-x-4">
                {[
                  { value: 'simple', label: 'Simple', color: 'green' },
                  { value: 'medium', label: 'Moyen', color: 'yellow' },
                  { value: 'complex', label: 'Complexe', color: 'red' }
                ].map((option) => (
                  <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="complexity"
                      value={option.value}
                      checked={formData.complexity === option.value}
                      onChange={(e) => setFormData(prev => ({...prev, complexity: e.target.value}))}
                      className="text-cyan-500 focus:ring-cyan-500"
                    />
                    <span className="text-slate-300">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500/50 text-red-400 px-4 py-3 rounded-md">
                {error}
              </div>
            )}

            <div className="flex space-x-4">
              <Button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
              >
                {loading ? 'Création...' : 'Créer le projet'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/dashboard/client')}
                className="border-slate-600 text-slate-300 hover:border-cyan-400"
              >
                Annuler
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
