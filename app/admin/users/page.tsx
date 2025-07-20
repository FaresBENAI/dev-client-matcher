'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      
      // Récupérer tous les utilisateurs avec leurs profils
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        setError('Erreur lors du chargement des utilisateurs: ' + error.message);
        return;
      }

      setUsers(profiles || []);
    } catch (err) {
      setError('Erreur inattendue: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateUserType = async (userId, newType) => {
    try {
      setUpdating(true);
      console.log(`🔄 Mise à jour utilisateur ${userId} vers type ${newType}`);
      
      const { error } = await supabase
        .from('profiles')
        .update({ 
          user_type: newType,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        alert('Erreur: ' + error.message);
        return;
      }

      alert(`✅ Utilisateur mis à jour vers ${newType}`);
      await loadUsers(); // Recharger la liste
    } catch (err) {
      alert('Erreur: ' + err.message);
    } finally {
      setUpdating(false);
    }
  };

  const createMissingProfile = async (email) => {
    try {
      setUpdating(true);
      
      // D'abord, essayer de trouver l'utilisateur dans auth.users via API
      alert('Création manuelle de profil - entrez les détails');
      const userId = prompt('ID utilisateur (depuis Supabase Auth):');
      const userType = prompt('Type d\'utilisateur (client/developer):', 'client');
      const fullName = prompt('Nom complet:', email.split('@')[0]);
      
      if (!userId || !userType) {
        alert('Informations manquantes');
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email: email,
          full_name: fullName,
          user_type: userType,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (error) {
        alert('Erreur création: ' + error.message);
        return;
      }

      alert('✅ Profil créé avec succès');
      await loadUsers();
    } catch (err) {
      alert('Erreur: ' + err.message);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Chargement des utilisateurs...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Gestion des Utilisateurs
          </h1>
          
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Bouton pour créer un profil manquant */}
          <div className="mb-6">
            <button
              onClick={() => createMissingProfile('Linkeria@outlook.com')}
              disabled={updating}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {updating ? 'Traitement...' : 'Créer Profil Linkeria@outlook.com'}
            </button>
          </div>

          {/* Liste des utilisateurs */}
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">ID</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Email</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Nom</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Type</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Créé</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900 font-mono">
                      {user.id.substring(0, 8)}...
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {user.email}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {user.full_name || 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.user_type === 'client' 
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {user.user_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-4 py-3 text-sm space-x-2">
                      <button
                        onClick={() => updateUserType(user.id, user.user_type === 'client' ? 'developer' : 'client')}
                        disabled={updating}
                        className="bg-yellow-600 text-white px-3 py-1 rounded text-xs hover:bg-yellow-700 disabled:opacity-50"
                      >
                        ↔️ Changer type
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {users.length === 0 && !error && (
            <div className="text-center py-8 text-gray-500">
              Aucun utilisateur trouvé
            </div>
          )}

          {/* Instructions */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2">Instructions:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Cliquez sur "Changer type" pour basculer entre client/developer</li>
              <li>• Utilisez "Créer Profil Linkeria@outlook.com" si ce compte n'apparaît pas</li>
              <li>• Vérifiez que Linkeria@outlook.com est bien de type "client" pour pouvoir noter</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 