import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { WorkflowTrendDataPoint, UserActivityDataPoint } from '../types/bayora';

interface D3WorkflowChartsProps {
  workflowTrends: WorkflowTrendDataPoint[];
  userActivityTrends: UserActivityDataPoint[];
}

export const D3WorkflowCharts: React.FC<D3WorkflowChartsProps> = ({
  workflowTrends,
  userActivityTrends,
}) => {
  const [activeChart, setActiveChart] = useState<'completion' | 'activity'>('completion');
  const completionSvgRef = useRef<SVGSVGElement | null>(null);
  const activitySvgRef = useRef<SVGSVGElement | null>(null);

  // Hover state for interactive tooltips
  const [hoveredCompletion, setHoveredCompletion] = useState<WorkflowTrendDataPoint | null>(null);
  const [hoveredActivity, setHoveredActivity] = useState<UserActivityDataPoint | null>(null);

  // Render D3 Workflow Completion Rate Chart
  useEffect(() => {
    if (activeChart !== 'completion' || !completionSvgRef.current || workflowTrends.length === 0) {
      return;
    }

    const svg = d3.select(completionSvgRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 24, right: 32, bottom: 36, left: 44 };
    const width = 640;
    const height = 240;
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg
      .attr('viewBox', `0 0 ${width} ${height}`)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Parse dates
    const data = workflowTrends.map((d) => ({
      ...d,
      date: new Date(d.timestamp),
    }));

    // Scales
    const xScale = d3
      .scaleTime()
      .domain(d3.extent(data, (d) => d.date) as [Date, Date])
      .range([0, innerWidth]);

    const yScale = d3.scaleLinear().domain([60, 100]).range([innerHeight, 0]);

    // Grid lines
    g.append('g')
      .attr('class', 'grid')
      .call(
        d3
          .axisLeft(yScale)
          .ticks(4)
          .tickSize(-innerWidth)
          .tickFormat(() => '')
      )
      .selectAll('line')
      .attr('stroke', '#1E293B')
      .attr('stroke-dasharray', '2,3');

    // Axes
    const xAxis = d3
      .axisBottom(xScale)
      .ticks(d3.timeDay.every(1))
      .tickFormat((d) => d3.timeFormat('%b %d')(d as Date));

    const yAxis = d3
      .axisLeft(yScale)
      .ticks(4)
      .tickFormat((d) => `${d}%`);

    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis)
      .selectAll('text')
      .attr('fill', '#94A3B8')
      .attr('font-size', '11px')
      .attr('font-family', 'JetBrains Mono');

    g.append('g')
      .call(yAxis)
      .selectAll('text')
      .attr('fill', '#94A3B8')
      .attr('font-size', '11px')
      .attr('font-family', 'JetBrains Mono');

    g.selectAll('.domain').attr('stroke', '#334155');

    // Gradient definitions
    const defs = svg.append('defs');
    const areaGradient = defs
      .append('linearGradient')
      .attr('id', 'workflowAreaGradient')
      .attr('x1', '0')
      .attr('y1', '0')
      .attr('x2', '0')
      .attr('y2', '1');

    areaGradient.append('stop').attr('offset', '0%').attr('stop-color', '#38BDF8').attr('stop-opacity', 0.35);
    areaGradient.append('stop').attr('offset', '100%').attr('stop-color', '#38BDF8').attr('stop-opacity', 0.0);

    // Area
    const area = d3
      .area<(typeof data)[0]>()
      .x((d) => xScale(d.date))
      .y0(innerHeight)
      .y1((d) => yScale(d.completionRate))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(data)
      .attr('fill', 'url(#workflowAreaGradient)')
      .attr('d', area);

    // Line
    const line = d3
      .line<(typeof data)[0]>()
      .x((d) => xScale(d.date))
      .y((d) => yScale(d.completionRate))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', '#38BDF8')
      .attr('stroke-width', 2.5)
      .attr('d', line);

    // Data points & interactive hover target
    const circles = g
      .selectAll('.data-circle')
      .data(data)
      .enter()
      .append('circle')
      .attr('cx', (d) => xScale(d.date))
      .attr('cy', (d) => yScale(d.completionRate))
      .attr('r', 4.5)
      .attr('fill', '#0B0F17')
      .attr('stroke', '#38BDF8')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer');

    // Overlay for seamless hover
    const overlay = g
      .append('rect')
      .attr('width', innerWidth)
      .attr('height', innerHeight)
      .attr('fill', 'transparent')
      .style('cursor', 'crosshair');

    const bisectDate = d3.bisector<(typeof data)[0], Date>((d) => d.date).left;

    overlay.on('mousemove', (event) => {
      const [mouseX] = d3.pointer(event);
      const x0 = xScale.invert(mouseX);
      const index = bisectDate(data, x0, 1);
      const d0 = data[index - 1];
      const d1 = data[index];
      let d = d0;
      if (d1 && x0.getTime() - d0.date.getTime() > d1.date.getTime() - x0.getTime()) {
        d = d1;
      }
      setHoveredCompletion(d);
      circles.attr('r', (c) => (c === d ? 7 : 4.5));
    });

    overlay.on('mouseleave', () => {
      setHoveredCompletion(null);
      circles.attr('r', 4.5);
    });
  }, [activeChart, workflowTrends]);

  // Render D3 User Activity Trends Chart
  useEffect(() => {
    if (activeChart !== 'activity' || !activitySvgRef.current || userActivityTrends.length === 0) {
      return;
    }

    const svg = d3.select(activitySvgRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 24, right: 32, bottom: 36, left: 44 };
    const width = 640;
    const height = 240;
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg
      .attr('viewBox', `0 0 ${width} ${height}`)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const data = userActivityTrends.map((d) => ({
      ...d,
      date: new Date(d.timestamp),
    }));

    const xScale = d3
      .scaleTime()
      .domain(d3.extent(data, (d) => d.date) as [Date, Date])
      .range([0, innerWidth]);

    const maxVal = d3.max(data, (d) => Math.max(d.redTeamActions, d.blueTeamActions, d.auditorActions)) || 30;
    const yScale = d3.scaleLinear().domain([0, Math.ceil(maxVal * 1.15)]).range([innerHeight, 0]);

    // Grid lines
    g.append('g')
      .call(
        d3
          .axisLeft(yScale)
          .ticks(4)
          .tickSize(-innerWidth)
          .tickFormat(() => '')
      )
      .selectAll('line')
      .attr('stroke', '#1E293B')
      .attr('stroke-dasharray', '2,3');

    // Axes
    const xAxis = d3
      .axisBottom(xScale)
      .ticks(d3.timeDay.every(1))
      .tickFormat((d) => d3.timeFormat('%b %d')(d as Date));

    const yAxis = d3.axisLeft(yScale).ticks(4);

    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis)
      .selectAll('text')
      .attr('fill', '#94A3B8')
      .attr('font-size', '11px')
      .attr('font-family', 'JetBrains Mono');

    g.append('g')
      .call(yAxis)
      .selectAll('text')
      .attr('fill', '#94A3B8')
      .attr('font-size', '11px')
      .attr('font-family', 'JetBrains Mono');

    g.selectAll('.domain').attr('stroke', '#334155');

    // Line generators
    const lineRed = d3
      .line<(typeof data)[0]>()
      .x((d) => xScale(d.date))
      .y((d) => yScale(d.redTeamActions))
      .curve(d3.curveMonotoneX);

    const lineBlue = d3
      .line<(typeof data)[0]>()
      .x((d) => xScale(d.date))
      .y((d) => yScale(d.blueTeamActions))
      .curve(d3.curveMonotoneX);

    const lineAudit = d3
      .line<(typeof data)[0]>()
      .x((d) => xScale(d.date))
      .y((d) => yScale(d.auditorActions))
      .curve(d3.curveMonotoneX);

    // Draw lines
    g.append('path').datum(data).attr('fill', 'none').attr('stroke', '#FB7185').attr('stroke-width', 2).attr('d', lineRed);
    g.append('path').datum(data).attr('fill', 'none').attr('stroke', '#38BDF8').attr('stroke-width', 2).attr('d', lineBlue);
    g.append('path').datum(data).attr('fill', 'none').attr('stroke', '#FBBF24').attr('stroke-width', 2).attr('d', lineAudit);

    // Overlay for hover
    const overlay = g
      .append('rect')
      .attr('width', innerWidth)
      .attr('height', innerHeight)
      .attr('fill', 'transparent')
      .style('cursor', 'crosshair');

    const bisectDate = d3.bisector<(typeof data)[0], Date>((d) => d.date).left;

    overlay.on('mousemove', (event) => {
      const [mouseX] = d3.pointer(event);
      const x0 = xScale.invert(mouseX);
      const index = bisectDate(data, x0, 1);
      const d0 = data[index - 1];
      const d1 = data[index];
      let d = d0;
      if (d1 && x0.getTime() - d0.date.getTime() > d1.date.getTime() - x0.getTime()) {
        d = d1;
      }
      setHoveredActivity(d);
    });

    overlay.on('mouseleave', () => {
      setHoveredActivity(null);
    });
  }, [activeChart, userActivityTrends]);

  return (
    <div className="border border-slate-800 bg-[#111622] rounded-lg p-6 space-y-4">
      {/* Header and Toggle Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-sky-400">
            <span>D3.js Telemetry Engine</span>
            <span aria-hidden="true">·</span>
            <span>Performance & User Activity Monitoring</span>
          </div>
          <h3 className="text-base font-semibold text-slate-100 mt-0.5">
            {activeChart === 'completion'
              ? 'Workflow Task Completion Rates & Latency Trends'
              : 'Multi-Role User Activity & Boundary Actions'}
          </h3>
        </div>

        {/* Tab switcher using accessible segmented buttons */}
        <div className="flex items-center gap-1 p-1 bg-[#0B0F17] border border-slate-800 rounded-lg">
          <button
            type="button"
            onClick={() => setActiveChart('completion')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              activeChart === 'completion'
                ? 'bg-slate-800 text-slate-100 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Workflow Completion Rate
          </button>
          <button
            type="button"
            onClick={() => setActiveChart('activity')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              activeChart === 'activity'
                ? 'bg-slate-800 text-slate-100 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            User Activity Trends
          </button>
        </div>
      </div>

      {/* Main Chart Canvas and Info */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        <div className="lg:col-span-8 relative">
          {activeChart === 'completion' ? (
            <svg
              ref={completionSvgRef}
              className="w-full h-auto overflow-visible select-none"
              style={{ maxHeight: '240px' }}
            />
          ) : (
            <svg
              ref={activitySvgRef}
              className="w-full h-auto overflow-visible select-none"
              style={{ maxHeight: '240px' }}
            />
          )}
        </div>

        {/* Dynamic Tooltip / Summary Panel */}
        <div className="lg:col-span-4 bg-[#0B0F17] border border-slate-800 rounded-lg p-4 space-y-3 text-xs">
          {activeChart === 'completion' ? (
            <>
              <div className="font-semibold text-slate-200 border-b border-slate-800 pb-2 flex items-center justify-between">
                <span>Hover Telemetry Inspection</span>
                <span className="font-mono text-sky-400">
                  {hoveredCompletion ? hoveredCompletion.label : 'Latest Snapshot'}
                </span>
              </div>
              {(() => {
                const target = hoveredCompletion || workflowTrends[workflowTrends.length - 1];
                if (!target) return null;
                return (
                  <div className="space-y-2 font-mono tabular-nums">
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-sans">Task Completion Rate:</span>
                      <span className="text-emerald-400 font-semibold">{target.completionRate}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-sans">Completed Workflow Tasks:</span>
                      <span className="text-slate-200">{target.completedTasks}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-sans">Failed / Interrupted:</span>
                      <span className={target.failedTasks > 0 ? 'text-rose-400' : 'text-slate-400'}>
                        {target.failedTasks}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-sans">Average Runner Latency:</span>
                      <span className="text-slate-300">{target.avgLatencyMs} ms</span>
                    </div>
                  </div>
                );
              })()}
              <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 leading-relaxed font-sans">
                Monitored by rootless runner telemetry. All automated pipelines execute under strict 512 MB memory caps.
              </div>
            </>
          ) : (
            <>
              <div className="font-semibold text-slate-200 border-b border-slate-800 pb-2 flex items-center justify-between">
                <span>Role Action Breakdown</span>
                <span className="font-mono text-sky-400">
                  {hoveredActivity ? hoveredActivity.label : 'Latest Snapshot'}
                </span>
              </div>
              {(() => {
                const target = hoveredActivity || userActivityTrends[userActivityTrends.length - 1];
                if (!target) return null;
                return (
                  <div className="space-y-2 font-mono tabular-nums">
                    <div className="flex justify-between items-center">
                      <span className="text-rose-300 font-sans flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-rose-400 inline-block" />
                        Red Team Actions:
                      </span>
                      <span className="text-slate-200 font-semibold">{target.redTeamActions}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sky-300 font-sans flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-sky-400 inline-block" />
                        Blue Team Defenses:
                      </span>
                      <span className="text-slate-200 font-semibold">{target.blueTeamActions}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-amber-300 font-sans flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                        Auditor Verifications:
                      </span>
                      <span className="text-slate-200 font-semibold">{target.auditorActions}</span>
                    </div>
                    <div className="flex justify-between items-center pt-1 border-t border-slate-800/80">
                      <span className="text-purple-300 font-sans flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-purple-400 inline-block" />
                        Policy Denials Blocked:
                      </span>
                      <span className="text-purple-300 font-semibold">{target.policyDenials}</span>
                    </div>
                  </div>
                );
              })()}
              <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 leading-relaxed font-sans">
                Every action is attributed to a validated principal and sealed into the tamper-evident audit chain.
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
