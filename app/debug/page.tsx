'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function DebugPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState<any>(null);
  const supabase = createClientComponentClient();

  const addLog = (message: string) => {
    console.log(message);
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  useEffect(() => {
    testAuth();
  }, []);

  const testAuth = async () => {
    addLog('=== DEBUT TEST AUTH ===');
    
    try {
      addLog('1. Variables d\'environnement...');
      addLog(`SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Définie' : 'Non définie'}`);
      addLog(`SUPABASE_ANON_KEY: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Définie' : 'Non définie'}`);
      
      addLog('2. Tentative getUser...');
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        addLog(`3. Erreur getUser: ${userError.message}`);
        setError(userError);
        return;
      }
      
      if (user) {
        addLog(`4. Utilisateur trouvé: ${user.email} (ID: ${user.id})`);
        setUser(user);
        
        addLog('5. Test requête profiles...');
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (profileError) {
          addLog(`6. Erreur profiles: ${profileError.message}`);
        } else {
          addLog(`6. Profil trouvé: ${JSON.stringify(profile)}`);
        }
      } else {
        addLog('4. Aucun utilisateur trouvé');
      }
      
      addLog('=== FIN TEST ===');
      
    } catch (err: any) {
      addLog(`EXCEPTION: ${err.message}`);
      setError(err);
    }
  };

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Debug Authentification</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* État utilisateur */}
          <div className="bg-gray-100 p-4 rounded">
            <h2 className="text-xl font-bold mb-4">État utilisateur</h2>
            {user ? (
              <div className="space-y-2">
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>ID:</strong> {user.id}</p>
                <p><strong>Créé le:</strong> {new Date(user.created_at).toLocaleString()}</p>
              </div>
            ) : (
              <p className="text-red-500">Aucun utilisateur connecté</p>
            )}
            
            {error && (
              <div className="mt-4 p-3 bg-red-100 text-red-700 rounded">
                <strong>Erreur:</strong> {error.message}
              </div>
            )}
          </div>
          
          {/* Logs */}
          <div className="bg-gray-100 p-4 rounded">
            <h2 className="text-xl font-bold mb-4">Logs</h2>
            <div className="space-y-1 text-sm font-mono max-h-96 overflow-y-auto">
              {logs.map((log, index) => (
                <div key={index} className="border-b border-gray-300 pb-1">
                  {log}
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="mt-6 space-x-4">
          <button 
            onClick={testAuth}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Retester l'auth
          </button>
          
          <button 
            onClick={() => window.location.href = '/auth/login'}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            Aller à la page de login
          </button>
          
          <button 
            onClick={() => window.location.href = '/projects'}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Aller aux projets
          </button>
        </div>
      </div>
    </div>
  );
}
