"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SearchPage() {
  const [patientId, setPatientId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // const [message, setMessage] = useState("Buscando...");
  const router = useRouter();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = patientId.trim();

    if (!id || !/^\d+$/.test(id)) return;

    setError("");
    // setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const res = await fetch(`${apiUrl}/api/patients/${id}/exists`, {
        method: "HEAD",
        cache: "no-store"
      });

      if (res.ok) {
        setLoading(true);
        // setMessage("Cargando datos del paciente...");
        router.push(`/patient/${id}`);
        return;
      } else {
        setError("El ID no existe. Revisa el número e inténtalo de nuevo.");
        setLoading(false);
      }
    } catch {
      setError("No se pudo comprobar el ID. Inténtalo de nuevo más tarde.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-8.6rem)] bg-white py-8 md:py-12 lg:py-16 xl:py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl font-light text-black mb-2">
              Buscar Paciente
            </h1>
            <p className="text-gray-600">
              Introduce el ID del paciente para ver su información
            </p>
          </div>

          {/* Formulario de búsqueda */}
          <form onSubmit={handleSearch} className="space-y-6">
            <div>
              <label htmlFor="patientId" className="block text-sm font-medium text-gray-700 mb-2">
                ID del Paciente
              </label>
              <input
                type="text"
                id="patientId"
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                placeholder="Ej: 10003400"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-200 focus:border-gray-400 outline-none transition-colors"
              />
            </div>
            
            <button
              type="submit"
              disabled={loading || !patientId.trim() || !/^\d+$/.test(patientId.trim())}
              className="w-full py-3 px-4 bg-black text-white font-medium rounded-lg hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {/* {loading ? message : "Buscar Paciente"} */}
              {loading ? "Cargando datos del paciente..." : "Buscar Paciente"}
            </button>
          </form>

          {/* Validación visual */}
          {patientId.trim() && !/^\d+$/.test(patientId.trim()) && (
            <p className="mt-2 text-sm text-red-600">
              El ID debe contener solo números
            </p>
          )}
          {error && (
            <p className="mt-2 text-sm text-red-600">{error}</p>
          )}
        </div>
      </div>
    </div>
  );
} 