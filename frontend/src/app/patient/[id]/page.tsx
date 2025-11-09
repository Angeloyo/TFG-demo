"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { PatientData } from '@/types';
import PatientBasicInfo from '@/components/patient/PatientBasicInfo';
import PatientAdmissions from '@/components/patient/PatientAdmissions';
import PatientAISummary from '@/components/patient/PatientAISummary';

export default function PatientPage() {
  const params = useParams();
  const patientId = params.id as string;

  const [data, setData] = useState<PatientData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!patientId) return;

    const fetchPatient = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        const res = await fetch(`${apiUrl}/api/patients/${patientId}`, {
          cache: 'no-store'
        });

        if (!res.ok) {
          setError(true);
          return;
        }

        const result = await res.json();
        setData(result);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchPatient();
  }, [patientId]);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-5rem)] bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Cargando datos del paciente...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-[calc(100vh-5rem)] bg-white flex items-center justify-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-xl sm:text-2xl font-light text-black mb-2">Paciente no encontrado</h1>
          <p className="text-gray-600">El ID {patientId} no existe en la base de datos</p>
        </div>
      </div>
    );
  }

  const { patient, admissions, diagnoses, procedures } = data;

  // Obtener la admisión más reciente para datos demográficos adicionales
  let latestAdmission = null;
  if (admissions.length > 0) {
    latestAdmission = admissions.reduce((latest, current) => {
      if (new Date(current.admittime) > new Date(latest.admittime)) {
        return current;
      } else {
        return latest;
      }
    });
  }

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-white py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-light text-black mb-2">
            Paciente {patient.subject_id}
          </h1>
          {/* <p className="text-gray-600">
            {admissions.length} {admissions.length === 1 ? 'ingreso' : 'ingresos'} registrados
          </p> */}
        </div>

        {/* Información básica */}
        <PatientBasicInfo
          patient={patient}
          latestAdmission={latestAdmission}
        />

        {/* Resumen IA */}
        <PatientAISummary data={{ patient, admissions, diagnoses, procedures }} />

        {/* Historial de ingresos */}
        <PatientAdmissions
          admissions={admissions}
          diagnoses={diagnoses}
          procedures={procedures}
        />
      </div>
    </div>
  );
}
 