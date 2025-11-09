import { Patient, Admission } from '@/types';

interface PatientBasicInfoProps {
  patient: Patient;
  latestAdmission: Admission | null;
}

export default function PatientBasicInfo({ patient, latestAdmission }: PatientBasicInfoProps) {
  return (
    <div className="bg-gray-50 p-4 sm:p-6 rounded-lg mb-8">
      <h2 className="text-lg sm:text-xl font-medium text-black mb-4">Información básica</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <div>
          <p className="text-sm text-gray-600">Género</p>
          <p className="font-medium">{patient.gender === 'M' ? 'Masculino' : 'Femenino'}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Edad</p>
          <p className="font-medium">{patient.anchor_age} años</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Año de referencia</p>
          <p className="font-medium">{patient.anchor_year}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Estado</p>
          <p className="font-medium">{patient.dod ? 'Fallecido' : 'Vivo'}</p>
        </div>
        {latestAdmission && (
          <>
            <div>
              <p className="text-sm text-gray-600">Idioma</p>
              <p className="font-medium">{latestAdmission.language}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Estado civil</p>
              <p className="font-medium">{latestAdmission.marital_status}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Raza</p>
              <p className="font-medium">{latestAdmission.race}</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
