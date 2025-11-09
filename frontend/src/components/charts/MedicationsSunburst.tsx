"use client";

import { useEffect, useState } from 'react';
import * as d3 from 'd3';
import { MedicationsTreemapResponse, MedicationsTreemapRoute } from '@/types';
import ChartTooltip from '@/components/ui/ChartTooltip';
import { useChartTooltip } from '@/hooks/useChartTooltip';

interface SunNode { name: string; value?: number; children?: SunNode[] }
type RectNode = d3.HierarchyRectangularNode<SunNode>;
type PolarRect = { x0: number; x1: number; y0: number; y1: number };

interface TooltipData {
  name: string;
  value: number;
  fullPath: string;
}

export default function MedicationsSunburst() {
  const { hoveredData, tooltipPosition, showTooltip, hideTooltip, containerRef } = useChartTooltip<TooltipData>({ autoHide: true });
  const [routes, setRoutes] = useState<MedicationsTreemapRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [threshold, setThreshold] = useState<number>(100);
  const [maxThreshold, setMaxThreshold] = useState<number>(1000);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        const res = await fetch(`${apiUrl}/api/charts/medications-sunburst`);
        if (!res.ok) throw new Error('Error al cargar datos');
        const json: MedicationsTreemapResponse = await res.json();
        setRoutes(json.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !routes.length) return;

    // Build hierarchy: route -> drug
    const filtered = routes
      .map((r) => ({
        route: r.route,
        total: r.total,
        drugs: r.drugs.filter((d) => d.count >= threshold && d.count <= maxThreshold)
      }))
      .filter((r) => r.drugs.length > 0);

    if (!filtered.length) {
      container.innerHTML = '';
      return;
    }

    const rootData: SunNode = {
      name: 'routes',
      children: filtered.map((r) => ({
        name: r.route || 'Unknown',
        children: r.drugs.map((d) => ({ name: d.drug || 'Unknown', value: d.count }))
      }))
    };

    const width = 928;
    const height = width;
    const radius = width / 6;

    const color = d3.scaleOrdinal<string, string>(
      d3.quantize(d3.interpolateRainbow, (rootData.children?.length || 0) + 1)
    );

    const hierarchy = d3.hierarchy<SunNode>(rootData)
      .sum((d) => (d.children && d.children.length ? 0 : (d.value || 0)))
      .sort((a, b) => (b.value || 0) - (a.value || 0));

    const root = d3.partition<SunNode>()
      .size([2 * Math.PI, (hierarchy.height || 0) + 1])(hierarchy) as RectNode;

    root.each((d) => ((d as unknown as { current: PolarRect }).current = { x0: d.x0, x1: d.x1, y0: d.y0, y1: d.y1 }));

    const arc = d3.arc<PolarRect>()
      .startAngle((d) => d.x0)
      .endAngle((d) => d.x1)
      .padAngle((d) => Math.min((d.x1 - d.x0) / 2, 0.005))
      .padRadius(radius * 1.5)
      .innerRadius((d) => d.y0 * radius)
      .outerRadius((d) => Math.max(d.y0 * radius, d.y1 * radius - 1));

    function arcVisible(d: PolarRect) {
      return d.y1 <= 3 && d.y0 >= 1 && d.x1 > d.x0;
    }

    function labelVisible(d: PolarRect) {
      return d.y1 <= 3 && d.y0 >= 1 && (d.y1 - d.y0) * (d.x1 - d.x0) > 0.03;
    }

    function labelTransform(d: PolarRect) {
      const x = ((d.x0 + d.x1) / 2) * (180 / Math.PI);
      const y = ((d.y0 + d.y1) / 2) * radius;
      return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
    }

    const svg = d3
      .create('svg')
      .attr('viewBox', [-width / 2, -height / 2, width, width].toString())
      .style('font', '10px sans-serif');

    const path = svg
      .append('g')
      .selectAll<SVGPathElement, RectNode>('path')
      .data(root.descendants().slice(1) as RectNode[])
      .join('path')
      .attr('fill', (d) => {
        let p: RectNode = d;
        while (p.depth > 1 && p.parent) p = p.parent as RectNode;
        return color(String(p.data.name));
      })
      .attr('fill-opacity', (d) => (arcVisible((d as unknown as { current: PolarRect }).current) ? (d.children ? 0.6 : 0.4) : 0))
      .attr('pointer-events', (d) => (arcVisible((d as unknown as { current: PolarRect }).current) ? 'auto' : 'none'))
      .attr('d', (d) => arc((d as unknown as { current: PolarRect }).current) as string);

    // Click primero (exactamente como el ejemplo base)
    path
      .filter((d) => Boolean(d.children))
      .style('cursor', 'pointer')
      .on('click', (event, d) => clicked(event as MouseEvent & { altKey: boolean }, d as RectNode));

    // Tooltip a nivel del SVG para no interferir con el click de los paths
    svg
      .on('mousemove', function(event: MouseEvent) {
        const target = event.target as Element;
        if (target && target.tagName.toLowerCase() === 'path') {
          const sel = d3.select(target as SVGPathElement);
          const datum = sel.datum() as RectNode;
          const tooltipData: TooltipData = {
            name: String(datum.data.name),
            value: datum.value || 0,
            fullPath: datum.ancestors().map((a: RectNode) => String(a.data.name)).reverse().join(' / ')
          };
          showTooltip(tooltipData, event.clientX, event.clientY);
        } else {
          hideTooltip();
        }
      })
      .on('mouseleave', function() {
        hideTooltip();
      });

    // Nota: no re-asignamos on('click') para no sobrescribir el anterior

    const label = svg
      .append('g')
      .attr('pointer-events', 'none')
      .attr('text-anchor', 'middle')
      .style('user-select', 'none')
      .selectAll<SVGTextElement, RectNode>('text')
      .data(root.descendants().slice(1) as RectNode[])
      .join('text')
      .attr('dy', '0.35em')
      .attr('fill-opacity', (d) => +labelVisible((d as unknown as { current: PolarRect }).current))
      .attr('transform', (d) => labelTransform((d as unknown as { current: PolarRect }).current))
      .text((d) => String(d.data.name));

    const parent = svg
      .append('circle')
      .datum(root)
      .attr('r', radius)
      .attr('fill', 'none')
      .attr('pointer-events', 'all')
      .on('click', (event) => clicked(event as MouseEvent & { altKey: boolean }, root));

    function clicked(event: MouseEvent & { altKey: boolean }, p: RectNode): void {
      parent.datum(p.parent || root);

      root.each((d) => {
        (d as unknown as { target: PolarRect }).target = {
          x0: Math.max(0, Math.min(1, (d.x0 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
          x1: Math.max(0, Math.min(1, (d.x1 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
          y0: Math.max(0, d.y0 - p.depth),
          y1: Math.max(0, d.y1 - p.depth)
        };
      });

      const tt = d3.transition().duration(event.altKey ? 7500 : 750);

      path
        .transition(tt)
        .tween('data', (d: RectNode) => {
          const i = d3.interpolate((d as unknown as { current: PolarRect }).current, (d as unknown as { target: PolarRect }).target!);
          return (t2: number) => (((d as unknown as { current: PolarRect }).current) = i(t2));
        })
        .filter(function (this: SVGPathElement, d: RectNode) {
          return +this.getAttribute('fill-opacity')! > 0 || arcVisible((d as unknown as { target: PolarRect }).target!);
        })
        .attr('fill-opacity', (d: RectNode) => (arcVisible((d as unknown as { target: PolarRect }).target!) ? (d.children ? 0.6 : 0.4) : 0))
        .attrTween('d', (d: RectNode) => () => (arc((d as unknown as { current: PolarRect }).current) || ''));

      label
        .filter(function (this: SVGTextElement, d: RectNode) {
          return +this.getAttribute('fill-opacity')! > 0 || labelVisible((d as unknown as { target: PolarRect }).target!);
        })
        .transition(tt)
        .attr('fill-opacity', (d: RectNode) => +labelVisible((d as unknown as { target: PolarRect }).target!))
        .attrTween('transform', (d: RectNode) => () => labelTransform((d as unknown as { current: PolarRect }).current));
    }

    container.innerHTML = '';
    container.appendChild(svg.node() as SVGSVGElement);

    return () => {
      container.innerHTML = '';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routes, threshold, maxThreshold]);

  if (loading) return <div className="w-full h-64" />;
  if (error) return <p className="text-red-600">Error: {error}</p>;
  return (
    <div className="relative w-full">
      <div ref={containerRef} />
      
      <ChartTooltip
        visible={!!hoveredData}
        x={tooltipPosition.x}
        y={tooltipPosition.y}
      >
        {hoveredData && (
          <div className="space-y-1">
            <div className="text-sm font-semibold">{hoveredData.name}</div>
            {/* <div className="text-sm text-gray-300">{hoveredData.fullPath}</div> */}
            <div className="text-sm">Count: {hoveredData.value.toLocaleString()}</div>
          </div>
        )}
      </ChartTooltip>
      
      <div className="mt-4 flex items-center gap-4 flex-wrap justify-center mt-10">
        <div className="flex items-center gap-2">
          <label htmlFor="sun-threshold" className="text-gray-700 text-sm">Mín (count):</label>
          <input
            id="sun-threshold"
            type="number"
            min={0}
            value={threshold}
            onChange={(e) => setThreshold(Math.max(0, parseInt(e.target.value || '0', 10)))}
            className="w-24 px-2 py-1 border border-gray-300 rounded text-center text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="sun-max-threshold" className="text-gray-700 text-sm">Máx (count):</label>
          <input
            id="sun-max-threshold"
            type="number"
            min={0}
            value={Number.isFinite(maxThreshold) ? maxThreshold : ''}
            onChange={(e) => {
              const val = e.target.value === '' ? Number.MAX_SAFE_INTEGER : Math.max(0, parseInt(e.target.value || '0', 10));
              setMaxThreshold(val);
            }}
            placeholder="∞"
            className="w-24 px-2 py-1 border border-gray-300 rounded text-center text-sm"
          />
        </div>
      </div>
    </div>
  );
}


