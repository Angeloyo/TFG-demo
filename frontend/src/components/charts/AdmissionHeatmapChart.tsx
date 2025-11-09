"use client";

import { useEffect, useState } from 'react';
import * as Plot from '@observablehq/plot';
import { AdmissionHeatmapData, AdmissionHeatmapHourlyData, AdmissionHeatmapMonthlyData } from '@/types';
import ChartTooltip from '@/components/ui/ChartTooltip';
import { useChartTooltip } from '@/hooks/useChartTooltip';

interface AdmissionHeatmapChartProps {
  viewType: 'hourly' | 'monthly';
}

export default function AdmissionHeatmapChart({ viewType }: AdmissionHeatmapChartProps) {
  const { hoveredData, tooltipPosition, showTooltip, containerRef } = useChartTooltip<AdmissionHeatmapData>({ autoHide: true });
  const [data, setData] = useState<AdmissionHeatmapData[]>([]);
  const [loading, setLoading] = useState(true);
  // const [loadingFilter, setLoadingFilter] = useState(false);
  const [filterMidnight/*, setFilterMidnight*/] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        const url = `${apiUrl}/api/charts/admission-heatmap?filter_midnight=${filterMidnight}&view_type=${viewType}`;
        const response = await fetch(url);
        const result = await response.json();
        setData(result.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
        // setLoadingFilter(false);
      }
    };
    fetchData();
  }, [filterMidnight, viewType]);

  useEffect(() => {
    if (!data.length || !containerRef.current) return;

    containerRef.current.innerHTML = '';

    const isHourly = viewType === 'hourly';
    
    const plot = Plot.plot({
      width: 700,
      height: isHourly ? 250 : 350,
      marginLeft: 50,
      marginBottom: 40,
      x: { 
        label: isHourly ? "Hora del día" : "Día del mes",
        domain: isHourly ? Array.from({length: 24}, (_, i) => i) : Array.from({length: 31}, (_, i) => i + 1)
      },
      y: { 
        label: isHourly ? "Día de la semana" : "Mes",
        domain: isHourly ? [2, 3, 4, 5, 6, 7, 1] : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        tickFormat: (d: number) => {
          if (isHourly) {
            return ({2: "Lun", 3: "Mar", 4: "Mié", 5: "Jue", 6: "Vie", 7: "Sáb", 1: "Dom"} as Record<number, string>)[d];
          } else {
            return ({1: "Ene", 2: "Feb", 3: "Mar", 4: "Abr", 5: "May", 6: "Jun", 7: "Jul", 8: "Ago", 9: "Sep", 10: "Oct", 11: "Nov", 12: "Dic"} as Record<number, string>)[d];
          }
        }
      },
      color: { scheme: "blues", legend: true },
      marks: [
        Plot.cell(data, {
          x: isHourly ? "hour" : "dayOfMonth",
          y: isHourly ? "dayOfWeek" : "month", 
          fill: "count"
        })
      ]
    });

    containerRef.current.appendChild(plot);

    // Añadir tooltips a las celdas
    const cells = plot.querySelectorAll('rect[fill]');
    cells.forEach((cell, index) => {
      const cellData = data[index];
      if (cellData) {
        cell.addEventListener('mouseenter', (e) => {
          const evt = e as MouseEvent;
          showTooltip(cellData, evt.clientX, evt.clientY);
        });
        cell.addEventListener('mousemove', (e) => {
          const evt = e as MouseEvent;
          showTooltip(cellData, evt.clientX, evt.clientY);
        });
        // Eliminar mouseleave manual - ahora lo maneja autoHide
      }
    });

    return () => plot.remove();
  }, [data, showTooltip, containerRef, viewType]);

  if (loading) {
    return (
      <div className="py-8 justify-center flex items-center w-[700px] mx-auto">
        <p className="text-gray-600">Cargando datos...</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div ref={containerRef} />
      
      {/* Controles de filtrado - Solo para vista horaria */}
      {/* {viewType === 'hourly' && (
        <div className="mt-4 text-sm text-gray-600 space-y-2">
          {loadingFilter ? (
            <p className="text-gray-600">
              Cargando...
            </p>
          ) : filterMidnight ? (
            <p>
              Se han filtrado los ingresos registrados a las 00:00:00 por no ser informativos.{' '}
              <button 
                onClick={() => {
                  setLoadingFilter(true);
                  setFilterMidnight(false);
                }}
                className="underline text-gray-700 hover:text-gray-900"
              >
                Mostrar todos los datos
              </button>
            </p>
          ) : (
            <p>
              Mostrando todos los ingresos.{' '}
              <button 
                onClick={() => {
                  setLoadingFilter(true);
                  setFilterMidnight(true);
                }}
                className="underline text-gray-700 hover:text-gray-900"
              >
                Filtrar medianoche
              </button>
            </p>
          )}
        </div>
      )} */}

      {/* Nota informativa - Solo para vista mensual */}
      {/* {viewType === 'monthly' && (
        <div className="mt-4 text-sm text-gray-600">
          <p>
            Se ha excluido el día 29 de febrero (382 ingresos) para mejorar la visualización de la escala de colores.
          </p>
        </div>
      )} */}
      
      <ChartTooltip
        visible={!!hoveredData}
        x={tooltipPosition.x}
        y={tooltipPosition.y}
      >
        {hoveredData && (
          <div>
            <div className="font-medium">
              {viewType === 'hourly' ? (
                (() => {
                  const d = hoveredData as AdmissionHeatmapHourlyData;
                  const dayMap: Record<number, string> = {2: 'Lunes', 3: 'Martes', 4: 'Miércoles', 5: 'Jueves', 6: 'Viernes', 7: 'Sábado', 1: 'Domingo'};
                  return `${dayMap[d.dayOfWeek]} - ${d.hour}:00h`;
                })()
              ) : (
                (() => {
                  const d = hoveredData as AdmissionHeatmapMonthlyData;
                  const monthMap: Record<number, string> = {1: 'Enero', 2: 'Febrero', 3: 'Marzo', 4: 'Abril', 5: 'Mayo', 6: 'Junio', 7: 'Julio', 8: 'Agosto', 9: 'Septiembre', 10: 'Octubre', 11: 'Noviembre', 12: 'Diciembre'};
                  return `${monthMap[d.month]} - Día ${d.dayOfMonth}`;
                })()
              )}
            </div>
            <div>
              {hoveredData.count.toLocaleString()} ingresos
            </div>
          </div>
        )}
      </ChartTooltip>
    </div>
  );
} 