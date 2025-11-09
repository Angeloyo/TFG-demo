'use client';

import { Admission, Diagnosis, Procedure } from '@/types';
import { useState } from 'react';
import LabEventTimeSeries from '@/components/charts/LabEventTimeSeries';

interface PatientAdmissionsProps {
  admissions: Admission[];
  diagnoses: Diagnosis[];
  procedures: Procedure[];
}

export default function PatientAdmissions({ admissions, diagnoses, procedures }: PatientAdmissionsProps) {
  const [expandedAdmissions, setExpandedAdmissions] = useState<Set<number>>(new Set());
  const [expandedCharts, setExpandedCharts] = useState<Set<string>>(new Set());
  const [expandedDiagnoses, setExpandedDiagnoses] = useState<Set<number>>(() => new Set());
  const [expandedLabs, setExpandedLabs] = useState<Set<number>>(() => new Set());
  const [expandedProcedures, setExpandedProcedures] = useState<Set<number>>(() => new Set());
  const [selectedCategories, setSelectedCategories] = useState<Map<number, string>>(new Map());

  const toggleAdmission = (hadmId: number) => {
    const newExpanded = new Set(expandedAdmissions);
    if (newExpanded.has(hadmId)) {
      newExpanded.delete(hadmId);
    } else {
      newExpanded.add(hadmId);
    }
    setExpandedAdmissions(newExpanded);
  };

  const toggleChart = (chartKey: string) => {
    const newExpanded = new Set(expandedCharts);
    if (newExpanded.has(chartKey)) {
      newExpanded.delete(chartKey);
    } else {
      newExpanded.add(chartKey);
    }
    setExpandedCharts(newExpanded);
  };

  const toggleDiagnosesSection = (hadmId: number) => {
    const next = new Set(expandedDiagnoses);
    if (next.has(hadmId)) next.delete(hadmId); else next.add(hadmId);
    setExpandedDiagnoses(next);
  };

  const toggleLabSection = (hadmId: number) => {
    const next = new Set(expandedLabs);
    if (next.has(hadmId)) next.delete(hadmId); else next.add(hadmId);
    setExpandedLabs(next);
  };

  const toggleProceduresSection = (hadmId: number) => {
    const next = new Set(expandedProcedures);
    if (next.has(hadmId)) next.delete(hadmId); else next.add(hadmId);
    setExpandedProcedures(next);
  };

  return (
    <div>
      <h2 className="text-lg sm:text-xl font-medium text-black mb-4">Historial de ingresos ({admissions.length})</h2>
      {admissions.length === 0 ? (
        <div className="p-4 sm:p-6 border border-gray-200 rounded-lg text-gray-600">
          No hay ingresos registrados para este paciente.
        </div>
      ) : (
        <div className="space-y-4">
          {admissions.map((admission: Admission) => {
          const admissionDiagnoses = diagnoses.filter(d => d.hadm_id === admission.hadm_id);
          const admissionProcedures = procedures.filter(p => p.hadm_id === admission.hadm_id);
          const isExpanded = expandedAdmissions.has(admission.hadm_id);

          return (
            <div key={admission.hadm_id} className="border border-gray-200 rounded-lg">
              {/* Header clickeable */}
              <button
                onClick={() => toggleAdmission(admission.hadm_id)}
                className="w-full p-4 sm:p-6 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-black mb-2">
                      Ingreso {new Date(admission.admittime).toLocaleDateString()}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      {/* <span>{admission.admission_type}</span>
                      <span>•</span>
                      <span>{admission.insurance}</span>
                      <span>•</span> */}
                      <span>{Math.max(1, Math.ceil((new Date(admission.dischtime).getTime() - new Date(admission.admittime).getTime()) / 86400000))} días</span>
                      {admissionDiagnoses.length > 0 && (
                        <>
                          <span>•</span>
                          <span>{admissionDiagnoses.length} diagnósticos</span>
                        </>
                      )}
                      {admissionProcedures.length > 0 && (
                        <>
                          <span>•</span>
                          <span>{admissionProcedures.length} procedimientos</span>
                        </>
                      )}
                      {(admission.labevents?.length ?? 0) > 0 && (
                        <>
                          <span>•</span>
                          <span>{admission.labevents?.length} tests</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="ml-4">
                    <svg
                      className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </button>
              
              {/* Contenido expandible */}
              {isExpanded && (
                <div className="px-4 sm:px-6 pb-4 sm:pb-6 border-t border-gray-100">
                  {/* Información detallada del ingreso */}
                  <div className="mb-4 pt-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-600">Fechas</p>
                        <p className="font-medium">{new Date(admission.admittime).toLocaleDateString()}</p>
                        <p className="text-sm text-gray-500">→ {new Date(admission.dischtime).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Tipo</p>
                        <p className="font-medium">{admission.admission_type}</p>
                        <p className="text-sm text-gray-500">{admission.insurance}</p>
                      </div>
                      <div className="sm:col-span-2 lg:col-span-1">
                        <p className="text-sm text-gray-600">Discharge Location</p>
                        <p className="font-medium">{admission.discharge_location || "No definido"}</p>
                        {admission.hospital_expire_flag === 1 && (
                          <p className="text-sm text-red-600">Fallecimiento hospitalario</p>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-xs text-gray-400">ID: {admission.hadm_id}</p>
                  </div>
                  
                  {/* Diagnósticos del ingreso (toggle) */}
                  {admissionDiagnoses.length > 0 && (
                    <div>
                      <button
                        onClick={() => toggleDiagnosesSection(admission.hadm_id)}
                        className="w-full text-left flex items-center justify-between py-2"
                      >
                        <h4 className="text-sm font-medium text-gray-700">
                          Diagnósticos ({admissionDiagnoses.length})
                        </h4>
                        <svg
                          className={`w-4 h-4 text-gray-400 transition-transform ${expandedDiagnoses.has(admission.hadm_id) ? 'rotate-180' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {expandedDiagnoses.has(admission.hadm_id) && (
                        <div className="space-y-2 mt-2">
                          {admissionDiagnoses.map((diagnosis: Diagnosis) => (
                            <div key={`${diagnosis.hadm_id}-${diagnosis.seq_num}`} 
                                 className="p-3 rounded bg-gray-50">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <p className="font-medium text-black">
                                    {diagnosis.description || `Código ICD ${diagnosis.icd_code}`}
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    ICD-{diagnosis.icd_version}: {diagnosis.icd_code}
                                  </p>
                                </div>
                                <span className="text-sm font-medium text-gray-600 ml-2">#{diagnosis.seq_num}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Procedimientos del ingreso (toggle) */}
                  {admissionProcedures.length > 0 && (
                    <div className="mt-6">
                      <button
                        onClick={() => toggleProceduresSection(admission.hadm_id)}
                        className="w-full text-left flex items-center justify-between py-2"
                      >
                        <h4 className="text-sm font-medium text-gray-700">
                          Procedimientos ({admissionProcedures.length})
                        </h4>
                        <svg
                          className={`w-4 h-4 text-gray-400 transition-transform ${expandedProcedures.has(admission.hadm_id) ? 'rotate-180' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {expandedProcedures.has(admission.hadm_id) && (
                        <div className="space-y-2 mt-2">
                          {admissionProcedures.map((procedure: Procedure) => (
                            <div key={`${procedure.hadm_id}-${procedure.seq_num}`} 
                                 className="p-3 rounded bg-gray-50">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <p className="font-medium text-black">
                                    {procedure.description || `Código ICD ${procedure.icd_code}`}
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    ICD-{procedure.icd_version}: {procedure.icd_code}
                                  </p>
                                </div>
                                {procedure.chartdate && (
                                  <span className="text-sm text-gray-500 ml-2">{new Date(procedure.chartdate).toLocaleDateString()}</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Laboratorio del ingreso (toggle) */}
                  {Array.isArray(admission.labevents) && admission.labevents.length > 0 && (
                    <div className="mt-6">
                      <button
                        onClick={() => toggleLabSection(admission.hadm_id)}
                        className="w-full text-left flex items-center justify-between py-2"
                      >
                        <h4 className="text-sm font-medium text-gray-700">
                          Laboratorio ({admission.labevents.length})
                        </h4>
                        <svg
                          className={`w-4 h-4 text-gray-400 transition-transform ${expandedLabs.has(admission.hadm_id) ? 'rotate-180' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {expandedLabs.has(admission.hadm_id) && (
                        <div className="mt-3">
                          {(() => {
                            const categoriesMap = new Map<string, number>();
                            admission.labevents.forEach((ev) => {
                              const key = ev.category || 'Sin categoría';
                              categoriesMap.set(key, (categoriesMap.get(key) || 0) + 1);
                            });
                            const categories = Array.from(categoriesMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));
                            const current = selectedCategories.get(admission.hadm_id) || 'Ver todas';

                            return (
                              <div className="mb-3 flex items-center gap-3">
                                <label className="text-sm text-gray-600">Categoría:</label>
                                <select
                                  className="border border-gray-200 rounded px-2 py-1 text-sm bg-white"
                                  value={current}
                                  onChange={(e) => {
                                    const next = new Map(selectedCategories);
                                    next.set(admission.hadm_id, e.target.value);
                                    setSelectedCategories(next);
                                  }}
                                >
                                  <option value="Ver todas">Ver todas</option>
                                  {categories.map(([name, count]) => (
                                    <option key={name} value={name}>
                                      {name} ({count})
                                    </option>
                                  ))}
                                </select>
                              </div>
                            );
                          })()}
                      {/* Tabla de eventos recientes */}
                      {/* <div className="overflow-x-auto border border-gray-100 rounded-md mb-4">
                        <table className="min-w-full text-sm table-fixed">
                          <thead>
                            <tr className="text-left text-gray-500">
                              <th className="py-2 pr-4 w-40 pl-4">Fecha</th>
                              <th className="py-2 pr-4 w-56 sm:w-72">Test</th>
                              <th className="py-2 pr-4 w-24">Valor</th>
                              <th className="py-2 pr-4 w-20">Unidad</th>
                              <th className="py-2 pr-4 w-24 text-center">Estado</th>
                            </tr>
                          </thead>
                          <tbody>
                            {admission.labevents.slice(0, 20).map((ev) => (
                              <tr key={ev.labevent_id} className="border-t border-gray-200">
                                <td className="py-2 pr-4 pl-4 text-gray-700 whitespace-nowrap">{new Date(ev.charttime).toLocaleString()}</td>
                                <td className="py-2 pr-4 text-gray-900 whitespace-nowrap max-w-[180px] sm:max-w-[280px] truncate">{ev.label || ev.itemid}</td>
                                <td className="py-2 pr-4 text-gray-900 whitespace-nowrap">{(ev.valuenum ?? ev.value ?? '-').toString()}</td>
                                <td className="py-2 pr-4 text-gray-700 whitespace-nowrap">{ev.valueuom || '-'}</td>
                                <td className="py-2 pr-4 text-center whitespace-nowrap">
                                  {ev.flag ? (
                                    <span className="inline-block px-2 py-1 text-xs rounded bg-red-100 text-red-700">Anormal</span>
                                  ) : (
                                    <span className="inline-block px-2 py-1 text-xs rounded bg-green-100 text-green-700">Normal</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div> */}

                      {/* Gráficos de series temporales */}
                      {(() => {
                        // Filtrado por categoría seleccionada
                        const currentCategory = selectedCategories.get(admission.hadm_id) || 'Ver todas';
                        const filteredEvents = currentCategory === 'Ver todas'
                          ? admission.labevents
                          : admission.labevents.filter(ev => (ev.category || 'Sin categoría') === currentCategory);

                        // Agrupar eventos por test name (incluyendo no numéricos)
                        const eventsByTestAll = new Map<string, typeof filteredEvents>();
                        filteredEvents.forEach(event => {
                          if (event.label) {
                            if (!eventsByTestAll.has(event.label)) {
                              eventsByTestAll.set(event.label, []);
                            }
                            eventsByTestAll.get(event.label)!.push(event);
                          }
                        });

                        const allTests = Array.from(eventsByTestAll.entries()).sort((a, b) => b[1].length - a[1].length);
                        if (allTests.length === 0) return null;

                        return (
                          <div>
                            <div className="rounded-md border border-gray-100 divide-y divide-gray-100">
                              {allTests.map(([testName, testEventsAll]) => {
                                const chartKey = `${admission.hadm_id}-${testName}`;
                                const isChartExpanded = expandedCharts.has(chartKey);

                                // Datos numéricos para graficar
                                const numericEvents = testEventsAll.filter(e => e.valuenum !== null && e.valuenum !== undefined);

                                // Porcentaje de normalidad sobre todos los eventos del test
                                const normalCount = testEventsAll.filter(event => !event.flag).length;
                                const normalPercentage = Math.round((normalCount / testEventsAll.length) * 100);

                                const getColorClasses = (percentage: number) => {
                                  if (percentage >= 80) return "bg-green-100 text-green-700 border-green-200";
                                  if (percentage >= 60) return "bg-yellow-100 text-yellow-700 border-yellow-200";
                                  if (percentage >= 40) return "bg-orange-100 text-orange-700 border-orange-200";
                                  return "bg-red-100 text-red-700 border-red-200";
                                };

                                // Caso: solo una instancia -> no gráfica, mostrar fila informativa con fecha/valor
                                if (testEventsAll.length === 1) {
                                  const ev = testEventsAll[0]!;
                                  return (
                                    <div key={chartKey}>
                                      <button
                                        onClick={() => toggleChart(chartKey)}
                                        className={`w-full px-3 py-2 text-left transition-colors flex items-center justify-between hover:bg-gray-50 min-h-12`}
                                      >
                                        <div className="flex items-center gap-3">
                                          <span className="text-sm font-medium text-gray-900">{testName}</span>
                                          <span className="text-xs text-gray-500">(1 punto)</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                          <span className={`inline-block px-2 py-1 text-xs rounded border w-24 text-center ${getColorClasses(normalPercentage)}`}>
                                            {normalPercentage}% normal
                                          </span>
                                          <svg
                                            className={`w-4 h-4 text-gray-400 transition-transform ${isChartExpanded ? 'rotate-180' : ''}`}
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                          >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                          </svg>
                                        </div>
                                      </button>
                                      {isChartExpanded && (
                                        <div className="p-4 border-t border-gray-100">
                                          <div className="px-3 py-2 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                              <span className="text-xs text-gray-500">{new Date(ev.charttime).toLocaleString()}</span>
                                            </div>
                                            <span className="text-sm text-gray-900">
                                              {String(ev.valuenum ?? ev.value ?? ev.comments ?? '-')}
                                              {ev.valueuom ? ` ${ev.valueuom}` : ''}
                                              {(() => {
                                                const lower = ev.ref_range_lower;
                                                const upper = ev.ref_range_upper;
                                                if (lower == null && upper == null) return '';
                                                const rangeStr = `${lower ?? '–'}–${upper ?? '–'}`;
                                                return ` · rango: ${rangeStr}`;
                                              })()}
                                              {ev.comments ? ` · ${ev.comments}` : ''}
                                              {ev.flag === 1 ? ' · Anormal' : ev.flag === 0 ? ' · Normal' : ''}
                                            </span>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  );
                                }

                                // Caso: múltiples eventos -> si hay ≥2 numéricos, mostrar gráfica expandible; si no, fila informativa
                                const canPlot = numericEvents.length >= 2;

                                return (
                                  <div key={chartKey}>
                                    {canPlot ? (
                                      <button
                                        onClick={() => toggleChart(chartKey)}
                                        className={`w-full px-3 py-2 text-left transition-colors flex items-center justify-between hover:bg-gray-50 min-h-12`}
                                      >
                                        <div className="flex items-center gap-3">
                                          <span className="text-sm font-medium text-gray-900">{testName}</span>
                                          <span className="text-xs text-gray-500">({testEventsAll.length} puntos)</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                          <span className={`inline-block px-2 py-1 text-xs rounded border w-24 text-center ${getColorClasses(normalPercentage)}`}>
                                            {normalPercentage}% normal
                                          </span>
                                          <svg
                                            className={`w-4 h-4 text-gray-400 transition-transform ${isChartExpanded ? 'rotate-180' : ''}`}
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                          >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                          </svg>
                                        </div>
                                      </button>
                                    ) : (
                                      <>
                                        <button
                                          onClick={() => toggleChart(chartKey)}
                                          className={`w-full px-3 py-2 text-left transition-colors flex items-center justify-between hover:bg-gray-50 min-h-12`}
                                        >
                                          <div className="flex items-center gap-3">
                                            <span className="text-sm font-medium text-gray-900">{testName}</span>
                                            <span className="text-xs text-gray-500">({testEventsAll.length} puntos)</span>
                                          </div>
                                          <div className="flex items-center gap-3">
                                            <span className="inline-block px-2 py-1 text-xs rounded border w-32 text-center bg-gray-100 text-gray-700 border-gray-200">
                                              Sin serie temporal
                                            </span>
                                            <svg
                                              className={`w-4 h-4 text-gray-400 transition-transform ${isChartExpanded ? 'rotate-180' : ''}`}
                                              fill="none"
                                              stroke="currentColor"
                                              viewBox="0 0 24 24"
                                            >
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                          </div>
                                        </button>
                                        {isChartExpanded && (
                                          <div className="p-4 border-t border-gray-100">
                                            <div className="rounded-md border border-gray-100 divide-y divide-gray-100">
                                              {testEventsAll.map((ev, idx) => (
                                                <div key={idx} className="px-3 py-2 flex items-center justify-between">
                                                  <div className="flex items-center gap-3">
                                                    <span className="text-xs text-gray-500">{new Date(ev.charttime).toLocaleString()}</span>
                                                  </div>
                                                  <span>{(ev.comments ?? '-').toString()}</span>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                      </>
                                    )}
                                    {canPlot && isChartExpanded && (
                                      <div className="p-4 border-t border-gray-100">
                                        <LabEventTimeSeries labevents={admission.labevents || []} testName={testName} />
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })()}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
          })}
        </div>
      )}
    </div>
  );
}
