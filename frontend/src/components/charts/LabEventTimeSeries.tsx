"use client";

import { useEffect, useRef } from 'react';
import * as Plot from '@observablehq/plot';
import { LabEvent } from '@/types';

interface LabEventTimeSeriesProps {
  labevents: LabEvent[];
  testName: string;
}

export default function LabEventTimeSeries({ labevents, testName }: LabEventTimeSeriesProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Filtrar solo eventos numéricos del test específico
  const numericEvents = labevents.filter(event => 
    event.label === testName && 
    event.valuenum !== null && 
    event.valuenum !== undefined
  );

  useEffect(() => {
    if (!numericEvents.length || !containerRef.current) return;

    // Limpiar el contenedor
    containerRef.current.innerHTML = '';

    // Si no hay datos suficientes, mostrar mensaje
    if (numericEvents.length < 2) {
      containerRef.current.innerHTML = '<p class="text-gray-500 text-sm p-4">Datos insuficientes para serie temporal</p>';
      return;
    }

    // Unidad dinámica desde el primer evento disponible
    const unit = numericEvents.find(e => e.valueuom)?.valueuom || '';

    const plot = Plot.plot({
    //   title: `Serie temporal: ${testName}`,
      width: 750,
      height: 350,
      marginLeft: 60,
      marginBottom: 50,
      marginTop: 30,
      x: {
        type: "time",
        label: "Fecha",
      },
      y: {
        label: unit ? `Valor (${unit})` : "Valor",
        grid: true
      },

      marks: [
        // Línea conectando los puntos con tooltip interactivo
        Plot.lineY(numericEvents, {
          x: d => new Date(d.charttime),
          y: "valuenum",
          stroke: "#6b7280", // gris
          strokeWidth: 2,
          tip: true,
          title: d => `${new Date(d.charttime).toLocaleString()}\n${d.valuenum} ${d.valueuom || ''}\n${d.flag ? 'Anormal' : 'Normal'}\n${d.comments || 'No comments'}`
        }),
        // Bandas de referencia si existen
        ...(numericEvents[0]?.ref_range_lower !== null && numericEvents[0]?.ref_range_upper !== null 
          ? [
              Plot.ruleY([numericEvents[0].ref_range_lower], { stroke: "#dc2626", strokeDasharray: "4,4" }),
              Plot.ruleY([numericEvents[0].ref_range_upper], { stroke: "#dc2626", strokeDasharray: "4,4" })
            ] 
          : [])
      ]
    });

    containerRef.current.appendChild(plot);

    // Cleanup
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [numericEvents, testName]);

  if (!numericEvents.length) {
    return (
      <div className="p-4 text-center text-gray-500">
        No hay datos numéricos para {testName}
      </div>
    );
  }

  return <div ref={containerRef} className="w-full" />;
}
