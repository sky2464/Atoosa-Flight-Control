import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Bot, User } from 'lucide-react';
import type { ProjectRecord } from '../../shared/types.ts';
import type { FlightTask } from '../../server/modules/project-manager/projectManagerService.ts';
import { api } from '../lib/api.ts';
import { PageHeader } from './ui/PageHeader.tsx';

interface ProjectManagerSlotProps {
  project: ProjectRecord | null;
}

export const ProjectManagerSlot: React.FC<ProjectManagerSlotProps> = ({ project }) => {
  const [tasks, setTasks] = useState<FlightTask[]>([]);
  const [filterProjectId, setFilterProjectId] = useState<string>(project?.id || '');
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);

  // New task form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<FlightTask['priority']>('medium');
  const [assignedTo, setAssignedTo] = useState<FlightTask['assignedTo']>('unassigned');
  const [status, setStatus] = useState<FlightTask['status']>('backlog');

  const loadTasks = async () => {
    try {
      const list = await api.getTasks(filterProjectId || undefined);
      setTasks(list);
    } catch (err: any) {
      console.error('Failed to load tasks:', err);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [filterProjectId, project?.id]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      await api.createTask({
        projectId: project?.id || 'global',
        title: title.trim(),
        description: description.trim(),
        priority,
        assignedTo,
        status,
      });

      setTitle('');
      setDescription('');
      setShowNewTaskModal(false);
      loadTasks();
    } catch (err: any) {
      alert(`Failed to create task: ${err.message}`);
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: FlightTask['status']) => {
    try {
      await api.updateTask(taskId, { status: newStatus });
      loadTasks();
    } catch (err: any) {
      alert(`Update failed: ${err.message}`);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await api.deleteTask(taskId);
      loadTasks();
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const columns: { id: FlightTask['status']; label: string }[] = [
    { id: 'backlog', label: 'Backlog' },
    { id: 'in-progress', label: 'In flight' },
    { id: 'review', label: 'Review' },
    { id: 'done', label: 'Landed' },
  ];

  const priorityDot: Record<string, string> = {
    critical: 'bg-rose-400',
    high: 'bg-amber-400',
  };

  return (
    <div className="page max-w-7xl">
      <PageHeader
        title="Kanban"
        subtitle="Tasks for people and AI agents."
        action={
          <button onClick={() => setShowNewTaskModal(true)} className="btn-primary">
            <Plus className="w-4 h-4" />
            Add task
          </button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {columns.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.id);
          return (
            <section key={col.id} className="flex flex-col min-h-[480px]">
              <h2 className="flex items-center gap-2 pb-3 text-[13px] font-medium text-slate-300">
                {col.label}
                <span className="text-slate-500 font-normal">{colTasks.length}</span>
              </h2>

              <div className="flex-1 space-y-2">
                {colTasks.length === 0 ? (
                  <div className="h-24 rounded-lg border border-dashed border-slate-800/60" />
                ) : (
                  colTasks.map((task) => (
                    <article
                      key={task.id}
                      className="group p-3 rounded-lg border border-slate-800/60 hover:border-slate-700 transition-colors space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-[13px] text-slate-100 leading-snug">{task.title}</h3>
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Delete task"
                          aria-label="Delete task"
                        >
                          <Trash2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                        </button>
                      </div>

                      {task.description && <p className="text-xs text-slate-400 leading-relaxed">{task.description}</p>}

                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span className="flex items-center gap-1.5 capitalize">
                          {priorityDot[task.priority] && <span className={`dot ${priorityDot[task.priority]}`} />}
                          {task.priority}
                        </span>
                        <span className="flex items-center gap-1">
                          {task.assignedTo === 'ai-agent' ? <Bot className="w-3 h-3" /> : <User className="w-3 h-3" />}
                          {task.assignedTo}
                        </span>
                      </div>

                      <select
                        value={task.status}
                        onChange={(e: any) => handleStatusChange(task.id, e.target.value)}
                        className="w-full text-xs bg-slate-950 text-slate-400 focus:outline-none opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                        aria-label="Move task"
                      >
                        <option value="backlog">Move to Backlog</option>
                        <option value="in-progress">Move to In flight</option>
                        <option value="review">Move to Review</option>
                        <option value="done">Move to Landed</option>
                      </select>
                    </article>
                  ))
                )}
              </div>
            </section>
          );
        })}
      </div>

      {showNewTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 space-y-5">
            <h3 className="text-base font-medium text-slate-100">New task</h3>
            <form onSubmit={handleCreateTask} className="space-y-4 text-[13px]">
              <label className="block space-y-1.5">
                <span className="text-slate-400">Title</span>
                <input
                  type="text"
                  placeholder="Split authService.ts"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="field"
                  required
                />
              </label>

              <label className="block space-y-1.5">
                <span className="text-slate-400">Description</span>
                <textarea
                  rows={3}
                  placeholder="Optional details or acceptance criteria"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="field h-auto py-2"
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block space-y-1.5">
                  <span className="text-slate-400">Priority</span>
                  <select value={priority} onChange={(e: any) => setPriority(e.target.value)} className="field bg-slate-900">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </label>

                <label className="block space-y-1.5">
                  <span className="text-slate-400">Assign to</span>
                  <select value={assignedTo} onChange={(e: any) => setAssignedTo(e.target.value)} className="field bg-slate-900">
                    <option value="unassigned">Unassigned</option>
                    <option value="ai-agent">AI agent</option>
                    <option value="human">Developer</option>
                  </select>
                </label>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setShowNewTaskModal(false)} className="btn-ghost">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
