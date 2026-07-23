import Database from 'better-sqlite3';
import fs from 'fs-extra';
import path from 'path';
import { settings } from '../config/settings';

export class DatabaseManager {
  private db: Database.Database | null = null;
  private dbPath: string;

  constructor() {
    const dir = settings.get('defaultOutputDir');
    this.dbPath = path.join(dir, 'openresearch.db');
  }

  async init(): Promise<void> {
    await fs.ensureDir(settings.get('defaultOutputDir'));
    this.db = new Database(this.dbPath);
    this.db.pragma('journal_mode = WAL');
    this.runMigrations();
  }

  private runMigrations(): void {
    if (!this.db) throw new Error('Database not initialized');

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        current_phase TEXT NOT NULL DEFAULT 'discovery',
        status TEXT NOT NULL DEFAULT 'active'
      );

      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        phase TEXT,
        agent_id TEXT,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS research_findings (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        url TEXT NOT NULL,
        snippet TEXT,
        source TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS canvas_items (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        metadata TEXT NOT NULL DEFAULT '{}',
        completed INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_messages_project ON messages(project_id);
      CREATE INDEX IF NOT EXISTS idx_findings_project ON research_findings(project_id);
      CREATE INDEX IF NOT EXISTS idx_canvas_project ON canvas_items(project_id);
    `);
  }

  getDb(): Database.Database {
    if (!this.db) throw new Error('Database not initialized');
    return this.db;
  }

  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}
