'use client';

import { useState, useCallback } from 'react';
import { Plus, Trash2, Save, AlertCircle, CheckCircle } from 'lucide-react';

export interface RubricCriterion {
  id: string;
  name: string;
  description: string;
  max_points: number;
  weight: number;
}

interface RubricBuilderProps {
  assignmentId: string;
  existingRubric?: { id: string; criteria: RubricCriterion[] } | null;
  onSave?: (rubric: { id: string; criteria: RubricCriterion[] }) => void;
}

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

export default function RubricBuilder({ assignmentId, existingRubric, onSave }: RubricBuilderProps) {
  const [criteria, setCriteria] = useState<RubricCriterion[]>(
    existingRubric?.criteria ??
    [{ id: generateId(), name: '', description: '', max_points: 10, weight: 100 }],
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalWeight = criteria.reduce((s, c) => s + (c.weight || 0), 0);
  const isWeightValid = totalWeight === 100;
  const canSave = isWeightValid && criteria.every((c) => c.name.trim().length > 0) && !saving;

  const update = useCallback((id: string, field: keyof RubricCriterion, value: string | number) => {
    setCriteria((prev) =>
      prev.map((c) => c.id === id ? { ...c, [field]: value } : c),
    );
    setSaved(false);
  }, []);

  function addCriterion() {
    const remaining = Math.max(0, 100 - totalWeight);
    setCriteria((prev) => [
      ...prev,
      { id: generateId(), name: '', description: '', max_points: 10, weight: remaining },
    ]);
    setSaved(false);
  }

  function removeCriterion(id: string) {
    if (criteria.length <= 1) return;
    setCriteria((prev) => prev.filter((c) => c.id !== id));
    setSaved(false);
  }

  async function handleSave() {
    if (!canSave) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/projects/rubrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignment_id: assignmentId, criteria }),
      });
      const data = await res.json() as { rubric?: { id: string; criteria: RubricCriterion[] }; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Failed to save');
      setSaved(true);
      if (data.rubric && onSave) onSave(data.rubric);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error saving rubric');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Weight indicator */}
      <div className={`flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-xl border ${
        isWeightValid
          ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
          : 'bg-amber-50 border-amber-100 text-amber-700'
      }`}>
        {isWeightValid
          ? <CheckCircle size={14} />
          : <AlertCircle size={14} />}
        Total weight: {totalWeight}%
        {!isWeightValid && ` (${totalWeight > 100 ? 'over' : 'under'} by ${Math.abs(100 - totalWeight)}%)`}
      </div>

      {/* Criteria list */}
      <div className="space-y-3">
        {criteria.map((c, idx) => (
          <div key={c.id} className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                Criterion {idx + 1}
              </span>
              {criteria.length > 1 && (
                <button
                  onClick={() => removeCriterion(c.id)}
                  className="p-1 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>

            <input
              type="text"
              placeholder="Criterion name (e.g., Code Quality)"
              value={c.name}
              onChange={(e) => update(c.id, 'name', e.target.value)}
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-400 placeholder-slate-300"
            />

            <textarea
              placeholder="Description (optional)"
              value={c.description}
              onChange={(e) => update(c.id, 'description', e.target.value)}
              rows={2}
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-violet-400 placeholder-slate-300"
            />

            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-xs text-slate-500 font-medium mb-1 block">Max Points</label>
                <input
                  type="number"
                  min={1}
                  max={1000}
                  value={c.max_points}
                  onChange={(e) => update(c.id, 'max_points', Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-400"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-slate-500 font-medium mb-1 block">Weight (%)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={c.weight}
                  onChange={(e) => update(c.id, 'weight', Math.max(0, Math.min(100, parseInt(e.target.value) || 0)))}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-400"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add criterion */}
      <button
        onClick={addCriterion}
        className="w-full py-3 border-2 border-dashed border-slate-200 text-slate-400 text-sm font-medium rounded-xl hover:border-violet-300 hover:text-violet-500 flex items-center justify-center gap-2 transition-colors"
      >
        <Plus size={16} />
        Add Criterion
      </button>

      {/* Error */}
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
          {error}
        </p>
      )}

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={!canSave}
        className="w-full py-2.5 bg-violet-600 text-white text-sm font-semibold rounded-xl hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
      >
        <Save size={15} />
        {saving ? 'Saving…' : saved ? 'Saved!' : 'Save Rubric'}
      </button>
    </div>
  );
}
