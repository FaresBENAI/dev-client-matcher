'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

export default function PerformanceTest() {
  const [instanceCount, setInstanceCount] = useState(0)
  const [testResults, setTestResults] = useState<string[]>([])

  useEffect(() => {
    const results: string[] = []
    
    // Test 1: Vérifier le singleton
    const client1 = createClient()
    const client2 = createClient()
    const isSingleton = client1 === client2
    results.push(`Singleton test: ${isSingleton ? '✅ PASS' : '❌ FAIL'}`)
    
    // Test 2: Compter les instances dans window
    if (typeof window !== 'undefined') {
      const windowKeys = Object.keys(window).filter(key => 
        key.includes('supabase') || key.includes('gotrue')
      )
      results.push(`Window keys with supabase/gotrue: ${windowKeys.length}`)
      setInstanceCount(windowKeys.length)
    }
    
    setTestResults(results)
  }, [])

  return (
    <div className="fixed bottom-20 right-4 bg-white p-4 rounded-lg shadow-lg border-2 border-gray-200 text-xs">
      <h3 className="font-bold mb-2">Performance Test</h3>
      {testResults.map((result, i) => (
        <div key={i}>{result}</div>
      ))}
      <div className="mt-2 text-red-600">
        Instances détectées: {instanceCount}
      </div>
    </div>
  )
}
