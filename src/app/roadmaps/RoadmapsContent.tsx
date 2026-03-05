'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
    Sparkles, ArrowLeft, Loader2, MapIcon, Clock, BookOpen,
    ExternalLink, CheckCircle2, Circle, X, GripHorizontal
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

const POPULAR = [
    'Full Stack Developer', 'Data Scientist', 'DevOps Engineer',
    'Machine Learning', 'Mobile App Developer', 'UI/UX Designer',
    'Cloud Architect', 'Cybersecurity',
];

// ── Layout constants ──────────────────────────────────────
const NW = 200;   // node width
const NH = 48;    // node height
const NR = 12;    // border-radius
const ROW_GAP = 140;
const COL_GAP = 220;
const PAD = 70;

// Depth-based colors
const COLORS = [
    { fill: '#0f172a', stroke: '#475569' },  // root
    { fill: '#4338ca', stroke: '#6366f1' },  // L1 indigo
    { fill: '#7c3aed', stroke: '#8b5cf6' },  // L2 violet
    { fill: '#be185d', stroke: '#ec4899' },  // L3 pink
    { fill: '#0369a1', stroke: '#38bdf8' },  // L4 cyan
];
const color = (ri: number) => COLORS[Math.min(ri, COLORS.length - 1)];

/** Group flat nodes into tree levels */
function buildGroups(nodes: RoadmapNode[]): RoadmapNode[][] {
    if (!nodes.length) return [];
    const rows: RoadmapNode[][] = [[nodes[0]]];
    const rest = nodes.slice(1);
    if (!rest.length) return rows;

    const r1 = Math.min(4, rest.length);
    rows.push(rest.slice(0, r1));
    const tail = rest.slice(r1);
    if (!tail.length) return rows;

    const chunk = Math.ceil(tail.length / Math.ceil(tail.length / 4));
    for (let i = 0; i < tail.length; i += chunk) rows.push(tail.slice(i, i + chunk));
    return rows;
}

/** Compute initial x for a node by column within its row */
function initX(ci: number, total: number, svgW: number): number {
    const total_w = (total - 1) * COL_GAP + NW;
    return (svgW - total_w) / 2 + ci * COL_GAP;
}
function initY(ri: number): number { return PAD + ri * ROW_GAP; }

export function RoadmapsContent() {
    const [form, setForm] = useState({ topic: '', experience: 'beginner', hours: '2', weeks: '12' });
    const [loading, setLoading] = useState(false);
    const [roadmap, setRoadmap] = useState<GeneratedRoadmap | null>(null);
    const [positions, setPositions] = useState<Record<number, { x: number; y: number }>>({});
    const [selected, setSelected] = useState<number | null>(null);
    const [done, setDone] = useState<Record<number, boolean>>({});
    const [error, setError] = useState('');

    const svgRef = useRef<SVGSVGElement>(null);
    const dragging = useRef<{ idx: number; ox: number; oy: number } | null>(null);

    const nodes = roadmap?.nodes ?? [];
    const groups = buildGroups(nodes);
    const maxCols = groups.length ? Math.max(...groups.map(g => g.length)) : 1;
    const SVG_W = Math.max(760, maxCols * COL_GAP + NW + PAD * 2);
    const SVG_H = groups.length ? PAD + groups.length * ROW_GAP + NH + PAD : 500;

    // Build index → flat position
    const nodeIndex = new globalThis.Map<RoadmapNode, number>();
    nodes.forEach((n, i) => nodeIndex.set(n, i));

    // Initialise positions when roadmap loads
    useEffect(() => {
        if (!roadmap) return;
        const grps = buildGroups(roadmap.nodes);
        const maxC = grps.length ? Math.max(...grps.map(g => g.length)) : 1;
        const sw = Math.max(760, maxC * COL_GAP + NW + PAD * 2);
        const pos: Record<number, { x: number; y: number }> = {};
        grps.forEach((row, ri) => {
            row.forEach((node, ci) => {
                const idx = roadmap.nodes.indexOf(node);
                pos[idx] = { x: initX(ci, row.length, sw), y: initY(ri) };
            });
        });
        setPositions(pos);
    }, [roadmap]);

    const getSVGPoint = (e: React.MouseEvent | MouseEvent): { x: number; y: number } => {
        const svg = svgRef.current;
        if (!svg) return { x: 0, y: 0 };
        const r = svg.getBoundingClientRect();
        return {
            x: (e.clientX - r.left) * (SVG_W / r.width),
            y: (e.clientY - r.top) * (SVG_H / r.height),
        };
    };

    const onNodeDown = (e: React.MouseEvent, idx: number) => {
        e.stopPropagation();
        const pt = getSVGPoint(e);
        const p = positions[idx] ?? { x: 0, y: 0 };
        dragging.current = { idx, ox: pt.x - p.x, oy: pt.y - p.y };
    };

    const onSVGMove = useCallback((e: React.MouseEvent) => {
        if (!dragging.current) return;
        const { idx, ox, oy } = dragging.current;
        const pt = getSVGPoint(e);
        setPositions(prev => ({
            ...prev,
            [idx]: {
                x: Math.max(0, Math.min(SVG_W - NW, pt.x - ox)),
                y: Math.max(0, pt.y - oy),
            },
        }));
    }, [SVG_W]);

    const onSVGUp = () => { dragging.current = null; };

    const generate = async () => {
        if (!form.topic.trim()) return;
        setLoading(true); setError(''); setRoadmap(null); setSelected(null); setDone({});
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

    const toggleDone = (i: number) => setDone(prev => ({ ...prev, [i]: !prev[i] }));

    const doneCount = Object.values(done).filter(Boolean).length;
    const progress = nodes.length ? Math.round((doneCount / nodes.length) * 100) : 0;
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
                        <MapIcon size={16} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-sm font-bold text-slate-900">AI Roadmap Generator</h1>
                        <p className="text-xs text-slate-400">Drag nodes · Click for details</p>
                    </div>
                    {roadmap && (
                        <button onClick={() => { setRoadmap(null); setSelected(null); setDone({}); }}
                            className="ml-auto text-xs text-indigo-600 font-semibold px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors">
                            ← New Roadmap
                        </button>
                    )}
                </div>
            </header>

            {!roadmap ? (
                /* ── Form ── */
                <div className="max-w-2xl mx-auto px-4 py-12">
                    <div className="text-center mb-10">
                        <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/20">
                            <Sparkles size={28} className="text-white" />
                        </div>
                        <h2 className="text-3xl font-bold text-slate-900 mb-2">Generate Your Roadmap</h2>
                        <p className="text-slate-500">Type any role — AI builds a draggable visual tree.</p>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mb-6">
                        <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">
                            What do you want to learn or become?
                        </label>
                        <div className="flex gap-2 mb-4">
                            <input
                                value={form.topic}
                                onChange={e => setForm(f => ({ ...f, topic: e.target.value }))}
                                onKeyDown={e => { if (e.key === 'Enter') generate(); }}
                                placeholder="e.g. Full Stack Developer, Data Scientist..."
                                className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
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
                                        className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-indigo-400 bg-white">
                                        {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                                    </select>
                                </div>
                            ))}
                        </div>
                    </div>

                    {error && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 mb-6">{error}</div>}

                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Popular topics</p>
                    <div className="flex flex-wrap gap-2">
                        {POPULAR.map(t => (
                            <button key={t} onClick={() => setForm(f => ({ ...f, topic: t }))}
                                className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 hover:border-indigo-300 hover:text-indigo-700 hover:bg-indigo-50 transition-all">
                                {t}
                            </button>
                        ))}
                    </div>
                </div>
            ) : (
                /* ── Roadmap view ── */
                <div className="max-w-7xl mx-auto px-4 py-6">
                    {/* Progress bar */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-4 shadow-sm">
                        <div className="flex items-start justify-between gap-4 mb-3">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 mb-0.5">{roadmap.roadmap_title}</h2>
                                <p className="text-sm text-slate-500">{roadmap.roadmap_description}</p>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-slate-500 flex-shrink-0">
                                <span className="flex items-center gap-1"><Clock size={12} />{roadmap.estimated_weeks}w</span>
                                <span className="flex items-center gap-1"><BookOpen size={12} />{nodes.length} steps</span>
                                <span className="flex items-center gap-1 text-indigo-500"><GripHorizontal size={12} />Draggable</span>
                            </div>
                        </div>
                        <div className="flex justify-between text-xs mb-1">
                            <span className="text-slate-500">Progress</span>
                            <span className="font-bold text-indigo-600">{doneCount}/{nodes.length} complete</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                        </div>
                    </div>

                    <div className="flex gap-4 items-start">
                        {/* ── SVG tree canvas ── */}
                        <div className="flex-1 min-w-0 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-auto">
                            <svg
                                ref={svgRef}
                                width={SVG_W}
                                height={SVG_H}
                                viewBox={`0 0 ${SVG_W} ${SVG_H}`}
                                className="w-full select-none"
                                style={{ minWidth: 480, cursor: dragging.current ? 'grabbing' : 'default' }}
                                onMouseMove={onSVGMove}
                                onMouseUp={onSVGUp}
                                onMouseLeave={onSVGUp}
                            >
                                <defs>
                                    <marker id="arr" markerWidth="9" markerHeight="7"
                                        refX="9" refY="3.5" orient="auto">
                                        <polygon points="0 0, 9 3.5, 0 7" fill="#94a3b8" />
                                    </marker>
                                </defs>

                                {/* ── Connector lines (drawn from stored positions) ── */}
                                {groups.map((row, ri) => {
                                    if (ri === 0) return null;
                                    const prevRow = groups[ri - 1];
                                    const ratio = row.length / prevRow.length;
                                    return prevRow.map((pNode, pi) => {
                                        const pIdx = nodes.indexOf(pNode);
                                        const from = positions[pIdx];
                                        if (!from) return null;

                                        const cStart = Math.round(pi * ratio);
                                        const cEnd = Math.round((pi + 1) * ratio);
                                        const children = row.slice(cStart, Math.max(cEnd, cStart + 1));

                                        return children.map((cNode, ci) => {
                                            const cIdx = nodes.indexOf(cNode);
                                            const to = positions[cIdx];
                                            if (!to) return null;
                                            const fx = from.x + NW / 2, fy = from.y + NH;
                                            const tx = to.x + NW / 2, ty = to.y - 2;
                                            const my = (fy + ty) / 2;
                                            return (
                                                <path key={`${pi}-${ci}`}
                                                    d={`M ${fx} ${fy} C ${fx} ${my}, ${tx} ${my}, ${tx} ${ty}`}
                                                    fill="none" stroke="#cbd5e1" strokeWidth={1.8}
                                                    markerEnd="url(#arr)" />
                                            );
                                        });
                                    });
                                })}

                                {/* ── Nodes ── */}
                                {groups.map((row, ri) =>
                                    row.map((node, _ci) => {
                                        const idx = nodes.indexOf(node);
                                        const pos = positions[idx];
                                        if (!pos) return null;
                                        const isSelected = selected === idx;
                                        const completed = !!done[idx];
                                        const { fill, stroke } = color(ri);
                                        const nodeFill = completed ? '#059669' : fill;

                                        return (
                                            <g key={idx}
                                                onMouseDown={e => onNodeDown(e, idx)}
                                                onClick={() => !dragging.current && setSelected(isSelected ? null : idx)}
                                                style={{ cursor: 'grab' }}
                                            >
                                                {/* Gold selection ring */}
                                                {isSelected && (
                                                    <rect x={pos.x - 5} y={pos.y - 5}
                                                        width={NW + 10} height={NH + 10}
                                                        rx={NR + 5} fill="none"
                                                        stroke="#fbbf24" strokeWidth={2.5} opacity={0.8} />
                                                )}
                                                {/* Node body */}
                                                <rect x={pos.x} y={pos.y}
                                                    width={NW} height={NH} rx={NR}
                                                    fill={nodeFill} stroke={stroke} strokeWidth={1.5} />

                                                {/* Badge */}
                                                <rect x={pos.x + 10} y={pos.y + (NH - 20) / 2}
                                                    width={26} height={20} rx={5}
                                                    fill="rgba(255,255,255,0.2)" />
                                                <text x={pos.x + 23} y={pos.y + NH / 2}
                                                    textAnchor="middle" dominantBaseline="middle"
                                                    fill="white" fontSize={10} fontWeight="800"
                                                    fontFamily="Inter,system-ui,sans-serif"
                                                    style={{ pointerEvents: 'none' }}>
                                                    {completed ? '✓' : String(idx + 1).padStart(2, '0')}
                                                </text>

                                                {/* Title — max 20 chars */}
                                                <text x={pos.x + 44} y={pos.y + NH / 2}
                                                    dominantBaseline="middle"
                                                    fill="white" fontSize={12} fontWeight="600"
                                                    fontFamily="Inter,system-ui,sans-serif"
                                                    style={{ pointerEvents: 'none' }}>
                                                    {node.title.length > 17 ? node.title.slice(0, 16) + '…' : node.title}
                                                </text>
                                            </g>
                                        );
                                    })
                                )}
                            </svg>
                        </div>

                        {/* ── Detail panel ── */}
                        {sel !== null && selected !== null && (
                            <div className="w-80 flex-shrink-0 sticky top-24 max-h-[calc(100vh-120px)] overflow-y-auto">
                                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm">
                                    {/* Panel header */}
                                    <div className="flex items-center gap-2 p-4 border-b border-slate-100 sticky top-0 bg-white rounded-t-2xl z-10">
                                        <span className="text-xs font-bold text-indigo-500 bg-indigo-50 px-2.5 py-1 rounded-lg">
                                            Step {selected + 1}
                                        </span>
                                        <span className="text-xs text-slate-400 capitalize flex-1">{sel.node_type || 'topic'}</span>
                                        <button onClick={() => toggleDone(selected)}
                                            className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg border transition-all
                                                ${done[selected]
                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-emerald-300'}`}>
                                            {done[selected] ? <CheckCircle2 size={11} /> : <Circle size={11} />}
                                            {done[selected] ? 'Done!' : 'Mark done'}
                                        </button>
                                        <button onClick={() => setSelected(null)}
                                            className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                                            <X size={14} className="text-slate-400" />
                                        </button>
                                    </div>

                                    <div className="p-4 space-y-4">
                                        {/* Title */}
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900 leading-snug">{sel.title}</h3>
                                            <p className="text-sm text-slate-500 mt-1 leading-relaxed">{sel.description}</p>
                                        </div>

                                        {/* Hours badge */}
                                        <div className="flex items-center gap-2">
                                            <span className="flex items-center gap-1.5 text-xs bg-slate-100 text-slate-700 px-3 py-1.5 rounded-full font-medium">
                                                <Clock size={11} /> {sel.estimated_hours} hours estimated
                                            </span>
                                        </div>

                                        {/* Full overview */}
                                        <div>
                                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Overview</h4>
                                            <div className="space-y-2.5">
                                                {(sel.detailed_summary || sel.description || '')
                                                    .split(/\n\n|\n/)
                                                    .filter(p => p.trim())
                                                    .map((p, i) => (
                                                        <p key={i} className="text-sm text-slate-700 leading-relaxed">{p.trim()}</p>
                                                    ))}
                                            </div>
                                        </div>

                                        {/* Resources */}
                                        {(sel.resources?.length ?? 0) > 0 && (
                                            <div>
                                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Resources</h4>
                                                <div className="space-y-2">
                                                    {sel.resources.map((r, i) => (
                                                        <a key={i} href={r.url} target="_blank" rel="noopener noreferrer"
                                                            className="flex items-start gap-2.5 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl hover:border-indigo-300 hover:bg-indigo-50 transition-all group">
                                                            <span className="text-base flex-shrink-0 mt-px">
                                                                {r.type === 'video' ? '▶' : r.type === 'article' ? '📄' : '🔗'}
                                                            </span>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-medium text-slate-800 group-hover:text-indigo-700 leading-snug">{r.title}</p>
                                                                <p className="text-xs text-slate-400 truncate">{r.url}</p>
                                                            </div>
                                                            <ExternalLink size={12} className="text-slate-400 flex-shrink-0 mt-1" />
                                                        </a>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {loading && (
                <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="text-center">
                        <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-lg animate-pulse">
                            <Sparkles size={28} className="text-white" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">Building your roadmap…</h3>
                        <p className="text-sm text-slate-500">Creating a tree for <strong>{form.topic}</strong></p>
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
