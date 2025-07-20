'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function DebugRatingsPage() {
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wahib, setWahib] = useState(null);
  const [linkeria, setLinkeria] = useState(null);

  useEffect(() => {
    loadDebugData();
  }, []);

  const loadDebugData = async () => {
    try {
      setLoading(true);
      
      // 1. Récupérer tous les ratings
      const { data: ratingsData, error: ratingsError } = await supabase
        .from('ratings')
        .select('*')
        .order('created_at', { ascending: false });

      if (ratingsError) {
        console.error('Erreur ratings:', ratingsError);
      } else {
        setRatings(ratingsData || []);
      }

      // 2. Rechercher Wahib Bougaiz
      const { data: wahibProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', 'wahib.bougaiz@efrei.net')
        .single();

      if (wahibProfile) {
        const { data: wahibDev } = await supabase
          .from('developer_profiles')
          .select('*')
          .eq('id', wahibProfile.id)
          .single();
        
        setWahib({ ...wahibProfile, dev_profile: wahibDev });
      }

      // 3. Rechercher Linkeria
      const { data: linkeriaProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', 'linkerai@outlook.com')
        .single();

      setLinkeria(linkeriaProfile);

    } catch (error) {
      console.error('Erreur debug:', error);
    } finally {
      setLoading(false);
    }
  };

  const recalculateRatings = async (developerId) => {
    try {
      console.log('🔄 Recalcul pour:', developerId);

      // Récupérer toutes les notes du développeur
      const { data: devRatings } = await supabase
        .from('ratings')
        .select('rating')
        .eq('developer_id', developerId);

      if (!devRatings || devRatings.length === 0) {
        console.log('Aucune note trouvée');
        return;
      }

      const totalRatings = devRatings.length;
      const averageRating = devRatings.reduce((sum, r) => sum + r.rating, 0) / totalRatings;

      // Mettre à jour le profil développeur
      const { error } = await supabase
        .from('developer_profiles')
        .update({
          average_rating: Math.round(averageRating * 10) / 10,
          total_ratings: totalRatings,
          updated_at: new Date().toISOString()
        })
        .eq('id', developerId);

      if (error) {
        console.error('Erreur mise à jour:', error);
        alert('Erreur: ' + error.message);
      } else {
        alert(`✅ Statistiques mises à jour: ${totalRatings} notes, moyenne ${averageRating.toFixed(1)}`);
        loadDebugData(); // Recharger
      }

    } catch (error) {
      console.error('Erreur recalcul:', error);
      alert('Erreur: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Chargement des données de debug...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 space-y-8">
        
        {/* Profils utilisateurs */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Debug Système de Notation
          </h1>
          
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* Wahib */}
            <div className="border rounded-lg p-4">
              <h3 className="font-bold text-lg mb-2">👨‍💻 Wahib Bougaiz (Développeur)</h3>
              {wahib ? (
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">ID:</span> {wahib.id}</p>
                  <p><span className="font-medium">Email:</span> {wahib.email}</p>
                  <p><span className="font-medium">Type:</span> {wahib.user_type}</p>
                  {wahib.dev_profile && (
                    <>
                      <p><span className="font-medium">Moyenne:</span> {wahib.dev_profile.average_rating || 0}</p>
                      <p><span className="font-medium">Total notes:</span> {wahib.dev_profile.total_ratings || 0}</p>
                      <button
                        onClick={() => recalculateRatings(wahib.id)}
                        className="mt-2 bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700"
                      >
                        🔄 Recalculer stats
                      </button>
                    </>
                  )}
                </div>
              ) : (
                <p className="text-red-500">❌ Profil non trouvé</p>
              )}
            </div>

            {/* Linkeria */}
            <div className="border rounded-lg p-4">
              <h3 className="font-bold text-lg mb-2">👤 Linkeria (Client)</h3>
              {linkeria ? (
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">ID:</span> {linkeria.id}</p>
                  <p><span className="font-medium">Email:</span> {linkeria.email}</p>
                  <p><span className="font-medium">Type:</span> {linkeria.user_type}</p>
                  <p className="text-green-600">✅ Peut noter des développeurs</p>
                </div>
              ) : (
                <p className="text-red-500">❌ Profil non trouvé</p>
              )}
            </div>
          </div>
        </div>

        {/* Liste des ratings */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            📊 Toutes les Notes ({ratings.length})
          </h2>
          
          {ratings.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Aucune note trouvée dans la base de données</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">ID</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Client</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Développeur</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Note</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Commentaire</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Projet</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {ratings.map((rating) => (
                    <tr key={rating.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900 font-mono">
                        {rating.id.substring(0, 8)}...
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {rating.client_id?.substring(0, 8)}...
                        {rating.client_id === linkeria?.id && (
                          <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Linkeria</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {rating.developer_id?.substring(0, 8)}...
                        {rating.developer_id === wahib?.id && (
                          <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Wahib</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center">
                          <span className="font-bold text-lg mr-2">{rating.rating}</span>
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <span
                                key={star}
                                className={`text-sm ${star <= rating.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                              >
                                ⭐
                              </span>
                            ))}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 max-w-xs truncate">
                        {rating.comment || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {rating.project_title || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {new Date(rating.created_at).toLocaleDateString('fr-FR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2">🔍 Debug Instructions:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Cette page montre tous les ratings stockés dans la base de données</li>
            <li>• Vérifiez si la note de Linkeria → Wahib apparaît dans la liste</li>
            <li>• Utilisez "Recalculer stats" pour forcer la mise à jour des moyennes</li>
            <li>• Si aucune note n'apparaît, le problème est dans la soumission</li>
            <li>• Si les notes apparaissent mais pas sur le profil, le problème est dans l'affichage</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 