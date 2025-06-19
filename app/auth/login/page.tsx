'use client'

import { useState } from 'react'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { supabase } from '../../../lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message)
      } else {
        alert('Connexion réussie !')
        // On redirigera vers le dashboard plus tard
        router.push('/')
      }
    } catch (err) {
      setError('Une erreur est survenue lors de la connexion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header Section - FOND NOIR */}
      <div className="bg-black py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="text-center">
            <h2 className="text-3xl font-black text-white mb-2">
              CONNEXION
            </h2>
            <p className="text-gray-300 font-medium">
              Accédez à votre espace LinkerAI
            </p>
          </div>
        </div>
      </div>

      {/* Main Content - FOND BLANC */}
      <div className="bg-white py-12 px-4">
        <div className="max-w-md mx-auto">
          <div className="bg-gray-50 rounded-2xl p-8 border-2 border-gray-200">
            
            {/* Logo/Branding */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl text-white font-black">L</span>
              </div>
              <h3 className="text-xl font-black text-black mb-2">
                LinkerAI
              </h3>
              <p className="text-gray-600 font-medium">
                Connectez-vous à votre compte
              </p>
            </div>
            
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-bold text-black mb-2">
                  Adresse email <span className="text-red-500">*</span>
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="votre@email.com"
                  className="bg-white border-2 border-gray-300 text-black placeholder-gray-400 focus:border-black font-medium"
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-black mb-2">
                  Mot de passe <span className="text-red-500">*</span>
                </label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="bg-white border-2 border-gray-300 text-black placeholder-gray-400 focus:border-black font-medium"
                />
              </div>

              {error && (
                <div className="bg-white border-2 border-red-300 text-red-700 px-4 py-3 rounded-lg">
                  <div className="flex items-center">
                    <span className="text-red-500 mr-2 font-bold">⚠️</span>
                    <span className="font-medium">{error}</span>
                  </div>
                </div>
              )}

              <Button 
                type="submit" 
                disabled={loading} 
                className="w-full bg-black text-white hover:bg-gray-800 border-2 border-black py-3 text-lg font-black rounded-xl transform hover:scale-105 transition-all duration-300 disabled:bg-gray-400 disabled:border-gray-400 disabled:transform-none"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Connexion...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    Se connecter
                    <span className="ml-2">→</span>
                  </span>
                )}
              </Button>

              <div className="text-center pt-4">
                <p className="text-gray-600 font-medium">
                  Pas encore de compte ?{' '}
                  <Link 
                    href="/auth/signup" 
                    className="font-black text-black hover:text-gray-700 underline decoration-2 underline-offset-2 hover:decoration-black transition-all"
                  >
                    Créer un compte
                  </Link>
                </p>
              </div>

              {/* Lien mot de passe oublié */}
              <div className="text-center">
                <Link 
                  href="/auth/forgot-password" 
                  className="text-gray-500 font-medium hover:text-black transition-colors text-sm"
                >
                  Mot de passe oublié ?
                </Link>
              </div>
            </form>
          </div>

          {/* Section retour accueil */}
          <div className="text-center mt-8">
            <Link href="/">
              <Button className="border-2 border-black text-black hover:bg-black hover:text-white font-black px-6 py-2 rounded-lg bg-transparent transform hover:scale-105 transition-all duration-300">
                ← Retour à l'accueil
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
