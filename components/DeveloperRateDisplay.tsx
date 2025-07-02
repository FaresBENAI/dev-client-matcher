// components/DeveloperRateDisplay.tsx
'use client'

interface DeveloperRateDisplayProps {
  dailyRate: number | null
  dailyRateDefined: boolean
  className?: string
  size?: 'small' | 'medium' | 'large'
}

export default function DeveloperRateDisplay({ 
  dailyRate, 
  dailyRateDefined,
  className = '',
  size = 'medium'
}: DeveloperRateDisplayProps) {
  
  // Styles selon la taille
  const sizeStyles = {
    small: {
      container: 'px-2 py-1 text-xs',
      icon: 'text-xs',
      text: 'text-xs font-bold'
    },
    medium: {
      container: 'px-3 py-1 text-sm',
      icon: 'text-sm',
      text: 'text-sm font-bold'
    },
    large: {
      container: 'px-4 py-2 text-base',
      icon: 'text-base',
      text: 'text-base font-bold'
    }
  }

  const styles = sizeStyles[size]

  // Si le TJM n'est pas défini ou explicitement marqué comme "à définir"
  if (!dailyRateDefined) {
    return (
      <span className={`inline-flex items-center gap-1 bg-orange-100 text-orange-700 border border-orange-200 rounded-full ${styles.container} ${className}`}>
        <span className={styles.icon}>💬</span>
        <span className={styles.text}>À définir</span>
      </span>
    )
  }

  // Si le TJM est défini et renseigné
  if (dailyRateDefined && dailyRate && dailyRate > 0) {
    return (
      <span className={`inline-flex items-center gap-1 bg-green-100 text-green-700 border border-green-200 rounded-full ${styles.container} ${className}`}>
        <span className={styles.icon}>💰</span>
        <span className={styles.text}>{dailyRate}€/j</span>
      </span>
    )
  }

  // Fallback : TJM défini mais non renseigné
  return (
    <span className={`inline-flex items-center gap-1 bg-gray-100 text-gray-600 border border-gray-200 rounded-full ${styles.container} ${className}`}>
      <span className={styles.icon}>❓</span>
      <span className={styles.text}>Non renseigné</span>
    </span>
  )
}
