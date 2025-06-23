'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function TableStructurePage() {
  const [tableInfo, setTableInfo] = useState<any[]>([]);
  const [existingProjects, setExistingProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    analyzeTable();
  }, []);

  const analyzeTable = async () => {
    try {
      console.log('=== ANALYSE DE LA TABLE PROJECTS ===');
      
      // 1. Essayer de récupérer quelques projets existants pour voir la structure
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .limit(3);

      if (projects && projects.length > 0) {
        console.log('Projets existants:', projects);
        setExistingProjects(projects);
        
        // Analyser la structure à partir d'un projet existant
        const firstProject = projects[0];
        const columns = Object.keys(firstProject).map(key => ({
          column_name: key,
          data_type: typeof firstProject[key],
          sample_value: firstProject[key],
          is_null: firstProject[key] === null
        }));
        
        setTableInfo(columns);
      } else {
        console.log('Aucun projet existant, erreur:', projectsError);
        
        // Si pas de projets, essayer une insertion avec les champs minimaux
        const testData = { title: 'TEST_STRUCTURE' };
        const { error: insertError } = await supabase
          .from('projects')
          .insert([testData]);
        
        if (insertError) {
          console.log('Erreur test insertion:', insertError);
          setError(`Erreur test: ${insertError.message}`);
        }
      }
      
    } catch (err: any) {
      console.error('Erreur analyse:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const testInsertWithAllFields = async () => {
    try {
      const testData = {
        title: 'Projet Test Complet',
        description: 'Description test',
        status: 'active',
        client_id: 'test-client-id',
        project_type: 'web', // Nouveau champ trouvé !
        budget: 5000,
        location: 'Paris',
        required_skills: ['React', 'Node.js'],
        deadline: new Date().toISOString(),
        priority: 'medium',
        category: 'development'
      };

      console.log('Test insertion avec tous les champs:', testData);
      
      const { data, error } = await supabase
        .from('projects')
        .insert([testData]);

      if (error) {
        console.log('Erreur insertion test:', error);
        alert(`Erreur: ${error.message}`);
      } else {
        console.log('Insertion réussie:', data);
        alert('Test réussi ! Regardez la console pour les détails.');
        analyzeTable(); // Recharger
      }
    } catch (err: any) {
      console.error('Erreur test:', err);
      alert(`Erreur: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-black rounded-full animate-spin mx-auto mb-4"></div>
          <p>Analyse de la structure de la table...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Diagnostic Table Projects</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            <strong>Erreur:</strong> {error}
          </div>
        )}

        {/* Structure de la table */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Structure détectée :</h2>
          {tableInfo.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-4 py-2 border text-left">Nom de la colonne</th>
                    <th className="px-4 py-2 border text-left">Type détecté</th>
                    <th className="px-4 py-2 border text-left">Valeur exemple</th>
                    <th className="px-4 py-2 border text-left">Peut être null</th>
                  </tr>
                </thead>
                <tbody>
                  {tableInfo.map((col, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                      <td className="px-4 py-2 border font-mono font-bold">{col.column_name}</td>
                      <td className="px-4 py-2 border">{col.data_type}</td>
                      <td className="px-4 py-2 border">
                        <code className="bg-gray-100 px-2 py-1 rounded">
                          {JSON.stringify(col.sample_value)}
                        </code>
                      </td>
                      <td className="px-4 py-2 border">
                        <span className={col.is_null ? 'text-red-600' : 'text-green-600'}>
                          {col.is_null ? 'NULL' : 'NON NULL'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-600">Aucune structure détectée</p>
          )}
        </div>

        {/* Projets existants */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Projets existants ({existingProjects.length}) :</h2>
          {existingProjects.length > 0 ? (
            <div className="space-y-4">
              {existingProjects.map((project, index) => (
                <div key={index} className="bg-gray-100 p-4 rounded">
                  <h3 className="font-bold text-lg mb-2">Projet {index + 1}</h3>
                  <pre className="text-sm overflow-x-auto">
                    {JSON.stringify(project, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">Aucun projet existant trouvé</p>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-4">
          <button
            onClick={analyzeTable}
            className="bg-blue-500 text-white px-6 py-3 rounded font-bold hover:bg-blue-600"
          >
            Réanalyser la table
          </button>
          
          <button
            onClick={testInsertWithAllFields}
            className="bg-green-500 text-white px-6 py-3 rounded font-bold hover:bg-green-600 ml-4"
          >
            Test insertion avec tous les champs possibles
          </button>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          <h3 className="font-bold mb-2">Instructions :</h3>
          <ol className="list-decimal list-inside space-y-1">
            <li>Regardez la structure détectée ci-dessus</li>
            <li>Notez toutes les colonnes qui ont des valeurs NON NULL</li>
            <li>Cliquez sur "Test insertion" pour voir quels champs sont obligatoires</li>
            <li>Regardez la console du navigateur pour plus de détails</li>
            <li>Donnez-moi la liste complète des colonnes obligatoires</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
