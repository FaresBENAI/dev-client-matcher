'use client'

import { useLanguage } from '@/contexts/LanguageContext'

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage()

  return (
    <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
      <button
        onClick={() => setLanguage('fr')}
        className={`px-3 py-1 text-xs font-bold rounded-md transition-all duration-300 ${
          language === 'fr'
            ? 'bg-black text-white shadow-sm'
            : 'text-gray-600 hover:text-black hover:bg-gray-200'
        }`}
      >
        FR
      </button>
      <button
        onClick={() => setLanguage('en')}
        className={`px-3 py-1 text-xs font-bold rounded-md transition-all duration-300 ${
          language === 'en'
            ? 'bg-black text-white shadow-sm'
            : 'text-gray-600 hover:text-black hover:bg-gray-200'
        }`}
      >
        EN
      </button>
    </div>
  )
} 