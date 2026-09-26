'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Plus, Trash2, Calendar, Flag } from 'lucide-react';

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

  const columns = {
    pending: { title: 'To Do', color: 'border-border bg-muted/40' },
    in_progress: { title: 'In Progress', color: 'border-accent-purple bg-accent-purple/10' },
    completed: { title: 'Completed', color: 'border-green-600 bg-green-500/10' },
  };

  const getTasksByStatus = (status: string) => {
    return tasks.filter(task => task.status === status);
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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Task Board</h2>
          <p className="text-sm text-foreground/80">Organize your work with drag and drop</p>
        </div>
        <button
          onClick={() => setShowNewTask(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary text-white font-semibold rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Task
        </button>
      </div>

      {showNewTask && (
        <div className="mb-6 p-4 bg-card rounded-xl border border-border">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addTask()}
            placeholder="Task title..."
            className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-ring mb-3"
            autoFocus
          />
          <div className="flex gap-2">
            <button
              onClick={addTask}
              className="px-4 py-2 bg-primary hover:bg-primary text-white font-semibold rounded-lg"
            >
              Add
            </button>
            <button
              onClick={() => {
                setShowNewTask(false);
                setNewTaskTitle('');
              }}
              className="px-4 py-2 bg-muted hover:bg-muted text-foreground/80 font-semibold rounded-lg"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.entries(columns).map(([status, column]) => (
            <div key={status} className="flex flex-col">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-foreground">{column.title}</h3>
                <p className="text-sm text-muted-foreground">{getTasksByStatus(status).length} tasks</p>
              </div>

              <Droppable droppableId={status}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex-1 p-4 rounded-xl border-2 transition-colors min-h-[500px] ${
                      column.color
                    } ${snapshot.isDraggingOver ? 'border-accent-purple bg-accent-purple/10' : ''}`}
                  >
                    <div className="space-y-3">
                      {getTasksByStatus(status).map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`p-4 bg-card rounded-lg border border-border transition-all ${
                                snapshot.isDragging ? 'rotate-2' : ''
                              }`}
                            >
                              <div className="flex items-start justify-between mb-2">
                                <h4 className="font-semibold text-foreground flex-1">{task.title}</h4>
                                <button
                                  onClick={() => deleteTask(task.id)}
                                  className="text-muted-foreground/70 hover:text-destructive transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>

                              {task.description && (
                                <p className="text-sm text-foreground/80 mb-3">{task.description}</p>
                              )}

                              <div className="flex items-center gap-2 flex-wrap">
                                {task.priority && (
                                  <span className={`px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${priorityColors[task.priority]}`}>
                                    <Flag className="w-3 h-3" />
                                    {task.priority}
                                  </span>
                                )}
                                {task.due_date && (
                                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {new Date(task.due_date).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}
