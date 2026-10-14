import React, { useState, useEffect } from 'react';
import {
  KanbanSquare,
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  Trash2,
  User,
  Bot,
  Filter,
} from 'lucide-react';
import type { ProjectRecord } from '../../shared/types.ts';
import type { FlightTask } from '../../server/modules/project-manager/projectManagerService.ts';
import { api } from '../lib/api.ts';

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

  const columns: { id: FlightTask['status']; label: string; color: string }[] = [
    { id: 'backlog', label: 'Backlog Runway', color: 'border-slate-700' },
    { id: 'in-progress', label: 'In-Flight Execution', color: 'border-sky-500' },
    { id: 'review', label: 'Tower Review & QA', color: 'border-amber-500' },
    { id: 'done', label: 'Landed & Verified', color: 'border-emerald-500' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900/80 border border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <KanbanSquare className="w-4 h-4 text-sky-400" />
            <span className="text-xs font-mono uppercase text-slate-400">Modular Extension Slot</span>
          </div>
          <h1 className="text-2xl font-bold text-white font-mono mt-1">Project Manager Tower</h1>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Agile task boards, human & AI agent assignments, and sprint governance.
          </p>
        </div>

        <button
          onClick={() => setShowNewTaskModal(true)}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-medium text-xs shadow-md shadow-sky-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>Add Flight Task</span>
        </button>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {columns.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.id);
          return (
            <div key={col.id} className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 flex flex-col h-[650px]">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                <span className="text-xs font-bold text-white font-mono uppercase flex items-center space-x-1.5">
                  <span className={`w-2 h-2 rounded-full border ${col.color} bg-current`}></span>
                  <span>{col.label}</span>
                </span>
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-bold">
                  {colTasks.length}
                </span>
              </div>

              {/* Tasks List */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {colTasks.length === 0 ? (
                  <div className="text-center py-12 text-slate-600 text-xs font-mono">
                    Runway empty
                  </div>
                ) : (
                  colTasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all space-y-2 group"
                    >
                      <div className="flex items-start justify-between">
                        <h4 className="text-xs font-bold text-slate-200 font-mono leading-tight">{task.title}</h4>
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="text-slate-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity p-0.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {task.description && (
                        <p className="text-[11px] text-slate-400 leading-relaxed font-sans">{task.description}</p>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t border-slate-900 text-[10px] font-mono">
                        <span
                          className={`px-1.5 py-0.5 rounded font-semibold uppercase ${
                            task.priority === 'critical'
                              ? 'bg-rose-500/20 text-rose-300'
                              : task.priority === 'high'
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {task.priority}
                        </span>

                        <span className="flex items-center space-x-1 text-slate-400">
                          {task.assignedTo === 'ai-agent' ? <Bot className="w-3 h-3 text-sky-400" /> : <User className="w-3 h-3" />}
                          <span>{task.assignedTo}</span>
                        </span>
                      </div>

                      {/* Quick Move Select */}
                      <div className="pt-1">
                        <select
                          value={task.status}
                          onChange={(e: any) => handleStatusChange(task.id, e.target.value)}
                          className="w-full text-[10px] font-mono bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5 text-slate-400 focus:outline-none"
                        >
                          <option value="backlog">Move: Backlog</option>
                          <option value="in-progress">Move: In-Flight</option>
                          <option value="review">Move: Review</option>
                          <option value="done">Move: Landed</option>
                        </select>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* New Task Modal */}
      {showNewTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white font-mono">Add New Flight Task</h3>
            <form onSubmit={handleCreateTask} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-mono">Task Title:</label>
                <input
                  type="text"
                  placeholder="e.g. Decompose authService.ts (>500 lines)"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-sky-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-mono">Description (optional):</label>
                <textarea
                  rows={3}
                  placeholder="Details, acceptance criteria, or flight instructions..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-mono">Priority:</label>
                  <select
                    value={priority}
                    onChange={(e: any) => setPriority(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-sky-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-mono">Assign To:</label>
                  <select
                    value={assignedTo}
                    onChange={(e: any) => setAssignedTo(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-sky-500"
                  >
                    <option value="unassigned">Unassigned</option>
                    <option value="ai-agent">AI Agent (Claude / Copilot)</option>
                    <option value="human">Human Developer</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowNewTaskModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-800 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-medium"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
