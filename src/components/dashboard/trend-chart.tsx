'use client';

import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface TrendChartProps {
  data: number[];
  color?: string;
  height?: number;
  width?: number;
}

export function TrendChart({ 
  data, 
  color = '#8B9D83', 
  height = 40, 
  width = 100 
}: TrendChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || data.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 2, right: 2, bottom: 2, left: 2 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const xScale = d3
      .scaleLinear()
      .domain([0, data.length - 1])
      .range([0, innerWidth]);

    const yScale = d3
      .scaleLinear()
      .domain([Math.min(...data) * 0.95, Math.max(...data) * 1.05])
      .range([innerHeight, 0]);

    const line = d3
      .line<number>()
      .x((_, i) => xScale(i))
      .y((d) => yScale(d))
      .curve(d3.curveMonotoneX);

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Add gradient
    const gradient = svg
      .append('defs')
      .append('linearGradient')
      .attr('id', `gradient-${Math.random().toString(36).substr(2, 9)}`)
      .attr('gradientUnits', 'userSpaceOnUse')
      .attr('x1', 0)
      .attr('x2', 0)
      .attr('y1', 0)
      .attr('y2', innerHeight);

    gradient
      .append('stop')
      .attr('offset', '0%')
      .attr('stop-color', color)
      .attr('stop-opacity', 0.3);

    gradient
      .append('stop')
      .attr('offset', '100%')
      .attr('stop-color', color)
      .attr('stop-opacity', 0.05);

    // Add area
    const area = d3
      .area<number>()
      .x((_, i) => xScale(i))
      .y0(innerHeight)
      .y1((d) => yScale(d))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(data)
      .attr('fill', `url(#${gradient.attr('id')})`)
      .attr('d', area);

    // Add line
    g.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', color)
      .attr('stroke-width', 2)
      .attr('d', line);

  }, [data, color, height, width]);

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      className="overflow-visible"
    />
  );
}
