'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Plus, Trash2, Calendar, Flag, Search, GripVertical, CircleDot, Clock3, CheckCircle2, Sparkles } from 'lucide-react';

type Task = {
  id: string;
  title: string;
  description: string | null;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high' | null;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
};

const priorityColors = {
  low: 'bg-accent-purple/10 text-accent-purple',
  medium: 'bg-amber-500/10 text-amber-600',
  high: 'bg-destructive/10 text-destructive',
};

export default function TaskBoardClient({ initialTasks, userId }: { initialTasks: Task[], userId: string }) {
  const supabase = createClient();
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [showNewTask, setShowNewTask] = useState(false);
  const [query, setQuery] = useState('');

  const columns = {
    pending: { title: 'To do', eyebrow: 'Backlog', icon: CircleDot, color: 'bg-sky-300/12 border-sky-300/25', dot: 'bg-sky-300' },
    in_progress: { title: 'In progress', eyebrow: 'Active work', icon: Clock3, color: 'bg-lime-300/12 border-lime-300/30', dot: 'bg-lime-300' },
    completed: { title: 'Completed', eyebrow: 'Done', icon: CheckCircle2, color: 'bg-[#ff8f78]/10 border-[#ff8f78]/25', dot: 'bg-[#ff8f78]' },
  };

  const getTasksByStatus = (status: string) => {
    return tasks.filter(task => task.status === status && `${task.title} ${task.description ?? ''}`.toLowerCase().includes(query.toLowerCase()));
  };

  const handleDragEnd = async (result: any) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    // droppableId is always a key of `columns`, i.e. one of the three status
    // values the `tasks` CHECK constraint accepts. The previous 'todo' in this
    // cast was never a real droppableId and isn't a legal status in the DB.
    const newStatus = destination.droppableId as Task['status'];


    setTasks(tasks.map(task => 
      task.id === draggableId 
        ? { ...task, status: newStatus, completed_at: newStatus === 'completed' ? new Date().toISOString() : null } 
        : task
    ));

    await supabase
      .from('tasks')
      .update({ 
        status: newStatus,
        completed_at: newStatus === 'completed' ? new Date().toISOString() : null
      })
      .eq('id', draggableId);
  };

  const addTask = async () => {
    if (!newTaskTitle.trim()) return;

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        student_id: userId,
        title: newTaskTitle,
        status: 'pending',
        priority: 'medium',
      })
      .select()
      .single();

    if (data) {
      setTasks([...tasks, data]);
      setNewTaskTitle('');
      setShowNewTask(false);
    }
  };

  const deleteTask = async (taskId: string) => {
    setTasks(tasks.filter(task => task.id !== taskId));
    await supabase.from('tasks').delete().eq('id', taskId);
  };

  const completedCount = tasks.filter((task) => task.status === 'completed').length;
  const progress = tasks.length ? Math.round((completedCount / tasks.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <section className="relative flex flex-col gap-6 pt-2 xl:flex-row xl:items-end xl:justify-between">
        <div className="relative">
          <span aria-hidden className="pointer-events-none absolute -left-12 -top-12 size-44 rounded-full bg-lime-300/25 blur-3xl" />
          <p className="relative mb-2 text-[10px] font-bold uppercase tracking-[.18em] text-muted-foreground">Learning workspace</p>
          <h1 className="relative text-4xl font-bold leading-[.94] tracking-[-.055em] sm:text-5xl">Task<br className="hidden sm:block" /> pipeline</h1>
          <p className="relative mt-3 max-w-xl text-sm text-muted-foreground">Move work from idea to done. Drag a card between stages to update it.</p>
        </div>
        <div className="flex flex-wrap items-end gap-7 pb-1">
          <div><p className="text-2xl font-bold tabular-nums">{tasks.length}</p><p className="text-[10px] font-semibold text-muted-foreground">Total tasks</p></div>
          <div><p className="text-2xl font-bold tabular-nums">{tasks.filter((task) => task.status === 'in_progress').length}</p><p className="text-[10px] font-semibold text-muted-foreground">In motion</p></div>
          <div><p className="text-2xl font-bold tabular-nums">{progress}%</p><p className="text-[10px] font-semibold text-muted-foreground">Completed</p></div>
          <button onClick={() => setShowNewTask(true)} className="inline-flex h-10 items-center gap-2 rounded-full bg-foreground px-5 text-sm font-bold text-background shadow-[0_12px_30px_-14px_rgba(15,23,42,.75)] hover:-translate-y-0.5">
            <Plus className="size-4" /> New task
          </button>
        </div>
      </section>

      <div className="flex flex-col gap-3 rounded-[1.5rem] border border-white/70 bg-card/55 p-2.5 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
        <div className="relative min-w-0 flex-1 sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search tasks…" className="h-10 w-full rounded-full border-0 bg-white/60 pl-10 pr-4 text-sm outline-none" />
        </div>
        <div className="flex items-center gap-2 px-2 text-[11px] font-semibold text-muted-foreground"><Sparkles className="size-3.5 text-lime-600" /> Drag cards to update status</div>
      </div>

      {showNewTask && (
        <div className="rounded-[1.5rem] border border-white/70 bg-card/75 p-4 shadow-lg backdrop-blur-xl">
          <input type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addTask()}
 placeholder="Task title..."
 className="mb-3 w-full rounded-2xl border border-white/80 bg-white/70 px-4 py-3"
            autoFocus
          />
          <div className="flex gap-2">
            <button
              onClick={addTask}
              className="rounded-full bg-primary px-4 py-2 font-semibold text-white"
            >
              Add
            </button>
            <button
              onClick={() => {
                setShowNewTask(false);
                setNewTaskTitle('');
              }}
              className="rounded-full bg-muted px-4 py-2 font-semibold text-foreground/80"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {Object.entries(columns).map(([status, column]) => (
            <section key={status} className="flex min-w-0 flex-col">
              <div className="mb-3 flex items-end justify-between px-1">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[.16em] text-muted-foreground">{column.eyebrow}</p>
                  <h2 className="mt-1 flex items-center gap-2 text-sm font-bold"><span className={`size-2 rounded-full ${column.dot}`} />{column.title}</h2>
                </div>
                <span className="rounded-full bg-foreground/[.06] px-2.5 py-1 text-[10px] font-bold tabular-nums">{getTasksByStatus(status).length}</span>
              </div>

              <Droppable droppableId={status}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex-1 rounded-[1.75rem] border p-3 transition-[background-color,border-color,box-shadow,transform] duration-300 min-h-[34rem] ${
                      column.color
                    } ${snapshot.isDraggingOver ? 'scale-[1.01] border-foreground/25 bg-white/55 shadow-[0_0_48px_-18px_rgba(190,242,100,.75)]' : ''}`}
                  >
                    <div className="space-y-2.5">
                      {getTasksByStatus(status).map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`group cursor-grab rounded-2xl border border-white/75 bg-white/72 p-4 shadow-[0_16px_38px_-30px_rgba(20,28,24,.55)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-lg active:cursor-grabbing ${
                                snapshot.isDragging ? '-rotate-1 scale-[1.03] shadow-xl' : ''
                              }`}
                            >
                              <div className="mb-2 flex items-start justify-between gap-2">
                                <div className="min-w-0 flex-1"><h3 className="truncate text-sm font-bold text-foreground">{task.title}</h3>{task.description && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{task.description}</p>}</div>
                                <button
                                  onClick={() => deleteTask(task.id)}
                                  aria-label={`Delete ${task.title}`}
                                  className="flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground/60 opacity-0 hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100 focus-visible:opacity-100"
                                >
                                  <Trash2 className="size-3.5" />
                                </button>
                              </div>
                              <div className="mt-5 flex flex-wrap items-end justify-between gap-2">
                                <div className="flex flex-wrap items-center gap-2">
                                {task.priority && (
                                  <span className={`flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold ${priorityColors[task.priority]}`}>
                                    <Flag className="size-3" />
                                    {task.priority}
                                  </span>
                                )}
                                {task.due_date && (
                                  <span className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
                                    <Calendar className="size-3" />
                                    {new Date(task.due_date).toLocaleDateString()}
                                  </span>
                                )}
                                </div>
                                <GripVertical className="size-4 text-muted-foreground/30 transition-colors group-hover:text-muted-foreground" />
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      {!getTasksByStatus(status).length && (
                        <button onClick={() => setShowNewTask(true)} className="flex min-h-28 w-full flex-col items-center justify-center rounded-2xl border border-dashed border-foreground/15 text-xs font-semibold text-muted-foreground transition-colors hover:border-foreground/30 hover:bg-white/35 hover:text-foreground">
                          <Plus className="mb-2 size-4" /> Add a task
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </Droppable>
            </section>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}
