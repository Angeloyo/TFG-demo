"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import ChartTooltip from '@/components/ui/ChartTooltip';
import { useChartTooltip } from '@/hooks/useChartTooltip';

type Link = { source: string; target: string; value: number };
type ApiData = { nodes: string[]; links: Link[] };
type TooltipData = { source: string; target: string; value: number };

export default function HospitalTransfersChord() {
  const ref = useRef<SVGSVGElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ApiData | null>(null);
  const [minCount, setMinCount] = useState<number>(10);
  const [maxCount, setMaxCount] = useState<number>(1000);
  const { hoveredData, tooltipPosition, showTooltip, hideTooltip, updateTooltipPosition, containerRef } = useChartTooltip<TooltipData>({ autoHide: true });
  const rafIdRef = useRef<number | null>(null);

  // Mantener refs estables para evitar re-dibujos por cambios de funciones del hook
  const showRef = useRef(showTooltip);
  const hideRef = useRef(hideTooltip);
  const updatePosRef = useRef(updateTooltipPosition);
  useEffect(() => {
    showRef.current = showTooltip;
    hideRef.current = hideTooltip;
    updatePosRef.current = updateTooltipPosition;
  }, [showTooltip, hideTooltip, updateTooltipPosition]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        const res = await fetch(`${apiUrl}/api/charts/hospital-transfers-chord`);
        if (!res.ok) throw new Error('Error al cargar datos');
        const json: ApiData = await res.json();
        setData(json);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error desconocido');
      }
    };
    fetchData();
  }, []);

  const renderChart = useCallback((data: ApiData) => {
    if (!ref.current) return;

    const width = 800;
    const height = width;
    const innerRadius = Math.min(width, height) * 0.5 - 20;
    const outerRadius = innerRadius + 6;

    const names = data.nodes;
    const index = new Map(names.map((n, i) => [n, i]));
    const n = names.length;
    const matrix: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
    for (const { source, target, value } of data.links) {
      const i = index.get(source);
      const j = index.get(target);
      if (i == null || j == null) continue;
      matrix[i][j] += value;
    }

    const svg = d3.select(ref.current);
    svg.selectAll('*').remove();
    svg
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `${-width / 2} ${-height / 2} ${width} ${height}`)
      .style('width', '100%')
      .style('height', 'auto')
      .style('font', '10px sans-serif');

    const chord = d3
      .chordDirected()
      .padAngle(12 / innerRadius)
      .sortSubgroups(d3.descending)
      .sortChords(d3.descending);

    const arc = d3.arc<d3.ChordGroup>().innerRadius(innerRadius).outerRadius(outerRadius);
    const ribbon = d3.ribbonArrow().radius(innerRadius - 0.5).padAngle(1 / innerRadius);
    const ribbonPath = (d: d3.Chord) => (ribbon as unknown as (d: d3.Chord) => string)(d);
    const colors = d3.schemeTableau10;

    const chords = chord(matrix) as d3.Chords;

    const ribbons = svg
      .append('g')
      .attr('fill-opacity', 0.75)
      .selectAll<SVGPathElement, d3.Chord>('path')
      .data(chords)
      .join('path')
      .attr('d', ribbonPath)
      .attr('fill', (d) => colors[d.target.index % colors.length])
      // Mezclas de color pueden ser costosas; las quitamos para fluidez
      .style('mix-blend-mode', null as unknown as string);

    ribbons
      .on('mouseenter', (event: MouseEvent, d: d3.Chord) => {
        const td: TooltipData = {
          source: names[d.source.index],
          target: names[d.target.index],
          value: d.source.value as number,
        };
        showTooltip(td, event.clientX, event.clientY);
      })
      .on('mousemove', (event: MouseEvent) => {
        if (rafIdRef.current != null) return;
        rafIdRef.current = requestAnimationFrame(() => {
          updatePosRef.current(event.clientX, event.clientY);
          rafIdRef.current = null;
        });
      })
      .on('mouseleave', () => hideTooltip());

    const g = svg.append('g').selectAll<SVGGElement, d3.ChordGroup>('g').data(chords.groups).join('g');

    g.append('path')
      .attr('d', arc)
      .attr('fill', (d) => colors[d.index % colors.length])
      .attr('stroke', '#fff');

    g.append('title')
      .text((d) => `${names[d.index]}\nTotal out: ${d3.sum(matrix[d.index])}\nTotal in: ${d3.sum(matrix, (row) => row[d.index])}`);
  }, [hideTooltip, showTooltip]);

  useEffect(() => {
    if (!data) return;
    const filteredLinks = data.links.filter(l => l.value >= minCount && l.value <= maxCount);
    if (filteredLinks.length === 0) {
      if (ref.current) d3.select(ref.current).selectAll('*').remove();
      return;
    }

    const names = Array.from(new Set([
      ...filteredLinks.map(d => d.source),
      ...filteredLinks.map(d => d.target),
    ]));
    renderChart({ nodes: names, links: filteredLinks });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, minCount, maxCount]);

  if (error) {
    return <div className="text-red-600">Error: {error}</div>;
  }

  return (
    <div className="w-full" ref={containerRef}>
      <svg ref={ref} />
      <div className="mt-4 flex items-center gap-4 justify-center">
        <div className="flex items-center gap-2">
          <label htmlFor="min-count" className="text-gray-700 text-sm">Mín (count):</label>
          <input
            id="min-count"
            type="number"
            min={0}
            value={minCount}
            onChange={(e) => setMinCount(Math.max(0, parseInt(e.target.value || '0', 10)))}
            className="w-24 px-2 py-1 border border-gray-300 rounded text-center text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="max-count" className="text-gray-700 text-sm">Máx (count):</label>
          <input
            id="max-count"
            type="number"
            min={0}
            value={Number.isFinite(maxCount) ? maxCount : ''}
            onChange={(e) => {
              const val = e.target.value === '' ? Number.MAX_SAFE_INTEGER : Math.max(0, parseInt(e.target.value || '0', 10));
              setMaxCount(val);
            }}
            placeholder="∞"
            className="w-24 px-2 py-1 border border-gray-300 rounded text-center text-sm"
          />
        </div>
      </div>
      <ChartTooltip
        visible={!!hoveredData}
        x={tooltipPosition.x}
        y={tooltipPosition.y}
      >
        {hoveredData && (
          <div className="space-y-1">
            <div className="text-sm font-semibold">{hoveredData.source} → {hoveredData.target}</div>
            <div className="text-sm">Transiciones: {hoveredData.value.toLocaleString()}</div>
          </div>
        )}
      </ChartTooltip>
    </div>
  );
}


