'use client';

import { AIToolShell } from '@/components/shared/AIToolShell';
import { useState, useEffect, useRef } from 'react';
import {
    Sparkles, ArrowLeft, Loader2, MapIcon, Clock, BookOpen,
    ExternalLink, CheckCircle2, Circle, X,
    History, Trash2, ZoomIn, ZoomOut, Download, Share2,
} from 'lucide-react';
import Link from 'next/link';
import { useDebouncedCallback } from '@/hooks/useDebounce';

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

interface HistoryItem { id: string; title: string; created_at: string; data: GeneratedRoadmap; }

const PHASE_TITLES = [
    'Systems Foundation', 'Core Concepts', 'Applied Skills',
    'Advanced Topics', 'Specialization', 'Mastery',
];

/** Group flat nodes into rows of max 4 */
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

const BADGE_PALETTE = [
    { label: 'CORE', cls: 'bg-[rgba(13,116,206,0.12)] text-[var(--cl-info)]' },
    { label: 'ENG',  cls: 'bg-[rgba(22,163,74,0.12)] text-[var(--cl-success)]' },
    { label: 'ADV',  cls: 'bg-[var(--cl-primary-soft)] text-[var(--cl-primary)]' },
    { label: 'PRO',  cls: 'bg-[rgba(239,68,68,0.12)] text-[var(--cl-error)]' },
    { label: 'OPS',  cls: 'bg-[rgba(13,116,206,0.12)] text-[var(--cl-info)]' },
];

function getNodeBadge(nodeType: string, phaseIdx: number) {
    const t = (nodeType || '').toLowerCase();
    if (t.includes('core') || t.includes('found') || t.includes('basic'))
        return { label: 'CORE', cls: 'bg-[rgba(13,116,206,0.12)] text-[var(--cl-info)]' };
    if (t.includes('eng') || t.includes('prac') || t.includes('tool') || t.includes('build'))
        return { label: 'ENG', cls: 'bg-[rgba(22,163,74,0.12)] text-[var(--cl-success)]' };
    if (t.includes('data') || t.includes('stat') || t.includes('math') || t.includes('theory'))
        return { label: 'DATA', cls: 'bg-[var(--cl-primary-soft)] text-[var(--cl-primary)]' };
    if (t.includes('ml') || t.includes('ai') || t.includes('deep') || t.includes('nlp'))
        return { label: 'AI', cls: 'bg-[var(--cl-primary-soft)] text-[var(--cl-primary)]' };
    if (t.includes('ops') || t.includes('deploy') || t.includes('cloud') || t.includes('infra'))
        return { label: 'OPS', cls: 'bg-[rgba(13,116,206,0.12)] text-[var(--cl-info)]' };
    if (t.includes('project') || t.includes('milestone') || t.includes('capstone'))
        return { label: 'LAB', cls: 'bg-[rgba(171,100,0,0.12)] text-[var(--cl-warning)]' };
    return BADGE_PALETTE[phaseIdx % BADGE_PALETTE.length];
}

function getDifficulty(hours: number) {
    if (hours <= 10) return 'Beginner';
    if (hours <= 25) return 'Intermediate';
    if (hours <= 50) return 'Advanced';
    return 'Expert';
}

export function RoadmapsContent() {
    const [form, setForm] = useState({ topic: '', experience: 'beginner', hours: '2', weeks: '12' });
    const [loading, setLoading] = useState(false);
    const [roadmap, setRoadmap] = useState<GeneratedRoadmap | null>(null);
    const [selected, setSelected] = useState<number | null>(null);
    const [done, setDone] = useState<Record<number, boolean>>({});
    const [error, setError] = useState('');
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [panning, setPanning] = useState(false);
    const [shared, setShared] = useState(false);
    const isPanning = useRef(false);
    const panStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

    useEffect(() => { fetchHistory(); }, []);

    const fetchHistory = async () => {
        try {
            const res = await fetch('/api/history?type=roadmap');
            if (res.ok) setHistory(await res.json());
        } catch { /* silent */ }
    };

    const saveHistory = async (generated: GeneratedRoadmap) => {
        try {
            await fetch('/api/history', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'roadmap', title: generated.roadmap_title, data: generated }),
            });
            fetchHistory();
        } catch { /* silent */ }
    };

    const deleteHistory = async (id: string) => {
        setHistory(prev => prev.filter(h => h.id !== id));
        await fetch(`/api/history?id=${id}`, { method: 'DELETE' });
    };

    const loadFromHistory = (item: HistoryItem) => {
        setRoadmap(item.data);
        setSelected(null);
        setDone({});
    };

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

            // Dispatch event to update credits
            window.dispatchEvent(new Event('tokens-updated'));
            
            setRoadmap(data);
            saveHistory(data);
        } catch (e: any) {
            setError(e.message || 'Failed to generate roadmap.');
        } finally { setLoading(false); }
    };

    const debouncedGenerate = useDebouncedCallback(generate, 400);
    const toggleDone = (i: number) => setDone(prev => ({ ...prev, [i]: !prev[i] }));

    const nodes = roadmap?.nodes ?? [];
    const groups = buildGroups(nodes);
    const doneCount = Object.values(done).filter(Boolean).length;
    const progress = nodes.length ? Math.round((doneCount / nodes.length) * 100) : 0;
    const sel = selected !== null ? nodes[selected] : null;

    const vLine: React.CSSProperties = {
        background: 'linear-gradient(to bottom, #135bec, #00f2ff)',
        boxShadow: '0 0 10px rgba(19,91,236,0.5)',
    };
    const hLine: React.CSSProperties = {
        background: 'linear-gradient(to right, #135bec, #00f2ff)',
        boxShadow: '0 0 10px rgba(19,91,236,0.5)',
    };

    const onCanvasMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        if ((e.target as HTMLElement).closest('[data-node]')) return;
        isPanning.current = true;
        setPanning(true);
        panStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
    };
    const onCanvasMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isPanning.current) return;
        setPan({
            x: panStart.current.panX + (e.clientX - panStart.current.x),
            y: panStart.current.panY + (e.clientY - panStart.current.y),
        });
    };
    const onCanvasMouseUp = () => { isPanning.current = false; setPanning(false); };
    const onCanvasWheel = (e: React.WheelEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (e.ctrlKey || e.metaKey) {
            setZoom(z => Math.max(0.4, Math.min(2.5, z - e.deltaY * 0.005)));
        } else {
            setPan(p => ({ x: p.x - e.deltaX, y: p.y - e.deltaY }));
        }
    };

    return (
        <div className="flex min-h-screen flex-col bg-[var(--cl-canvas-soft)] text-[var(--cl-ink)]" style={{ fontFamily: 'Inter, sans-serif' }}>

            {/* ---- Header ---- */}
            <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-[var(--cl-hairline)] bg-[rgba(255,255,255,0.8)] px-4 md:px-8 py-3.5 backdrop-blur-md">
                <Link href="/dashboard/student" className="p-1.5 rounded-lg hover:bg-[var(--cl-surface-strong)] transition-colors">
                    <ArrowLeft size={18} className="text-[var(--cl-muted)]" />
                </Link>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[rgba(13,116,206,0.12)] text-[var(--cl-info)]">
                    <MapIcon size={16} />
                </div>
                <div>
                    <h1 className="text-sm font-semibold text-[var(--cl-ink)]">AI Roadmap Generator</h1>
                    <p className="text-xs text-[var(--cl-muted)]">Click a node to explore · AI-powered path</p>
                </div>
                {roadmap && (
                    <button
                        onClick={() => { setRoadmap(null); setSelected(null); setDone({}); }}
                        className="ml-auto rounded-[var(--cl-r-md)] border border-[var(--cl-hairline-strong)] bg-[var(--cl-surface-card)] px-3 py-1.5 text-xs font-semibold text-[var(--cl-ink)] transition-colors hover:bg-[var(--cl-canvas-soft)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[rgba(10,10,10,0.12)]"
                    >
                        Back to form
                    </button>
                )}
            </header>

            {/* Two-pane shell: history rail on the left, workspace on the right -
                the same layout the AI Career Coach uses. The recent list used to
                be a horizontally-scrolling strip under the form, which truncated
                titles and hid older entries. */}
            <AIToolShell
                newLabel="New Roadmap"
                onNew={() => { setRoadmap(null); setSelected(null); setError(''); setForm(f => ({ ...f, topic: '' })); }}
                history={history.map(h => ({ id: h.id, title: h.title, createdAt: h.created_at }))}
                activeId={null}
                onDelete={deleteHistory}
                onSelect={(id) => { const item = history.find(h => h.id === id); if (item) loadFromHistory(item); }}
                historyLabel="Recent Roadmaps"
                emptyLabel="No roadmaps yet. Generate your first one."
            >

            {!roadmap ? (
                /* ====================================================== FORM ====================================================== */
                <div className="max-w-2xl mx-auto px-4 py-12">
                    <div className="text-center mb-10">
                        <div
                            className="w-16 h-16 rounded-[var(--cl-r-xl)] bg-[rgba(13,116,206,0.12)] border border-[var(--cl-info)] flex items-center justify-center mx-auto mb-4"
                            style={{ boxShadow: '0 0 30px rgba(19,91,236,0.25)' }}
                        >
                            <Sparkles size={28} className="text-[var(--cl-info)]" />
                        </div>
                        <div className="mb-4 inline-flex items-center rounded-full bg-[rgba(13,116,206,0.12)] px-3 py-1 text-xs font-semibold uppercase tracking-widest text-[var(--cl-info)] ring-1 ring-[var(--cl-info)]">
                            Interactive Learning Path
                        </div>
                        <h2 className="text-3xl font-semibold text-[var(--cl-ink)] mb-2">Generate Your Roadmap</h2>
                        <p className="text-[var(--cl-muted)]">Type any role — AI builds a visual node-based learning path.</p>
                    </div>

                    <div className="border border-[var(--cl-hairline)] bg-[var(--cl-surface-card)] rounded-[var(--cl-r-xl)] p-6 mb-6">
                        <label className="block text-xs font-semibold text-[var(--cl-muted)] mb-2 uppercase tracking-wider">
                            What do you want to learn or become?
                        </label>
                        <div className="flex gap-2 mb-4">
                            <input
                                value={form.topic}
                                onChange={e => setForm(f => ({ ...f, topic: e.target.value }))}
                                onKeyDown={e => { if (e.key === 'Enter') debouncedGenerate(); }}
                                placeholder="e.g. Full Stack Developer, Data Scientist..."
                                className="flex-1 px-4 py-3 border border-[var(--cl-hairline)] bg-[var(--cl-canvas-soft)] rounded-[var(--cl-r-lg)] text-sm text-[var(--cl-ink)] placeholder-[var(--cl-muted-soft)] focus:outline-none focus:ring-2 focus:ring-[var(--cl-info)] focus:border-[var(--cl-info)] transition-all"
                            />
                            <button
                                onClick={generate}
                                disabled={!form.topic.trim() || loading}
                                className="px-5 py-3 bg-[var(--cl-info)] text-[var(--cl-on-dark)] rounded-[var(--cl-r-lg)] font-semibold text-sm hover:bg-[var(--cl-info)] disabled:opacity-40 transition-colors flex items-center gap-2 flex-shrink-0"
                            >
                                {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                                Generate
                            </button>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { label: 'Experience', key: 'experience', opts: [['beginner','Beginner'],['intermediate','Intermediate'],['advanced','Advanced']] },
                                { label: 'Hours/day',  key: 'hours',      opts: ['1','2','3','4','5','6','8'].map(h => [h, `${h}h`]) },
                                { label: 'Target weeks', key: 'weeks',    opts: ['4','8','12','16','24','52'].map(w => [w, `${w}w`]) },
                            ].map(({ label, key, opts }) => (
                                <div key={key}>
                                    <label className="block text-xs text-[var(--cl-muted)] mb-1">{label}</label>
                                    <select
                                        value={(form as any)[key]}
                                        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                                        className="w-full px-3 py-2.5 border border-[var(--cl-hairline)] bg-[var(--cl-canvas-soft)] rounded-lg text-sm text-[var(--cl-ink)] focus:outline-none focus:border-[var(--cl-info)]"
                                    >
                                        {opts.map(([v, l]) => <option key={v} value={v} className="bg-[var(--cl-surface-card)]">{l}</option>)}
                                    </select>
                                </div>
                            ))}
                        </div>
                    </div>

                    {error && (
                        <div className="border border-[var(--cl-error)] bg-[rgba(239,68,68,0.12)] rounded-[var(--cl-r-lg)] px-4 py-3 text-sm text-[var(--cl-error)] mb-6">
                            {error}
                        </div>
                    )}


                    <p className="text-xs font-semibold text-[var(--cl-muted)] uppercase tracking-wider mb-3">Popular topics</p>
                    <div className="flex flex-wrap gap-2">
                        {POPULAR.map(t => (
                            <button
                                key={t}
                                onClick={() => setForm(f => ({ ...f, topic: t }))}
                                className="px-3 py-1.5 border border-[var(--cl-hairline)] bg-[var(--cl-canvas-soft)] rounded-lg text-sm text-[var(--cl-body)] hover:border-[var(--cl-info)] hover:text-[var(--cl-info)] transition-all"
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                </div>
            ) : (
                /* ============================================== ROADMAP VIEW ============================================ */
                <div className="pb-36">
                    {/* Progress strip */}
                    <div className="border-b border-[var(--cl-hairline)] bg-[var(--cl-surface-card)] px-6 py-4">
                        <div className="max-w-4xl mx-auto">
                            <div className="flex items-start justify-between gap-4 mb-3">
                                <div>
                                    <h2 className="text-base font-semibold text-[var(--cl-ink)] mb-0.5">{roadmap.roadmap_title}</h2>
                                    <p className="text-xs text-[var(--cl-muted)]">{roadmap.roadmap_description}</p>
                                </div>
                                <div className="flex items-center gap-3 text-[10px] text-[var(--cl-muted)] flex-shrink-0">
                                    <span className="flex items-center gap-1"><Clock size={10} /> {roadmap.estimated_weeks}w</span>
                                    <span className="flex items-center gap-1"><BookOpen size={10} /> {nodes.length} steps</span>
                                </div>
                            </div>
                            <div className="flex justify-between text-xs mb-1.5">
                                <span className="text-[var(--cl-muted)]">Progress</span>
                                <span className="font-semibold text-[var(--cl-info)]">{doneCount}/{nodes.length} complete</span>
                            </div>
                            <div className="h-1.5 rounded-full overflow-hidden bg-[var(--cl-surface-strong)]">
                                <div
                                    className="h-full rounded-full transition-all duration-500"
                                    style={{ width: `${progress}%`, background: 'linear-gradient(to right,#135bec,#00f2ff)' }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Node graph - pannable canvas */}
                    <div
                        className="relative overflow-hidden select-none"
                        style={{ height: 'calc(100vh - 200px)', cursor: panning ? 'grabbing' : 'grab' }}
                        onMouseDown={onCanvasMouseDown}
                        onMouseMove={onCanvasMouseMove}
                        onMouseUp={onCanvasMouseUp}
                        onMouseLeave={onCanvasMouseUp}
                        onWheel={onCanvasWheel}
                    >

                        {/* Dot-grid background */}
                        <div className="absolute inset-0 pointer-events-none opacity-[0.06]">
                            <svg width="100%" height="100%">
                                <defs>
                                    <pattern id="rmdots" width="24" height="24" patternUnits="userSpaceOnUse">
                                        <circle cx="1" cy="1" r="1" fill="#135bec" />
                                    </pattern>
                                </defs>
                                <rect width="100%" height="100%" fill="url(#rmdots)" />
                            </svg>
                        </div>

                        {/* Inner pannable/zoomable layer */}
                        <div
                            className="px-4 py-12"
                            style={{
                                transform: `translate(calc(-50% + 50vw + ${pan.x}px), ${pan.y}px) scale(${zoom})`,
                                transformOrigin: 'top center',
                                willChange: 'transform',
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: 'max-content',
                                minWidth: '900px',
                            }}
                        >
                        {groups.map((phase, phaseIdx) => {
                            const isSingle = phase.length === 1;
                            const barOffsetPct = `${50 / phase.length}%`;

                            return (
                                <div key={phaseIdx} className="flex flex-col items-center">
                                    {/* Vertical connector from previous phase */}
                                    {phaseIdx > 0 && (
                                        <div className="w-0.5 h-16" style={vLine} />
                                    )}

                                    {/* Phase label */}
                                    <div className="mb-8 rounded-lg bg-[var(--cl-canvas-soft)] px-6 py-2 border border-[var(--cl-hairline)] backdrop-blur-sm">
                                        <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--cl-muted)]">
                                            Phase {String(phaseIdx + 1).padStart(2, '0')}
                                            {PHASE_TITLES[phaseIdx] ? `: ${PHASE_TITLES[phaseIdx]}` : ''}
                                        </span>
                                    </div>

                                    {isSingle ? (
                                        /* Single node */
                                        (() => {
                                            const node = phase[0];
                                            const idx = nodes.indexOf(node);
                                            const completed = !!done[idx];
                                            const isSelected = selected === idx;
                                            const badge = getNodeBadge(node.node_type, phaseIdx);
                                            const isMilestone = phaseIdx === 0;
                                            return (
                                                <div
                                                    onClick={() => setSelected(isSelected ? null : idx)}
                                                    className={`relative z-10 cursor-pointer rounded-[var(--cl-r-lg)] border p-5 transition-all duration-200 ${isMilestone ? 'w-72 p-6' : 'w-64'} ${
                                                        completed
                                                            ? 'border-[var(--cl-success)] bg-[rgba(22,163,74,0.12)]'
                                                            : isSelected
                                                                ? 'border-[var(--cl-info)] bg-[var(--cl-surface-card)]'
                                                                : isMilestone
                                                                    ? 'border-[var(--cl-info)] bg-[var(--cl-surface-card)]'
                                                                    : 'border-[var(--cl-hairline)] bg-[var(--cl-surface-card)] hover:border-[var(--cl-info)]'
                                                    }`}
                                                    style={
                                                        isSelected
                                                            ? { boxShadow: '0 0 25px rgba(19,91,236,0.4)' }
                                                            : isMilestone
                                                                ? { boxShadow: '0 0 20px rgba(19,91,236,0.15)' }
                                                                : undefined
                                                    }
                                                    data-node="true"
                                                >
                                                    <div className="mb-3 flex items-center justify-between">
                                                        <span className={`rounded-[var(--cl-r-xs)] px-2 py-0.5 text-[11px] font-semibold ${completed ? 'bg-[rgba(22,163,74,0.12)] text-[var(--cl-success)]' : badge.cls}`}>
                                                            {completed ? '✓ DONE' : badge.label}
                                                        </span>
                                                        <span className="text-[10px] font-medium text-[var(--cl-muted)]">
                                                            #{String(idx + 1).padStart(2, '0')}
                                                        </span>
                                                    </div>
                                                    <h3 className={`font-semibold text-[var(--cl-ink)] ${isMilestone ? 'text-base' : 'text-sm'}`}>{node.title}</h3>
                                                    <p className="mt-1.5 line-clamp-2 flex-1 text-[12px] leading-relaxed text-[var(--cl-muted)]">{node.description}</p>
                                                    <div className={`mt-4 flex items-center justify-between ${isMilestone ? 'border-t border-[var(--cl-hairline)] pt-3' : ''}`}>
                                                        <div className="flex items-center gap-3 text-[10px] text-[var(--cl-muted)]">
                                                            <span className="flex items-center gap-1"><Clock size={9} /> {node.estimated_hours}h</span>
                                                            <span>{getDifficulty(node.estimated_hours)}</span>
                                                        </div>
                                                        <span className="text-[10px] font-semibold text-[var(--cl-info)]">View →</span>
                                                    </div>
                                                </div>
                                            );
                                        })()
                                    ) : (
                                        /* Multi-node row */
                                        <div className="relative w-full">
                                            {/* Horizontal bar */}
                                            <div
                                                className="absolute top-0 h-0.5"
                                                style={{ left: barOffsetPct, right: barOffsetPct, ...hLine }}
                                            />
                                            <div className="flex items-stretch">
                                                {phase.map((node) => {
                                                    const idx = nodes.indexOf(node);
                                                    const completed = !!done[idx];
                                                    const isSelected = selected === idx;
                                                    const badge = getNodeBadge(node.node_type, phaseIdx);
                                                    return (
                                                        <div key={idx} className="flex flex-1 flex-col items-stretch px-3">
                                                            {/* Vertical stub */}
                                                            <div className="mx-auto h-12 w-0.5 flex-shrink-0" style={vLine} />
                                                            {/* Card */}
                                                            <div
                                                                onClick={() => setSelected(isSelected ? null : idx)}
                                                                className={`flex h-full w-full max-w-[15rem] cursor-pointer flex-col rounded-[var(--cl-r-lg)] border p-4 transition-colors duration-[var(--cl-dur-micro)] ${
                                                                    completed
                                                                        ? 'border-[var(--cl-success)] bg-[rgba(22,163,74,0.12)]'
                                                                        : isSelected
                                                                            ? 'border-[var(--cl-info)] bg-[rgba(13,116,206,0.12)]'
                                                                            : 'border-[var(--cl-hairline)] bg-[var(--cl-surface-card)] hover:border-[var(--cl-info)]'
                                                                }`}
                                                                style={isSelected ? { boxShadow: '0 0 20px rgba(19,91,236,0.3)' } : undefined}
                                                                data-node="true"
                                                            >
                                                                <div className="mb-3 flex items-center justify-between">
                                                                    <span className={`rounded-[var(--cl-r-xs)] px-2 py-0.5 text-[11px] font-semibold ${completed ? 'bg-[rgba(22,163,74,0.12)] text-[var(--cl-success)]' : badge.cls}`}>
                                                                        {completed ? '✓' : badge.label}
                                                                    </span>
                                                                    <span className="cl-mono text-[11px] text-[var(--cl-muted)]">#{String(idx + 1).padStart(2, '0')}</span>
                                                                </div>
                                                                <h3 className="line-clamp-2 min-h-[2.5rem] text-[14px] font-semibold leading-snug text-[var(--cl-ink)]">{node.title}</h3>
                                                                <p className="mt-1.5 line-clamp-2 flex-1 text-[12px] leading-relaxed text-[var(--cl-muted)]">{node.description}</p>
                                                                <div className="mt-3 flex items-center gap-3 text-[11px] text-[var(--cl-muted)]">
                                                                    <span className="flex items-center gap-1"><Clock size={9} /> {node.estimated_hours}h</span>
                                                                    <span>{getDifficulty(node.estimated_hours)}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                        </div>{/* /pan layer */}
                    </div>{/* /canvas */}

                    {/* Floating toolbar */}
                    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-30 flex items-center gap-5 rounded-full border border-[var(--cl-hairline)] bg-[var(--cl-surface-card)] px-6 py-3">
                        <button onClick={() => setZoom(z => Math.min(z + 0.15, 2.5))} className="flex flex-col items-center gap-0.5 text-[var(--cl-info)] hover:text-[var(--cl-info)] transition-colors">
                            <ZoomIn size={18} />
                            <span className="text-[9px] font-semibold">Zoom In</span>
                        </button>
                        <div className="w-px h-5 bg-[var(--cl-surface-strong)]" />
                        <button onClick={() => setZoom(z => Math.max(z - 0.15, 0.4))} className="flex flex-col items-center gap-0.5 text-[var(--cl-muted)] hover:text-[var(--cl-info)] transition-colors">
                            <ZoomOut size={18} />
                            <span className="text-[9px] font-semibold">Zoom Out</span>
                        </button>
                        <div className="w-px h-5 bg-[var(--cl-surface-strong)]" />
                        <button onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} className="flex flex-col items-center gap-0.5 text-[var(--cl-muted)] hover:text-[var(--cl-info)] transition-colors">
                            <MapIcon size={18} />
                            <span className="text-[9px] font-semibold">Reset</span>
                        </button>
                        <button
                            onClick={() => {
                                const csv = ['Step,Title,Description,Hours,Difficulty,Status']
                                    .concat(nodes.map((n, i) =>
                                        `${i + 1},"${n.title.replace(/"/g, '""')}","${n.description.replace(/"/g, '""')}",${n.estimated_hours},${getDifficulty(n.estimated_hours)},${done[i] ? 'done' : 'pending'}`
                                    )).join('\n');
                                const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `${roadmap.roadmap_title}.csv`;
                                a.click();
                                // Release the blob; without this it is retained
                                // for the lifetime of the document.
                                URL.revokeObjectURL(url);
                            }}
                            className="flex flex-col items-center gap-0.5 text-[var(--cl-muted)] hover:text-[var(--cl-info)] transition-colors"
                        >
                            <Download size={18} />
                            <span className="text-[9px] font-semibold">Export</span>
                        </button>
                        <button
                            onClick={async () => {
                                const url = window.location.href;
                                try {
                                    if (navigator.share) {
                                        await navigator.share({ title: roadmap.roadmap_title, url });
                                    } else {
                                        await navigator.clipboard.writeText(url);
                                        setShared(true);
                                        setTimeout(() => setShared(false), 2000);
                                    }
                                } catch {
                                    /* user dismissed the share sheet - nothing to do */
                                }
                            }}
                            className="flex flex-col items-center gap-0.5 text-[var(--cl-muted)] transition-colors hover:text-[var(--cl-ink)]"
                        >
                            <Share2 size={18} />
                            <span className="text-[9px] font-semibold">{shared ? 'Copied' : 'Share'}</span>
                        </button>
                    </div>

                    {/* ---- Left legend ---- */}
                    <div className="fixed left-20 bottom-24 z-30 hidden lg:block">
                        <div className="rounded-[var(--cl-r-lg)] border border-[var(--cl-hairline)] bg-[var(--cl-surface-card)] p-4 backdrop-blur-md">
                            <h4 className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-[var(--cl-muted)]">Legend</h4>
                            <div className="space-y-2">
                                {[
                                    { color: 'bg-[var(--cl-info)]',    label: 'Core Path' },
                                    { color: 'bg-[var(--cl-success)]', label: 'Engineering' },
                                    { color: 'bg-[var(--cl-primary)]',  label: 'Theory / Data' },
                                    { color: 'bg-[var(--cl-warning)]',   label: 'Milestone' },
                                    { color: 'bg-[var(--cl-success)]', label: 'Completed' },
                                ].map(({ color, label }) => (
                                    <div key={label} className="flex items-center gap-2">
                                        <div className={`h-2 w-2 rounded-full ${color}`} />
                                        <span className="text-[10px] text-[var(--cl-muted)]">{label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ---- Loading overlay ---- */}
            {loading && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(255,255,255,0.9)] backdrop-blur-sm">
                    <div className="text-center">
                        <div
                            className="w-16 h-16 rounded-[var(--cl-r-xl)] bg-[rgba(13,116,206,0.12)] border border-[var(--cl-info)] flex items-center justify-center mx-auto mb-4 animate-pulse"
                            style={{ boxShadow: '0 0 30px rgba(19,91,236,0.4)' }}
                        >
                            <Sparkles size={28} className="text-[var(--cl-info)]" />
                        </div>
                        <h3 className="text-lg font-semibold text-[var(--cl-ink)] mb-2">Building your roadmap…</h3>
                        <p className="text-sm text-[var(--cl-muted)]">
                            Crafting a path for <strong className="text-[var(--cl-ink)]">{form.topic}</strong>
                        </p>
                        <div className="flex justify-center gap-1 mt-4">
                            {[0, 150, 300].map(d => (
                                <div key={d} className="w-2 h-2 bg-[var(--cl-info)] rounded-full animate-bounce"
                                    style={{ animationDelay: `${d}ms` }} />
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ---- Detail panel (slide-in from right) ---- */}
            <div
                className={`fixed inset-y-0 right-0 z-40 w-full md:w-[400px] overflow-y-auto border-l border-[var(--cl-hairline)] bg-[var(--cl-canvas-soft)] transform transition-transform duration-300 ${sel ? 'translate-x-0' : 'translate-x-full'}`}
            >
                {sel && selected !== null && (
                    <div className="p-6 pt-16 md:pt-6">
                        {/* Panel header */}
                        <div className="flex items-center gap-3 mb-6">
                            <span className="text-xs font-semibold text-[var(--cl-info)] bg-[rgba(13,116,206,0.12)] border border-[var(--cl-info)] px-2.5 py-1 rounded-lg">
                                Step {selected + 1}
                            </span>
                            <span className="flex-1 text-xs text-[var(--cl-muted)] capitalize">{sel.node_type || 'topic'}</span>
                            <button
                                onClick={() => toggleDone(selected)}
                                className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg border transition-all ${
                                    done[selected]
                                        ? 'bg-[rgba(22,163,74,0.12)] text-[var(--cl-success)] border-[var(--cl-success)]'
                                        : 'bg-[var(--cl-canvas-soft)] text-[var(--cl-muted)] border-[var(--cl-hairline)] hover:border-[var(--cl-success)]'
                                }`}
                            >
                                {done[selected] ? <CheckCircle2 size={11} /> : <Circle size={11} />}
                                {done[selected] ? 'Done!' : 'Mark done'}
                            </button>
                            <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg hover:bg-[var(--cl-surface-strong)] transition-colors">
                                <X size={14} className="text-[var(--cl-muted)]" />
                            </button>
                        </div>

                        <h2 className="text-2xl font-semibold text-[var(--cl-ink)] mb-2 leading-snug">{sel.title}</h2>
                        <p className="text-sm text-[var(--cl-muted)] mb-5 leading-relaxed">{sel.description}</p>

                        <div className="flex items-center gap-2 mb-6 flex-wrap">
                            <span className="flex items-center gap-1.5 text-xs bg-[var(--cl-canvas-soft)] border border-[var(--cl-hairline)] text-[var(--cl-body)] px-3 py-1.5 rounded-full">
                                <Clock size={10} /> {sel.estimated_hours}h estimated
                            </span>
                            <span className="text-xs bg-[var(--cl-canvas-soft)] border border-[var(--cl-hairline)] text-[var(--cl-body)] px-3 py-1.5 rounded-full">
                                {getDifficulty(sel.estimated_hours)}
                            </span>
                        </div>

                        {/* Overview */}
                        <div className="mb-6">
                            <h4 className="text-[10px] font-semibold text-[var(--cl-muted)] uppercase tracking-wider mb-3">Overview</h4>
                            <div className="space-y-2.5">
                                {(sel.detailed_summary || sel.description || '')
                                    .split(/\n\n|\n/)
                                    .filter(p => p.trim())
                                    .map((p, i) => (
                                        <p key={i} className="text-sm text-[var(--cl-body)] leading-relaxed">{p.trim()}</p>
                                    ))}
                            </div>
                        </div>

                        {/* Resources */}
                        {(sel.resources?.length ?? 0) > 0 && (
                            <div>
                                <h4 className="text-[10px] font-semibold text-[var(--cl-muted)] uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <BookOpen size={11} /> Learning Resources
                                </h4>
                                <div className="space-y-2">
                                    {sel.resources.map((r, i) => (
                                        <a
                                            key={i}
                                            href={r.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-start gap-2.5 px-3 py-2.5 border border-[var(--cl-hairline)] bg-[var(--cl-canvas-soft)] rounded-[var(--cl-r-lg)] hover:border-[var(--cl-info)] hover:bg-[rgba(13,116,206,0.12)] transition-all group"
                                        >
                                            <span className="text-sm flex-shrink-0 mt-0.5">
                                                {r.type === 'video' ? '▶' : r.type === 'article' ? '📄' : '🔗'}
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-[var(--cl-ink)] group-hover:text-[var(--cl-info)] leading-snug">{r.title}</p>
                                                <p className="text-xs text-[var(--cl-muted)] truncate mt-0.5">{r.url}</p>
                                            </div>
                                            <ExternalLink size={12} className="text-[var(--cl-muted)] flex-shrink-0 mt-1" />
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            </AIToolShell>

            {/* Mobile backdrop */}
            {sel && (
                <div className="fixed inset-0 z-30 bg-black/50 md:hidden" onClick={() => setSelected(null)} />
            )}
        </div>
    );
}

