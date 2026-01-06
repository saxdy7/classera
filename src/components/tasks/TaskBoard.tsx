'use client';

import React, { useEffect, useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import {
  Plus,
  MoreVertical,
  Calendar,
  Flag,
  Trash2,
  Edit2,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { format } from 'date-fns';

interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  status: 'todo' | 'in_progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date: string | null;
  labels: string[];
  position: number;
  created_at: string;
  updated_at: string;
}

const columns = [
  { id: 'todo', title: 'To Do', color: 'bg-gray-500' },
  { id: 'in_progress', title: 'In Progress', color: 'bg-blue-500' },
  { id: 'review', title: 'Review', color: 'bg-yellow-500' },
  { id: 'done', title: 'Done', color: 'bg-green-500' },
];

const priorityColors = {
  low: 'bg-gray-200 text-gray-700',
  medium: 'bg-blue-200 text-blue-700',
  high: 'bg-orange-200 text-orange-700',
  urgent: 'bg-red-200 text-red-700',
};

export default function TaskBoard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddTask, setShowAddTask] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<Task['priority']>('medium');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/tasks');
      const data = await response.json();
      setTasks(data.tasks || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = async (status: string) => {
    if (!newTaskTitle.trim()) return;

    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTaskTitle,
          description: newTaskDescription,
          status,
          priority: newTaskPriority,
          due_date: newTaskDueDate || null,
        }),
      });

      const data = await response.json();
      setTasks([...tasks, data.task]);
      
      // Reset form
      setNewTaskTitle('');
      setNewTaskDescription('');
      setNewTaskPriority('medium');
      setNewTaskDueDate('');
      setShowAddTask(null);
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await fetch(`/api/tasks?id=${taskId}`, { method: 'DELETE' });
      setTasks(tasks.filter((t) => t.id !== taskId));
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const task = tasks.find((t) => t.id === draggableId);
    if (!task) return;

    // Update local state
    const newTasks = Array.from(tasks);
    const taskIndex = newTasks.findIndex((t) => t.id === draggableId);
    newTasks[taskIndex] = {
      ...task,
      status: destination.droppableId as Task['status'],
    };
    setTasks(newTasks);

    // Update backend
    try {
      await fetch('/api/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: draggableId,
          status: destination.droppableId,
        }),
      });
    } catch (error) {
      console.error('Error updating task:', error);
      // Revert on error
      fetchTasks();
    }
  };

  const getTasksByStatus = (status: string) => {
    return tasks.filter((task) => task.status === status);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-64 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Task Board
        </h1>
        <p className="text-gray-600 mt-2">Organize and track your tasks</p>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {columns.map((column) => (
            <div key={column.id} className="bg-gray-50 rounded-lg p-4">
              {/* Column Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${column.color}`}></div>
                  <h3 className="font-semibold text-gray-900">{column.title}</h3>
                  <span className="text-sm text-gray-500">
                    {getTasksByStatus(column.id).length}
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowAddTask(column.id)}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {/* Add Task Form */}
              {showAddTask === column.id && (
                <Card className="p-3 mb-3 space-y-2">
                  <input
                    type="text"
                    placeholder="Task title..."
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    className="w-full px-2 py-1 border rounded text-sm"
                    autoFocus
                  />
                  <textarea
                    placeholder="Description (optional)"
                    value={newTaskDescription}
                    onChange={(e) => setNewTaskDescription(e.target.value)}
                    className="w-full px-2 py-1 border rounded text-sm"
                    rows={2}
                  />
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value as Task['priority'])}
                    className="w-full px-2 py-1 border rounded text-sm"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                    <option value="urgent">Urgent</option>
                  </select>
                  <input
                    type="date"
                    value={newTaskDueDate}
                    onChange={(e) => setNewTaskDueDate(e.target.value)}
                    className="w-full px-2 py-1 border rounded text-sm"
                  />
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      onClick={() => handleAddTask(column.id)}
                      className="flex-1"
                    >
                      Add
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowAddTask(null)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              )}

              {/* Tasks List */}
              <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`space-y-2 min-h-[200px] ${
                      snapshot.isDraggingOver ? 'bg-purple-50' : ''
                    } rounded-lg transition-colors`}
                  >
                    {getTasksByStatus(column.id).map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id} index={index}>
                        {(provided, snapshot) => (
                          <Card
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`p-3 cursor-move ${
                              snapshot.isDragging ? 'shadow-lg' : ''
                            }`}
                          >
                            <div className="space-y-2">
                              <div className="flex items-start justify-between">
                                <h4 className="font-medium text-sm text-gray-900 flex-1">
                                  {task.title}
                                </h4>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDeleteTask(task.id)}
                                  className="h-6 w-6 p-0"
                                >
                                  <Trash2 className="w-3 h-3 text-gray-400" />
                                </Button>
                              </div>

                              {task.description && (
                                <p className="text-xs text-gray-600 line-clamp-2">
                                  {task.description}
                                </p>
                              )}

                              <div className="flex items-center justify-between">
                                <span
                                  className={`text-xs px-2 py-0.5 rounded-full ${
                                    priorityColors[task.priority]
                                  }`}
                                >
                                  {task.priority}
                                </span>

                                {task.due_date && (
                                  <div className="flex items-center text-xs text-gray-500">
                                    <Calendar className="w-3 h-3 mr-1" />
                                    {format(new Date(task.due_date), 'MMM d')}
                                  </div>
                                )}
                              </div>
                            </div>
                          </Card>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
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
