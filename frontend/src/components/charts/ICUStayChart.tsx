"use client";

import { useEffect, useState } from 'react';
import * as Plot from '@observablehq/plot';
import { ICUStayData } from '@/types';
import ChartTooltip from '@/components/ui/ChartTooltip';
import { useChartTooltip } from '@/hooks/useChartTooltip';

export default function ICUStayChart() {
  const { hoveredData, tooltipPosition, showTooltip, containerRef } = useChartTooltip<ICUStayData>({ autoHide: true });
  const [threshold, setThreshold] = useState(5);
  const [data, setData] = useState<ICUStayData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        const response = await fetch(`${apiUrl}/api/charts/icu-stay-duration`);
        if (!response.ok) throw new Error('Error al cargar datos');
        const result = await response.json();
        setData(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filtrar datos según el threshold
  const filteredData = data.filter(d => d.total_stays >= threshold);
  const hiddenCount = data.length - filteredData.length;

  useEffect(() => {
    if (!filteredData.length || !containerRef.current) return;

    // Limpiar el contenedor
    containerRef.current.innerHTML = '';

    const plot = Plot.plot({
      marginLeft: 250,
      height: 500,
      marginBottom: 38,
      x: { 
        label: "Estancia promedio (días)",
        grid: true 
      },
      y: { 
        label: null 
      },
      marks: [
        Plot.barX(filteredData, {
          x: "avg_stay_days",
          y: "careunit",
          fill: "#374151",
          sort: { y: "x", reverse: true },
        })
      ]
    });

    containerRef.current.appendChild(plot);

    // Añadir event listeners a las barras
    const bars = plot.querySelectorAll('rect');
    bars.forEach((bar, index) => {
      const dataItem = filteredData.find(d => d.careunit === bar.getAttribute('aria-label')?.split(',')[0]) || filteredData[index];
      
      bar.addEventListener('mouseenter', (e) => {
        showTooltip(dataItem, e.clientX, e.clientY);
      });
      
      // Eliminar mouseleave manual - ahora lo maneja autoHide
    });

    return () => {
      plot.remove();
    };
  }, [filteredData, containerRef, showTooltip]);

  if (loading) {
    return (
      <div className="relative">
        <div className="flex justify-center" style={{ width: '640px' }}>
          <div className="flex items-center justify-center w-full">
            <p className="text-gray-600">Cargando datos...</p>
          </div>
        </div>
      </div>
    );
  }
  if (error) return <div className="py-8 md:py-12 lg:py-16 xl:py-20 justify-center flex text-red-600">Error: {error}</div>;

  const handleThresholdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0;
    setThreshold(value);
  };

  return (
    <div className="relative">
      <div ref={containerRef} className="w-full" />
      
      {/* Controles de filtrado */}
      <div className="mt-4 text-sm text-gray-600 space-y-2">
        {hiddenCount > 0 && (
          <p>
            Se han ocultado {hiddenCount} unidades con menos de {threshold} estancias.
          </p>
        )}
        <div className="flex items-center gap-2">
          <label htmlFor="threshold" className="text-gray-700">
            Threshold mínimo:
          </label>
          <input
            id="threshold"
            type="number"
            value={threshold}
            onChange={handleThresholdChange}
            min="1"
            className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
          />
          <span className="text-gray-600">estancias</span>
        </div>
      </div>
      
      <ChartTooltip
        visible={!!hoveredData}
        x={tooltipPosition.x}
        y={tooltipPosition.y}
      >
        {hoveredData && (
          <div>
            <div>Total estancias: {hoveredData.total_stays.toLocaleString()}</div>
            <div>Estancia promedio: {hoveredData.avg_stay_days.toFixed(2)} días</div>
          </div>
        )}
      </ChartTooltip>
    </div>
  );
} 