"use client";

import { useState, useEffect } from "react";
import { DashboardCategorizedStats } from "@/types";
import { ArrowRight } from "lucide-react"; 


export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardCategorizedStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        const response = await fetch(`${apiUrl}/api/dashboard/stats`);
        if (!response.ok) {
          throw new Error('Error al cargar estadísticas');
        }
        const data = await response.json();
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-8.6rem)] bg-white flex py-8 md:py-12 lg:py-16 xl:py-20 justify-center ">
        {/* <p className="text-gray-600">Cargando estadísticas...</p> */}
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-8.6rem)] bg-white flex py-8 md:py-12 lg:py-16 xl:py-20 justify-center ">
        <p className="text-red-600">Error: {error}</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-[calc(100vh-8.6rem)] bg-white flex py-8 md:py-12 lg:py-16 xl:py-20 justify-center ">
        <p className="text-gray-600">No hay datos disponibles</p>
      </div>
    );
  }

  const { categories } = stats;

  return (
    <div className="min-h-[calc(100vh-8.6rem)] bg-white py-8 md:py-12 lg:py-16 xl:py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-xl sm:text-2xl font-light text-black mb-2">
            Dashboard
          </h1>
        </div>

        {/* Estadísticas por categorías */}
        <div className="max-w-6xl mx-auto mb-16 space-y-8">
          
          {/* Primera fila: 3 categorías */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* 🏥 DEMOGRÁFICOS & ADMISIONES */}
            <div className="space-y-4">
              <h2 className="text-lg font-light text-black mb-6">
                🏥 Demográficos & Admisiones
              </h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-base font-light text-gray-700">
                    Pacientes totales
                  </span>
                  <span className="text-lg font-light text-black">
                    {categories.demograficos_admisiones.total_patients.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-base font-light text-gray-700">
                    Ingresos hospitalarios
                  </span>
                  <span className="text-lg font-light text-black">
                    {categories.demograficos_admisiones.total_admissions.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-base font-light text-gray-700">
                    Mortalidad hospitalaria
                  </span>
                  <span className="text-lg font-light text-black">
                    {categories.demograficos_admisiones.mortality_rate}%
                  </span>
                </div>
                
                {/* Enlaces a gráficos */}
                <div className="pt-2 space-y-2 border-t border-gray-100">
                  <a 
                    href="/charts/age-distribution"
                    className="flex justify-between items-center group"
                  >
                    <span className="text-sm font-light text-gray-600 group-hover:text-gray-800">
                      Distribución por edad y género
                    </span>
                    <ArrowRight className="w-3 h-3 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all duration-200" />
                  </a>
                  <a 
                    href="/charts/admission-heatmap"
                    className="flex justify-between items-center group"
                  >
                    <span className="text-sm font-light text-gray-600 group-hover:text-gray-800">
                      Patrones de admisión temporales
                    </span>
                    <ArrowRight className="w-3 h-3 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all duration-200" />
                  </a>
                </div>
              </div>
            </div>

            {/* 🏥 UCI */}
            <div className="space-y-4">
              <h2 className="text-lg font-light text-black mb-6">
                🏥 Cuidados Intensivos (UCI)
              </h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-base font-light text-gray-700">
                    Estancias en UCI
                  </span>
                  <span className="text-lg font-light text-black">
                    {categories.icu.total_icu_stays.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-base font-light text-gray-700">
                    Mortalidad UCI
                  </span>
                  <span className="text-lg font-light text-black">
                    {categories.icu.icu_mortality_rate}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-base font-light text-gray-700">
                    Estancia promedio UCI
                  </span>
                  <span className="text-lg font-light text-black">
                    {categories.icu.avg_icu_stay} días
                  </span>
                </div>
                
                {/* Enlaces a gráficos */}
                <div className="pt-2 space-y-2 border-t border-gray-100">
                  <a 
                    href="/charts/icu-stay-duration"
                    className="flex justify-between items-center group"
                  >
                    <span className="text-sm font-light text-gray-600 group-hover:text-gray-800">
                      Duración de estancias por UCI
                    </span>
                    <ArrowRight className="w-3 h-3 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all duration-200" />
                  </a>
                </div>
              </div>
            </div>

            {/* 🧪 LABORATORIO & MEDICAMENTOS */}
            <div className="space-y-4">
              <h2 className="text-lg font-light text-black mb-6">
                🧪 Laboratorio & Medicamentos
              </h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-base font-light text-gray-700">
                    Análisis de laboratorio
                  </span>
                  <span className="text-lg font-light text-black">
                    {categories.laboratorio.total_lab_tests.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-base font-light text-gray-700">
                    Prescripciones totales
                  </span>
                  <span className="text-lg font-light text-black">
                    {categories.laboratorio.total_prescriptions.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-base font-light text-gray-700">
                    Tests promedio/paciente
                  </span>
                  <span className="text-lg font-light text-black">
                    {categories.laboratorio.avg_tests_per_patient}
                  </span>
                </div>
                
                {/* Enlaces a gráficos */}
                <div className="pt-2 space-y-2 border-t border-gray-100">
                  <a 
                    href="/charts/medications-sunburst"
                    className="flex justify-between items-center group"
                  >
                    <span className="text-sm font-light text-gray-600 group-hover:text-gray-800">
                      Medicamentos más prescritos por vía
                    </span>
                    <ArrowRight className="w-3 h-3 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all duration-200" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Segunda fila: 2 categorías */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* 🩺 DIAGNÓSTICOS & PROCEDIMIENTOS */}
            <div className="space-y-4">
              <h2 className="text-lg font-light text-black mb-6">
                🩺 Diagnósticos & Procedimientos
              </h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-base font-light text-gray-700">
                    Diagnósticos registrados
                  </span>
                  <span className="text-lg font-light text-black">
                    {categories.diagnosticos.total_diagnoses.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-base font-light text-gray-700">
                    Procedimientos totales
                  </span>
                  <span className="text-lg font-light text-black">
                    {categories.diagnosticos.total_procedures.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-base font-light text-gray-700">
                    Diagnósticos promedio/paciente
                  </span>
                  <span className="text-lg font-light text-black">
                    {categories.diagnosticos.avg_diagnoses_per_patient}
                  </span>
                </div>
                
                {/* Enlaces a gráficos */}
                <div className="pt-2 space-y-2 border-t border-gray-100">
                  <a 
                    href="/charts/diagnosis-icicle"
                    className="flex justify-between items-center group"
                  >
                    <span className="text-sm font-light text-gray-600 group-hover:text-gray-800">
                      Diagnósticos por categoría
                    </span>
                    <ArrowRight className="w-3 h-3 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all duration-200" />
                  </a>
                </div>
              </div>
            </div>

            {/* 🔄 FLUJOS HOSPITALARIOS */}
            <div className="space-y-4">
              <h2 className="text-lg font-light text-black mb-6">
                🔄 Flujos Hospitalarios
              </h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-base font-light text-gray-700">
                    Tasa de transferencias
                  </span>
                  <span className="text-lg font-light text-black">
                    {categories.flujos.transfer_rate}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-base font-light text-gray-700">
                    Movimientos promedio/admisión
                  </span>
                  <span className="text-lg font-light text-black">
                    {categories.flujos.avg_moves_per_admission}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-base font-light text-gray-700">
                    Destino más común
                  </span>
                  <span className="text-lg font-light text-black">
                    {categories.flujos.most_common_destination}
                  </span>
                </div>
                
                {/* Enlaces a gráficos */}
                <div className="pt-2 space-y-2 border-t border-gray-100">
                  <a 
                    href="/charts/hospital-transfers-chord"
                    className="flex justify-between items-center group"
                  >
                    <span className="text-sm font-light text-gray-600 group-hover:text-gray-800">
                      Flujos entre unidades
                    </span>
                    <ArrowRight className="w-3 h-3 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all duration-200" />
                  </a>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
} 