"use client";

import { useEffect, useState } from 'react';
import * as Plot from '@observablehq/plot';
import { AgeDistributionData } from '@/types';
import ChartTooltip from '@/components/ui/ChartTooltip';
import { useChartTooltip } from '@/hooks/useChartTooltip';

interface AgeDistributionChartProps {
  detailed: boolean;
}

export default function AgeDistributionChart({ detailed }: AgeDistributionChartProps) {
  const { hoveredData, tooltipPosition, showTooltip, containerRef } = useChartTooltip<AgeDistributionData>({ autoHide: true });
  const [data, setData] = useState<AgeDistributionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        const url = `${apiUrl}/api/charts/age-distribution${detailed ? '?detailed=true' : ''}`;
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error('Error al cargar datos');
        }

        const result = await response.json();
        setData(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [detailed]);

  useEffect(() => {
    if (!data.length || !containerRef.current) return;

    // Limpiar el contenedor
    containerRef.current.innerHTML = '';

    // Detectar si es modo detallado (muchas edades específicas)
    const isDetailed = data.length > 10;

    const plot = Plot.plot({
      width: 600,
      height: 400,
      marginLeft: isDetailed ? 47 : 66,
      marginBottom: 40,
      x: {
        label: "← hombres · pacientes · mujeres →",
        labelAnchor: "center",
        tickFormat: Math.abs
      },
      y: { 
        label: isDetailed ? "Edad" : "Grupos de edad",
        grid: isDetailed ? false : true, // Deshabilitamos grid automático para detailed
        axis: isDetailed ? null : undefined, // Solo deshabilitamos si es detailed
        // Para detailed, definir el dominio completo pero mostrar solo algunas etiquetas
        ...(isDetailed && {
          domain: data.map(d => d.age_group).filter((v, i, a) => a.indexOf(v) === i).sort((a, b) => parseInt(a) - parseInt(b))
        })
      },
      color: {
        domain: ["M", "F"],
        range: ["#3B82F6", "#EC4899"]
      },
      marks: [
        // Eje Y y Grid con etiquetas reducidas solo para detailed
        ...(isDetailed ? [
          Plot.gridY(["20", "25", "30", "35", "40", "45", "50", "55", "60", "65", "70", "75", "80", "85", "90"]),
          Plot.axisY(
            ["20", "25", "30", "35", "40", "45", "50", "55", "60", "65", "70", "75", "80", "85", "90"], 
            {label: "Edad"}
          )
        ] : []),
        Plot.areaX(data, {
          x: (d) => d.count * (d.gender === "M" ? -1 : 1),
          y: "age_group",
          fill: "gender"
        }),
        Plot.ruleX([0])
      ]
    });

    containerRef.current.appendChild(plot);

    // Añadir event listeners a las áreas para tooltips
    const areas = plot.querySelectorAll('path[fill]');
    areas.forEach((area) => {
      const handleMouseEvent = (e: Event) => {
        // Obtener el color del área para identificar el género
        const fill = area.getAttribute('fill');
        const isBlue = fill?.includes('#3B82F6') || fill?.includes('rgb(59, 130, 246)');
        const gender = isBlue ? 'M' : 'F';
        
        // Obtener la posición Y del mouse para identificar la edad
        const rect = area.getBoundingClientRect();
        const mouseY = (e as MouseEvent).clientY;
        const relativeY = mouseY - rect.top;
        const heightRatio = relativeY / rect.height;
        
        // Encontrar el dato más cercado en la posición
        const sortedData = data.filter(d => d.gender === gender);
        const index = Math.round(heightRatio * (sortedData.length - 1));
        const dataItem = sortedData[index];
        
        if (dataItem) {
          showTooltip(dataItem, (e as MouseEvent).clientX, (e as MouseEvent).clientY);
        }
      };

      area.addEventListener('mouseenter', handleMouseEvent);
      area.addEventListener('mousemove', handleMouseEvent);
      // Eliminar mouseleave manual - ahora lo maneja autoHide
    });

    return () => {
      plot.remove();
    };
  }, [data, containerRef, showTooltip]);

  if (loading) {
    return (
      <div className="relative">
        <div className="flex justify-center" style={{ width: '600px' }}>
          <div className="flex items-center justify-center w-full">
            <p className="text-gray-600">Cargando datos...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8 justify-center flex">
        <p className="text-red-600">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div ref={containerRef} className="w-full" />
      
      <ChartTooltip
        visible={!!hoveredData}
        x={tooltipPosition.x}
        y={tooltipPosition.y}
      >
        {hoveredData && (
          <div>
            <div className="font-medium">
              {hoveredData.gender === 'M' ? 'Hombres' : 'Mujeres'} - Edad {hoveredData.age_group}
            </div>
            <div>
              {hoveredData.count.toLocaleString()} pacientes
            </div>
          </div>
        )}
      </ChartTooltip>
    </div>
  );
} 