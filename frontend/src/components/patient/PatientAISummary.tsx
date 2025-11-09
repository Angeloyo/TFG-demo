'use client';

import { PatientData } from '@/types';
import { useCallback, useEffect, useRef, useState } from 'react';

interface PatientAISummaryProps {
  data: PatientData;
}

export default function PatientAISummary({ data }: PatientAISummaryProps) {
  // const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);

  const handleGenerate = useCallback(async () => {
    setError(null);
    // setLoading(true);
    setSummary(null);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const res = await fetch(`${apiUrl}/api/summary/patient`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.detail || 'Error generando el resumen');
      }
      const json = await res.json();
      setSummary(json.summary);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error inesperado');
    } finally {
      // setLoading(false);
    }
  }, [data]);

  const didRun = useRef(false);
  useEffect(() => {
    if (didRun.current) return;
    didRun.current = true;
    handleGenerate();
  }, [handleGenerate]);

  return (
    <div className="bg-gray-50 p-4 sm:p-6 rounded-lg mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg sm:text-xl font-medium text-black">Resumen IA</h2>
        {/* <button
          onClick={handleGenerate}
          disabled={loading}
          className="py-2 px-3 bg-black text-white text-sm rounded-md hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Generando…' : 'Generar resumen'}
        </button> */}
      </div>
      {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
      {summary ? (
        <div className="prose prose-sm max-w-none whitespace-pre-wrap text-gray-800 text-justify">{summary}</div>
      ) : (
        // <p className="text-sm text-gray-600">Pulsa el botón para generar un resumen automático de este paciente.</p>
        <p className="text-sm text-gray-600">Generando resumen...</p>
      )}
    </div>
  );
}


