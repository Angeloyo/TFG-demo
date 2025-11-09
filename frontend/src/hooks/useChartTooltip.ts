import { useState, useEffect, useRef } from 'react';

interface UseChartTooltipOptions {
  autoHide?: boolean; // Ocultar automáticamente cuando el mouse no esté sobre elementos del gráfico
}

export function useChartTooltip<T>(options: UseChartTooltipOptions = {}) {
  const [hoveredData, setHoveredData] = useState<T | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const showTooltip = (data: T, x: number, y: number) => {
    setHoveredData(data);
    setTooltipPosition({ x, y });
  };

  const hideTooltip = () => {
    setHoveredData(null);
  };

  const updateTooltipPosition = (x: number, y: number) => {
    setTooltipPosition({ x, y });
  };

  // Global mousemove listener para auto-hide
  useEffect(() => {
    if (!options.autoHide) return;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      const target = e.target as Element;
      // Si no estamos sobre un rect del gráfico o no está dentro del contenedor
      if (!target.closest('rect, path[fill]') || !containerRef.current?.contains(target)) {
        hideTooltip();
      }
    };
    
    document.addEventListener('mousemove', handleGlobalMouseMove);
    return () => document.removeEventListener('mousemove', handleGlobalMouseMove);
  }, [options.autoHide]);

  return {
    hoveredData,
    tooltipPosition,
    showTooltip,
    hideTooltip,
    updateTooltipPosition,
    containerRef // Devolver el ref para que el componente lo use
  };
} 