import fs from 'fs-extra';
import path from 'path';
import { settings } from '../config/settings';

export class Storage {
  static async init(): Promise<void> {
    await fs.ensureDir(settings.get('defaultOutputDir'));
  }

  static async listReports(): Promise<string[]> {
    const dir = settings.get('defaultOutputDir');
    try {
      const files = await fs.readdir(dir);
      return files.filter(f => f.endsWith('.md') || f.endsWith('.html'));
    } catch {
      return [];
    }
  }
}
