'use client'

import React, { useState, useEffect, useCallback } from 'react';
import { AlertCircle, Activity, Database, Wifi, Clock } from 'lucide-react';

const PerformanceMonitor = () => {
  const [metrics, setMetrics] = useState({
    pageLoadTime: 0,
    supabaseLatency: 0,
    activeConnections: 0,
    renderCount: 0,
    lastUpdate: new Date().toISOString()
  });

  const [isMinimized, setIsMinimized] = useState(false);

  const measureSupabaseLatency = useCallback(async () => {
    const start = performance.now();
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`, {
        method: 'HEAD',
        headers: {
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        }
      });
      return performance.now() - start;
    } catch (error) {
      console.error('Supabase latency test failed:', error);
      return -1;
    }
  }, []);

  const collectMetrics = useCallback(async () => {
    const navigation = performance.getEntriesByType('navigation')[0] as any;
    const pageLoad = navigation ? navigation.loadEventEnd - navigation.fetchStart : 0;
    
    const supabaseLatency = await measureSupabaseLatency();
    
    const newMetrics = {
      pageLoadTime: pageLoad,
      supabaseLatency,
      activeConnections: performance.getEntriesByType('resource').filter(r => 
        r.name.includes('supabase.co')
      ).length,
      renderCount: metrics.renderCount + 1,
      lastUpdate: new Date().toISOString()
    };

    setMetrics(newMetrics);
  }, [measureSupabaseLatency, metrics.renderCount]);

  useEffect(() => {
    collectMetrics();
    const interval = setInterval(collectMetrics, 5000);
    return () => clearInterval(interval);
  }, [collectMetrics]);

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsMinimized(false)}
          className="bg-gray-800 text-white p-2 rounded-full shadow-lg hover:bg-gray-700"
        >
          <Activity className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white rounded-lg shadow-xl p-4 w-80 border">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-semibold">Performance Monitor</h3>
        <button onClick={() => setIsMinimized(true)} className="text-gray-500">−</button>
      </div>

      <div className="space-y-2 text-xs">
        <div className="flex justify-between">
          <span>Page Load</span>
          <span>{metrics.pageLoadTime.toFixed(0)}ms</span>
        </div>
        <div className="flex justify-between">
          <span>Supabase Latency</span>
          <span>{metrics.supabaseLatency > 0 ? `${metrics.supabaseLatency.toFixed(0)}ms` : 'N/A'}</span>
        </div>
        <div className="flex justify-between">
          <span>Active Connections</span>
          <span>{metrics.activeConnections}</span>
        </div>
        <div className="flex justify-between">
          <span>Render Count</span>
          <span>{metrics.renderCount}</span>
        </div>
      </div>
    </div>
  );
};

export default PerformanceMonitor;
