'use client';

import { useState } from 'react';
import {
    Sparkles, ArrowLeft, Loader2, MapIcon, Clock, BookOpen,
    ExternalLink, CheckCircle2, Circle, X
} from 'lucide-react';
import Link from 'next/link';

interface RoadmapNode {
    title: string;
    description: string;
    detailed_summary: string;
    node_type: string;
    estimated_hours: number;
    order_index: number;
    resources: { title: string; url: string; type: string }[];
}

interface GeneratedRoadmap {
    roadmap_title: string;
    roadmap_description: string;
    estimated_weeks: number;
    nodes: RoadmapNode[];
}

const POPULAR_TOPICS = [
    'Full Stack Developer', 'Data Scientist', 'DevOps Engineer',
    'Machine Learning', 'Mobile App Developer', 'UI/UX Designer',
    'Cloud Architect', 'Cybersecurity',
];

// ── Layout constants ──────────────────────────────────────────────
const NW = 144;   // node width
const NH = 44;    // node height
const NR = 10;    // node border-radius
const ROW_GAP = 130;   // vertical spacing between rows
const COL_GAP = 170;   // horizontal spacing between siblings
const PAD_X = 60;

// Node row colours (root → leaf)
const ROW_COLORS = [
    { fill: '#0f172a', text: '#ffffff', ring: '#334155' },
    { fill: '#4f46e5', text: '#ffffff', ring: '#6366f1' },
    { fill: '#7c3aed', text: '#ffffff', ring: '#8b5cf6' },
    { fill: '#db2777', text: '#ffffff', ring: '#ec4899' },
    { fill: '#0891b2', text: '#ffffff', ring: '#06b6d4' },
];

function rowColor(ri: number) {
    return ROW_COLORS[Math.min(ri, ROW_COLORS.length - 1)];
}

/** Group a flat list into a tree-level array.
 *  Row 0 → root (1 node)
 *  Row 1 → up to 4 nodes
 *  Row 2+ → remainder split into groups
 */
function groupNodes(nodes: RoadmapNode[]): RoadmapNode[][] {
    if (!nodes.length) return [];
    const rows: RoadmapNode[][] = [[nodes[0]]];        // root
    const rest = nodes.slice(1);
    if (!rest.length) return rows;

    // Row 1: up to 4 nodes
    const r1Size = Math.min(4, rest.length);
    rows.push(rest.slice(0, r1Size));
    if (rest.length <= r1Size) return rows;

    // Remaining: split into approx 4-node groups
    const tail = rest.slice(r1Size);
    const chunkSize = Math.ceil(tail.length / Math.ceil(tail.length / 4));
    for (let i = 0; i < tail.length; i += chunkSize) {
        rows.push(tail.slice(i, i + chunkSize));
    }
    return rows;
}

/** Compute SVG x position of node at (row ri, col ci, total cols in row) */
function nodeX(ci: number, total: number, svgW: number): number {
    const totalWidth = (total - 1) * COL_GAP + NW;
    const startX = (svgW - totalWidth) / 2;
    return startX + ci * COL_GAP;
}

function nodeY(ri: number): number {
    return PAD_X + ri * ROW_GAP;
}

export function RoadmapsContent() {
    const [form, setForm] = useState({ topic: '', experience: 'beginner', hours: '2', weeks: '12' });
    const [loading, setLoading] = useState(false);
    const [roadmap, setRoadmap] = useState<GeneratedRoadmap | null>(null);
    const [selected, setSelected] = useState<number | null>(null); // flat node index
    const [done, setDone] = useState<Set<number>>(new Set());
    const [error, setError] = useState('');

    const generate = async () => {
        if (!form.topic.trim()) return;
        setLoading(true); setError(''); setRoadmap(null); setSelected(null); setDone(new Set());
        try {
            const res = await fetch('/api/ai/generate-roadmap', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    target_role: form.topic,
                    experience_level: form.experience,
                    daily_hours: parseInt(form.hours),
                    target_weeks: parseInt(form.weeks),
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Generation failed');
            setRoadmap(data);
        } catch (e: any) {
            setError(e.message || 'Failed to generate roadmap.');
        } finally { setLoading(false); }
    };

    const toggleDone = (i: number) => {
        setDone(prev => { const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n; });
    };

    const nodes = roadmap?.nodes ?? [];
    const groups = groupNodes(nodes);

    // Compute SVG width based on widest row
    const maxCols = groups.length ? Math.max(...groups.map(g => g.length)) : 0;
    const SVG_W = Math.max(720, maxCols * COL_GAP + NW + PAD_X * 2);
    const SVG_H = groups.length ? PAD_X + groups.length * ROW_GAP + NH + PAD_X : 500;

    // Build flat-index lookup for each node in groups
    const nodeIndex = new Map<RoadmapNode, number>();
    nodes.forEach((n, i) => nodeIndex.set(n, i));

    // Compute all node positions
    const positions = new Map<number, { x: number; y: number }>();
    groups.forEach((row, ri) => {
        row.forEach((node, ci) => {
            const idx = nodeIndex.get(node) ?? 0;
            positions.set(idx, { x: nodeX(ci, row.length, SVG_W), y: nodeY(ri) });
        });
    });

    const progress = nodes.length ? Math.round((done.size / nodes.length) * 100) : 0;
    const sel = selected !== null ? nodes[selected] : null;

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 px-4 md:px-8 py-3.5 sticky top-0 z-20">
                <div className="max-w-6xl mx-auto flex items-center gap-3">
                    <Link href="/dashboard/student" className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                        <ArrowLeft size={18} className="text-slate-600" />
                    </Link>
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                        <MapIcon size={18} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-sm font-bold text-slate-900">AI Roadmap Generator</h1>
                        <p className="text-xs text-slate-400">Visual tree-based learning paths</p>
                    </div>
                    {roadmap && (
                        <button onClick={() => { setRoadmap(null); setSelected(null); }}
                            className="ml-auto text-xs text-indigo-600 font-semibold px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors">
                            ← New Roadmap
                        </button>
                    )}
                </div>
            </header>

            {!roadmap ? (
                /* ── Generator form ── */
                <div className="max-w-2xl mx-auto px-4 py-12">
                    <div className="text-center mb-10">
                        <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/20">
                            <Sparkles size={28} className="text-white" />
                        </div>
                        <h2 className="text-3xl font-bold text-slate-900 mb-2">Generate Your Roadmap</h2>
                        <p className="text-slate-500">Type any role — AI builds a visual tree-style learning path.</p>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mb-6">
                        <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wider">
                            What do you want to learn or become?
                        </label>
                        <div className="flex gap-2 mb-4">
                            <input
                                value={form.topic}
                                onChange={e => setForm(f => ({ ...f, topic: e.target.value }))}
                                onKeyDown={e => { if (e.key === 'Enter') generate(); }}
                                placeholder="e.g. Full Stack Developer, Data Scientist, DevOps..."
                                className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
                            />
                            <button onClick={generate} disabled={!form.topic.trim() || loading}
                                className="px-5 py-3 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 disabled:opacity-40 transition-colors flex items-center gap-2 flex-shrink-0">
                                {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                                Generate
                            </button>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { label: 'Experience', key: 'experience', opts: [['beginner', 'Beginner'], ['intermediate', 'Intermediate'], ['advanced', 'Advanced']] },
                                { label: 'Hours/day', key: 'hours', opts: ['1', '2', '3', '4', '5', '6', '8'].map(h => [h, `${h}h`]) },
                                { label: 'Target weeks', key: 'weeks', opts: ['4', '8', '12', '16', '24', '52'].map(w => [w, `${w}w`]) },
                            ].map(({ label, key, opts }) => (
                                <div key={key}>
                                    <label className="block text-xs text-slate-500 mb-1">{label}</label>
                                    <select value={(form as any)[key]}
                                        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400 bg-white">
                                        {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                                    </select>
                                </div>
                            ))}
                        </div>
                    </div>

                    {error && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 mb-6">{error}</div>}

                    <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Popular topics</p>
                        <div className="flex flex-wrap gap-2">
                            {POPULAR_TOPICS.map(t => (
                                <button key={t} onClick={() => setForm(f => ({ ...f, topic: t }))}
                                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 hover:border-indigo-300 hover:text-indigo-700 hover:bg-indigo-50 transition-all">
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                /* ── Tree roadmap view ── */
                <div className="max-w-6xl mx-auto px-4 py-6">
                    {/* Info bar */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-4 shadow-sm">
                        <h2 className="text-lg font-bold text-slate-900 mb-1">{roadmap.roadmap_title}</h2>
                        <p className="text-sm text-slate-500 mb-3">{roadmap.roadmap_description}</p>
                        <div className="flex items-center gap-4 text-xs text-slate-500 mb-3">
                            <span className="flex items-center gap-1"><Clock size={12} />{roadmap.estimated_weeks} weeks</span>
                            <span className="flex items-center gap-1"><BookOpen size={12} />{nodes.length} steps</span>
                            <span className="text-indigo-500 font-medium">Click any node to see details</span>
                        </div>
                        <div className="flex justify-between text-xs mb-1">
                            <span className="text-slate-500">Progress</span>
                            <span className="font-bold text-indigo-600">{done.size}/{nodes.length} complete</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                        </div>
                    </div>

                    <div className="flex gap-4 items-start">
                        {/* SVG Tree Canvas */}
                        <div className="flex-1 min-w-0 bg-white border border-slate-200 rounded-2xl overflow-auto shadow-sm">
                            <svg
                                width={SVG_W}
                                height={SVG_H}
                                viewBox={`0 0 ${SVG_W} ${SVG_H}`}
                                className="w-full"
                                style={{ minWidth: Math.min(SVG_W, 480) }}
                            >
                                <defs>
                                    <marker id="arr" markerWidth="8" markerHeight="6"
                                        refX="8" refY="3" orient="auto">
                                        <polygon points="0 0, 8 3, 0 6" fill="#94a3b8" />
                                    </marker>
                                    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                                        <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#0000001a" />
                                    </filter>
                                </defs>

                                {/* ── Connector arrows ── */}
                                {groups.map((row, ri) => {
                                    if (ri === 0) return null;
                                    const prevRow = groups[ri - 1];
                                    const lines: React.ReactNode[] = [];

                                    // Fan: each node in prevRow connects proportionally to current row
                                    const ratio = row.length / prevRow.length;
                                    prevRow.forEach((pNode, pi) => {
                                        const pIdx = nodeIndex.get(pNode) ?? 0;
                                        const from = positions.get(pIdx)!;
                                        const fromX = from.x + NW / 2;
                                        const fromY = from.y + NH;

                                        const childStart = Math.round(pi * ratio);
                                        const childEnd = Math.round((pi + 1) * ratio);
                                        const children = row.slice(childStart, Math.max(childEnd, childStart + 1));

                                        children.forEach((cNode, ci) => {
                                            const cIdx = nodeIndex.get(cNode) ?? 0;
                                            const to = positions.get(cIdx)!;
                                            const toX = to.x + NW / 2;
                                            const toY = to.y - 2;

                                            const midY = (fromY + toY) / 2;
                                            lines.push(
                                                <path
                                                    key={`${pi}-${ci}`}
                                                    d={`M ${fromX} ${fromY} C ${fromX} ${midY}, ${toX} ${midY}, ${toX} ${toY}`}
                                                    fill="none"
                                                    stroke="#cbd5e1"
                                                    strokeWidth={1.8}
                                                    markerEnd="url(#arr)"
                                                />
                                            );
                                        });
                                    });
                                    return <g key={ri}>{lines}</g>;
                                })}

                                {/* ── Nodes ── */}
                                {groups.map((row, ri) => {
                                    const { fill, text, ring } = rowColor(ri);
                                    return row.map((node, ci) => {
                                        const globalIdx = nodeIndex.get(node) ?? 0;
                                        const pos = positions.get(globalIdx)!;
                                        const isSelected = selected === globalIdx;
                                        const completed = done.has(globalIdx);

                                        const nodeFill = completed ? '#10b981' : fill;
                                        const strokeColor = isSelected ? '#fbbf24' : ring;

                                        return (
                                            <g key={globalIdx}
                                                onClick={() => setSelected(isSelected ? null : globalIdx)}
                                                style={{ cursor: 'pointer' }}
                                                filter={isSelected ? 'url(#shadow)' : undefined}
                                            >
                                                {/* Selection halo */}
                                                {isSelected && (
                                                    <rect
                                                        x={pos.x - 4} y={pos.y - 4}
                                                        width={NW + 8} height={NH + 8}
                                                        rx={NR + 4}
                                                        fill="none"
                                                        stroke="#fbbf24"
                                                        strokeWidth={2.5}
                                                        opacity={0.7}
                                                    />
                                                )}

                                                {/* Node rect */}
                                                <rect
                                                    x={pos.x} y={pos.y}
                                                    width={NW} height={NH}
                                                    rx={NR}
                                                    fill={nodeFill}
                                                    stroke={strokeColor}
                                                    strokeWidth={1.5}
                                                />

                                                {/* Step badge */}
                                                <rect
                                                    x={pos.x + 8} y={pos.y + 8}
                                                    width={20} height={16}
                                                    rx={4}
                                                    fill="rgba(255,255,255,0.2)"
                                                />
                                                <text
                                                    x={pos.x + 18} y={pos.y + 20}
                                                    textAnchor="middle"
                                                    dominantBaseline="middle"
                                                    fill={text}
                                                    fontSize={9}
                                                    fontWeight="800"
                                                    fontFamily="Inter, system-ui, sans-serif"
                                                >
                                                    {completed ? '✓' : String(globalIdx + 1).padStart(2, '0')}
                                                </text>

                                                {/* Node title */}
                                                <text
                                                    x={pos.x + 36} y={pos.y + NH / 2}
                                                    dominantBaseline="middle"
                                                    fill={text}
                                                    fontSize={11}
                                                    fontWeight="600"
                                                    fontFamily="Inter, system-ui, sans-serif"
                                                    style={{ pointerEvents: 'none' }}
                                                >
                                                    {/* Truncate long titles */}
                                                    {node.title.length > 14
                                                        ? node.title.slice(0, 13) + '…'
                                                        : node.title}
                                                </text>
                                            </g>
                                        );
                                    });
                                })}
                            </svg>
                        </div>

                        {/* Detail panel */}
                        {sel !== null && selected !== null && (
                            <div className="w-72 flex-shrink-0 sticky top-24">
                                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="text-xs font-bold text-indigo-500 bg-indigo-50 px-2.5 py-1 rounded-lg">
                                            Step {selected + 1}
                                        </span>
                                        <span className="text-xs text-slate-400 capitalize flex-1">{sel.node_type}</span>
                                        <button
                                            onClick={() => toggleDone(selected)}
                                            className={`text-xs font-semibold px-2.5 py-1 rounded-lg border flex items-center gap-1 transition-all
                                                ${done.has(selected)
                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-emerald-300'}`}>
                                            {done.has(selected) ? <CheckCircle2 size={11} /> : <Circle size={11} />}
                                            {done.has(selected) ? 'Done' : 'Mark done'}
                                        </button>
                                        <button onClick={() => setSelected(null)}
                                            className="p-1 rounded-lg hover:bg-slate-100 transition-colors">
                                            <X size={13} className="text-slate-400" />
                                        </button>
                                    </div>

                                    <h3 className="text-base font-bold text-slate-900 mb-1 leading-snug">{sel.title}</h3>
                                    <p className="text-xs text-slate-500 mb-3 leading-relaxed">{sel.description}</p>

                                    <span className="flex items-center gap-1 text-xs bg-slate-100 px-2.5 py-1 rounded-full text-slate-600 w-fit mb-4">
                                        <Clock size={10} />{sel.estimated_hours} hours
                                    </span>

                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Overview</p>
                                    <div className="space-y-2 mb-4 max-h-52 overflow-y-auto pr-1">
                                        {(sel.detailed_summary || sel.description).split('\n\n').map((p, i) => (
                                            <p key={i} className="text-xs text-slate-700 leading-relaxed">{p}</p>
                                        ))}
                                    </div>

                                    {(sel.resources?.length ?? 0) > 0 && (
                                        <>
                                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Resources</p>
                                            <div className="space-y-1.5">
                                                {sel.resources.map((r, i) => (
                                                    <a key={i} href={r.url} target="_blank" rel="noopener noreferrer"
                                                        className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-all group">
                                                        <span className="text-xs flex-shrink-0">{r.type === 'video' ? '▶' : '📄'}</span>
                                                        <span className="text-xs text-slate-700 group-hover:text-indigo-700 flex-1 truncate">{r.title}</span>
                                                        <ExternalLink size={10} className="text-slate-400 flex-shrink-0" />
                                                    </a>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Loading overlay */}
            {loading && (
                <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="text-center">
                        <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-lg animate-pulse">
                            <Sparkles size={28} className="text-white" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">Building your roadmap…</h3>
                        <p className="text-sm text-slate-500">Creating a tree path for <strong>{form.topic}</strong></p>
                        <div className="flex justify-center gap-1 mt-4">
                            {[0, 150, 300].map(d => (
                                <div key={d} className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"
                                    style={{ animationDelay: `${d}ms` }} />
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
