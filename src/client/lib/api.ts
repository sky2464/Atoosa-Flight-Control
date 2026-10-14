import type {
  ProjectRecord,
  TelemetrySummary,
  PreFlightInterview,
  PreFlightRecommendation,
  AISettings,
  ModuleDescriptor,
} from '../../shared/types.ts';
import type { FlightTask } from '../../server/modules/project-manager/projectManagerService.ts';

const API_BASE = '/api';

export const api = {
  // Health
  async getHealth() {
    const res = await fetch(`${API_BASE}/health`);
    return res.json();
  },

  // Projects
  async getProjects(): Promise<ProjectRecord[]> {
    const res = await fetch(`${API_BASE}/projects`);
    const data = await res.json();
    return data.projects || [];
  },

  async getProject(id: string): Promise<ProjectRecord | null> {
    const res = await fetch(`${API_BASE}/projects/${id}`);
    const data = await res.json();
    return data.project || null;
  },

  async createProject(project: Partial<ProjectRecord>): Promise<ProjectRecord> {
    const res = await fetch(`${API_BASE}/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(project),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to create project');
    return data.project;
  },

  async deleteProject(id: string): Promise<boolean> {
    const res = await fetch(`${API_BASE}/projects/${id}`, { method: 'DELETE' });
    const data = await res.json();
    return data.success;
  },

  // Scanner
  async scanProject(path: string, projectId?: string): Promise<TelemetrySummary> {
    const res = await fetch(`${API_BASE}/scanner/scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path, projectId }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Scan failed');
    return data.telemetry;
  },

  // Discovery
  async analyzePreFlight(interview: PreFlightInterview): Promise<PreFlightRecommendation> {
    const res = await fetch(`${API_BASE}/discovery/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(interview),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Analysis failed');
    return data.recommendation;
  },

  // Governance
  async emitGovernance(targetFolder: string, files: { filename: string; content: string }[], overwriteExisting = true) {
    const res = await fetch(`${API_BASE}/governance/emit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetFolder, files, overwriteExisting }),
    });
    return res.json();
  },

  // AI & Streaming
  async getAISettings(): Promise<AISettings> {
    const res = await fetch(`${API_BASE}/ai/settings`);
    const data = await res.json();
    return data.settings;
  },

  async saveAISettings(settings: Partial<AISettings>): Promise<AISettings> {
    const res = await fetch(`${API_BASE}/ai/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    const data = await res.json();
    return data.settings;
  },

  async streamPromptImprovement(
    idea: string,
    meta: { domain?: string; scale?: string; container?: string },
    onChunk: (text: string) => void,
    onDone: () => void,
    onError: (err: string) => void
  ) {
    try {
      const res = await fetch(`${API_BASE}/ai/improve-prompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userIdea: idea,
          projectDomain: meta.domain,
          targetScale: meta.scale,
          containerChoice: meta.container,
        }),
      });

      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      if (!res.body) throw new Error('No streaming response body');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const block of lines) {
          const eventMatch = block.match(/^event:\s*(\w+)/m);
          const dataMatch = block.match(/^data:\s*(.+)$/m);
          const event = eventMatch ? eventMatch[1] : 'message';
          const data = dataMatch ? dataMatch[1] : '';

          if (event === 'token') {
            onChunk(data);
          } else if (event === 'done') {
            onDone();
          } else if (event === 'error') {
            onError(data);
          }
        }
      }
      onDone();
    } catch (err: any) {
      onError(err.message);
    }
  },

  // Modules & Project Manager
  async getModules(): Promise<ModuleDescriptor[]> {
    const res = await fetch(`${API_BASE}/modules`);
    const data = await res.json();
    return data.modules || [];
  },

  async getTasks(projectId?: string): Promise<FlightTask[]> {
    const url = projectId ? `${API_BASE}/modules/tasks?projectId=${projectId}` : `${API_BASE}/modules/tasks`;
    const res = await fetch(url);
    const data = await res.json();
    return data.tasks || [];
  },

  async createTask(task: Partial<FlightTask>): Promise<FlightTask> {
    const res = await fetch(`${API_BASE}/modules/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task),
    });
    const data = await res.json();
    return data.task;
  },

  async updateTask(id: string, updates: Partial<FlightTask>): Promise<FlightTask> {
    const res = await fetch(`${API_BASE}/modules/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    return data.task;
  },

  async deleteTask(id: string): Promise<boolean> {
    const res = await fetch(`${API_BASE}/modules/tasks/${id}`, { method: 'DELETE' });
    const data = await res.json();
    return data.success;
  },
};
