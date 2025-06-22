'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DeveloperDashboardPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirection immédiate vers la page applications qui fonctionne
    router.replace('/dashboard/developer/applications');
  }, [router]);

  // Affichage temporaire pendant la redirection
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="relative mb-8">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-black rounded-full animate-spin mx-auto"></div>
          <div className="absolute top-2 left-2 w-12 h-12 border-4 border-transparent border-t-white rounded-full animate-spin"></div>
        </div>
        <h2 className="text-2xl font-black text-black mb-4">Redirection vers Dashboard...</h2>
        <p className="text-gray-600">Accès à vos candidatures en cours</p>
      </div>
    </div>
  );
}

