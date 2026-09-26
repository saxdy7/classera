'use client';

import { useState } from 'react';
import { Loader2, Star } from 'lucide-react';

export default function PortfolioToggle({
  assignmentId,
  initialFeatured,
}: {
  assignmentId: string;
  initialFeatured: boolean;
}) {
  const [featured, setFeatured] = useState(initialFeatured);
  const [saving, setSaving] = useState(false);

  async function toggle() {
    const next = !featured;
    setSaving(true);
    setFeatured(next);
    try {
      const res = await fetch(`/api/project-assignments/${assignmentId}/feature`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featured: next }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setFeatured(!next); // revert on failure
    } finally {
      setSaving(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={saving}
      className={`flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-[var(--cl-r-pill,9999px)] border transition-colors disabled:opacity-60 ${
        featured
          ? 'bg-accent-purple/10 border-accent-purple text-accent-purple'
          : 'border-border text-muted-foreground hover:bg-muted/40'
      }`}
    >
      {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Star className={`w-3.5 h-3.5 ${featured ? 'fill-accent-purple' : ''}`} />}
      {featured ? 'Featured on portfolio' : 'Feature on portfolio'}
    </button>
  );
}
