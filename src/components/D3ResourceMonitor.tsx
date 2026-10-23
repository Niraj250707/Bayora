import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Cpu, Server, Activity, RefreshCw, Zap } from 'lucide-react';
import { CloudSandboxNode } from '../types/bayora';

interface D3ResourceMonitorProps {
  nodes: CloudSandboxNode[];
}

interface NodeResourceDatum {
  nodeId: string;
  region: string;
  cpuPct: number;
  gpuPct: number;
  memUsedMb: number;
  memLimitMb: number;
  pidsActive: number;
  pidsLimit: number;
  status: string;
}

export const D3ResourceMonitor: React.FC<D3ResourceMonitorProps> = ({ nodes }) => {
  const chartRef = useRef<SVGSVGElement | null>(null);
  const [hoveredNode, setHoveredNode] = useState<NodeResourceDatum | null>(null);
  const [simulatedLoad, setSimulatedLoad] = useState<number>(0);

  // Synthesize GPU & detailed metrics based on active container state
  const data: NodeResourceDatum[] = nodes.map((n, idx) => {
    const burst = idx === 0 ? simulatedLoad : 0;
    const cpuPct = Math.min(100, n.cpu_usage_pct + burst);
    // Deterministic GPU inference load simulation for AI crash testing
    const gpuPct = n.status === 'Active' ? Math.min(100, 42 + (n.cpu_usage_pct % 35) + burst) : 8;
    const memUsedMb = Math.min(n.memory_limit_mb, n.memory_used_mb + burst * 3);

    return {
      nodeId: n.node_id,
      region: n.region.split(' ')[0],
      cpuPct,
      gpuPct,
      memUsedMb,
      memLimitMb: n.memory_limit_mb,
      pidsActive: n.pids_active + (burst > 0 ? 4 : 0),
      pidsLimit: n.pids_limit,
      status: n.status,
    };
  });

  const handleSimulateBurst = () => {
    setSimulatedLoad((prev) => (prev > 0 ? 0 : 38));
  };

  useEffect(() => {
    if (!chartRef.current || data.length === 0) return;

    const svg = d3.select(chartRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 30, right: 30, bottom: 40, left: 60 };
    const width = 760 - margin.left - margin.right;
    const height = 240 - margin.top - margin.bottom;

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Group scales: X0 for Node names, X1 for CPU, GPU, Memory%
    const x0 = d3
      .scaleBand()
      .domain(data.map((d) => d.nodeId))
      .rangeRound([0, width])
      .paddingInner(0.25);

    const metrics = ['CPU Usage (%)', 'GPU Compute (%)', 'RAM Used (%)'];

    const x1 = d3
      .scaleBand()
      .domain(metrics)
      .rangeRound([0, x0.bandwidth()])
      .padding(0.08);

    const y = d3.scaleLinear().domain([0, 100]).nice().rangeRound([height, 0]);

    const color = d3
      .scaleOrdinal<string>()
      .domain(metrics)
      .range(['#38BDF8', '#818CF8', '#34D399']); // sky-400, indigo-400, emerald-400

    // Horizontal grid lines
    g.append('g')
      .attr('class', 'grid')
      .call(
        d3
          .axisLeft(y)
          .ticks(5)
          .tickSize(-width)
          .tickFormat(() => '')
      )
      .selectAll('line')
      .attr('stroke', '#1E293B')
      .attr('stroke-dasharray', '2,2');

    // Axes
    const xAxis = d3.axisBottom(x0);
    const yAxis = d3.axisLeft(y).ticks(5).tickFormat((d) => `${d}%`);

    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(xAxis)
      .selectAll('text')
      .attr('fill', '#94A3B8')
      .attr('font-size', '10px')
      .attr('font-family', 'JetBrains Mono, monospace');

    g.append('g')
      .call(yAxis)
      .selectAll('text')
      .attr('fill', '#94A3B8')
      .attr('font-size', '10px')
      .attr('font-family', 'JetBrains Mono, monospace');

    // Remove domain lines
    g.selectAll('.domain').attr('stroke', '#334155');

    // Bars
    const nodeGroups = g
      .selectAll('.node-group')
      .data(data)
      .enter()
      .append('g')
      .attr('class', 'node-group')
      .attr('transform', (d) => `translate(${x0(d.nodeId)},0)`);

    nodeGroups
      .selectAll('rect')
      .data((d) => [
        { metric: 'CPU Usage (%)', value: d.cpuPct, node: d },
        { metric: 'GPU Compute (%)', value: d.gpuPct, node: d },
        {
          metric: 'RAM Used (%)',
          value: Math.round((d.memUsedMb / d.memLimitMb) * 100),
          node: d,
        },
      ])
      .enter()
      .append('rect')
      .attr('x', (d) => x1(d.metric) || 0)
      .attr('y', (d) => y(d.value))
      .attr('width', x1.bandwidth())
      .attr('height', (d) => Math.max(0, height - y(d.value)))
      .attr('fill', (d) => color(d.metric))
      .attr('rx', 3)
      .attr('opacity', 0.88)
      .style('cursor', 'pointer')
      .on('mouseenter', function (event, d) {
        d3.select(this).attr('opacity', 1).attr('stroke', '#FFFFFF').attr('stroke-width', 1.5);
        setHoveredNode(d.node);
      })
      .on('mouseleave', function () {
        d3.select(this).attr('opacity', 0.88).attr('stroke', 'none');
        setHoveredNode(null);
      });

    // Value labels on top of bars
    nodeGroups
      .selectAll('.bar-label')
      .data((d) => [
        { metric: 'CPU Usage (%)', value: d.cpuPct },
        { metric: 'GPU Compute (%)', value: d.gpuPct },
        {
          metric: 'RAM Used (%)',
          value: Math.round((d.memUsedMb / d.memLimitMb) * 100),
        },
      ])
      .enter()
      .append('text')
      .attr('class', 'bar-label')
      .attr('x', (d) => (x1(d.metric) || 0) + x1.bandwidth() / 2)
      .attr('y', (d) => y(d.value) - 4)
      .attr('text-anchor', 'middle')
      .attr('fill', '#CBD5E1')
      .attr('font-size', '9px')
      .attr('font-family', 'JetBrains Mono, monospace')
      .text((d) => `${d.value}%`);
  }, [data, simulatedLoad]);

  return (
    <div className="border border-slate-800 bg-[#111622] rounded-lg p-5 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-sky-500/10 border border-sky-500/30 rounded-lg text-sky-400">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold font-mono text-white tracking-wide uppercase">
                Resource Monitor (D3.js Real-Time Telemetry)
              </h3>
              <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded border border-emerald-500/30 bg-emerald-950/40 text-emerald-300">
                Live cgroups Telemetry
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Multi-dimensional CPU cores, GPU accelerators, and ephemeral container RAM across active runner nodes.
            </p>
          </div>
        </div>

        {/* Legend & Simulation Controls */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-3 text-[11px] font-mono text-slate-300">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-sky-400" />
              <span>CPU</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-indigo-400" />
              <span>GPU (Tensor)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400" />
              <span>Memory</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSimulateBurst}
            className={`px-3 py-1.5 text-xs font-mono font-semibold rounded transition-all inline-flex items-center gap-1.5 border ${
              simulatedLoad > 0
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 shadow-sm'
                : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
            }`}
            title="Simulate burst workload injection on primary sandbox runner"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>{simulatedLoad > 0 ? 'Normal Telemetry' : 'Simulate Workload Burst'}</span>
          </button>
        </div>
      </div>

      {/* D3 Responsive Chart Container */}
      <div className="w-full overflow-x-auto bg-[#0B0F17] border border-slate-800 rounded-lg p-2">
        <svg
          ref={chartRef}
          viewBox="0 0 760 240"
          className="w-full h-56 select-none"
        />
      </div>

      {/* Node Metrics Cards Summary Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
        {data.map((node) => (
          <div
            key={node.nodeId}
            className={`p-3 rounded border text-xs font-mono transition-all ${
              hoveredNode?.nodeId === node.nodeId
                ? 'bg-slate-800/80 border-sky-400'
                : 'bg-[#0B0F17] border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
              <span className="font-bold text-white">{node.nodeId}</span>
              <span className="text-[10px] text-slate-400">{node.region}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-2 text-center">
              <div>
                <span className="text-[10px] text-slate-500 uppercase block">CPU</span>
                <span className="text-sm font-bold text-sky-400 tabular-nums">{node.cpuPct}%</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase block">GPU</span>
                <span className="text-sm font-bold text-indigo-400 tabular-nums">{node.gpuPct}%</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase block">Memory</span>
                <span className="text-sm font-bold text-emerald-400 tabular-nums">
                  {node.memUsedMb} <span className="text-[10px] text-slate-500">MB</span>
                </span>
              </div>
            </div>
            <div className="mt-2 text-[10px] text-slate-400 flex items-center justify-between">
              <span>PIDs: {node.pidsActive}/{node.pidsLimit}</span>
              <span className="text-emerald-400 font-semibold">{node.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
