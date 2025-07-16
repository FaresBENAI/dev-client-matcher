'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

const supabase = createClient()

export default function ProjectsDebugPage() {
 const [projects, setProjects] = useState<any[]>([])
 const [loading, setLoading] = useState(true)
 const [error, setError] = useState<any>(null)
 const [debugLogs, setDebugLogs] = useState<string[]>([])

 const addLog = (message: string) => {
   setDebugLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
 }

 useEffect(() => {
   fetchProjects()
 }, [])

 const fetchProjects = async () => {
   addLog('🔍 Début fetch projets...')
   addLog(`URL Supabase: ${process.env.NEXT_PUBLIC_SUPABASE_URL ? 'OK' : 'MANQUANTE'}`)
   addLog(`Clé Anon: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'OK' : 'MANQUANTE'}`)
   
   try {
     const { data, error } = await supabase
       .from('projects')
       .select(`
         id,
         title,
         description,
         project_type,
         budget_min,
         budget_max,
         timeline,
         required_skills,
         complexity,
         status,
         created_at,
         profiles (
           full_name
         )
       `)
       .eq('status', 'open')
       .order('created_at', { ascending: false })

     addLog(`✅ Data reçue: ${data ? data.length + ' projets' : 'null'}`)
     addLog(`❌ Erreur: ${error ? JSON.stringify(error) : 'aucune'}`)

     if (data) {
       setProjects(data)
       addLog(`📊 Projets chargés: ${data.length}`)
     }
     if (error) {
       setError(error)
       addLog(`💥 Erreur détaillée: ${error.message || 'Erreur inconnue'}`)
     }
   } catch (err: any) {
     addLog(`💥 Exception: ${err.message || err}`)
     setError(err)
   }
   
   setLoading(false)
   addLog('🏁 Fin du chargement')
 }

 return (
   <div className="min-h-screen bg-slate-900 p-8 text-white">
     <div className="max-w-6xl mx-auto">
       <h1 className="text-3xl mb-6 text-center">🔬 Debug Projets</h1>
       
       {/* État général */}
       <div className="grid md:grid-cols-3 gap-4 mb-8">
         <div className="bg-slate-800 p-4 rounded-lg border">
           <h3 className="font-bold text-cyan-400 mb-2">État</h3>
           <p>Loading: <span className={loading ? 'text-yellow-400' : 'text-green-400'}>{loading ? 'OUI' : 'NON'}</span></p>
           <p>Projets: <span className="text-white font-bold">{projects.length}</span></p>
           <p>Erreur: <span className={error ? 'text-red-400' : 'text-green-400'}>{error ? 'OUI' : 'NON'}</span></p>
         </div>

         <div className="bg-slate-800 p-4 rounded-lg border">
           <h3 className="font-bold text-purple-400 mb-2">Config</h3>
           <p>URL: <span className={process.env.NEXT_PUBLIC_SUPABASE_URL ? 'text-green-400' : 'text-red-400'}>
             {process.env.NEXT_PUBLIC_SUPABASE_URL ? 'CONFIGURÉE' : 'MANQUANTE'}
           </span></p>
           <p>Clé: <span className={process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'text-green-400' : 'text-red-400'}>
             {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'CONFIGURÉE' : 'MANQUANTE'}
           </span></p>
         </div>

         <div className="bg-slate-800 p-4 rounded-lg border">
           <h3 className="font-bold text-orange-400 mb-2">Actions</h3>
           <button 
             onClick={() => {
               setDebugLogs([])
               setError(null)
               setProjects([])
               setLoading(true)
               fetchProjects()
             }}
             className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded w-full"
           >
             🔄 Recharger
           </button>
         </div>
       </div>

       {/* Logs en temps réel */}
       <div className="mb-8">
         <h2 className="text-xl mb-4 text-yellow-400">📝 Logs de debug</h2>
         <div className="bg-black p-4 rounded-lg h-48 overflow-y-auto font-mono text-sm">
           {debugLogs.map((log, index) => (
             <div key={index} className="mb-1 text-green-400">{log}</div>
           ))}
           {debugLogs.length === 0 && (
             <div className="text-slate-500">Aucun log encore...</div>
           )}
         </div>
       </div>

       {/* Erreur détaillée */}
       {error && (
         <div className="mb-8 p-6 bg-red-900/30 border border-red-500 rounded-lg">
           <h2 className="text-xl mb-4 text-red-400">❌ Erreur détaillée</h2>
           <div className="bg-black p-4 rounded font-mono text-sm">
             <pre className="text-red-300 whitespace-pre-wrap">{JSON.stringify(error, null, 2)}</pre>
           </div>
         </div>
       )}

       {/* Projets trouvés */}
       <div>
         <h2 className="text-xl mb-4 text-green-400">📋 Projets trouvés ({projects.length})</h2>
         {projects.length === 0 ? (
           <div className="bg-slate-800 p-6 rounded-lg text-center text-slate-400">
             {loading ? 'Chargement en cours...' : 'Aucun projet trouvé'}
           </div>
         ) : (
           <div className="grid gap-4">
             {projects.map((project, index) => (
               <div key={project.id} className="bg-slate-800 p-4 rounded-lg border border-slate-600">
                 <div className="flex justify-between items-start mb-2">
                   <h3 className="font-bold text-white text-lg">{project.title || 'Titre manquant'}</h3>
                   <span className="text-sm text-slate-400">#{index + 1}</span>
                 </div>
                 
                 <div className="grid md:grid-cols-2 gap-4 text-sm">
                   <div>
                     <p><span className="text-slate-400">ID:</span> <span className="text-cyan-400">{project.id}</span></p>
                     <p><span className="text-slate-400">Status:</span> <span className="text-green-400">{project.status}</span></p>
                     <p><span className="text-slate-400">Type:</span> <span className="text-purple-400">{project.project_type}</span></p>
                     <p><span className="text-slate-400">Complexité:</span> <span className="text-yellow-400">{project.complexity}</span></p>
                   </div>
                   <div>
                     <p><span className="text-slate-400">Client:</span> <span className="text-orange-400">
                       {project.profiles?.full_name || 'Non trouvé'}
                     </span></p>
                     <p><span className="text-slate-400">Budget:</span> <span className="text-green-400">
                       {project.budget_min && project.budget_max ? 
                         `${project.budget_min}€ - ${project.budget_max}€` : 
                         'Non défini'}
                     </span></p>
                     <p><span className="text-slate-400">Délai:</span> <span className="text-blue-400">{project.timeline || 'Non défini'}</span></p>
                   </div>
                 </div>
                 
                 {project.description && (
                   <p className="mt-2 text-slate-300 text-sm bg-slate-700 p-2 rounded">
                     {project.description.substring(0, 200)}...
                   </p>
                 )}
                 
                 {project.required_skills && project.required_skills.length > 0 && (
                   <div className="mt-2">
                     <span className="text-slate-400 text-sm">Compétences: </span>
                     {project.required_skills.map((skill: string, i: number) => (
                       <span key={i} className="inline-block bg-purple-500/20 text-purple-400 px-2 py-1 rounded text-xs mr-1 mb-1">
                         {skill}
                       </span>
                     ))}
                   </div>
                 )}
               </div>
             ))}
           </div>
         )}
       </div>
     </div>
   </div>
 )
}
