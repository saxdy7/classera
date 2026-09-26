'use client';

import { useState } from 'react';
import { CheckSquare, Square, Flag } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  status: 'pending' | 'in_progress' | 'completed';
  due_date: string | null;
}

export default function MilestoneChecklist({ initialTasks }: { initialTasks: Task[] }) {
  const [tasks, setTasks] = useState(initialTasks);

  async function toggle(taskId: string, currentStatus: Task['status']) {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)));

    // Goes through PATCH /api/tasks rather than writing the table directly from
    // the browser: that route scopes the update to `student_id = auth.uid()`,
    // so a checkpoint can't be toggled on someone else's behalf regardless of
    // how the `tasks` RLS policies are configured.
    try {
      const res = await fetch('/api/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: taskId,
          status: newStatus,
          completed_at: newStatus === 'completed' ? new Date().toISOString() : null,
        }),
      });
      if (!res.ok) throw new Error('Update failed');
    } catch {
      // Revert the optimistic toggle so the UI doesn't claim a save that never landed.
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: currentStatus } : t)));
    }
  }

  if (tasks.length === 0) return null;

  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
        <Flag className="w-5 h-5 text-accent-purple" />
        Checkpoints
      </h2>
      <div className="space-y-2">
        {tasks.map((task) => (
          <button
            key={task.id}
            onClick={() => toggle(task.id, task.status)}
            className="w-full flex items-center gap-3 p-3 bg-muted/40 rounded-lg hover:bg-muted transition-colors text-left"
          >
            {task.status === 'completed' ? (
              <CheckSquare className="w-4.5 h-4.5 text-green-600 flex-shrink-0" />
            ) : (
              <Square className="w-4.5 h-4.5 text-muted-foreground/70 flex-shrink-0" />
            )}
            <span className={`flex-1 text-sm ${task.status === 'completed' ? 'text-muted-foreground/70 line-through' : 'text-foreground'}`}>
              {task.title}
            </span>
            {task.due_date && (
              <span className="text-xs text-muted-foreground flex-shrink-0">
                {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
