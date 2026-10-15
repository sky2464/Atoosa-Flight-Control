import { describe, it, expect } from 'bun:test';
import { db, DB_PATH } from '../../src/server/db/sqlite.ts';
import {
  getProjects,
  getProjectById,
  upsertProject,
  deleteProject,
  getSettings,
  saveSettings,
  recordTelemetryHistory,
  getTelemetryHistory,
} from '../../src/server/db.ts';
import {
  addTask,
  getTasks,
  updateTask,
  deleteTask,
} from '../../src/server/modules/project-manager/projectManagerService.ts';

describe('Engine: SQLite Storage Engine (bun:sqlite)', () => {
  it('should initialize database with WAL mode and foreign keys enabled', () => {
    expect(db).toBeDefined();
    expect(DB_PATH).toBeDefined();

    const journalMode = (db.query('PRAGMA journal_mode;').get() as any).journal_mode;
    expect(journalMode.toLowerCase()).toBe('wal');

    const foreignKeys = (db.query('PRAGMA foreign_keys;').get() as any).foreign_keys;
    expect(Number(foreignKeys)).toBe(1);
  });

  it('should perform settings get and save with persistence', async () => {
    const settings = await getSettings();
    expect(settings).toBeDefined();
    expect(settings.profile).toBeDefined();

    const updated = await saveSettings({
      selectedCli: 'claude',
      profile: {
        ...settings.profile,
        name: 'Chief Architect',
        callsign: 'TOWER-TEST',
      },
    });

    expect(updated.selectedCli).toBe('claude');
    expect(updated.profile.callsign).toBe('TOWER-TEST');

    const refetched = await getSettings();
    expect(refetched.selectedCli).toBe('claude');
    expect(refetched.profile.callsign).toBe('TOWER-TEST');
  });

  it('should handle project upsert, retrieval, and telemetry history logging', async () => {
    const testProjectId = `proj_test_${Date.now()}`;
    const testPath = `/tmp/test_project_${Date.now()}`;

    // Upsert project with telemetry
    const created = await upsertProject({
      id: testProjectId,
      name: 'Test SQLite Project',
      path: testPath,
      status: 'in-flight',
      createdAt: new Date().toISOString(),
      telemetry: {
        totalFiles: 42,
        totalLines: 3200,
        filesOver500Lines: [
          { file: 'big_module.ts', lines: 650, percentage: 20 },
        ],
        flightScore: 88,
        status: 'in-flight',
        scannedAt: new Date().toISOString(),
        criticalIssues: [],
      },
    });

    expect(created.id).toBe(testProjectId);
    expect(created.name).toBe('Test SQLite Project');

    // Retrieve by ID
    const found = await getProjectById(testProjectId);
    expect(found).not.toBeNull();
    expect(found?.name).toBe('Test SQLite Project');
    expect(found?.telemetry?.flightScore).toBe(88);

    // Verify telemetry history was automatically recorded
    const history = await getTelemetryHistory(testProjectId);
    expect(history.length).toBeGreaterThanOrEqual(1);
    expect(history[0].flightScore).toBe(88);
    expect(history[0].filesOver500Count).toBe(1);
    expect(history[0].totalFiles).toBe(42);

    // List all projects
    const allProjects = await getProjects();
    expect(allProjects.some((p) => p.id === testProjectId)).toBe(true);

    // Delete project
    const deleted = await deleteProject(testProjectId);
    expect(deleted).toBe(true);

    const afterDelete = await getProjectById(testProjectId);
    expect(afterDelete).toBeNull();
  });

  it('should handle flight tasks in SQLite with ACID transactions and updates', async () => {
    const testProjectId = `proj_task_test_${Date.now()}`;

    const task = await addTask({
      projectId: testProjectId,
      title: 'Enforce WAL Mode and SQLite Storage',
      description: 'Zero external dependencies using bun:sqlite',
      priority: 'critical',
      status: 'backlog',
      assignedTo: 'ai-agent',
    });

    expect(task.id).toBeDefined();
    expect(task.projectId).toBe(testProjectId);
    expect(task.status).toBe('backlog');

    // Retrieve tasks for project
    const projectTasks = await getTasks(testProjectId);
    expect(projectTasks.length).toBe(1);
    expect(projectTasks[0].id).toBe(task.id);

    // Update status to done (auto-stamps completedAt)
    const completed = await updateTask(task.id, { status: 'done' });
    expect(completed?.status).toBe('done');
    expect(completed?.completedAt).toBeDefined();

    // Delete task
    const removed = await deleteTask(task.id);
    expect(removed).toBe(true);

    const remaining = await getTasks(testProjectId);
    expect(remaining.length).toBe(0);
  });
});
